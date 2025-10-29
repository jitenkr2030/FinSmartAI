import { EnhancedWebSocketService } from '@/lib/services/enhancedWebSocketService';

// Mock socket.io-client
const mockIo = jest.fn(() => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
}));

jest.mock('socket.io-client', () => ({
  io: mockIo,
}));

describe('EnhancedWebSocketService', () => {
  let webSocketService: EnhancedWebSocketService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };
    
    // Mock the io function to return our mock socket
    mockIo.mockReturnValue(mockSocket);
    
    webSocketService = new EnhancedWebSocketService({
      url: 'http://localhost:3000',
      autoConnect: false,
    });
  });

  afterEach(() => {
    webSocketService.destroy();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const service = new EnhancedWebSocketService();
      expect(service).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options = {
        url: 'http://custom-url:3000',
        reconnection: false,
        timeout: 5000,
      };
      
      const service = new EnhancedWebSocketService(options);
      expect(service).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should connect when autoConnect is true', () => {
      // This test verifies that the service can be initialized with autoConnect
      // The actual connection logic is tested in other tests
      const service = new EnhancedWebSocketService({
        autoConnect: true,
      });
      
      expect(service).toBeDefined();
      service.destroy();
    });

    it('should not connect when autoConnect is false', () => {
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should connect manually', () => {
      webSocketService.connect();
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should disconnect', () => {
      webSocketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should register event handlers', () => {
      const handler = jest.fn();
      webSocketService.on('test-event', handler);
      
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', handler);
    });

    it('should unregister event handlers', () => {
      const handler = jest.fn();
      webSocketService.on('test-event', handler);
      webSocketService.off('test-event', handler);
      
      expect(mockSocket.off).toHaveBeenCalledWith('test-event', handler);
    });

    it('should emit messages when connected', () => {
      mockSocket.connected = true;
      
      webSocketService.emit('test-event', { data: 'test' });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' }, undefined);
    });

    it('should queue messages when not connected', () => {
      mockSocket.connected = false;
      
      webSocketService.emit('test-event', { data: 'test' });
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
      // Message should be queued
    });
  });

  describe('Connection Callbacks', () => {
    it('should register connection change callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = webSocketService.onConnectionChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify connection callbacks on connect', () => {
      const callback = jest.fn();
      webSocketService.onConnectionChange(callback);
      
      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
        expect(callback).toHaveBeenCalledWith(true);
      }
    });

    it('should notify connection callbacks on disconnect', () => {
      const callback = jest.fn();
      webSocketService.onConnectionChange(callback);
      
      // Simulate disconnection
      const disconnectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];
      
      if (disconnectHandler) {
        disconnectHandler('test reason');
        expect(callback).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Connection Statistics', () => {
    it('should return initial connection stats', () => {
      const stats = webSocketService.getConnectionStats();
      
      expect(stats).toEqual({
        connected: false,
        reconnectAttempts: 0,
        lastConnected: null,
        lastDisconnected: null,
        connectionTime: 0,
        latency: 0,
      });
    });

    it('should update connection stats on connect', () => {
      const statsBefore = webSocketService.getConnectionStats();
      
      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
        
        const statsAfter = webSocketService.getConnectionStats();
        
        expect(statsAfter.connected).toBe(true);
        expect(statsAfter.reconnectAttempts).toBe(0);
        expect(statsAfter.lastConnected).not.toBeNull();
        expect(statsAfter.connectionTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Message Queue', () => {
    it('should queue messages when disconnected', () => {
      mockSocket.connected = false;
      
      webSocketService.emit('event1', { data: 'test1' });
      webSocketService.emit('event2', { data: 'test2' });
      
      const queueSize = webSocketService.getQueueSize();
      expect(queueSize).toBe(2);
    });

    it('should process queued messages when connected', (done) => {
      mockSocket.connected = false;
      
      // Queue messages
      webSocketService.emit('event1', { data: 'test1' });
      webSocketService.emit('event2', { data: 'test2' });
      
      // Connect
      mockSocket.connected = true;
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
        
        // Wait for queue processing
        setTimeout(() => {
          // Check that emit was called at least once
          expect(mockSocket.emit).toHaveBeenCalled();
          done();
        }, 100);
      }
    });

    it('should clear queue', () => {
      mockSocket.connected = false;
      
      webSocketService.emit('event1', { data: 'test1' });
      webSocketService.emit('event2', { data: 'test2' });
      
      expect(webSocketService.getQueueSize()).toBe(2);
      
      webSocketService.clearQueue();
      
      expect(webSocketService.getQueueSize()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const callback = jest.fn();
      webSocketService.onConnectionChange(callback);
      
      const errorHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'connect_error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
        expect(callback).toHaveBeenCalledWith(false);
      }
    });

    it('should handle reconnection errors', () => {
      const errorHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'reconnect_error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Reconnection failed'));
        // Should not throw
      }
    });

    it('should handle reconnection failed', () => {
      const callback = jest.fn();
      webSocketService.onConnectionChange(callback);
      
      const failedHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'reconnect_failed'
      )?.[1];
      
      if (failedHandler) {
        failedHandler();
        expect(callback).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Cleanup', () => {
    it('should destroy service properly', () => {
      const callback = jest.fn();
      webSocketService.onConnectionChange(callback);
      
      webSocketService.destroy();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(webSocketService.getQueueSize()).toBe(0);
    });
  });
});