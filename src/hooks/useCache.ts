'use client';

import { useEffect, useState, useCallback } from 'react';
import { globalCacheManager, CacheNamespaces } from '@/lib/services/cacheService';

export function useCache<T>(
  namespace: string,
  key: string,
  computeFn: () => Promise<T>,
  ttl?: number,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await globalCacheManager.getOrSet(namespace, key, computeFn, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [namespace, key, computeFn, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await globalCacheManager.delete(namespace, key);
    setData(null);
  }, [namespace, key]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}