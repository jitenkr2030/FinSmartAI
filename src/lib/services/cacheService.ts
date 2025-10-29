import { LRUCache } from 'lru-cache';

interface CacheOptions {
  max?: number;
  ttl?: number;
  allowStale?: boolean;
  updateAgeOnGet?: boolean;
  noDeleteOnStaleGet?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class EnhancedCacheManager {
  private caches: Map<string, LRUCache<string, any>>;
  private stats: Map<string, CacheStats>;
  private defaultOptions: CacheOptions;

  constructor(defaultOptions: CacheOptions = {}) {
    this.defaultOptions = {
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
      allowStale: false,
      updateAgeOnGet: false,
      noDeleteOnStaleGet: false,
      ...defaultOptions
    };

    this.caches = new Map();
    this.stats = new Map();
  }

  /**
   * Create or get a cache instance for a specific namespace
   */
  getCache(namespace: string, options?: CacheOptions): LRUCache<string, any> {
    if (!this.caches.has(namespace)) {
      const cacheOptions = { ...this.defaultOptions, ...options };
      const cache = new LRUCache(cacheOptions);
      
      this.caches.set(namespace, cache);
      this.initializeStats(namespace, cacheOptions);
    }

    return this.caches.get(namespace)!;
  }

  /**
   * Initialize statistics for a cache namespace
   */
  private initializeStats(namespace: string, options: CacheOptions) {
    this.stats.set(namespace, {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: options.max || 1000,
      hitRate: 0
    });
  }

  /**
   * Get a value from cache
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;

    try {
      const value = cache.get(key);
      
      if (value !== undefined) {
        stats.hits++;
        stats.size = cache.size;
        stats.hitRate = stats.hits / (stats.hits + stats.misses);
        return value as T;
      } else {
        stats.misses++;
        stats.hitRate = stats.hits / (stats.hits + stats.misses);
        return null;
      }
    } catch (error) {
      stats.misses++;
      stats.hitRate = stats.hits / (stats.hits + stats.misses);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(namespace: string, key: string, value: T, ttl?: number): Promise<void> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;

    try {
      if (ttl) {
        cache.set(key, value, { ttl });
      } else {
        cache.set(key, value);
      }
      
      stats.size = cache.size;
    } catch (error) {
      console.error(`Cache set error for ${namespace}:${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;

    try {
      const deleted = cache.delete(key);
      stats.size = cache.size;
      return deleted;
    } catch (error) {
      console.error(`Cache delete error for ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all values in a cache namespace
   */
  async clear(namespace: string): Promise<void> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;

    try {
      cache.clear();
      stats.size = 0;
    } catch (error) {
      console.error(`Cache clear error for ${namespace}:`, error);
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(namespace: string, key: string): Promise<boolean> {
    const cache = this.getCache(namespace);

    try {
      return cache.has(key);
    } catch (error) {
      console.error(`Cache has error for ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(namespace: string, keys: string[]): Promise<Map<string, T>> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;
    const result = new Map<string, T>();

    try {
      keys.forEach(key => {
        const value = cache.get(key);
        if (value !== undefined) {
          result.set(key, value as T);
          stats.hits++;
        } else {
          stats.misses++;
        }
      });

      stats.hitRate = stats.hits / (stats.hits + stats.misses);
      stats.size = cache.size;
    } catch (error) {
      console.error(`Cache getMany error for ${namespace}:`, error);
    }

    return result;
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(namespace: string, entries: Map<string, T>, ttl?: number): Promise<void> {
    const cache = this.getCache(namespace);
    const stats = this.stats.get(namespace)!;

    try {
      entries.forEach((value, key) => {
        if (ttl) {
          cache.set(key, value, { ttl });
        } else {
          cache.set(key, value);
        }
      });

      stats.size = cache.size;
    } catch (error) {
      console.error(`Cache setMany error for ${namespace}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache, if not exists, compute and cache
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    // Compute the value
    const value = await computeFn();
    
    // Set in cache
    await this.set(namespace, key, value, ttl);
    
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(namespace?: string): CacheStats | Map<string, CacheStats> {
    if (namespace) {
      return { ...this.stats.get(namespace)! };
    }
    
    return new Map(this.stats);
  }

  /**
   * Reset statistics for a namespace
   */
  resetStats(namespace: string): void {
    const stats = this.stats.get(namespace);
    if (stats) {
      stats.hits = 0;
      stats.misses = 0;
      stats.hitRate = 0;
    }
  }

  /**
   * Get cache size information
   */
  getSizeInfo(namespace?: string): any {
    if (namespace) {
      const cache = this.caches.get(namespace);
      if (!cache) return null;

      return {
        size: cache.size,
        maxSize: cache.max,
        itemCount: cache.size,
        calculatedSize: cache.calculatedSize
      };
    }

    const sizeInfo: any = {};
    this.caches.forEach((cache, ns) => {
      sizeInfo[ns] = {
        size: cache.size,
        maxSize: cache.max,
        itemCount: cache.size,
        calculatedSize: cache.calculatedSize
      };
    });

    return sizeInfo;
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<void> {
    this.caches.forEach((cache, namespace) => {
      cache.purgeStale();
      
      // Reset stats for accurate hit rate calculation
      const stats = this.stats.get(namespace);
      if (stats) {
        stats.size = cache.size;
      }
    });
  }

  /**
   * Destroy cache manager and clean up all caches
   */
  destroy(): void {
    this.caches.forEach(cache => {
      cache.clear();
    });
    this.caches.clear();
    this.stats.clear();
  }
}

// Pre-configured cache namespaces
export const CacheNamespaces = {
  MARKET_DATA: 'market_data',
  PREDICTIONS: 'predictions',
  USER_DATA: 'user_data',
  API_RESPONSES: 'api_responses',
  SESSION_DATA: 'session_data',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  MODELS: 'models'
} as const;

// Cache TTL configurations (in milliseconds)
export const CacheTTL = {
  MARKET_DATA: 1000 * 30, // 30 seconds - market data changes frequently
  PREDICTIONS: 1000 * 60 * 5, // 5 minutes - predictions are valid for short periods
  USER_DATA: 1000 * 60 * 60, // 1 hour - user data doesn't change often
  API_RESPONSES: 1000 * 60 * 10, // 10 minutes - API responses
  SESSION_DATA: 1000 * 60 * 60 * 24, // 24 hours - session data
  ANALYTICS: 1000 * 60 * 15, // 15 minutes - analytics data
  NOTIFICATIONS: 1000 * 60 * 60, // 1 hour - notifications
  MODELS: 1000 * 60 * 60 * 2 // 2 hours - model information
} as const;

// Global cache manager instance
export const globalCacheManager = new EnhancedCacheManager({
  max: 5000,
  ttl: CacheTTL.API_RESPONSES
});

// Higher-order function for caching API responses
export function withCache<T>(
  namespace: string,
  keyFn: (...args: any[]) => string,
  apiFn: (...args: any[]) => Promise<T>,
  ttl?: number
) {
  return async (...args: any[]): Promise<T> => {
    const key = keyFn(...args);
    return globalCacheManager.getOrSet(namespace, key, () => apiFn(...args), ttl);
  };
}

// Cache utilities
export const cacheUtils = {
  /**
   * Generate cache key from parameters
   */
  generateKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${prefix}?${sortedParams}`;
  },

  /**
   * Cache market data with automatic TTL
   */
  cacheMarketData: (symbol: string, data: any): Promise<void> => {
    const key = `market_${symbol}_${Date.now()}`;
    return globalCacheManager.set(CacheNamespaces.MARKET_DATA, key, data, CacheTTL.MARKET_DATA);
  },

  /**
   * Get cached market data
   */
  getCachedMarketData: (symbol: string): Promise<any | null> => {
    // Get the most recent entry for this symbol
    const cache = globalCacheManager.getCache(CacheNamespaces.MARKET_DATA);
    const keys = Array.from(cache.keys())
      .filter(key => key.startsWith(`market_${symbol}_`))
      .sort()
      .reverse();
    
    if (keys.length > 0) {
      return globalCacheManager.get(CacheNamespaces.MARKET_DATA, keys[0]);
    }
    
    return Promise.resolve(null);
  },

  /**
   * Cache prediction results
   */
  cachePrediction: (model: string, symbol: string, prediction: any): Promise<void> => {
    const key = `prediction_${model}_${symbol}_${Date.now()}`;
    return globalCacheManager.set(CacheNamespaces.PREDICTIONS, key, prediction, CacheTTL.PREDICTIONS);
  },

  /**
   * Get cached predictions
   */
  getCachedPredictions: (model: string, symbol: string): Promise<any[]> => {
    const cache = globalCacheManager.getCache(CacheNamespaces.PREDICTIONS);
    const keys = Array.from(cache.keys())
      .filter(key => key.startsWith(`prediction_${model}_${symbol}_`))
      .sort();
    
    const predictions: any[] = [];
    keys.forEach(key => {
      const prediction = cache.get(key);
      if (prediction) {
        predictions.push(prediction);
      }
    });
    
    return Promise.resolve(predictions);
  }
};