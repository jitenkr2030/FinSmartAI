import { apiClient, MarketDataRequest, MarketDataPoint } from './apiClient';

// Real-time market data types
export interface RealTimeData {
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
}

export interface MarketDepth {
  symbol: string;
  bids: Array<[number, number]>; // [price, quantity]
  asks: Array<[number, number]>; // [price, quantity]
  timestamp: string;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  timestamp: string;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: 'price' | 'volume' | 'technical' | 'news';
  condition: string;
  triggered: boolean;
  message: string;
  timestamp: string;
}

// Data source configuration
export interface DataSourceConfig {
  name: string;
  type: 'api' | 'websocket' | 'file';
  endpoint: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  enabled: boolean;
}

class MarketDataService {
  private wsConnections: Map<string, WebSocket> = new Map();
  private dataCallbacks: Map<string, ((data: RealTimeData) => void)[]> = new Map();
  private alertCallbacks: ((alert: MarketAlert) => void)[] = [];
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Supported data sources
  private dataSources: DataSourceConfig[] = [
    {
      name: 'NSE',
      type: 'websocket',
      endpoint: '/ws/market/nse',
      rateLimit: 100,
      enabled: true,
    },
    {
      name: 'BSE',
      type: 'websocket',
      endpoint: '/ws/market/bse',
      rateLimit: 100,
      enabled: true,
    },
    {
      name: 'Yahoo Finance',
      type: 'api',
      endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart',
      rateLimit: 60,
      enabled: true,
    },
    {
      name: 'Alpha Vantage',
      type: 'api',
      endpoint: 'https://www.alphavantage.co/query',
      rateLimit: 5,
      enabled: false,
    },
  ];

  constructor() {
    this.initializeWebSocketConnections();
  }

  private initializeWebSocketConnections() {
    this.dataSources.forEach(source => {
      if (source.type === 'websocket' && source.enabled) {
        this.connectWebSocket(source.name, source.endpoint);
      }
    });
  }

  private connectWebSocket(sourceName: string, endpoint: string) {
    try {
      const ws = apiClient.createWebSocketConnection(endpoint);
      
      ws.onopen = () => {
        console.log(`WebSocket connected to ${sourceName}`);
        this.reconnectAttempts.set(sourceName, 0);
        
        // Subscribe to initial symbols
        this.subscribeToSymbols(['NIFTY 50', 'BANKNIFTY', 'RELIANCE', 'TCS']);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketData(sourceName, data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected from ${sourceName}`);
        this.handleWebSocketDisconnect(sourceName, endpoint);
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${sourceName}:`, error);
      };

      this.wsConnections.set(sourceName, ws);
    } catch (error) {
      console.error(`Failed to connect WebSocket for ${sourceName}:`, error);
    }
  }

