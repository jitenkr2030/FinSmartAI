'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EnhancedWebSocketService } from '@/lib/services/enhancedWebSocketService';

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  transports?: string[];
  upgrade?: boolean;
  rememberUpgrade?: boolean;
}

interface ConnectionStats {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  connectionTime: number;
  latency: number;
}

export function useEnhancedWebSocket(options: WebSocketOptions = {}) {
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    connected: false,
    reconnectAttempts: 0,
    lastConnected: null,
    lastDisconnected: null,
    connectionTime: 0,
    latency: 0
  });

  const socketRef = useRef<EnhancedWebSocketService | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    socketRef.current = new EnhancedWebSocketService(options);

    const handleConnectionChange = (connected: boolean) => {
      setConnectionStats(socketRef.current!.getConnectionStats());
    };

    socketRef.current.onConnectionChange(handleConnectionChange);

    return () => {
      if (socketRef.current) {
        socketRef.current.offConnectionChange(handleConnectionChange);
        socketRef.current.destroy();
      }
    };
  }, [JSON.stringify(options)]);

  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    socketRef.current?.emit(event, data, callback);
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
    socketRef.current?.on(event, handler);

    return () => {
      eventHandlersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    eventHandlersRef.current.get(event)?.delete(handler);
    socketRef.current?.off(event, handler);
  }, []);

  const connect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  const getConnectionStats = useCallback(() => {
    return socketRef.current?.getConnectionStats() || connectionStats;
  }, [connectionStats]);

  const getQueueSize = useCallback(() => {
    return socketRef.current?.getQueueSize() || 0;
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current?.isConnected() || false;
  }, []);

  return {
    emit,
    on,
    off,
    connect,
    disconnect,
    connectionStats,
    getConnectionStats,
    getQueueSize,
    isConnected
  };
}