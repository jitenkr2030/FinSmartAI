'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CachedMarketDataService, 
  CachedModelService, 
  CachedUserService, 
  CachedAnalyticsService,
  cacheManagement,
  cacheUtils 
} from '@/lib/services/cachedApiService';
import { useCache } from '@/lib/services/cacheService';
import { 
  Database, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Trash2, 
  Activity,
  BarChart3,
  Users,
  Brain,
  Clock
} from 'lucide-react';

export default function CacheDemoPage() {
  const [marketData, setMarketData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Use the cache hook for demonstration
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    refetch: refetchDashboard 
  } = useCache(
    'analytics',
    'dashboard_summary',
    () => CachedAnalyticsService.getDashboardSummary(),
    300000, // 5 minutes
    []
  );

  // Load cache stats
  const loadCacheStats = async () => {
    try {
      const stats = cacheManagement.getCacheStats();
      const sizeInfo = cacheManagement.getCacheSizeInfo();
      setCacheStats({ stats, sizeInfo });
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  // Load market data
  const loadMarketData = async () => {
    setLoading(true);
    try {
      const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS'];
      const data = await CachedMarketDataService.getMultipleSymbolsData(symbols);
      setMarketData(Object.fromEntries(data));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load predictions
  const loadPredictions = async () => {
    try {
      const models = ['SentimentAI', 'OptionsAI', 'RiskAI'];
      const symbol = 'NIFTY50';
      
      const predictionPromises = models.map(model => 
        CachedModelService.getModelPrediction(model, symbol)
      );
      
      const results = await Promise.all(predictionPromises);
      setPredictions(results);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const analyticsData = await CachedAnalyticsService.getDashboardSummary();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  // Clear cache
  const clearCache = async (namespace?: string) => {
    try {
      if (namespace) {
        await cacheManagement.clearNamespace(namespace);
      } else {
        await cacheManagement.clearAllCaches();
      }
      
      // Reload data
      await Promise.all([
        loadMarketData(),
        loadPredictions(),
        loadAnalytics(),
        loadCacheStats()
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Warm up cache
  const warmUpCache = async () => {
    try {
      await cacheManagement.warmUpCache();
      await loadCacheStats();
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadMarketData(),
        loadPredictions(),
        loadAnalytics(),
        loadCacheStats()
      ]);
    };

    initializeData();
  }, []);

  // Format cache size
  const formatCacheSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format hit rate
  const formatHitRate = (hitRate: number) => {
    return `${(hitRate * 100).toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache Performance Demo</h1>
          <p className="text-gray-600 mt-2">
            Demonstrating the enhanced caching layer with real-time performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastRefresh && (
            <div className="text-sm text-gray-500">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Cache Statistics
            </CardTitle>
            <CardDescription>
              Real-time cache performance metrics across all namespaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(cacheStats.stats).map(([namespace, stats]: [string, any]) => {
                const sizeInfo = cacheStats.sizeInfo[namespace];
                return (
                  <div key={namespace} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{namespace}</h3>
                      <Badge variant={stats.hitRate > 0.8 ? 'default' : 'secondary'}>
                        {formatHitRate(stats.hitRate)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Hits: {stats.hits}</div>
                      <div>Misses: {stats.misses}</div>
                      <div>Size: {stats.size}/{stats.maxSize}</div>
                      {sizeInfo && (
                        <div>Memory: {formatCacheSize(sizeInfo.calculatedSize)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Control cache behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={loadMarketData} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Market Data
            </Button>
            <Button onClick={loadPredictions} disabled={loading}>
              <Brain className="w-4 h-4 mr-2" />
              Load Predictions
            </Button>
            <Button onClick={loadAnalytics} disabled={loading}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Load Analytics
            </Button>
            <Button onClick={warmUpCache} disabled={loading} variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Warm Up Cache
            </Button>
            <Button onClick={() => clearCache()} disabled={loading} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      <Tabs defaultValue="market" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard Hook</TabsTrigger>
        </TabsList>

        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Cached Market Data
              </CardTitle>
              <CardDescription>
                Real-time market data with intelligent caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(marketData).map(([symbol, data]: [string, any]) => (
                    <div key={symbol} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{symbol}</h3>
                      <div className="space-y-1 text-sm">
                        <div>Price: ₹{data.price.toFixed(2)}</div>
                        <div className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Change: {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}
                        </div>
                        <div>Volume: {data.volume.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          Updated: {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No market data loaded. Click "Load Market Data" to fetch cached data.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Cached AI Predictions
              </CardTitle>
              <CardDescription>
                AI model predictions with optimized caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{prediction.model}</h3>
                      <div className="space-y-1 text-sm">
                        <div>Symbol: {prediction.symbol}</div>
                        <div>Prediction: {prediction.prediction.toFixed(2)}</div>
                        <div>Confidence: {(prediction.confidence * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">
                          Updated: {new Date(prediction.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No predictions loaded. Click "Load Predictions" to fetch cached predictions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Cached Analytics
              </CardTitle>
              <CardDescription>
                Analytics data with intelligent caching for performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Market Sentiment</h3>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between">
                          <span>Sentiment:</span>
                          <Badge variant={analytics.marketSentiment.sentiment === 'bullish' ? 'default' : 'destructive'}>
                            {analytics.marketSentiment.sentiment}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Score: {analytics.marketSentiment.score.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">User Activity</h3>
                      <div className="p-3 bg-gray-50 rounded space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Active Users:</span>
                          <span>{analytics.userActivity.activeUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>New Users:</span>
                          <span>{analytics.userActivity.newUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sessions:</span>
                          <span>{analytics.userActivity.sessions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Prediction Accuracy</h3>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span>Overall Accuracy:</span>
                          <Badge variant="default">
                            {(analytics.predictionAccuracy.overallAccuracy).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          {Object.entries(analytics.predictionAccuracy.byModel).map(([model, accuracy]: [string, any]) => (
                            <div key={model} className="flex justify-between">
                              <span>{model}:</span>
                              <span>{accuracy.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">System Health</h3>
                      <div className="p-3 bg-gray-50 rounded space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant="default">{analytics.systemHealth.status}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Uptime:</span>
                          <span>{analytics.systemHealth.uptime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Response Time:</span>
                          <span>{analytics.systemHealth.responseTime}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No analytics data loaded. Click "Load Analytics" to fetch cached analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Dashboard Hook Demo
              </CardTitle>
              <CardDescription>
                Demonstrating the React useCache hook with automatic caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Loading dashboard data from cache...</p>
                </div>
              ) : dashboardData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Market Sentiment</h3>
                      <Badge variant={dashboardData.marketSentiment.sentiment === 'bullish' ? 'default' : 'destructive'}>
                        {dashboardData.marketSentiment.sentiment}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        Score: {dashboardData.marketSentiment.score.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Active Users</h3>
                      <div className="text-2xl font-bold">{dashboardData.userActivity.activeUsers}</div>
                      <div className="text-sm text-gray-600">
                        New: {dashboardData.userActivity.newUsers}
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">System Health</h3>
                      <Badge variant="default">{dashboardData.systemHealth.status}</Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        {dashboardData.systemHealth.uptime} uptime
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={refetchDashboard} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refetch Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No dashboard data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}