'use client';

import { useEffect, useState, useCallback } from 'react';
import { enhancedDatabaseService } from '@/lib/services/enhancedDatabaseService';
import { globalCacheManager, CacheNamespaces } from '@/lib/services/cacheService';

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
  }, [enabled, cacheKey, ttl, operation]);

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