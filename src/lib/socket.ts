import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictionUpdate {
  id: string;
  model: string;
  symbol: string;
  prediction: number;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  startTime: Date;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

export class EnhancedSocketManager {
  private io: Server;
  private marketRooms: Map<string, Set<string>>;
  private userRooms: Map<string, Set<string>>;
  private connectionMetrics: ConnectionMetrics;
  private rateLimits: Map<string, { count: number; resetTime: number }>;
  private rateLimitConfig: RateLimitConfig;
  private redisClient?: any;
  private redisAdapter?: any;

  constructor(io: Server, redisUrl?: string) {
    this.io = io;
    this.marketRooms = new Map();
    this.userRooms = new Map();
    this.rateLimits = new Map();
    
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: new Date()
    };

    this.rateLimitConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      skipSuccessfulRequests: false
    };

    this.initializeRedis(redisUrl).then(() => {
      this.setupEventHandlers();
      this.startMetricsCollection();
      this.startCleanupTasks();
    });
  }

  private async initializeRedis(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redisClient = createClient({ url: redisUrl });
        await this.redisClient.connect();
        
        const pubClient = this.redisClient.duplicate();
        await pubClient.connect();
        
        const subClient = this.redisClient.duplicate();
        await subClient.connect();
        
        this.redisAdapter = createAdapter(pubClient, subClient);
        this.io.adapter(this.redisAdapter);
        
        console.log('Redis adapter initialized for Socket.IO');
      } catch (error) {
        console.error('Failed to initialize Redis adapter:', error);
      }
    }
  }

  private setupEventHandlers() {
    this.io.use((socket, next) => {
      this.handleConnectionMiddleware(socket, next);
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnectionMiddleware(socket: any, next: (err?: Error) => void) {
    const clientId = socket.id;
    const clientIp = socket.handshake.address;
    
    // Rate limiting
    if (!this.checkRateLimit(clientIp)) {
      return next(new Error('Rate limit exceeded'));
    }

    // Authentication (if needed)
    const token = socket.handshake.auth.token;
    if (token && !this.validateToken(token)) {
      return next(new Error('Authentication failed'));
    }

    socket.data = {
      clientId,
      clientIp,
      connectedAt: new Date(),
      userAgent: socket.handshake.headers['user-agent']
    };

    next();
  }

  private validateToken(token: string): boolean {
    // Implement token validation logic
    return true; // For now, accept all tokens
  }

  private checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const limitKey = `rate_limit:${clientIp}`;
    
    let limit = this.rateLimits.get(limitKey);
    
    if (!limit || now > limit.resetTime) {
      limit = {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs
      };
      this.rateLimits.set(limitKey, limit);
      return true;
    }
    
    if (limit.count >= this.rateLimitConfig.maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  private handleConnection(socket: any) {
    this.connectionMetrics.totalConnections++;
    this.connectionMetrics.activeConnections++;
    
    console.log(`Client connected: ${socket.id} from ${socket.data.clientIp}`);
    
    // Market data room management
    socket.on('join-market', (symbol: string) => {
      this.joinMarketRoom(socket, symbol);
    });

    socket.on('leave-market', (symbol: string) => {
      this.leaveMarketRoom(socket, symbol);
    });

    // User room management
    socket.on('join-user', (userId: string) => {
      this.joinUserRoom(socket, userId);
    });

    // Subscription management
    socket.on('subscribe-notifications', (userId: string) => {
      this.subscribeToNotifications(socket, userId);
    });

    socket.on('subscribe-predictions', (model: string) => {
      this.subscribeToPredictions(socket, model);
    });

    // Batch operations
    socket.on('batch-subscribe', (symbols: string[]) => {
      this.batchSubscribeToMarkets(socket, symbols);
    });

    socket.on('batch-unsubscribe', (symbols: string[]) => {
      this.batchUnsubscribeFromMarkets(socket, symbols);
    });

    // Health checks
    socket.on('ping', () => {
      socket.emit('pong', Date.now());
    });

    socket.on('get-connection-stats', () => {
      socket.emit('connection-stats', this.getConnectionStats());
    });

    // Message handling
    socket.on('message', (msg: any) => {
      this.connectionMetrics.messagesReceived++;
      this.handleMessage(socket, msg);
    });

    // Error handling
    socket.on('error', (error: Error) => {
      this.connectionMetrics.errors++;
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Disconnect handling
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Send initial data
    this.sendWelcomeMessage(socket);
  }

  private joinMarketRoom(socket: any, symbol: string) {
    const room = `market-${symbol}`;
    socket.join(room);
    
    if (!this.marketRooms.has(room)) {
      this.marketRooms.set(room, new Set());
    }
    this.marketRooms.get(room)!.add(socket.id);
    
    console.log(`Client ${socket.id} joined market room: ${room}`);
    
    // Send current market data
    this.sendMarketData(socket, symbol);
  }

  private leaveMarketRoom(socket: any, symbol: string) {
    const room = `market-${symbol}`;
    socket.leave(room);
    
    if (this.marketRooms.has(room)) {
      this.marketRooms.get(room)!.delete(socket.id);
      if (this.marketRooms.get(room)!.size === 0) {
        this.marketRooms.delete(room);
      }
    }
    
    console.log(`Client ${socket.id} left market room: ${room}`);
  }

  private joinUserRoom(socket: any, userId: string) {
    const room = `user-${userId}`;
    socket.join(room);
    
    if (!this.userRooms.has(room)) {
      this.userRooms.set(room, new Set());
    }
    this.userRooms.get(room)!.add(socket.id);
    
    console.log(`Client ${socket.id} joined user room: ${room}`);
  }

  private subscribeToNotifications(socket: any, userId: string) {
    const room = `notifications-${userId}`;
    socket.join(room);
    console.log(`Client ${socket.id} subscribed to notifications for user: ${userId}`);
  }

  private subscribeToPredictions(socket: any, model: string) {
    const room = `predictions-${model}`;
    socket.join(room);
    console.log(`Client ${socket.id} subscribed to predictions for model: ${model}`);
  }

  private batchSubscribeToMarkets(socket: any, symbols: string[]) {
    symbols.forEach(symbol => {
      this.joinMarketRoom(socket, symbol);
    });
  }

  private batchUnsubscribeFromMarkets(socket: any, symbols: string[]) {
    symbols.forEach(symbol => {
      this.leaveMarketRoom(socket, symbol);
    });
  }

  private sendMarketData(socket: any, symbol: string) {
    const marketData: MarketDataUpdate = {
      symbol,
      price: Math.random() * 1000 + 100,
      change: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      bid: Math.random() * 1000 + 95,
      ask: Math.random() * 1000 + 105,
      high: Math.random() * 1000 + 110,
      low: Math.random() * 1000 + 90,
      open: Math.random() * 1000 + 100,
      close: Math.random() * 1000 + 100
    };
    
    socket.emit('market-data', marketData);
  }

  private sendWelcomeMessage(socket: any) {
    socket.emit('message', {
      text: 'Welcome to FinSmartAI Enhanced Real-time Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
      features: [
        'Enhanced market data streaming',
        'Batch operations support',
        'Rate limiting and security',
        'Connection health monitoring',
        'Redis clustering support'
      ]
    });
  }

  private handleMessage(socket: any, msg: any) {
    // Broadcast message to all clients except the sender
    socket.broadcast.emit('message', {
      text: `Broadcast: ${msg.text}`,
      senderId: msg.senderId,
      timestamp: new Date().toISOString(),
    });
    
    this.connectionMetrics.messagesSent++;
  }

  private handleDisconnection(socket: any, reason: string) {
    this.connectionMetrics.activeConnections--;
    
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    // Clean up room memberships
    this.cleanupClientRooms(socket.id);
  }

  private cleanupClientRooms(clientId: string) {
    // Clean up market rooms
    for (const [room, clients] of this.marketRooms.entries()) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.marketRooms.delete(room);
      }
    }
    
    // Clean up user rooms
    for (const [room, clients] of this.userRooms.entries()) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.userRooms.delete(room);
      }
    }
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  private startCleanupTasks() {
    // Clean up expired rate limits
    setInterval(() => {
      const now = Date.now();
      for (const [key, limit] of this.rateLimits.entries()) {
        if (now > limit.resetTime) {
          this.rateLimits.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  private collectMetrics() {
    // This could be extended to send metrics to monitoring systems
    const metrics = {
      ...this.connectionMetrics,
      uptime: Date.now() - this.connectionMetrics.startTime.getTime(),
      marketRooms: this.marketRooms.size,
      userRooms: this.userRooms.size,
      activeRateLimits: this.rateLimits.size
    };
    
    console.log('Socket.IO Metrics:', metrics);
  }

  private getConnectionStats() {
    return {
      ...this.connectionMetrics,
      uptime: Date.now() - this.connectionMetrics.startTime.getTime(),
      marketRooms: this.marketRooms.size,
      userRooms: this.userRooms.size,
      rateLimits: this.rateLimits.size
    };
  }

  // Public API for broadcasting
  public broadcastMarketUpdate(symbol: string, data: MarketDataUpdate) {
    this.io.to(`market-${symbol}`).emit('market-update', data);
    this.connectionMetrics.messagesSent++;
  }

  public sendNotification(userId: string, notification: NotificationData) {
    this.io.to(`notifications-${userId}`).emit('notification', notification);
    this.connectionMetrics.messagesSent++;
  }

  public broadcastPredictionUpdate(model: string, prediction: PredictionUpdate) {
    this.io.to(`predictions-${model}`).emit('prediction-update', prediction);
    this.connectionMetrics.messagesSent++;
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
    this.connectionMetrics.messagesSent++;
  }

  public getMetrics() {
    return this.getConnectionStats();
  }

  public shutdown() {
    console.log('Shutting down Socket.IO server...');
    this.io.close();
    
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }
}

// Legacy function for backward compatibility
export const setupSocket = (io: Server) => {
  const manager = new EnhancedSocketManager(io);
  
  // Simulate real-time market data updates
  setInterval(() => {
    manager.marketRooms.forEach((clients, room) => {
      if (clients.size > 0) {
        const symbol = room.replace('market-', '');
        const update: MarketDataUpdate = {
          symbol,
          price: Math.random() * 1000 + 100,
          change: (Math.random() - 0.5) * 10,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };
        
        manager.broadcastMarketUpdate(symbol, update);
      }
    });
  }, 2000);
  
  // Simulate notification broadcasts
  setInterval(() => {
    manager.userRooms.forEach((clients, room) => {
      if (clients.size > 0) {
        const notificationTypes = ['info', 'warning', 'success'] as const;
        const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        
        const notification: NotificationData = {
          id: Date.now().toString(),
          type: randomType,
          title: 'Market Alert',
          message: `New market update for ${room.replace('user-', '')}`,
          timestamp: new Date().toISOString()
        };
        
        manager.sendNotification(room.replace('user-', ''), notification);
      }
    });
  }, 30000);
  
  // Simulate prediction updates
  setInterval(() => {
    const models = ['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI'];
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS'];
    
    models.forEach(model => {
      const room = `predictions-${model}`;
      const clients = Array.from(manager['io'].sockets.adapter.rooms.get(room) || []);
      
      if (clients.length > 0) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const prediction: PredictionUpdate = {
          id: Date.now().toString(),
          model,
          symbol,
          prediction: Math.random() * 100,
          confidence: Math.random(),
          timestamp: new Date().toISOString()
        };
        
        manager.broadcastPredictionUpdate(model, prediction);
      }
    });
  }, 10000);

  return manager;
};

// Helper functions for server-side events (backward compatibility)
export const broadcastMarketUpdate = (io: Server, symbol: string, data: MarketDataUpdate) => {
  io.to(`market-${symbol}`).emit('market-update', data);
};

export const sendNotification = (io: Server, userId: string, notification: NotificationData) => {
  io.to(`notifications-${userId}`).emit('notification', notification);
};

export const broadcastPredictionUpdate = (io: Server, model: string, prediction: PredictionUpdate) => {
  io.to(`predictions-${model}`).emit('prediction-update', prediction);
};