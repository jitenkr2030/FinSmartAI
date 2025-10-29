'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMobile, useTouchInteractions } from '@/hooks/use-mobile';
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
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Touchpoints
} from 'lucide-react';

interface MobileRealTimeMarketDataProps {
  symbols?: string[];
  autoSubscribe?: boolean;
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

export function MobileRealTimeMarketData({ 
  symbols = DEFAULT_SYMBOLS, 
  autoSubscribe = true 
}: MobileRealTimeMarketDataProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [marketData, setMarketData] = useState<Record<string, MarketDataItem>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const symbolsPerPage = 3;

  const { isMobile, isTouchDevice } = useMobile();
  const { touchInfo, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchInteractions();

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

  // Simulate real-time updates
  useEffect(() => {
    if (!autoSubscribe) return;

    const interval = setInterval(() => {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      setMarketData(prev => ({
        ...prev,
        [randomSymbol]: {
          ...prev[randomSymbol],
          price: prev[randomSymbol].price * (1 + (Math.random() - 0.5) * 0.002),
          change: prev[randomSymbol].change + (Math.random() - 0.5) * 0.5,
          changePercent: prev[randomSymbol].changePercent + (Math.random() - 0.5) * 0.2,
          volume: (parseFloat(prev[randomSymbol].volume) * (1 + Math.random() * 0.1)).toFixed(1) + 'M',
          lastUpdate: new Date().toLocaleTimeString()
        }
      }));
      setLastUpdate(new Date());
      setIsConnected(true);
      setConnectionQuality(Math.random() > 0.1 ? 'good' : 'poor');
    }, 2000);

    return () => clearInterval(interval);
  }, [symbols, autoSubscribe]);

  // Handle swipe gestures for pagination
  useEffect(() => {
    if (touchInfo.swipeDirection === 'left' && currentPage < Math.ceil(symbols.length / symbolsPerPage) - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (touchInfo.swipeDirection === 'right' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [touchInfo.swipeDirection, currentPage, symbols.length]);

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

  const getSymbolName = (symbol: string): string => {
    const names: Record<string, string> = {
      'NIFTY50': 'Nifty 50',
      'BANKNIFTY': 'Bank Nifty',
      'RELIANCE': 'Reliance',
      'TCS': 'TCS',
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

  const paginatedSymbols = symbols.slice(
    currentPage * symbolsPerPage,
    (currentPage + 1) * symbolsPerPage
  );

  const totalPages = Math.ceil(symbols.length / symbolsPerPage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Market Data</h3>
          </div>
          <div className="flex items-center space-x-1">
            {getConnectionIcon()}
            <span className="text-sm text-gray-600">
              {connectionQuality === 'good' ? 'Live' : connectionQuality === 'poor' ? 'Delayed' : 'Offline'}
            </span>
          </div>
        </div>
        {isTouchDevice && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Touchpoints className="w-4 h-4" />
            <span>Swipe to navigate</span>
          </div>
        )}
      </div>

      {/* Market Data Cards */}
      <div 
        className="space-y-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {paginatedSymbols.map(symbol => {
          const data = marketData[symbol];
          if (!data) return null;

          const isPositive = data.change >= 0;
          const isSelected = symbol === selectedSymbol;

          return (
            <Card 
              key={symbol} 
              className={`transition-all hover:shadow-md active:scale-95 ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
              onClick={() => setSelectedSymbol(symbol)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{symbol}</CardTitle>
                    <div className="text-sm text-gray-600">{data.name}</div>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    i === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Selected Symbol Details */}
      {selectedSymbol && marketData[selectedSymbol] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>{selectedSymbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(marketData[selectedSymbol].price)}
                </div>
                <div className="text-sm text-gray-600">Price</div>
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
                <span className="font-medium">Connection</span>
              </div>
              <Badge variant={
                connectionQuality === 'good' ? 'default' : 
                connectionQuality === 'poor' ? 'secondary' : 'destructive'
              }>
                {connectionQuality === 'good' ? 'Live' : connectionQuality === 'poor' ? 'Delayed' : 'Offline'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {isConnected ? 'Real-time updates active' : 'Connecting...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}