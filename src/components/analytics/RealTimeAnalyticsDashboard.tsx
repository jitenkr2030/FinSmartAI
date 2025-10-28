'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  CandlestickChart,
  Candlestick,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  Brush,
  Legend
} from 'recharts';
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
  Users,
  Database,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  TrendingUp as TrendIcon,
  BarChart2,
  PieChart as PieIcon,
  Scatter as ScatterIcon,
  Brain
} from 'lucide-react';
import { createEnhancedMarketDataService } from '@/lib/services/enhancedMarketDataService';
import { useMarketData, useNotifications, usePredictions } from '@/hooks/useWebSocket';

interface RealTimeAnalyticsDashboardProps {
  userId?: string;
  symbols?: string[];
  models?: string[];
  showAdvancedFeatures?: boolean;
  enableRealTimeUpdates?: boolean;
}

const DEFAULT_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
const DEFAULT_MODELS = ['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI'];

interface RealTimeMetrics {
  timestamp: string;
  throughput: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  predictions: number;
  accuracy: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface AnalyticsConfig {
  updateInterval: number;
  maxDataPoints: number;
  enableAlerts: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    accuracy: number;
  };
  chartTypes: {
    performance: 'line' | 'area' | 'bar';
    usage: 'line' | 'area' | 'bar';
    predictions: 'scatter' | 'line' | 'area';
  };
}

