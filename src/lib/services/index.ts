// Export all services
export * from './apiClient';
export * from './marketDataService';
export * from './paymentService';
export * from './userService';
export * from './analyticsService';
export * from './modelRegistry';

// Utility functions for service integration
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  enableLogging?: boolean;
}

// Service health check
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

class ServiceManager {
  private services: Map<string, any> = new Map();
  private healthChecks: Map<string, () => Promise<ServiceHealth>> = new Map();
  private config: ServiceConfig;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      baseUrl: '/api',
      timeout: 30000,
      retries: 3,
      enableLogging: process.env.NODE_ENV === 'development',
      ...config,
    };
  }

  registerService(name: string, service: any, healthCheck?: () => Promise<ServiceHealth>) {
    this.services.set(name, service);
    if (healthCheck) {
      this.healthChecks.set(name, healthCheck);
    }
  }

  getService<T>(name: string): T | null {
    return this.services.get(name) || null;
  }

  async checkAllServices(): Promise<ServiceHealth[]> {
    const healthResults: ServiceHealth[] = [];

    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const startTime = Date.now();
        const health = await healthCheck();
        const responseTime = Date.now() - startTime;
        
        healthResults.push({
          ...health,
          responseTime,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        healthResults.push({
          name,
          status: 'unhealthy',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return healthResults;
  }

  async checkService(name: string): Promise<ServiceHealth | null> {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) {
      return null;
    }

    try {
      const startTime = Date.now();
      const health = await healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        ...health,
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getConfig(): ServiceConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global service manager instance
export const serviceManager = new ServiceManager();

// Initialize services with health checks
export function initializeServices() {
  // Register API client health check
  serviceManager.registerService('apiClient', apiClient, async () => {
    const response = await apiClient.healthCheck();
    return {
      name: 'API Client',
      status: response.success ? 'healthy' : 'unhealthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: response.error,
    };
  });

  // Register market data service health check
  serviceManager.registerService('marketData', marketDataService, async () => {
    try {
      const price = await marketDataService.getRealTimePrice('NIFTY 50');
      return {
        name: 'Market Data Service',
        status: price ? 'healthy' : 'degraded',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'Market Data Service',
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Register payment service health check
  serviceManager.registerService('payment', paymentService, async () => {
    try {
      const response = await apiClient.get('/payment/health');
      return {
        name: 'Payment Service',
        status: response.success ? 'healthy' : 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: response.error,
      };
    } catch (error) {
      return {
        name: 'Payment Service',
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Register user service health check
  serviceManager.registerService('user', userService, async () => {
    try {
      const response = await userService.getProfile();
      return {
        name: 'User Service',
        status: response.success ? 'healthy' : 'degraded',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: response.error,
      };
    } catch (error) {
      return {
        name: 'User Service',
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Register analytics service health check
  serviceManager.registerService('analytics', analyticsService, async () => {
    try {
      const response = await analyticsService.getMarketAnalytics();
      return {
        name: 'Analytics Service',
        status: response.success ? 'healthy' : 'degraded',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: response.error,
      };
    } catch (error) {
      return {
        name: 'Analytics Service',
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Register model registry service health check
  serviceManager.registerService('modelRegistry', ModelRegistryService, async () => {
    try {
      const models = await ModelRegistryService.getActiveModels();
      return {
        name: 'Model Registry',
        status: Array.isArray(models) ? 'healthy' : 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'Model Registry',
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

// React hooks for services
export function useServices() {
  return {
    apiClient,
    marketDataService,
    paymentService,
    userService,
    analyticsService,
    modelRegistry: ModelRegistryService,
    serviceManager,
  };
}

// Error handling utilities
export function handleServiceError(error: any, fallbackMessage: string = 'An error occurred'): ServiceError {
  if (error?.response?.data) {
    return {
      code: error.response.data.code || 'API_ERROR',
      message: error.response.data.message || fallbackMessage,
      details: error.response.data.details,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || fallbackMessage,
    details: error,
    timestamp: new Date().toISOString(),
  };
}

// Retry utility
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache utility
export class ServiceCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Global cache instance
export const serviceCache = new ServiceCache();

// Cached API call wrapper
export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cached = serviceCache.get(key);
  if (cached) {
    return cached;
  }

  const result = await apiCall();
  serviceCache.set(key, result, ttl);
  return result;
}

// WebSocket connection manager
export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  connect(url: string, name: string = 'default'): WebSocket {
    if (this.connections.has(name)) {
      this.connections.get(name)!.close();
    }

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log(`WebSocket connected: ${name}`);
      this.reconnectAttempts.set(name, 0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', { name, data });
        this.emit(`message:${name}`, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected: ${name}`);
      this.handleDisconnect(name, url);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error: ${name}`, error);
      this.emit('error', { name, error });
    };

    this.connections.set(name, ws);
    return ws;
  }

  private handleDisconnect(name: string, url: string) {
    const attempts = this.reconnectAttempts.get(name) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      console.log(`Reconnecting WebSocket ${name} in ${delay}ms...`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(name, attempts + 1);
        this.connect(url, name);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for WebSocket: ${name}`);
    }
  }

  send(name: string, data: any) {
    const ws = this.connections.get(name);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  close(name?: string) {
    if (name) {
      const ws = this.connections.get(name);
      if (ws) {
        ws.close();
        this.connections.delete(name);
      }
    } else {
      this.connections.forEach(ws => ws.close());
      this.connections.clear();
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Global WebSocket manager
export const webSocketManager = new WebSocketManager();

// Initialize services on module load
if (typeof window !== 'undefined') {
  initializeServices();
}