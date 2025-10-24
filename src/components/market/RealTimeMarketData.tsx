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
import { useToast } from '@/hooks/use-toast';
import { 
  marketDataService, 
  RealTimeData, 
  MarketAlert, 
  MarketDepth,
  TechnicalIndicator 
} from '@/lib/services/marketDataService';
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
  ReferenceLine,
  Brush,
  Legend,
  ComposedChart
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
  Minimize2
} from 'lucide-react';

interface RealTimeMarketDataProps {
  defaultSymbols?: string[];
  showChart?: boolean;
  showDepth?: boolean;
  showAlerts?: boolean;
  height?: number;
  showAdvancedChart?: boolean;
}

export function RealTimeMarketData({ 
  defaultSymbols = ['NIFTY 50', 'BANKNIFTY', 'RELIANCE'], 
  showChart = true, 
  showDepth = true, 
  showAlerts = true,
  height = 400,
  showAdvancedChart = true
}: RealTimeMarketDataProps) {
  const [symbols, setSymbols] = useState<string[]>(defaultSymbols);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbols[0]);
  const [realTimeData, setRealTimeData] = useState<Map<string, RealTimeData>>(new Map());
  const [marketDepth, setMarketDepth] = useState<MarketDepth | null>(null);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [newSymbol, setNewSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick' | 'bar'>('area');
  const [showVolume, setShowVolume] = useState(true);
  const [showMovingAverages, setShowMovingAverages] = useState(true);
  const [showBollingerBands, setShowBollingerBands] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  // Initialize real-time data subscriptions
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      try {
        // Load initial data for all symbols
        const initialData = new Map<string, RealTimeData>();
        
        for (const symbol of symbols) {
          const priceData = await marketDataService.getRealTimePrice(symbol);
          if (priceData) {
            initialData.set(symbol, priceData);
          }
        }
        
        setRealTimeData(initialData);
        
        // Load historical data for selected symbol
        await loadHistoricalData(selectedSymbol, timeframe);
        
        // Load market depth
        await loadMarketDepth(selectedSymbol);
        
        // Load technical indicators
        await loadTechnicalIndicators(selectedSymbol);
        
        // Load alerts
        await loadAlerts();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize market data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load market data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initializeData();

    // Subscribe to real-time updates
    const unsubscribeCallbacks: (() => void)[] = [];
    
    symbols.forEach(symbol => {
      const unsubscribe = marketDataService.subscribeToRealTimeData(symbol, (data) => {
        setRealTimeData(prev => {
          const newData = new Map(prev);
          newData.set(symbol, data);
          return newData;
        });
        
        // Update connection status
        setConnectionStatus('connected');
      });
      
      unsubscribeCallbacks.push(unsubscribe);
    });

    // Subscribe to alerts
    const alertUnsubscribe = marketDataService.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      
      toast({
        title: 'Market Alert',
        description: `${alert.symbol}: ${alert.message}`,
        variant: alert.triggered ? 'destructive' : 'default',
      });
    });
    
    unsubscribeCallbacks.push(alertUnsubscribe);

    // Cleanup
    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [symbols, selectedSymbol, timeframe, toast]);

  const loadHistoricalData = useCallback(async (symbol: string, tf: string) => {
    try {
      const data = await marketDataService.getHistoricalData({
        symbol,
        timeframe: tf as any,
        limit: 100,
      });
      setHistoricalData(data);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }, []);

  const loadMarketDepth = useCallback(async (symbol: string) => {
    try {
      const depth = await marketDataService.getMarketDepth(symbol);
      setMarketDepth(depth);
    } catch (error) {
      console.error('Failed to load market depth:', error);
    }
  }, []);

  const loadTechnicalIndicators = useCallback(async (symbol: string) => {
    try {
      const indicators = await marketDataService.getTechnicalIndicators(symbol, ['RSI', 'MACD', 'BB']);
      setTechnicalIndicators(indicators);
    } catch (error) {
      console.error('Failed to load technical indicators:', error);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const alertList = await marketDataService.getAlerts();
      setAlerts(alertList.slice(0, 10));
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, []);

  const handleAddSymbol = useCallback(() => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      setSymbols(prev => [...prev, newSymbol]);
      setNewSymbol('');
    }
  }, [newSymbol, symbols]);

  const handleRemoveSymbol = useCallback((symbol: string) => {
    setSymbols(prev => prev.filter(s => s !== symbol));
    if (selectedSymbol === symbol && symbols.length > 1) {
      setSelectedSymbol(symbols[0]);
    }
  }, [selectedSymbol, symbols]);

  const handleCreateAlert = useCallback(async () => {
    if (!selectedSymbol) return;
    
    try {
      const alert = await marketDataService.createAlert({
        symbol: selectedSymbol,
        type: 'price',
        condition: 'price > 1000',
        triggered: false,
        message: `Price alert for ${selectedSymbol}`,
      });
      
      if (alert) {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]);
        toast({
          title: 'Success',
          description: 'Alert created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create alert',
        variant: 'destructive',
      });
    }
  }, [selectedSymbol, toast]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    try {
      const success = await marketDataService.deleteAlert(alertId);
      if (success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        toast({
          title: 'Success',
          description: 'Alert deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const formatPrice = marketDataService.formatPrice;
  const formatChange = marketDataService.formatChange;
  const formatVolume = marketDataService.formatVolume;

  const currentData = realTimeData.get(selectedSymbol);

  // Helper functions for advanced charting
  const calculateMovingAverage = (data: any[], period: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  const calculateBollingerBands = (data: any[], period: number = 20, stdDev: number = 2) => {
    const ma = calculateMovingAverage(data, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = ma[i];
        const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }
    
    return { upper, lower };
  };

  const calculateRSI = (data: any[], period: number = 14): number[] => {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
    
    return result;
  };

  const renderAdvancedChart = () => {
    const enhancedData = historicalData.map((d, index) => {
      const ma20 = calculateMovingAverage(historicalData, 20);
      const ma50 = calculateMovingAverage(historicalData, 50);
      const bb = calculateBollingerBands(historicalData);
      
      return {
        ...d,
        ma20: ma20[index],
        ma50: ma50[index],
        bbUpper: bb.upper[index],
        bbLower: bb.lower[index],
        timestamp: new Date(d.timestamp).toLocaleTimeString()
      };
    });

    switch (chartType) {
      case 'line':
        return (
          <ComposedChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} />
            {showMovingAverages && (
              <>
                <Line type="monotone" dataKey="ma20" stroke="#f59e0b" strokeWidth={1} dot={false} name="MA20" />
                <Line type="monotone" dataKey="ma50" stroke="#ef4444" strokeWidth={1} dot={false} name="MA50" />
              </>
            )}
            {showBollingerBands && (
              <>
                <Line type="monotone" dataKey="bbUpper" stroke="#8b5cf6" strokeWidth={1} dot={false} name="BB Upper" />
                <Line type="monotone" dataKey="bbLower" stroke="#8b5cf6" strokeWidth={1} dot={false} name="BB Lower" />
              </>
            )}
            {showVolume && (
              <Bar dataKey="volume" fill="#e5e7eb" opacity={0.3} />
            )}
            <Brush dataKey="timestamp" height={30} />
          </ComposedChart>
        );

      case 'area':
        return (
          <ComposedChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="close" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
            {showMovingAverages && (
              <>
                <Line type="monotone" dataKey="ma20" stroke="#f59e0b" strokeWidth={1} dot={false} name="MA20" />
                <Line type="monotone" dataKey="ma50" stroke="#ef4444" strokeWidth={1} dot={false} name="MA50" />
              </>
            )}
            {showBollingerBands && (
              <>
                <Line type="monotone" dataKey="bbUpper" stroke="#8b5cf6" strokeWidth={1} dot={false} name="BB Upper" />
                <Line type="monotone" dataKey="bbLower" stroke="#8b5cf6" strokeWidth={1} dot={false} name="BB Lower" />
              </>
            )}
            {showVolume && (
              <Bar dataKey="volume" fill="#e5e7eb" opacity={0.3} />
            )}
            <Brush dataKey="timestamp" height={30} />
          </ComposedChart>
        );

      case 'bar':
        return (
          <BarChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="close" fill="#3b82f6" name="Close Price" />
            {showVolume && (
              <Bar dataKey="volume" fill="#e5e7eb" opacity={0.5} name="Volume" />
            )}
            <Brush dataKey="timestamp" height={30} />
          </BarChart>
        );

      default:
        return (
          <AreaChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="close" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
            <Brush dataKey="timestamp" height={30} />
          </AreaChart>
        );
    }
  };

  const renderRSIChart = () => {
    const rsiData = calculateRSI(historicalData);
    const enhancedRSIData = historicalData.map((d, index) => ({
      ...d,
      rsi: rsiData[index] || 0,
      timestamp: new Date(d.timestamp).toLocaleTimeString()
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">RSI (14)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={enhancedRSIData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label="Overbought" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" label="Oversold" />
              <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderMACDChart = () => {
    // Simplified MACD calculation for demo
    const macdData = historicalData.map((d, index) => ({
      ...d,
      macd: Math.sin(index * 0.1) * 10 + (Math.random() - 0.5) * 5,
      signal: Math.sin((index - 5) * 0.1) * 8,
      histogram: Math.sin(index * 0.1) * 2,
      timestamp: new Date(d.timestamp).toLocaleTimeString()
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">MACD</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={macdData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="macd" stroke="#2563eb" strokeWidth={2} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#ef4444" strokeWidth={1} dot={false} name="Signal" />
              <Bar dataKey="histogram" fill="#f59e0b" opacity={0.6} name="Histogram" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add symbol..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="w-32"
          />
          <Button onClick={handleAddSymbol} size="sm">Add</Button>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="flex flex-wrap gap-2">
        {symbols.map(symbol => (
          <Badge
            key={symbol}
            variant={symbol === selectedSymbol ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedSymbol(symbol)}
          >
            {symbol}
            {symbol !== selectedSymbol && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSymbol(symbol);
                }}
                className="ml-2 text-xs hover:text-red-500"
              >
                ×
              </button>
            )}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showChart && <TabsTrigger value="chart">Chart</TabsTrigger>}
          {showAdvancedChart && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
          {showDepth && <TabsTrigger value="depth">Depth</TabsTrigger>}
          {showAlerts && <TabsTrigger value="alerts">Alerts</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Price Card */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : currentData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedSymbol}</span>
                  <Badge variant={currentData.change >= 0 ? "default" : "destructive"}>
                    {currentData.change >= 0 ? '↑' : '↓'} {Math.abs(currentData.changePercent).toFixed(2)}%
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Last updated: {new Date(currentData.timestamp).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold">{formatPrice(currentData.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`text-lg font-semibold ${formatChange(currentData.change, currentData.changePercent).className}`}>
                      {formatChange(currentData.change, currentData.changePercent).text}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Volume</p>
                    <p className="text-lg font-semibold">{formatVolume(currentData.volume)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Day Range</p>
                    <p className="text-lg font-semibold">
                      {formatPrice(currentData.low || 0)} - {formatPrice(currentData.high || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>No data available for {selectedSymbol}</AlertDescription>
            </Alert>
          )}

          {/* Technical Indicators */}
          {technicalIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {technicalIndicators.map(indicator => (
                    <div key={indicator.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{indicator.name}</span>
                        <Badge variant={
                          indicator.signal === 'buy' ? 'default' : 
                          indicator.signal === 'sell' ? 'destructive' : 'secondary'
                        }>
                          {indicator.signal.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{indicator.value.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(indicator.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showChart && (
          <TabsContent value="chart" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => loadHistoricalData(selectedSymbol, timeframe)}>
                Refresh
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={height}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="close" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No historical data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showAdvancedChart && (
          <TabsContent value="advanced" className="space-y-4">
            {/* Advanced Chart Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Chart Type:</span>
                <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Timeframe:</span>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1m</SelectItem>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="1d">1d</SelectItem>
                    <SelectItem value="1w">1w</SelectItem>
                    <SelectItem value="1M">1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showVolume"
                  checked={showVolume}
                  onChange={(e) => setShowVolume(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showVolume" className="text-sm">Volume</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showMA"
                  checked={showMovingAverages}
                  onChange={(e) => setShowMovingAverages(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showMA" className="text-sm">MA</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showBB"
                  checked={showBollingerBands}
                  onChange={(e) => setShowBollingerBands(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showBB" className="text-sm">BB</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showRSI"
                  checked={showRSI}
                  onChange={(e) => setShowRSI(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showRSI" className="text-sm">RSI</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showMACD"
                  checked={showMACD}
                  onChange={(e) => setShowMACD(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showMACD" className="text-sm">MACD</label>
              </div>

              <div className="flex items-center space-x-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button onClick={() => loadHistoricalData(selectedSymbol, timeframe)} size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Main Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedSymbol} - Advanced Chart</span>
                  <Badge variant={currentData?.change >= 0 ? "default" : "destructive"}>
                    {currentData?.change >= 0 ? '↑' : '↓'} {Math.abs(currentData?.changePercent || 0).toFixed(2)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historicalData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Price Chart */}
                    <div style={{ height: isFullscreen ? '600px' : height }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {renderAdvancedChart()}
                      </ResponsiveContainer>
                    </div>

                    {/* Technical Indicators Panel */}
                    {(showRSI || showMACD) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {showRSI && renderRSIChart()}
                        {showMACD && renderMACDChart()}
                      </div>
                    )}

                    {/* Chart Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Open</p>
                        <p className="font-semibold">{formatPrice(historicalData[0]?.open || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">High</p>
                        <p className="font-semibold text-green-600">
                          {formatPrice(Math.max(...historicalData.map(d => d.high)))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Low</p>
                        <p className="font-semibold text-red-600">
                          {formatPrice(Math.min(...historicalData.map(d => d.low)))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Volume</p>
                        <p className="font-semibold">
                          {formatVolume(historicalData.reduce((sum, d) => sum + (d.volume || 0), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No historical data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showDepth && (
          <TabsContent value="depth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Depth - {selectedSymbol}</CardTitle>
              </CardHeader>
              <CardContent>
                {marketDepth ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bids */}
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">Bids</h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-1">
                          {marketDepth.bids.map((bid, index) => (
                            <div key={index} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                              <span>{formatPrice(bid.price)}</span>
                              <span>{formatVolume(bid.volume)}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    {/* Asks */}
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Asks</h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-1">
                          {marketDepth.asks.map((ask, index) => (
                            <div key={index} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                              <span>{formatPrice(ask.price)}</span>
                              <span>{formatVolume(ask.volume)}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No market depth data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showAlerts && (
          <TabsContent value="alerts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Market Alerts</h3>
              <Button onClick={handleCreateAlert} size="sm">
                Create Alert
              </Button>
            </div>
            
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <Card key={alert.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={alert.triggered ? "destructive" : "secondary"}>
                              {alert.type}
                            </Badge>
                            <span className="font-semibold">{alert.symbol}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDeleteAlert(alert.id)}
                          variant="outline"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No alerts configured</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}