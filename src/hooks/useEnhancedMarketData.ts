import { useState, useEffect, useCallback, useRef } from 'react';
import { useEnhancedWebSocket } from './enhancedWebSocketService';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

interface MarketDataOptions {
  symbols: string[];
  updateInterval?: number;
  enableBatching?: boolean;
  batchSize?: number;
  enableCompression?: boolean;
  enablePredictions?: boolean;
  enableNotifications?: boolean;
  maxDataPoints?: number;
  enableReconnection?: boolean;
  connectionTimeout?: number;
}

interface MarketDataState {
  data: Map<string, MarketData>;
  isConnected: boolean;
  connectionStats: any;
  error: string | null;
  lastUpdate: Date | null;
  subscriptionCount: number;
}

export function useEnhancedMarketData(options: MarketDataOptions) {
  const {
    symbols,
    updateInterval = 1000,
    enableBatching = true,
    batchSize = 10,
    enableCompression = true,
    enablePredictions = true,
    enableNotifications = true,
    maxDataPoints = 1000,
    enableReconnection = true,
    connectionTimeout = 5000
  } = options;

  const [state, setState] = useState<MarketDataState>({
    data: new Map(),
    isConnected: false,
    connectionStats: null,
    error: null,
    lastUpdate: null,
    subscriptionCount: 0
  });

  const dataBufferRef = useRef<Map<string, MarketData[]>>(new Map());
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const lastPingRef = useRef<number>(Date.now());

  const { emit, on, off, connect, disconnect, connectionStats, isConnected } = useEnhancedWebSocket({
    reconnection: enableReconnection,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: connectionTimeout
  });

  // Initialize data buffers for each symbol
  useEffect(() => {
    symbols.forEach(symbol => {
      dataBufferRef.current.set(symbol, []);
    });
  }, [symbols]);

  // Handle connection changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      connectionStats
    }));

    if (isConnected) {
      reconnectAttemptsRef.current = 0;
      resubscribeAll();
    }
  }, [isConnected, connectionStats]);

  // Setup event handlers
  useEffect(() => {
    const handleMarketUpdate = (data: MarketData) => {
      if (!data || !data.symbol) return;

      const now = Date.now();
      
      // Update last ping time
      lastPingRef.current = now;

      if (enableBatching) {
        // Add to buffer
        const buffer = dataBufferRef.current.get(data.symbol) || [];
        buffer.push(data);
        dataBufferRef.current.set(data.symbol, buffer);

        // Process batch if buffer is full
        if (buffer.length >= batchSize) {
          processBatch(data.symbol);
        }
      } else {
        // Process immediately
        updateMarketData(data.symbol, data);
      }
    };

    const handleBatchUpdate = (batchData: MarketData[]) => {
      if (!Array.isArray(batchData)) return;

      batchData.forEach(data => {
        if (data && data.symbol) {
          updateMarketData(data.symbol, data);
        }
      });
    };

    const handleConnectionError = (error: any) => {
      setState(prev => ({
        ...prev,
        error: error?.message || 'Connection error'
      }));

      if (enableReconnection && reconnectAttemptsRef.current < 10) {
        reconnectAttemptsRef.current++;
        setTimeout(() => {
          connect();
        }, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000));
      }
    };

    const handlePredictionUpdate = (data: any) => {
      if (enablePredictions && data) {
        // Handle prediction updates
        console.log('Prediction update:', data);
      }
    };

    const handleNotification = (data: any) => {
      if (enableNotifications && data) {
        // Handle notifications
        console.log('Notification:', data);
      }
    };

    // Register event handlers
    on('market-update', handleMarketUpdate);
    on('batch-update', handleBatchUpdate);
    on('connect_error', handleConnectionError);
    on('prediction-update', handlePredictionUpdate);
    on('notification', handleNotification);

    return () => {
      off('market-update', handleMarketUpdate);
      off('batch-update', handleBatchUpdate);
      off('connect_error', handleConnectionError);
      off('prediction-update', handlePredictionUpdate);
      off('notification', handleNotification);
    };
  }, [on, off, enableBatching, batchSize, enablePredictions, enableNotifications, enableReconnection, connect]);

  // Setup batch processing timer
  useEffect(() => {
    if (enableBatching) {
      batchTimerRef.current = setInterval(() => {
        // Process all buffers
        dataBufferRef.current.forEach((buffer, symbol) => {
          if (buffer.length > 0) {
            processBatch(symbol);
          }
        });
      }, updateInterval);
    }

    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }
    };
  }, [enableBatching, updateInterval]);

  const processBatch = useCallback((symbol: string) => {
    const buffer = dataBufferRef.current.get(symbol) || [];
    if (buffer.length === 0) return;

    // Take the latest data point (or average if needed)
    const latestData = buffer[buffer.length - 1];
    
    // Clear buffer
    dataBufferRef.current.set(symbol, []);

    // Update state
    updateMarketData(symbol, latestData);
  }, []);

  const updateMarketData = useCallback((symbol: string, data: MarketData) => {
    setState(prev => {
      const newData = new Map(prev.data);
      
      // Get existing data array or create new one
      const existingData = newData.get(symbol) || [];
      
      // Add new data point
      const updatedData = [...existingData, data];
      
      // Limit data points
      if (updatedData.length > maxDataPoints) {
        updatedData.shift();
      }
      
      newData.set(symbol, updatedData as any);
      
      return {
        ...prev,
        data: newData,
        lastUpdate: new Date(),
        error: null
      };
    });
  }, [maxDataPoints]);

  const subscribeToSymbol = useCallback((symbol: string) => {
    if (!subscriptionsRef.current.has(symbol)) {
      subscriptionsRef.current.add(symbol);
      emit('join-market', symbol);
      
      setState(prev => ({
        ...prev,
        subscriptionCount: prev.subscriptionCount + 1
      }));
    }
  }, [emit]);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    if (subscriptionsRef.current.has(symbol)) {
      subscriptionsRef.current.delete(symbol);
      emit('leave-market', symbol);
      
      setState(prev => ({
        ...prev,
        subscriptionCount: prev.subscriptionCount - 1
      }));
    }
  }, [emit]);

  const resubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(symbol => {
      emit('join-market', symbol);
    });
  }, [emit]);

  const getLatestData = useCallback((symbol: string): MarketData | null => {
    const symbolData = state.data.get(symbol);
    return symbolData ? symbolData[symbolData.length - 1] : null;
  }, [state.data]);

  const getHistoricalData = useCallback((symbol: string, limit?: number): MarketData[] => {
    const symbolData = state.data.get(symbol) || [];
    const data = limit ? symbolData.slice(-limit) : symbolData;
    return data as MarketData[];
  }, [state.data]);

  const clearData = useCallback((symbol?: string) => {
    setState(prev => {
      const newData = new Map(prev.data);
      
      if (symbol) {
        newData.delete(symbol);
      } else {
        newData.clear();
      }
      
      return {
        ...prev,
        data: newData
      };
    });
  }, []);

  const getConnectionHealth = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPing = now - lastPingRef.current;
    
    return {
      isConnected: state.isConnected,
      timeSinceLastPing,
      latency: connectionStats?.latency || 0,
      reconnectAttempts: reconnectAttemptsRef.current,
      subscriptionCount: state.subscriptionCount,
      bufferSize: Array.from(dataBufferRef.current.values()).reduce((total, buffer) => total + buffer.length, 0)
    };
  }, [state.isConnected, connectionStats, state.subscriptionCount]);

  // Auto-subscribe to symbols
  useEffect(() => {
    if (state.isConnected && symbols.length > 0) {
      symbols.forEach(symbol => {
        subscribeToSymbol(symbol);
      });
    }
  }, [state.isConnected, symbols, subscribeToSymbol]);

  return {
    // State
    data: state.data,
    isConnected: state.isConnected,
    connectionStats: state.connectionStats,
    error: state.error,
    lastUpdate: state.lastUpdate,
    subscriptionCount: state.subscriptionCount,

    // Actions
    subscribeToSymbol,
    unsubscribeFromSymbol,
    getLatestData,
    getHistoricalData,
    clearData,
    getConnectionHealth,
    
    // Connection management
    connect,
    disconnect
  };
}