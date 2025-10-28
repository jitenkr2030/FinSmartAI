'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketHookOptions {
  url?: string;
  autoConnect?: boolean;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface PredictionUpdate {
  id: string;
  model: string;
  symbol: string;
  prediction: number;
  confidence: number;
  timestamp: string;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError?.(error as Event);
    }
  }, [url, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  const joinMarket = useCallback((symbol: string) => {
    sendMessage({ type: 'join-market', symbol });
  }, [sendMessage]);

  const leaveMarket = useCallback((symbol: string) => {
    sendMessage({ type: 'leave-market', symbol });
  }, [sendMessage]);

  const joinUser = useCallback((userId: string) => {
    sendMessage({ type: 'join-user', userId });
  }, [sendMessage]);

  const subscribeNotifications = useCallback((userId: string) => {
    sendMessage({ type: 'subscribe-notifications', userId });
  }, [sendMessage]);

  const subscribePredictions = useCallback((model: string) => {
    sendMessage({ type: 'subscribe-predictions', model });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    sendMessage,
    joinMarket,
    leaveMarket,
    joinUser,
    subscribeNotifications,
    subscribePredictions,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN
  };
}

// Specialized hooks for different types of real-time data
export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketDataUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'market-update' && data.symbol === symbol) {
      setMarketData(data);
    } else if (data.type === 'market-data' && data.symbol === symbol) {
      setMarketData(data);
    }
  }, [symbol]);

  const { connect, disconnect, joinMarket, leaveMarket } = useWebSocket({
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onMessage: handleMessage
  });

  useEffect(() => {
    if (isConnected && symbol) {
      joinMarket(symbol);
    }

    return () => {
      if (symbol) {
        leaveMarket(symbol);
      }
    };
  }, [isConnected, symbol, joinMarket, leaveMarket]);

  return { marketData, isConnected };
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'notification') {
      setNotifications(prev => [data, ...prev]);
    }
  }, []);

  const { connect, disconnect, subscribeNotifications } = useWebSocket({
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onMessage: handleMessage
  });

  useEffect(() => {
    if (isConnected && userId) {
      subscribeNotifications(userId);
    }
  }, [isConnected, userId, subscribeNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, isConnected, clearNotifications };
}

export function usePredictions(model: string) {
  const [predictions, setPredictions] = useState<PredictionUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'prediction-update' && data.model === model) {
      setPredictions(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 predictions
    }
  }, [model]);

  const { connect, disconnect, subscribePredictions } = useWebSocket({
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onMessage: handleMessage
  });

  useEffect(() => {
    if (isConnected && model) {
      subscribePredictions(model);
    }
  }, [isConnected, model, subscribePredictions]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  return { predictions, isConnected, clearPredictions };
}