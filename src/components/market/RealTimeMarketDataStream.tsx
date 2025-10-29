'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketData } from '@/hooks/useWebSocket';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Signal, 
  SignalLow, 
  SignalHigh,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface MarketDataStreamProps {
  symbols?: string[];
  autoSubscribe?: boolean;
  showChart?: boolean;
}

const DEFAULT_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];

interface MarketDataItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  lastUpdate: string;
}

export function RealTimeMarketDataStream({ 
  symbols = DEFAULT_SYMBOLS, 
  autoSubscribe = true,
  showChart = false 
}: MarketDataStreamProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [marketData, setMarketData] = useState<Record<string, MarketDataItem>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { marketData: realTimeData, isConnected: wsConnected } = useMarketData(selectedSymbol);

  // Initialize market data
  useEffect(() => {
    const initialData: Record<string, MarketDataItem> = {};
    symbols.forEach(symbol => {
      initialData[symbol] = {
        symbol,
        name: getSymbolName(symbol),
        price: Math.random() * 1000 + 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: (Math.random() * 10).toFixed(1) + 'M',
        lastUpdate: new Date().toLocaleTimeString()
      };
    });
    setMarketData(initialData);
  }, [symbols]);

  // Update connection status
  useEffect(() => {
    setIsConnected(wsConnected);
    setConnectionQuality(wsConnected ? 'good' : 'disconnected');
  }, [wsConnected]);

  // Handle real-time updates
  useEffect(() => {
    if (realTimeData) {
      setMarketData(prev => ({
        ...prev,
        [realTimeData.symbol]: {
          ...prev[realTimeData.symbol],
          price: realTimeData.price,
          change: realTimeData.change,
          changePercent: (realTimeData.change / realTimeData.price) * 100,
          volume: (realTimeData.volume / 1000000).toFixed(1) + 'M',
          lastUpdate: new Date(realTimeData.timestamp).toLocaleTimeString()
        }
      }));
      setLastUpdate(new Date());
    }
  }, [realTimeData]);

  // Simulate connection quality changes
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const quality = Math.random() > 0.1 ? 'good' : 'poor';
      setConnectionQuality(quality);
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

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
        return 'Real-time';
      case 'poor':
        return 'Delayed';
      default:
        return 'Disconnected';
    }
  };

  const getSymbolName = (symbol: string): string => {
    const names: Record<string, string> = {
      'NIFTY50': 'Nifty 50',
      'BANKNIFTY': 'Bank Nifty',
      'RELIANCE': 'Reliance Industries',
      'TCS': 'Tata Consultancy Services',
      'INFY': 'Infosys'
    };
    return names[symbol] || symbol;
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toFixed(2)}`;
  };

  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent: number): string => {
    return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Real-time Market Data</h3>
          </div>
          <div className="flex items-center space-x-1">
            {getConnectionIcon()}
            <span className="text-sm text-gray-600">{getConnectionText()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map(symbol => {
          const data = marketData[symbol];
          if (!data) return null;

          const isPositive = data.change >= 0;
          const isSelected = symbol === selectedSymbol;

          return (
            <Card 
              key={symbol} 
              className={`transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{symbol}</CardTitle>
                    <CardDescription className="text-sm">{data.name}</CardDescription>
                  </div>
                  {isSelected && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(data.price)}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        <span className="font-medium">{formatChange(data.change)}</span>
                        <span className="text-sm">({formatChangePercent(data.changePercent)})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Volume</div>
                    <div className="font-medium">{data.volume}</div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{data.lastUpdate}</span>
                  </div>
                  {symbol === selectedSymbol && isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Live</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Symbol Details */}
      {selectedSymbol && marketData[selectedSymbol] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>{selectedSymbol} Detailed View</span>
            </CardTitle>
            <CardDescription>
              Real-time data for {getSymbolName(selectedSymbol)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(marketData[selectedSymbol].price)}
                </div>
                <div className="text-sm text-gray-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  marketData[selectedSymbol].change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatChange(marketData[selectedSymbol].change)}
                </div>
                <div className="text-sm text-gray-600">Change</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  marketData[selectedSymbol].changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatChangePercent(marketData[selectedSymbol].changePercent)}
                </div>
                <div className="text-sm text-gray-600">Change %</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {marketData[selectedSymbol].volume}
                </div>
                <div className="text-sm text-gray-600">Volume</div>
              </div>
            </div>
            
            {lastUpdate && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getConnectionIcon()}
                <span className="font-medium">Connection Status</span>
              </div>
              <Badge variant={
                connectionQuality === 'good' ? 'default' : 
                connectionQuality === 'poor' ? 'secondary' : 'destructive'
              }>
                {getConnectionText()}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {isConnected ? 'Receiving real-time updates' : 'Attempting to connect...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}