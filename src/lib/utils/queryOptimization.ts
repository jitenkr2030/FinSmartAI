import { db } from '@/lib/db';
import { enhancedDatabaseService } from '@/lib/services/enhancedDatabaseService';
import { globalCacheManager, CacheNamespaces, CacheTTL } from '@/lib/services/cacheService';
import { logger } from '@/lib/services/monitoringService';

// Query optimization utilities
export class QueryOptimizer {
  // Cache key generators
  static generateUserKey(userId: string, operation: string, params?: any): string {
    const paramString = params ? `_${JSON.stringify(params)}` : '';
    return `user_${userId}_${operation}${paramString}`;
  }

  static generateModelKey(modelName: string, operation: string, params?: any): string {
    const paramString = params ? `_${JSON.stringify(params)}` : '';
    return `model_${modelName}_${operation}${paramString}`;
  }

  static generateMarketKey(symbol: string, timeframe: string, params?: any): string {
    const paramString = params ? `_${JSON.stringify(params)}` : '';
    return `market_${symbol}_${timeframe}${paramString}`;
  }

  // Optimized user queries
  static async getUserWithCache(userId: string, options: {
    includeSubscriptions?: boolean;
    includePortfolios?: boolean;
    useCache?: boolean;
  } = {}) {
    const {
      includeSubscriptions = false,
      includePortfolios = false,
      useCache = true
    } = options;

    const cacheKey = this.generateUserKey(userId, 'profile', {
      includeSubscriptions,
      includePortfolios
    });

    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) return cached;
    }

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
          passwordHash: false,
          ...(includeSubscriptions && {
            subscriptions: {
              where: { status: 'active' },
              include: {
                plan: {
                  select: {
                    name: true,
                    features: true
                  }
                }
              }
            }
          }),
          ...(includePortfolios && {
            portfolios: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            }
          })
        }
      });

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
      logger.error('Optimized query error: getUserWithCache', { error, userId });
      throw error;
    }
  }

  // Optimized model queries
  static async getModelWithCache(modelName: string, options: {
    includePredictions?: boolean;
    predictionsLimit?: number;
    useCache?: boolean;
  } = {}) {
    const {
      includePredictions = false,
      predictionsLimit = 10,
      useCache = true
    } = options;

    const cacheKey = this.generateModelKey(modelName, 'details', {
      includePredictions,
      predictionsLimit
    });

    if (useCache) {
      const cached = await globalCacheManager.get(CacheNamespaces.MODELS, cacheKey);
      if (cached) return cached;
    }

    try {
      const model = await db.aIModel.findUnique({
        where: { name: modelName, isActive: true },
        include: {
          ...(includePredictions && {
            predictions: {
              orderBy: { createdAt: 'desc' },
              take: predictionsLimit,
              select: {
                id: true,
                confidenceScore: true,
                processingTimeMs: true,
                createdAt: true
              }
            }
          })
        }
      });

      if (model && useCache) {
        await globalCacheManager.set(
          CacheNamespaces.MODELS,
          cacheKey,
          model,
          CacheTTL.MODELS
        );
      }

      return model;
    } catch (error) {
      logger.error('Optimized query error: getModelWithCache', { error, modelName });
      throw error;
    }
  }

  // Optimized bulk operations
  static async bulkCreateWithOptimization(
    model: any,
    data: any[],
    options: {
      batchSize?: number;
      skipDuplicates?: boolean;
      invalidateCache?: boolean;
      cacheKeys?: string[];
    } = {}
  ) {
    const {
      batchSize = 100,
      skipDuplicates = false,
      invalidateCache = true,
      cacheKeys = []
    } = options;

    try {
      const results: any[] = [];
      
      // Process in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        if (skipDuplicates) {
          // Check for duplicates before inserting
          const uniqueFields = this.getUniqueFields(model);
          if (uniqueFields.length > 0) {
            const existing = await this.findExistingRecords(model, batch, uniqueFields);
            const newRecords = batch.filter(record => 
              !existing.some(existing => this.isDuplicate(record, existing, uniqueFields))
            );
            
            if (newRecords.length > 0) {
              const batchResult = await model.createMany({ data: newRecords });
              results.push(...batchResult);
            }
          } else {
            const batchResult = await model.createMany({ data: batch });
            results.push(...batchResult);
          }
        } else {
          const batchResult = await model.createMany({ data: batch });
          results.push(...batchResult);
        }
      }

      // Invalidate cache if requested
      if (invalidateCache && cacheKeys.length > 0) {
        await Promise.all(
          cacheKeys.map(key => 
            globalCacheManager.delete(CacheNamespaces.USER_DATA, key)
          )
        );
      }

      return results;
    } catch (error) {
      logger.error('Bulk create optimization error', { error, model: model.name });
      throw error;
    }
  }

  // Optimized read operations with pagination
  static async getPaginatedWithCache(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      page?: number;
      limit?: number;
      cacheKey?: string;
      ttl?: number;
    } = {}
  ) {
    const {
      where = {},
      orderBy = { createdAt: 'desc' },
      include = {},
      page = 1,
      limit = 20,
      cacheKey,
      ttl = 1000 * 60 * 5 // 5 minutes
    } = options;

    if (cacheKey) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) return cached;
    }

    try {
      const skip = (page - 1) * limit;

      // Execute count and query in parallel
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

      if (cacheKey) {
        await globalCacheManager.set(
          CacheNamespaces.USER_DATA,
          cacheKey,
          result,
          ttl
        );
      }

      return result;
    } catch (error) {
      logger.error('Paginated query optimization error', { error });
      throw error;
    }
  }

  // Optimized aggregation queries
  static async getAggregatedData(
    model: any,
    options: {
      where?: any;
      groupBy?: string[];
      aggregations?: {
        [key: string]: 'count' | 'sum' | 'avg' | 'min' | 'max';
      };
      orderBy?: any;
      cacheKey?: string;
      ttl?: number;
    } = {}
  ) {
    const {
      where = {},
      groupBy = [],
      aggregations = {},
      orderBy = {},
      cacheKey,
      ttl = 1000 * 60 * 15 // 15 minutes
    } = options;

    if (cacheKey) {
      const cached = await globalCacheManager.get(CacheNamespaces.USER_DATA, cacheKey);
      if (cached) return cached;
    }

    try {
      // Build aggregation query
      const select: any = {};
      
      if (groupBy.length > 0) {
        groupBy.forEach(field => {
          select[field] = true;
        });
      }

      Object.entries(aggregations).forEach(([alias, operation]) => {
        const [field] = alias.split('_');
        switch (operation) {
          case 'count':
            select[alias] = { _count: { select: { [field]: true } } };
            break;
          case 'sum':
            select[alias] = { _sum: { [field]: true } };
            break;
          case 'avg':
            select[alias] = { _avg: { [field]: true } };
            break;
          case 'min':
            select[alias] = { _min: { [field]: true } };
            break;
          case 'max':
            select[alias] = { _max: { [field]: true } };
            break;
        }
      });

      const result = await model.findMany({
        where,
        select,
        orderBy,
        ...(groupBy.length > 0 && { groupBy })
      });

      if (cacheKey) {
        await globalCacheManager.set(
          CacheNamespaces.USER_DATA,
          cacheKey,
          result,
          ttl
        );
      }

      return result;
    } catch (error) {
      logger.error('Aggregation query optimization error', { error });
      throw error;
    }
  }

  // Helper methods
  private static getUniqueFields(model: any): string[] {
    // This would ideally be determined from the model schema
    // For now, return common unique fields
    return ['id', 'email', 'symbol'];
  }

  private static async findExistingRecords(model: any, records: any[], uniqueFields: string[]): Promise<any[]> {
    const uniqueValues = records.map(record => 
      uniqueFields.map(field => record[field]).join('_')
    );

    // Build OR condition for unique fields
    const whereClause = {
      OR: uniqueValues.map(values => 
        uniqueFields.reduce((acc, field, index) => ({
          ...acc,
          [field]: values[index]
        }), {})
      )
    };

    return await model.findMany({ where: whereClause });
  }

  private static isDuplicate(record: any, existing: any, uniqueFields: string[]): boolean {
    return uniqueFields.every(field => record[field] === existing[field]);
  }

  // Query performance monitoring
  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    options: {
      slowQueryThreshold?: number;
      logParameters?: any;
    } = {}
  ): Promise<T> {
    const {
      slowQueryThreshold = 1000, // 1 second
      logParameters = {}
    } = options;

    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const queryTime = Date.now() - startTime;

      if (queryTime > slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryName,
          queryTime,
          threshold: slowQueryThreshold,
          parameters: logParameters
        });
      }

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Query failed', {
        queryName,
        queryTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        parameters: logParameters
      });
      throw error;
    }
  }

  // Cache invalidation patterns
  static async invalidateUserRelatedCache(userId: string): Promise<void> {
    const cache = globalCacheManager.getCache(CacheNamespaces.USER_DATA);
    const keys = Array.from(cache.keys())
      .filter(key => key.includes(userId) || key.startsWith('user_'));

    await Promise.all(
      keys.map(key => globalCacheManager.delete(CacheNamespaces.USER_DATA, key))
    );
  }

  static async invalidateModelRelatedCache(modelName: string): Promise<void> {
    const cache = globalCacheManager.getCache(CacheNamespaces.MODELS);
    const keys = Array.from(cache.keys())
      .filter(key => key.includes(modelName) || key.startsWith('model_'));

    await Promise.all(
      keys.map(key => globalCacheManager.delete(CacheNamespaces.MODELS, key))
    );
  }

  static async invalidateMarketDataCache(symbol?: string): Promise<void> {
    const cache = globalCacheManager.getCache(CacheNamespaces.MARKET_DATA);
    const keys = Array.from(cache.keys())
      .filter(key => !symbol || key.includes(symbol));

    await Promise.all(
      keys.map(key => globalCacheManager.delete(CacheNamespaces.MARKET_DATA, key))
    );
  }
}

