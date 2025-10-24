import { db } from '@/lib/db';
import { globalCacheManager, CacheNamespaces, CacheTTL, cacheUtils } from './cacheService';
import { logger } from './monitoringService';

// Database query optimization service
export class EnhancedDatabaseService {
  private queryStats: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    slowQueries: number;
  }> = new Map();

  private cacheHitRates: Map<string, {
    hits: number;
    misses: number;
    hitRate: number;
  }> = new Map();

  constructor() {
    this.initializeCacheStats();
    this.startPeriodicCleanup();
  }

  private initializeCacheStats() {
    Object.values(CacheNamespaces).forEach(namespace => {
      this.cacheHitRates.set(namespace, {
        hits: 0,
        misses: 0,
        hitRate: 0
      });
    });
  }

  // Optimized user queries with caching
  async getUserById(userId: string, useCache = true): Promise<any> {
    const cacheKey = `user_${userId}`;
    
    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) {
        this.updateCacheStats(CacheNamespaces.USER_DATA, true);
        return cached;
      }
      this.updateCacheStats(CacheNamespaces.USER_DATA, false);
    }

    const startTime = Date.now();
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
          isActive: true,
          emailVerified: true,
          // Exclude sensitive data
          passwordHash: false
        }
      });

      const queryTime = Date.now() - startTime;
      this.trackQuery('getUserById', queryTime);

      if (user && useCache) {
        await globalCacheManager.set(
          CacheNamespaces.USER_DATA, 
          cacheKey, 
          user, 
          CacheTTL.USER_DATA
        );
      }

      return user;
    } catch (error) {
      logger.error('Database query error: getUserById', { error, userId });
      throw error;
    }
  }

  // Optimized portfolio queries with caching and includes
  async getUserPortfolios(userId: string, options: {
    includeHoldings?: boolean;
    includeRiskMetrics?: boolean;
    includeLatestMetrics?: number;
    useCache?: boolean;
  } = {}): Promise<any[]> {
    const {
      includeHoldings = true,
      includeRiskMetrics = true,
      includeLatestMetrics = 5,
      useCache = true
    } = options;

    const cacheKey = `portfolios_${userId}_${JSON.stringify(options)}`;
    
    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) {
        this.updateCacheStats(CacheNamespaces.USER_DATA, true);
        return cached;
      }
      this.updateCacheStats(CacheNamespaces.USER_DATA, false);
    }

    const startTime = Date.now();
    try {
      const portfolios = await db.portfolio.findMany({
        where: { userId, isActive: true },
        include: {
          holdings: includeHoldings ? {
            include: {
              instrument: {
                select: {
                  id: true,
                  symbol: true,
                  name: true,
                  type: true,
                  exchange: true,
                  currency: true
                }
              }
            }
          } : false,
          riskMetrics: includeRiskMetrics ? {
            orderBy: { timestamp: 'desc' },
            take: includeLatestMetrics
          } : false
        },
        orderBy: { createdAt: 'desc' }
      });

      const queryTime = Date.now() - startTime;
      this.trackQuery('getUserPortfolios', queryTime);

      if (portfolios.length > 0 && useCache) {
        await globalCacheManager.set(
          CacheNamespaces.USER_DATA, 
          cacheKey, 
          portfolios, 
          CacheTTL.USER_DATA
        );
      }

      return portfolios;
    } catch (error) {
      logger.error('Database query error: getUserPortfolios', { error, userId });
      throw error;
    }
  }

  // Optimized model queries with caching
  async getActiveModels(useCache = true): Promise<any[]> {
    const cacheKey = 'active_models';
    
    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.MODELS, cacheKey);
      if (cached) {
        this.updateCacheStats(CacheNamespaces.MODELS, true);
        return cached;
      }
      this.updateCacheStats(CacheNamespaces.MODELS, false);
    }

    const startTime = Date.now();
    try {
      const models = await db.aIModel.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          version: true,
          modelType: true,
          performanceMetrics: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      const queryTime = Date.now() - startTime;
      this.trackQuery('getActiveModels', queryTime);

      if (useCache) {
        await globalCacheManager.set(
          CacheNamespaces.MODELS, 
          cacheKey, 
          models, 
          CacheTTL.MODELS
        );
      }

      return models;
    } catch (error) {
      logger.error('Database query error: getActiveModels', { error });
      throw error;
    }
  }

  // Batch operations for better performance
  async batchCreatePredictions(predictions: any[]): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      // Use transaction for data consistency
      const result = await db.$transaction(
        predictions.map(prediction => 
          db.prediction.create({
            data: prediction
          })
        )
      );

      const queryTime = Date.now() - startTime;
      this.trackQuery('batchCreatePredictions', queryTime);

      // Invalidate relevant cache
      await this.invalidateCacheForPredictions(predictions);

      return result;
    } catch (error) {
      logger.error('Database batch operation error: batchCreatePredictions', { error });
      throw error;
    }
  }

  // Optimized market data queries with time-based caching
  async getMarketData(symbol: string, timeframe: string, limit: number = 100): Promise<any[]> {
    const cacheKey = `market_data_${symbol}_${timeframe}_${limit}`;
    
    // Check cache first
    const cached = await globalCacheManager.get(CacheNamespaces.MARKET_DATA, cacheKey);
    if (cached) {
      this.updateCacheStats(CacheNamespaces.MARKET_DATA, true);
      return cached;
    }
    this.updateCacheStats(CacheNamespaces.MARKET_DATA, false);

    const startTime = Date.now();
    try {
      const marketData = await db.marketData.findMany({
        where: { 
          instrumentId: symbol,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      const queryTime = Date.now() - startTime;
      this.trackQuery('getMarketData', queryTime);

      // Cache with short TTL for market data
      await globalCacheManager.set(
        CacheNamespaces.MARKET_DATA, 
        cacheKey, 
        marketData, 
        CacheTTL.MARKET_DATA
      );

      return marketData;
    } catch (error) {
      logger.error('Database query error: getMarketData', { error, symbol });
      throw error;
    }
  }

  // Optimized query for user statistics
  async getUserStats(userId: string): Promise<any> {
    const cacheKey = `user_stats_${userId}`;
    
    // Check cache first
    const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
    if (cached) {
      this.updateCacheStats(CacheNamespaces.USER_DATA, true);
      return cached;
    }
    this.updateCacheStats(CacheNamespaces.USER_DATA, false);

    const startTime = Date.now();
    try {
      // Run multiple queries in parallel for better performance
      const [
        portfolioCount,
        totalPredictions,
        apiUsageCount,
        latestActivity
      ] = await Promise.all([
        db.portfolio.count({ where: { userId, isActive: true } }),
        db.prediction.count({ where: { userId } }),
        db.apiUsage.count({ where: { userId } }),
        db.prediction.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ]);

      const stats = {
        portfolioCount,
        totalPredictions,
        apiUsageCount,
        latestActivity: latestActivity?.createdAt || null,
        calculatedAt: new Date().toISOString()
      };

      const queryTime = Date.now() - startTime;
      this.trackQuery('getUserStats', queryTime);

      // Cache stats for 1 hour
      await globalCacheManager.set(
        CacheNamespaces.USER_DATA, 
        cacheKey, 
        stats, 
        1000 * 60 * 60
      );

      return stats;
    } catch (error) {
      logger.error('Database query error: getUserStats', { error, userId });
      throw error;
    }
  }

  // Pagination helper for large datasets
  async getPaginatedData(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      page?: number;
      limit?: number;
      useCache?: boolean;
    }
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      where = {},
      orderBy = { createdAt: 'desc' },
      include = {},
      page = 1,
      limit = 20,
      useCache = false
    } = options;

    const cacheKey = `paginated_${model.name}_${JSON.stringify({ where, page, limit })}`;
    
    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) {
        this.updateCacheStats(CacheNamespaces.USER_DATA, true);
        return cached;
      }
      this.updateCacheStats(CacheNamespaces.USER_DATA, false);
    }

    const startTime = Date.now();
    try {
      const skip = (page - 1) * limit;

      // Get data and total count in parallel
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          include,
          skip,
          take: limit
        }),
        model.count({ where })
      ]);

      const result = {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      const queryTime = Date.now() - startTime;
      this.trackQuery('getPaginatedData', queryTime);

      if (useCache) {
        await globalCacheManager.set(
          CacheNamespaces.USER_DATA, 
          cacheKey, 
          result, 
          1000 * 60 * 5 // 5 minutes
        );
      }

      return result;
    } catch (error) {
      logger.error('Database query error: getPaginatedData', { error });
      throw error;
    }
  }

  // Cache invalidation helpers
  async invalidateUserCache(userId: string): Promise<void> {
    const userCache = globalCacheManager.getCache(CacheNamespaces.USER_DATA);
    const keysToDelete = Array.from(userCache.keys())
      .filter(key => key.includes(userId) || key.startsWith('user_'));

    await Promise.all(
      keysToDelete.map(key => 
        globalCacheManager.delete(CacheNamespaces.USER_DATA, key)
      )
    );
  }

  async invalidateCacheForPredictions(predictions: any[]): Promise<void> {
    const userIds = [...new Set(predictions.map(p => p.userId))];
    
    await Promise.all(
      userIds.map(userId => this.invalidateUserCache(userId))
    );
  }

  async invalidateModelCache(): Promise<void> {
    await globalCacheManager.clear(CacheNamespaces.MODELS);
  }

  // Query performance tracking
  private trackQuery(queryName: string, queryTime: number): void {
    const stats = this.queryStats.get(queryName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowQueries: 0
    };

    stats.count++;
    stats.totalTime += queryTime;
    stats.avgTime = stats.totalTime / stats.count;
    
    if (queryTime > 1000) { // Slow query threshold (1 second)
      stats.slowQueries++;
      logger.warn('Slow database query detected', {
        queryName,
        queryTime,
        avgTime: stats.avgTime
      });
    }

    this.queryStats.set(queryName, stats);
  }

  private updateCacheStats(namespace: string, isHit: boolean): void {
    const stats = this.cacheHitRates.get(namespace);
    if (stats) {
      if (isHit) {
        stats.hits++;
      } else {
        stats.misses++;
      }
      stats.hitRate = stats.hits / (stats.hits + stats.misses);
      this.cacheHitRates.set(namespace, stats);
    }
  }

  // Get performance statistics
  getPerformanceStats(): any {
    return {
      queries: Object.fromEntries(this.queryStats),
      cache: Object.fromEntries(this.cacheHitRates),
      timestamp: new Date().toISOString()
    };
  }

  // Database health check
  async healthCheck(): Promise<{
    healthy: boolean;
    responseTime: number;
    connectionCount?: number;
    slowQueryCount: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple health check query
      await db.user.count({ take: 1 });
      
      const responseTime = Date.now() - startTime;
      const slowQueryCount = Array.from(this.queryStats.values())
        .reduce((sum, stats) => sum + stats.slowQueries, 0);

      return {
        healthy: responseTime < 5000, // 5 second threshold
        responseTime,
        slowQueryCount
      };
    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        slowQueryCount: Array.from(this.queryStats.values())
          .reduce((sum, stats) => sum + stats.slowQueries, 0)
      };
    }
  }

  // Periodic cleanup
  private startPeriodicCleanup(): void {
    // Clean up old query stats every hour
    setInterval(() => {
      this.cleanupQueryStats();
    }, 60 * 60 * 1000);

    // Clean up cache stats every 30 minutes
    setInterval(() => {
      this.cleanupCacheStats();
    }, 30 * 60 * 1000);
  }

  private cleanupQueryStats(): void {
    // Keep only recent query stats
    this.queryStats.forEach((stats, queryName) => {
      if (stats.count > 1000) {
        // Reset stats for high-frequency queries
        this.queryStats.set(queryName, {
          count: Math.floor(stats.count * 0.1),
          totalTime: stats.totalTime * 0.1,
          avgTime: stats.avgTime,
          slowQueries: Math.floor(stats.slowQueries * 0.1)
        });
      }
    });
  }

  private cleanupCacheStats(): void {
    this.cacheHitRates.forEach((stats, namespace) => {
      // Reset cache stats periodically
      this.cacheHitRates.set(namespace, {
        hits: Math.floor(stats.hits * 0.5),
        misses: Math.floor(stats.misses * 0.5),
        hitRate: stats.hitRate
      });
    });
  }

  // Optimized bulk operations
  async bulkCreatePortfolioHoldings(holdings: any[]): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      // Group by symbol to find/create instruments efficiently
      const symbols = [...new Set(holdings.map(h => h.symbol))];
      const existingInstruments = await db.financialInstrument.findMany({
        where: { symbol: { in: symbols } }
      });

      const existingSymbols = new Set(existingInstruments.map(i => i.symbol));
      const newInstruments = symbols
        .filter(symbol => !existingSymbols.has(symbol))
        .map(symbol => ({
          symbol,
          name: symbol,
          type: 'stock',
          exchange: 'NSE',
          currency: 'INR'
        }));

      // Create new instruments in batch
      let createdInstruments: any[] = [];
      if (newInstruments.length > 0) {
        createdInstruments = await db.financialInstrument.createMany({
          data: newInstruments
        });
      }

      // Get all instruments (existing + newly created)
      const allInstruments = await db.financialInstrument.findMany({
        where: { symbol: { in: symbols } }
      });

      // Create holdings with proper instrument IDs
      const holdingData = holdings.map(holding => {
        const instrument = allInstruments.find(i => i.symbol === holding.symbol);
        return {
          portfolioId: holding.portfolioId,
          instrumentId: instrument.id,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice
        };
      });

      const result = await db.portfolioHolding.createMany({
        data: holdingData
      });

      const queryTime = Date.now() - startTime;
      this.trackQuery('bulkCreatePortfolioHoldings', queryTime);

      return result;
    } catch (error) {
      logger.error('Database bulk operation error: bulkCreatePortfolioHoldings', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedDatabaseService = new EnhancedDatabaseService();

// React hook for enhanced database operations
import { useEffect, useState, useCallback } from 'react';

export function useEnhancedDatabase<T>(
  operation: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    enabled?: boolean;
    cacheKey?: string;
    ttl?: number;
  } = {}
) {
  const {
    enabled = true,
    cacheKey,
    ttl
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let result: T;
      
      if (cacheKey) {
        result = await globalCacheManager.getOrSet(
          CacheNamespaces.USER_DATA,
          cacheKey,
          operation,
          ttl
        );
      } else {
        result = await operation();
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [operation, enabled, cacheKey, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    if (cacheKey) {
      await globalCacheManager.delete(CacheNamespaces.USER_DATA, cacheKey);
    }
    setData(null);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}