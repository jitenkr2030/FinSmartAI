import { EnhancedCacheManager, CacheNamespaces, CacheTTL, cacheUtils } from '@/lib/services/cacheService';

describe('EnhancedCacheManager', () => {
  let cacheManager: EnhancedCacheManager;

  beforeEach(() => {
    cacheManager = new EnhancedCacheManager({
      max: 100,
      ttl: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('Basic Operations', () => {
    it('should create and get cache instance', () => {
      const cache = cacheManager.getCache('test-namespace');
      expect(cache).toBeDefined();
      expect(cache.max).toBe(100);
    });

    it('should set and get values', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      const value = await cacheManager.get('test', 'key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await cacheManager.get('test', 'non-existent');
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      const deleted = await cacheManager.delete('test', 'key1');
      expect(deleted).toBe(true);
      
      const value = await cacheManager.get('test', 'key1');
      expect(value).toBeNull();
    });

    it('should clear namespace', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      await cacheManager.set('test', 'key2', 'value2');
      
      await cacheManager.clear('test');
      
      const value1 = await cacheManager.get('test', 'key1');
      const value2 = await cacheManager.get('test', 'key2');
      
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('TTL Functionality', () => {
    it('should respect TTL', async () => {
      await cacheManager.set('test', 'key1', 'value1', 100); // 100ms TTL
      
      // Should be available immediately
      let value = await cacheManager.get('test', 'key1');
      expect(value).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be null after TTL expires
      value = await cacheManager.get('test', 'key1');
      expect(value).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      
      // Should be available immediately
      let value = await cacheManager.get('test', 'key1');
      expect(value).toBe('value1');
      
      // Wait for default TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be null after TTL expires
      value = await cacheManager.get('test', 'key1');
      expect(value).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      await cacheManager.set('test', 'key2', 'value2');
      await cacheManager.set('test', 'key3', 'value3');
      
      const results = await cacheManager.getMany('test', ['key1', 'key2', 'key3', 'key4']);
      
      expect(results.size).toBe(3);
      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('key3')).toBe('value3');
      expect(results.get('key4')).toBeUndefined();
    });

    it('should set multiple values', async () => {
      const entries = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3']
      ]);
      
      await cacheManager.setMany('test', entries);
      
      const value1 = await cacheManager.get('test', 'key1');
      const value2 = await cacheManager.get('test', 'key2');
      const value3 = await cacheManager.get('test', 'key3');
      
      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');
    });
  });

  describe('getOrSet Pattern', () => {
    it('should return cached value if exists', async () => {
      await cacheManager.set('test', 'key1', 'cached-value');
      
      const computeFn = jest.fn().mockResolvedValue('computed-value');
      const value = await cacheManager.getOrSet('test', 'key1', computeFn);
      
      expect(value).toBe('cached-value');
      expect(computeFn).not.toHaveBeenCalled();
    });

    it('should compute and cache value if not exists', async () => {
      const computeFn = jest.fn().mockResolvedValue('computed-value');
      const value = await cacheManager.getOrSet('test', 'key1', computeFn);
      
      expect(value).toBe('computed-value');
      expect(computeFn).toHaveBeenCalled();
      
      // Should be cached now
      const cachedValue = await cacheManager.get('test', 'key1');
      expect(cachedValue).toBe('computed-value');
    });

    it('should handle compute function errors', async () => {
      const computeFn = jest.fn().mockRejectedValue(new Error('Compute error'));
      
      await expect(cacheManager.getOrSet('test', 'key1', computeFn))
        .rejects.toThrow('Compute error');
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      
      // Hit
      await cacheManager.get('test', 'key1');
      
      // Miss
      await cacheManager.get('test', 'non-existent');
      
      const stats = cacheManager.getStats('test');
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate hit rate correctly', async () => {
      await cacheManager.set('test', 'key1', 'value1');
      await cacheManager.set('test', 'key2', 'value2');
      
      // Multiple hits
      await cacheManager.get('test', 'key1');
      await cacheManager.get('test', 'key1');
      await cacheManager.get('test', 'key2');
      
      // One miss
      await cacheManager.get('test', 'non-existent');
      
      const stats = cacheManager.getStats('test');
      
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.75);
    });
  });

  describe('Cache Utilities', () => {
    it('should generate cache keys correctly', () => {
      const key1 = cacheUtils.generateKey('market_data', { symbol: 'NIFTY50', timeframe: '1d' });
      const key2 = cacheUtils.generateKey('prediction', { model: 'SentimentAI', symbol: 'RELIANCE' });
      
      expect(key1).toBe('market_data?symbol="NIFTY50"&timeframe="1d"');
      expect(key2).toBe('prediction?model="SentimentAI"&symbol="RELIANCE"');
    });

    it('should have predefined cache namespaces', () => {
      expect(CacheNamespaces.MARKET_DATA).toBe('market_data');
      expect(CacheNamespaces.PREDICTIONS).toBe('predictions');
      expect(CacheNamespaces.USER_DATA).toBe('user_data');
      expect(CacheNamespaces.API_RESPONSES).toBe('api_responses');
    });

    it('should have predefined TTL values', () => {
      expect(CacheTTL.MARKET_DATA).toBe(30000); // 30 seconds
      expect(CacheTTL.PREDICTIONS).toBe(300000); // 5 minutes
      expect(CacheTTL.USER_DATA).toBe(3600000); // 1 hour
    });
  });
});