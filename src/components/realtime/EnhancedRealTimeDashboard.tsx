'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMarketData, useNotifications, usePredictions } from '@/hooks/useWebSocket';
import { 
  RealTimeLineChart, 
  RealTimeAreaChart, 
  RealTimeBarChart, 
  RealTimePieChart,
  MarketDataStream
} from '@/components/charts/RealTimeChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Target, 
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  Signal,
  SignalLow,
  SignalHigh,
  Clock,
  DollarSign,
  Bell,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Users,
  Database,
  Cpu,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';

interface EnhancedRealTimeDashboardProps {
  userId?: string;
  symbols?: string[];
  models?: string[];
  showAdvancedFeatures?: boolean;
}

const DEFAULT_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
const DEFAULT_MODELS = ['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI'];

interface SystemMetrics {
  cpu: number;
  memory: number;
  connections: number;
  uptime: string;
  latency: number;
}

interface PerformanceMetrics {
  throughput: number;
  errorRate: number;
  responseTime: number;
  availability: number;
}

export function EnhancedRealTimeDashboard({ 
  userId = 'demo-user',
  symbols = DEFAULT_SYMBOLS,
  models = DEFAULT_MODELS,
  showAdvancedFeatures = true
}: EnhancedRealTimeDashboardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    connections: 0,
    uptime: '0s',
    latency: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    throughput: 0,
    errorRate: 0,
    responseTime: 0,
    availability: 100
  });
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  // WebSocket hooks
  const { marketData, isConnected: marketConnected } = useMarketData(selectedSymbol);
  const { notifications, isConnected: notificationsConnected, clearNotifications } = useNotifications(userId);
  const { predictions, isConnected: predictionsConnected, clearPredictions } = usePredictions(selectedModel);

  // Initialize real-time data
  useEffect(() => {
    // Simulate system metrics
    const updateSystemMetrics = () => {
      setSystemMetrics({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        connections: Math.floor(Math.random() * 1000) + 100,
        uptime: formatUptime(Math.floor(Math.random() * 86400)),
        latency: Math.random() * 100
      });
    };

    // Simulate performance metrics
    const updatePerformanceMetrics = () => {
      setPerformanceMetrics({
        throughput: Math.random() * 10000,
        errorRate: Math.random() * 5,
        responseTime: Math.random() * 500,
        availability: 95 + Math.random() * 5
      });
    };

    // Initial update
    updateSystemMetrics();
    updatePerformanceMetrics();

    // Set up intervals
    const systemInterval = setInterval(updateSystemMetrics, 5000);
    const performanceInterval = setInterval(updatePerformanceMetrics, 3000);

    return () => {
      clearInterval(systemInterval);
      clearInterval(performanceInterval);
    };
  }, []);

  // Update connection status
  useEffect(() => {
    const overallConnected = marketConnected && notificationsConnected && predictionsConnected;
    setIsConnected(overallConnected);
    setConnectionQuality(overallConnected ? 'good' : 'disconnected');
  }, [marketConnected, notificationsConnected, predictionsConnected]);

  // Handle real-time events
  useEffect(() => {
    if (marketData) {
      addRealTimeEvent({
        type: 'market',
        symbol: marketData.symbol,
        data: marketData,
        timestamp: new Date().toISOString()
      });
    }
  }, [marketData]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      addRealTimeEvent({
        type: 'notification',
        id: latestNotification.id,
        data: latestNotification,
        timestamp: new Date().toISOString()
      });
    }
  }, [notifications]);

  useEffect(() => {
    if (predictions.length > 0) {
      const latestPrediction = predictions[0];
      addRealTimeEvent({
        type: 'prediction',
        model: latestPrediction.model,
        data: latestPrediction,
        timestamp: new Date().toISOString()
      });
    }
  }, [predictions]);

  const addRealTimeEvent = useCallback((event: any) => {
    setRealTimeEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    setLastUpdate(new Date());
  }, []);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toFixed(2)}`;
  };

  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <SignalHigh className="w-4 h-4 text-green-500" />;
      case 'poor':
        return <SignalLow className="w-4 h-4 text-yellow-500" />;
      default:
        return <Signal className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionQuality) {
      case 'good':
        return 'All Systems Operational';
      case 'poor':
        return 'Partial Degradation';
      default:
        return 'Disconnected';
    }
  };

  const handleExportData = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemMetrics,
      performanceMetrics,
      marketData: Array.from(realTimeEvents.filter(e => e.type === 'market')),
      notifications: Array.from(realTimeEvents.filter(e => e.type === 'notification')),
      predictions: Array.from(realTimeEvents.filter(e => e.type === 'prediction')),
      summary: {
        totalEvents: realTimeEvents.length,
        marketEvents: realTimeEvents.filter(e => e.type === 'market').length,
        notificationEvents: realTimeEvents.filter(e => e.type === 'notification').length,
        predictionEvents: realTimeEvents.filter(e => e.type === 'prediction').length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsmartai-realtime-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Real-time data exported successfully',
    });
  }, [systemMetrics, performanceMetrics, realTimeEvents, toast]);

  const handleRefresh = useCallback(() => {
    // Trigger manual refresh of all data
    setLastUpdate(new Date());
    toast({
      title: 'Refresh Triggered',
      description: 'All real-time data refreshed',
    });
  }, [toast]);

  const renderSystemStatus = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold">{systemMetrics.cpu.toFixed(1)}%</p>
            </div>
            <Cpu className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${systemMetrics.cpu}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold">{systemMetrics.memory.toFixed(1)}%</p>
            </div>
            <Database className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${systemMetrics.memory}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold">{systemMetrics.connections}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold">{systemMetrics.uptime}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{systemMetrics.latency.toFixed(0)}ms latency</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Throughput</p>
              <p className="text-2xl font-bold">{performanceMetrics.throughput.toFixed(0)}/s</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500">Requests per second</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold">{performanceMetrics.errorRate.toFixed(2)}%</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500">Failed requests</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold">{performanceMetrics.responseTime.toFixed(0)}ms</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500">Average latency</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Availability</p>
              <p className="text-2xl font-bold">{performanceMetrics.availability.toFixed(2)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500">System uptime</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRealTimeEvents = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Real-time Event Stream</CardTitle>
            <CardDescription>Live events from all connected systems</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRealTimeEvents([])}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full border rounded-md">
          <div className="space-y-2 p-4">
            {realTimeEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No events yet. Waiting for real-time data...</p>
              </div>
            ) : (
              realTimeEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {event.type === 'market' && <DollarSign className="w-5 h-5 text-blue-500" />}
                    {event.type === 'notification' && <Bell className="w-5 h-5 text-yellow-500" />}
                    {event.type === 'prediction' && <Brain className="w-5 h-5 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {event.type === 'market' && `Market Update: ${event.symbol}`}
                        {event.type === 'notification' && `Notification: ${event.data.title}`}
                        {event.type === 'prediction' && `Prediction: ${event.model}`}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {event.type === 'market' && `Price: ${formatCurrency(event.data.price)} | Change: ${formatChange(event.data.change)}`}
                      {event.type === 'notification' && `${event.data.message}`}
                      {event.type === 'prediction' && `Confidence: ${(event.data.confidence * 100).toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 bg-white z-50 p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Enhanced Real-time Dashboard</h2>
          </div>
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-600">{getConnectionText()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {showAdvancedFeatures && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="events">Event Stream</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            {renderSystemStatus()}
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            {renderPerformanceMetrics()}
          </div>

          {/* Real-time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeLineChart 
              title="System Throughput" 
              description="Requests per second over time"
              dataKey="value"
              color="#3b82f6"
            />
            <RealTimeAreaChart 
              title="Response Time" 
              description="Average response time in milliseconds"
              dataKey="value"
              color="#10b981"
            />
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {/* Market Data Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant={marketConnected ? 'default' : 'secondary'}>
                {marketConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>

          {/* Market Data Stream */}
          <MarketDataStream />

          {/* Market Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeAreaChart 
              title={`${selectedSymbol} Price Chart`} 
              description="Real-time price movements"
              dataKey="value"
              color="#8b5cf6"
            />
            <RealTimeBarChart 
              title={`${selectedSymbol} Volume`} 
              description="Trading volume over time"
              dataKey="value"
              color="#f59e0b"
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Model Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimePieChart 
              title="AI Model Usage Distribution" 
              description="Real-time model usage statistics"
            />
            <RealTimeBarChart 
              title="Model Performance Metrics" 
              description="Accuracy and response times by model"
              dataKey="value"
              color="#ef4444"
            />
          </div>

          {/* Predictions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Model Predictions</CardTitle>
                  <CardDescription>Real-time predictions from {selectedModel}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant={predictionsConnected ? 'default' : 'secondary'}>
                    {predictionsConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={clearPredictions}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full">
                <div className="space-y-2">
                  {predictions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No predictions yet. Waiting for AI model updates...</p>
                    </div>
                  ) : (
                    predictions.map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{prediction.symbol}</p>
                          <p className="text-sm text-gray-600">
                            Prediction: {prediction.prediction.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">
                            {(prediction.confidence * 100).toFixed(1)}% confidence
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(prediction.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>Real-time alerts and notifications</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={notificationsConnected ? 'default' : 'secondary'}>
                    {notificationsConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={clearNotifications}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full">
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications yet. System is running smoothly.</p>
                    </div>
                  ) : (
                    notifications.map((notification, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-shrink-0">
                          {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                          {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{notification.title}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Event Stream */}
          {renderRealTimeEvents()}
        </TabsContent>
      </Tabs>
    </div>
  );
}