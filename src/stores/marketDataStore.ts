import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MarketDataPoint {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

interface MarketDataState {
  // Real-time Data
  realTimeData: Record<string, MarketDataPoint>;
  
  // Historical Data
  historicalData: Record<string, MarketDataPoint[]>;
  
  // Watchlist
  watchlist: string[];
  
  // Loading States
  loading: Record<string, boolean>;
  
  // Error States
  errors: Record<string, string>;
  
  // Last Update
  lastUpdate: Record<string, Date>;
  
  // WebSocket Connection
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Actions
  updateRealTimeData: (symbol: string, data: MarketDataPoint) => void;
  updateHistoricalData: (symbol: string, data: MarketDataPoint[]) => void;
  
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setWatchlist: (symbols: string[]) => void;
  
  setLoading: (symbol: string, loading: boolean) => void;
  setError: (symbol: string, error: string | null) => void;
  
  setConnectionStatus: (status: MarketDataState['connectionStatus']) => void;
  
  clearData: (symbol?: string) => void;
  
  // Getters
  getWatchlistData: () => MarketDataPoint[];
  getPriceChange: (symbol: string) => { change: number; changePercent: number } | null;
  isDataStale: (symbol: string, maxAgeMs: number) => boolean;
}

export const useMarketDataStore = create<MarketDataState>()(
  devtools(
    (set, get) => ({
      // Initial State
      realTimeData: {},
      historicalData: {},
      watchlist: ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'],
      loading: {},
      errors: {},
      lastUpdate: {},
      isConnected: false,
      connectionStatus: 'disconnected',
      
      // Actions
      updateRealTimeData: (symbol, data) =>
        set((state) => ({
          realTimeData: {
            ...state.realTimeData,
            [symbol]: {
              ...data,
              change: data.close - (state.realTimeData[symbol]?.close || data.open),
              changePercent: ((data.close - (state.realTimeData[symbol]?.close || data.open)) / (state.realTimeData[symbol]?.close || data.open)) * 100,
            },
          },
          lastUpdate: {
            ...state.lastUpdate,
            [symbol]: new Date(),
          },
          errors: {
            ...state.errors,
            [symbol]: '',
          },
        })),
      
      updateHistoricalData: (symbol, data) =>
        set((state) => ({
          historicalData: {
            ...state.historicalData,
            [symbol]: data,
          },
          errors: {
            ...state.errors,
            [symbol]: '',
          },
        })),
      
      addToWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist
            : [...state.watchlist, symbol],
        })),
      
      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
        })),
      
      setWatchlist: (symbols) => set({ watchlist: symbols }),
      
      setLoading: (symbol, loading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [symbol]: loading,
          },
        })),
      
      setError: (symbol, error) =>
        set((state) => ({
          errors: {
            ...state.errors,
            [symbol]: error || '',
          },
        })),
      
      setConnectionStatus: (connectionStatus) => set({ connectionStatus, isConnected: connectionStatus === 'connected' }),
      
      clearData: (symbol) =>
        set((state) => {
          if (symbol) {
            const { [symbol]: removed, ...remainingRealTime } = state.realTimeData;
            const { [symbol]: removedHist, ...remainingHistorical } = state.historicalData;
            const { [symbol]: removedLoading, ...remainingLoading } = state.loading;
            const { [symbol]: removedError, ...remainingErrors } = state.errors;
            const { [symbol]: removedUpdate, ...remainingUpdate } = state.lastUpdate;
            
            return {
              realTimeData: remainingRealTime,
              historicalData: remainingHistorical,
              loading: remainingLoading,
              errors: remainingErrors,
              lastUpdate: remainingUpdate,
            };
          }
          
          return {
            realTimeData: {},
            historicalData: {},
            loading: {},
            errors: {},
            lastUpdate: {},
          };
        }),
      
      // Getters
      getWatchlistData: () => {
        const state = get();
        return state.watchlist
          .map((symbol) => state.realTimeData[symbol])
          .filter(Boolean);
      },
      
      getPriceChange: (symbol) => {
        const state = get();
        const data = state.realTimeData[symbol];
        if (!data) return null;
        
        return {
          change: data.change,
          changePercent: data.changePercent,
        };
      },
      
      isDataStale: (symbol, maxAgeMs) => {
        const state = get();
        const lastUpdate = state.lastUpdate[symbol];
        if (!lastUpdate) return true;
        
        return Date.now() - lastUpdate.getTime() > maxAgeMs;
      },
    }),
    {
      name: 'market-data-store',
    }
  )
);