// Export optimized query builders for common patterns
export const OptimizedQueries = {
  // User queries
  getUserProfile: (userId: string) => 
    QueryOptimizer.monitorQuery('getUserProfile', () =>
      QueryOptimizer.getUserWithCache(userId, {
        includeSubscriptions: true,
        includePortfolios: true
      })
    ),

  getUserPortfolios: (userId: string, page = 1, limit = 20) =>
    QueryOptimizer.monitorQuery('getUserPortfolios', () =>
      QueryOptimizer.getPaginatedWithCache(
        db.portfolio,
        {
          where: { userId, isActive: true },
          include: {
            holdings: {
              include: {
                instrument: {
                  select: {
                    id: true,
                    symbol: true,
                    name: true,
                    type: true
                  }
                }
              }
            }
          },
          page,
          limit,
          cacheKey: `user_portfolios_${userId}_${page}_${limit}`
        }
      ),
      { logParameters: { userId, page, limit } }
    ),

  // Model queries
  getModelDetails: (modelName: string) =>
    QueryOptimizer.monitorQuery('getModelDetails', () =>
      QueryOptimizer.getModelWithCache(modelName, {
        includePredictions: true,
        predictionsLimit: 20
      })
    ),

  getActiveModels: () =>
    QueryOptimizer.monitorQuery('getActiveModels', () =>
      enhancedDatabaseService.getActiveModels()
    ),

  // Market data queries
  getMarketData: (symbol: string, timeframe: string, limit = 100) =>
    QueryOptimizer.monitorQuery('getMarketData', () =>
      enhancedDatabaseService.getMarketData(symbol, timeframe, limit)
    ),

  // Analytics queries
  getUserStats: (userId: string) =>
    QueryOptimizer.monitorQuery('getUserStats', () =>
      enhancedDatabaseService.getUserStats(userId)
    ),

  getApiUsageStats: (userId?: string, days = 30) =>
    QueryOptimizer.monitorQuery('getApiUsageStats', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return QueryOptimizer.getAggregatedData(
        db.apiUsage,
        {
          where: {
            ...(userId && { userId }),
            createdAt: { gte: startDate }
          },
          groupBy: ['modelName'],
          aggregations: {
            totalCalls: 'count',
            avgResponseTime: 'avg',
            totalCost: 'sum'
          },
          orderBy: { totalCalls: 'desc' },
          cacheKey: `api_usage_stats_${userId || 'all'}_${days}`,
          ttl: 1000 * 60 * 30 // 30 minutes
        }
      );
    })
};