  private handleWebSocketDisconnect(sourceName: string, endpoint: string) {
    const attempts = this.reconnectAttempts.get(sourceName) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      console.log(`Attempting to reconnect to ${sourceName} in ${delay}ms...`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(sourceName, attempts + 1);
        this.connectWebSocket(sourceName, endpoint);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${sourceName}`);
    }
  }

  private handleWebSocketData(sourceName: string, data: any) {
    if (data.type === 'price') {
      const realTimeData: RealTimeData = {
        symbol: data.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        timestamp: data.timestamp,
        bid: data.bid,
        ask: data.ask,
        high: data.high,
        low: data.low,
        open: data.open,
      };

      this.notifyDataCallbacks(data.symbol, realTimeData);
    } else if (data.type === 'alert') {
      const alert: MarketAlert = {
        id: data.id,
        symbol: data.symbol,
        type: data.alertType,
        condition: data.condition,
        triggered: data.triggered,
        message: data.message,
        timestamp: data.timestamp,
      };

      this.notifyAlertCallbacks(alert);
    }
  }

  private notifyDataCallbacks(symbol: string, data: RealTimeData) {
    const callbacks = this.dataCallbacks.get(symbol) || [];
    callbacks.forEach(callback => callback(data));
  }

  private notifyAlertCallbacks(alert: MarketAlert) {
    this.alertCallbacks.forEach(callback => callback(alert));
  }

  // Public methods
  async getHistoricalData(request: MarketDataRequest): Promise<CandlestickData[]> {
    const response = await apiClient.get('/market/historical', {
      params: {
        symbol: request.symbol,
        timeframe: request.timeframe,
        limit: request.limit || 100,
        startDate: request.startDate,
        endDate: request.endDate,
      },
    });

    if (response.success && response.data) {
      return response.data.map((item: any) => ({
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));
    }

    return [];
  }

  async getRealTimePrice(symbol: string): Promise<RealTimeData | null> {
    const response = await apiClient.get(`/market/price/${symbol}`);
    
    if (response.success && response.data) {
      return response.data as RealTimeData;
    }

    return null;
  }

  async getMarketDepth(symbol: string): Promise<MarketDepth | null> {
    const response = await apiClient.get(`/market/depth/${symbol}`);
    
    if (response.success && response.data) {
      return response.data as MarketDepth;
    }

    return null;
  }

  async getTechnicalIndicators(symbol: string, indicators: string[]): Promise<TechnicalIndicator[]> {
    const response = await apiClient.get(`/market/indicators/${symbol}`, {
      params: { indicators: indicators.join(',') },
    });

    if (response.success && response.data) {
      return response.data as TechnicalIndicator[];
    }

    return [];
  }

  subscribeToRealTimeData(symbol: string, callback: (data: RealTimeData) => void): () => void {
    if (!this.dataCallbacks.has(symbol)) {
      this.dataCallbacks.set(symbol, []);
    }

    this.dataCallbacks.get(symbol)!.push(callback);

    // Send subscription message via WebSocket
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbol: symbol,
        }));
      }
    });

    // Return unsubscribe function
    return () => {
      const callbacks = this.dataCallbacks.get(symbol) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Unsubscribe from WebSocket if no more callbacks
      if (callbacks.length === 0) {
        this.wsConnections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'unsubscribe',
              symbol: symbol,
            }));
          }
        });
      }
    };
  }

  subscribeToAlerts(callback: (alert: MarketAlert) => void): () => void {
    this.alertCallbacks.push(callback);

    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  private subscribeToSymbols(symbols: string[]) {
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'subscribe_batch',
          symbols: symbols,
        }));
      }
    });
  }

  async createAlert(alert: Omit<MarketAlert, 'id' | 'timestamp' | 'triggered'>): Promise<MarketAlert | null> {
    const response = await apiClient.post('/market/alerts', alert);
    
    if (response.success && response.data) {
      return response.data as MarketAlert;
    }

    return null;
  }

  async getAlerts(symbol?: string): Promise<MarketAlert[]> {
    const response = await apiClient.get('/market/alerts', {
      params: symbol ? { symbol } : {},
    });

    if (response.success && response.data) {
      return response.data as MarketAlert[];
    }

    return [];
  }

  async deleteAlert(alertId: string): Promise<boolean> {
    const response = await apiClient.delete(`/market/alerts/${alertId}`);
    return response.success;
  }

  // Utility methods
  formatPrice(price: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatChange(change: number, changePercent: number): { text: string; className: string } {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    const text = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
    const className = isPositive ? 'text-green-600' : 'text-red-600';
    
    return { text, className };
  }

  formatVolume(volume: number): string {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  // Cleanup
  disconnect() {
    this.wsConnections.forEach(ws => {
      ws.close();
    });
    this.wsConnections.clear();
    this.dataCallbacks.clear();
    this.alertCallbacks.length = 0;
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// Export class for custom instances
export { MarketDataService };

// React hook for market data service
export const useMarketDataService = () => {
  return marketDataService;
};