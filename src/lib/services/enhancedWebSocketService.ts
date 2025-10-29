import { io, Socket } from 'socket.io-client';

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  transports?: string[];
  upgrade?: boolean;
  rememberUpgrade?: boolean;
}

interface ConnectionStats {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  connectionTime: number;
  latency: number;
}

interface MessageQueueItem {
  event: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

export class EnhancedWebSocketService {
  private socket: Socket | null = null;
  private options: WebSocketOptions;
  private messageQueue: MessageQueueItem[] = [];
  private isProcessingQueue = false;
  private connectionStats: ConnectionStats;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      url: options.url || 'http://localhost:3000',
      autoConnect: options.autoConnect ?? true,
      reconnection: options.reconnection ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? 10,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      reconnectionDelayMax: options.reconnectionDelayMax ?? 5000,
      timeout: options.timeout ?? 20000,
      transports: options.transports || ['websocket', 'polling'],
      upgrade: options.upgrade ?? true,
      rememberUpgrade: options.rememberUpgrade ?? true,
      ...options
    };

    this.connectionStats = {
      connected: false,
      reconnectAttempts: 0,
      lastConnected: null,
      lastDisconnected: null,
      connectionTime: 0,
      latency: 0
    };

    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.options.url!, this.options);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      this.handleConnectError(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.handleReconnect(attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      this.handleReconnectError(error);
    });

    this.socket.on('reconnect_failed', () => {
      this.handleReconnectFailed();
    });

    this.socket.on('ping', () => {
      this.handlePing();
    });

    this.socket.on('pong', (latency) => {
      this.handlePong(latency);
    });
  }

  private handleConnect() {
    this.connectionStats.connected = true;
    this.connectionStats.reconnectAttempts = 0;
    this.connectionStats.lastConnected = new Date();
    this.connectionStats.connectionTime = Date.now();

    this.notifyConnectionCallbacks(true);
    this.processMessageQueue();
    this.startPingTimer();
  }

  private handleDisconnect(reason: string) {
    this.connectionStats.connected = false;
    this.connectionStats.lastDisconnected = new Date();

    this.notifyConnectionCallbacks(false);
    this.stopPingTimer();

    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't try to reconnect
      console.log('Server disconnected, not attempting to reconnect');
    } else {
      console.log(`Disconnected due to: ${reason}, attempting to reconnect...`);
    }
  }

  private handleConnectError(error: Error) {
    console.error('Connection error:', error);
    this.connectionStats.connected = false;
    this.notifyConnectionCallbacks(false);
  }

  private handleReconnect(attemptNumber: number) {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    this.connectionStats.reconnectAttempts = 0;
    this.handleConnect();
  }

  private handleReconnectError(error: Error) {
    console.error('Reconnection error:', error);
    this.connectionStats.reconnectAttempts++;
  }

  private handleReconnectFailed() {
    console.error('Failed to reconnect after maximum attempts');
    this.connectionStats.connected = false;
    this.notifyConnectionCallbacks(false);
  }

  private handlePing() {
    // Server ping received
  }

  private handlePong(latency: number) {
    this.connectionStats.latency = latency;
  }

  private startPingTimer() {
    this.stopPingTimer();
    this.pingTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue || !this.socket?.connected) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue[0];
      
      try {
        await this.sendMessageWithRetry(message);
        this.messageQueue.shift();
      } catch (error) {
        console.error('Failed to send queued message:', error);
        
        if (message.retryCount >= 3) {
          this.messageQueue.shift(); // Remove failed message after 3 retries
        } else {
          message.retryCount++;
          break; // Stop processing on failure
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private sendMessageWithRetry(message: MessageQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 5000);

      this.socket.emit(message.event, message.data, (ack: any) => {
        clearTimeout(timeout);
        if (ack && ack.error) {
          reject(new Error(ack.error));
        } else {
          resolve();
        }
      });
    });
  }

  // Public API
  connect() {
    if (!this.socket) {
      this.initializeSocket();
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.stopPingTimer();
  }

  emit(event: string, data: any, callback?: (response: any) => void) {
    if (this.socket?.connected) {
      this.socket.emit(event, data, callback);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push({
        event,
        data,
        timestamp: new Date(),
        retryCount: 0
      });
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler: (data: any) => void) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.delete(handler);
      
      if (this.eventHandlers.get(event)!.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue() {
    this.messageQueue = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  destroy() {
    this.disconnect();
    this.clearQueue();
    this.eventHandlers.clear();
    this.connectionCallbacks.clear();
  }
}

// Factory function for creating enhanced WebSocket service instances
export function createEnhancedWebSocketService(options: WebSocketOptions = {}) {
  return new EnhancedWebSocketService(options);
}