export function RealTimeAnalyticsDashboard({ 
  userId = 'demo-user',
  symbols = DEFAULT_SYMBOLS,
  models = DEFAULT_MODELS,
  showAdvancedFeatures = true,
  enableRealTimeUpdates = true
}: RealTimeAnalyticsDashboardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>({
    updateInterval: 2000,
    maxDataPoints: 100,
    enableAlerts: true,
    alertThresholds: {
      responseTime: 500,
      errorRate: 5,
      accuracy: 80
    },
    chartTypes: {
      performance: 'line',
      usage: 'area',
      predictions: 'scatter'
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [filteredMetrics, setFilteredMetrics] = useState<RealTimeMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const { toast } = useToast();

  // Initialize enhanced market data service
  const [marketDataService] = useState(() => createEnhancedMarketDataService({
    symbols,
    updateInterval: analyticsConfig.updateInterval,
    enablePredictions: true,
    enableNotifications: true,
    enableSystemMetrics: true,
    enableAIIntegration: true
  }));

  // WebSocket hooks
  const { marketData, isConnected: marketConnected } = useMarketData(selectedSymbol);
  const { notifications, isConnected: notificationsConnected } = useNotifications(userId);
  const { predictions, isConnected: predictionsConnected } = usePredictions(selectedModel);

  // Initialize real-time data
  useEffect(() => {
    if (enableRealTimeUpdates) {
      marketDataService.initialize();
      
      // Subscribe to real-time metrics updates
      const unsubscribeMetrics = marketDataService.subscribe('metrics', (data) => {
        handleMetricsUpdate(data);
      });

      // Subscribe to alerts
      const unsubscribeAlerts = marketDataService.subscribe('alerts', (data) => {
        handleAlertUpdate(data);
      });

      return () => {
        unsubscribeMetrics();
        unsubscribeAlerts();
      };
    }
  }, [enableRealTimeUpdates, marketDataService]);

  // Update connection status
  useEffect(() => {
    const overallConnected = marketConnected && notificationsConnected && predictionsConnected;
    setIsConnected(overallConnected);
    setConnectionQuality(overallConnected ? 'good' : 'disconnected');
  }, [marketConnected, notificationsConnected, predictionsConnected]);

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(() => {
      const newMetric: RealTimeMetrics = {
        timestamp: new Date().toISOString(),
        throughput: Math.random() * 10000 + 5000,
        responseTime: Math.random() * 1000,
        errorRate: Math.random() * 10,
        activeUsers: Math.floor(Math.random() * 1000) + 100,
        predictions: Math.floor(Math.random() * 1000) + 100,
        accuracy: Math.random() * 20 + 80
      };

      handleMetricsUpdate(newMetric);
    }, analyticsConfig.updateInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, analyticsConfig.updateInterval]);

  const handleMetricsUpdate = useCallback((metric: RealTimeMetrics) => {
    setRealTimeMetrics(prev => {
      const updated = [...prev, metric];
      if (updated.length > analyticsConfig.maxDataPoints) {
        updated.shift();
      }
      return updated;
    });

    setLastUpdate(new Date());

    // Check for alerts
    if (analyticsConfig.enableAlerts) {
      checkAndCreateAlerts(metric);
    }

    // Update filtered metrics based on time range
    updateFilteredMetrics();
  }, [analyticsConfig]);

  const handleAlertUpdate = useCallback((alert: PerformanceAlert) => {
    setPerformanceAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
  }, []);

  const checkAndCreateAlerts = useCallback((metric: RealTimeMetrics) => {
    const alerts: PerformanceAlert[] = [];

    // Check response time
    if (metric.responseTime > analyticsConfig.alertThresholds.responseTime) {
      alerts.push({
        id: `alert_${Date.now()}_response`,
        type: 'warning',
        title: 'High Response Time',
        message: `Response time is ${metric.responseTime.toFixed(0)}ms, exceeding threshold of ${analyticsConfig.alertThresholds.responseTime}ms`,
        timestamp: new Date().toISOString(),
        severity: metric.responseTime > analyticsConfig.alertThresholds.responseTime * 2 ? 'high' : 'medium',
        resolved: false
      });
    }

    // Check error rate
    if (metric.errorRate > analyticsConfig.alertThresholds.errorRate) {
      alerts.push({
        id: `alert_${Date.now()}_error`,
        type: 'error',
        title: 'High Error Rate',
        message: `Error rate is ${metric.errorRate.toFixed(2)}%, exceeding threshold of ${analyticsConfig.alertThresholds.errorRate}%`,
        timestamp: new Date().toISOString(),
        severity: metric.errorRate > analyticsConfig.alertThresholds.errorRate * 2 ? 'critical' : 'high',
        resolved: false
      });
    }

    // Check accuracy
    if (metric.accuracy < analyticsConfig.alertThresholds.accuracy) {
      alerts.push({
        id: `alert_${Date.now()}_accuracy`,
        type: 'warning',
        title: 'Low Accuracy',
        message: `Model accuracy is ${metric.accuracy.toFixed(2)}%, below threshold of ${analyticsConfig.alertThresholds.accuracy}%`,
        timestamp: new Date().toISOString(),
        severity: metric.accuracy < analyticsConfig.alertThresholds.accuracy * 0.8 ? 'high' : 'medium',
        resolved: false
      });
    }

    alerts.forEach(alert => {
      handleAlertUpdate(alert);
    });
  }, [analyticsConfig, handleAlertUpdate]);

  const updateFilteredMetrics = useCallback(() => {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '5m':
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case '15m':
        cutoffTime = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '30m':
        cutoffTime = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '3h':
        cutoffTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    const filtered = realTimeMetrics.filter(metric => 
      new Date(metric.timestamp) >= cutoffTime
    );
    setFilteredMetrics(filtered);
  }, [realTimeMetrics, timeRange]);

  useEffect(() => {
    updateFilteredMetrics();
  }, [realTimeMetrics, timeRange, updateFilteredMetrics]);

  const handleExportData = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: analyticsConfig,
      metrics: filteredMetrics,
      alerts: performanceAlerts,
      summary: {
        totalMetrics: filteredMetrics.length,
        totalAlerts: performanceAlerts.length,
        avgThroughput: filteredMetrics.reduce((sum, m) => sum + m.throughput, 0) / filteredMetrics.length || 0,
        avgResponseTime: filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length || 0,
        avgErrorRate: filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length || 0,
        avgAccuracy: filteredMetrics.reduce((sum, m) => sum + m.accuracy, 0) / filteredMetrics.length || 0
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Real-time analytics data exported successfully',
    });
  }, [filteredMetrics, performanceAlerts, analyticsConfig, toast]);

  const handleRefresh = useCallback(() => {
    setLastUpdate(new Date());
    toast({
      title: 'Refresh Triggered',
      description: 'Analytics data refreshed',
    });
  }, [toast]);

  const handleResolveAlert = useCallback((alertId: string) => {
    setPerformanceAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
    toast({
      title: 'Alert Resolved',
      description: 'Performance alert has been resolved',
    });
  }, [toast]);

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number, decimals = 2): string => {
    return num.toFixed(decimals);
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const renderPerformanceChart = () => {
    const chartType = analyticsConfig.chartTypes.performance;
    
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any, name: string) => [
                  name === 'responseTime' ? `${value.toFixed(0)}ms` : 
                  name === 'errorRate' ? `${value.toFixed(2)}%` :
                  name === 'throughput' ? `${value.toFixed(0)}/s` :
                  name === 'accuracy' ? `${value.toFixed(2)}%` :
                  value,
                  name === 'responseTime' ? 'Response Time' :
                  name === 'errorRate' ? 'Error Rate' :
                  name === 'throughput' ? 'Throughput' :
                  name === 'accuracy' ? 'Accuracy' : name
                ]}
              />
              <Area type="monotone" dataKey="throughput" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
              <Area type="monotone" dataKey="responseTime" stroke="#FF8042" fill="#FF8042" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredMetrics.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any, name: string) => [
                  name === 'responseTime' ? `${value.toFixed(0)}ms` : 
                  name === 'errorRate' ? `${value.toFixed(2)}%` :
                  name === 'throughput' ? `${value.toFixed(0)}/s` :
                  name === 'accuracy' ? `${value.toFixed(2)}%` :
                  value,
                  name === 'responseTime' ? 'Response Time' :
                  name === 'errorRate' ? 'Error Rate' :
                  name === 'throughput' ? 'Throughput' :
                  name === 'accuracy' ? 'Accuracy' : name
                ]}
              />
              <Bar dataKey="throughput" fill="#0088FE" />
              <Bar dataKey="responseTime" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any, name: string) => [
                  name === 'responseTime' ? `${value.toFixed(0)}ms` : 
                  name === 'errorRate' ? `${value.toFixed(2)}%` :
                  name === 'throughput' ? `${value.toFixed(0)}/s` :
                  name === 'accuracy' ? `${value.toFixed(2)}%` :
                  value,
                  name === 'responseTime' ? 'Response Time' :
                  name === 'errorRate' ? 'Error Rate' :
                  name === 'throughput' ? 'Throughput' :
                  name === 'accuracy' ? 'Accuracy' : name
                ]}
              />
              <Line type="monotone" dataKey="throughput" stroke="#0088FE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="responseTime" stroke="#FF8042" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="errorRate" stroke="#FF0000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderMetricsSummary = () => {
    if (filteredMetrics.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const latest = filteredMetrics[filteredMetrics.length - 1];
    const avgThroughput = filteredMetrics.reduce((sum, m) => sum + m.throughput, 0) / filteredMetrics.length;
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length;
    const avgErrorRate = filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length;
    const avgAccuracy = filteredMetrics.reduce((sum, m) => sum + m.accuracy, 0) / filteredMetrics.length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Throughput</p>
                <p className="text-2xl font-bold">{formatLargeNumber(avgThroughput)}/s</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">Current: {formatLargeNumber(latest.throughput)}/s</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">Current: {latest.responseTime.toFixed(0)}ms</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Error Rate</p>
                <p className="text-2xl font-bold">{avgErrorRate.toFixed(2)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">Current: {latest.errorRate.toFixed(2)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold">{avgAccuracy.toFixed(2)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">Current: {latest.accuracy.toFixed(2)}%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 bg-white z-50 p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Real-time Analytics Dashboard</h2>
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
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="w-4 h-4 mr-2" />
            Config
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

      {/* Configuration Panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="update-interval">Update Interval (ms)</Label>
                <Input
                  id="update-interval"
                  type="number"
                  value={analyticsConfig.updateInterval}
                  onChange={(e) => setAnalyticsConfig(prev => ({
                    ...prev,
                    updateInterval: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="max-data-points">Max Data Points</Label>
                <Input
                  id="max-data-points"
                  type="number"
                  value={analyticsConfig.maxDataPoints}
                  onChange={(e) => setAnalyticsConfig(prev => ({
                    ...prev,
                    maxDataPoints: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="time-range">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5 minutes</SelectItem>
                    <SelectItem value="15m">15 minutes</SelectItem>
                    <SelectItem value="30m">30 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="3h">3 hours</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="enable-alerts">Enable Alerts</Label>
              <Switch
                id="enable-alerts"
                checked={analyticsConfig.enableAlerts}
                onCheckedChange={(checked) => setAnalyticsConfig(prev => ({
                  ...prev,
                  enableAlerts: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Summary */}
          {renderMetricsSummary()}

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Real-time Performance Metrics</CardTitle>
                  <CardDescription>Live system performance monitoring</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Live' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderPerformanceChart()}
            </CardContent>
          </Card>

          {/* Market Data Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Market Data Integration</CardTitle>
              <CardDescription>Real-time market data for selected symbol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol-select">Select Symbol</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label htmlFor="model-select">Select Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
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
                </div>
              </div>
              
              {marketData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-bold">₹{marketData.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Change</p>
                      <p className={`text-lg font-bold ${marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marketData.change >= 0 ? '+' : ''}{marketData.change.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Volume</p>
                      <p className="text-lg font-bold">{formatLargeNumber(marketData.volume)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Update</p>
                      <p className="text-sm">{new Date(marketData.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Detailed Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(0)}ms`, 'Response Time']}
                    />
                    <Area type="monotone" dataKey="responseTime" stroke="#FF8042" fill="#FF8042" fillOpacity={0.3} />
                    <ReferenceLine y={analyticsConfig.alertThresholds.responseTime} stroke="#FF0000" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(2)}%`, 'Error Rate']}
                    />
                    <Line type="monotone" dataKey="errorRate" stroke="#FF0000" strokeWidth={2} dot={false} />
                    <ReferenceLine y={analyticsConfig.alertThresholds.errorRate} stroke="#FF0000" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Throughput and Accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Throughput Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredMetrics.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(0)}/s`, 'Throughput']}
                    />
                    <Bar dataKey="throughput" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(2)}%`, 'Accuracy']}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#00C49F" fill="#00C49F" fillOpacity={0.3} />
                    <ReferenceLine y={analyticsConfig.alertThresholds.accuracy} stroke="#00C49F" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alerts Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Alerts</p>
                    <p className="text-2xl font-bold">{performanceAlerts.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical</p>
                    <p className="text-2xl font-bold text-red-600">
                      {performanceAlerts.filter(a => a.severity === 'critical').length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {performanceAlerts.filter(a => a.resolved).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {performanceAlerts.filter(a => !a.resolved).length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Alerts</CardTitle>
                  <CardDescription>Real-time system alerts and notifications</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPerformanceAlerts([])}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full border rounded-md">
                <div className="space-y-2 p-4">
                  {performanceAlerts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                      <p>No alerts. System is performing optimally.</p>
                    </div>
                  ) : (
                    performanceAlerts.map((alert) => (
                      <div key={alert.id} className={`p-3 border rounded-lg ${alert.resolved ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{alert.title}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  {alert.resolved && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Resolved
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* AI Model Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Predictions</CardTitle>
              <CardDescription>Real-time predictions from {selectedModel}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No predictions yet. Waiting for AI model updates...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions.slice(0, 10).map((prediction, index) => (
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
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prediction Accuracy Chart */}
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prediction Confidence Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={predictions.map(p => ({
                    timestamp: new Date(p.timestamp).toLocaleTimeString(),
                    confidence: p.confidence * 100,
                    prediction: p.prediction
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'confidence' ? `${value.toFixed(2)}%` : value.toFixed(2),
                        name === 'confidence' ? 'Confidence' : 'Prediction'
                      ]}
                    />
                    <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label="Good Confidence" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}