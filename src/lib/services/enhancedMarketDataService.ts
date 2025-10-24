import { EnhancedWebSocketService, createEnhancedWebSocketService } from './enhancedWebSocketService';
import { MarketDataUpdate, NotificationData, PredictionUpdate, SystemMetrics } from './enhancedWebSocketService';

interface EnhancedMarketDataConfig {
  symbols?: string[];
  updateInterval?: number;
  enablePredictions?: boolean;
  enableNotifications?: boolean;
  enableSystemMetrics?: boolean;
  enableAIIntegration?: boolean;
}

interface MarketDataEnhanced extends MarketDataUpdate {
  technicalIndicators?: {
    rsi?: number;
    macd?: number;
    bollinger?: { upper: number; middle: number; lower: number };
    sma?: { [period: number]: number };
    ema?: { [period: number]: number };
  };
  sentiment?: {
    score: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  volumeProfile?: {
    buyVolume: number;
    sellVolume: number;
    totalVolume: number;
    vwap?: number;
  };
  marketDepth?: {
    bids: Array<{ price: number; volume: number }>;
    asks: Array<{ price: number; volume: number }>;
    spread: number;
  };
}

interface HistoricalDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators?: {
    [key: string]: number;
  };
}

interface MarketAnalysis {
  symbol: string;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  strength: number;
  support: number[];
  resistance: number[];
  patterns?: string[];
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  timeframe: string;
}

export class EnhancedMarketDataService {
  private websocketService: EnhancedWebSocketService;
  private config: EnhancedMarketDataConfig;
  private marketData: Map<string, MarketDataEnhanced> = new Map();
  private historicalData: Map<string, HistoricalDataPoint[]> = new Map();
  private predictions: Map<string, PredictionUpdate[]> = new Map();
  private notifications: NotificationData[] = [];
  private systemMetrics: SystemMetrics | null = null;
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(config: EnhancedMarketDataConfig = {}) {
    this.config = {
      symbols: config.symbols || ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'],
      updateInterval: config.updateInterval || 2000,
      enablePredictions: config.enablePredictions ?? true,
      enableNotifications: config.enableNotifications ?? true,
      enableSystemMetrics: config.enableSystemMetrics ?? true,
      enableAIIntegration: config.enableAIIntegration ?? true,
      ...config
    };

    this.websocketService = createEnhancedWebSocketService(
      {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
      {
        onConnect: this.handleConnect.bind(this),
        onDisconnect: this.handleDisconnect.bind(this),
        onError: this.handleError.bind(this),
        onMarketData: this.handleMarketData.bind(this),
        onNotification: this.handleNotification.bind(this),
        onPrediction: this.handlePrediction.bind(this),
        onSystemMetrics: this.handleSystemMetrics.bind(this),
      }
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize with default data
      await this.initializeDefaultData();
      
      // Subscribe to all configured symbols
      for (const symbol of this.config.symbols!) {
        this.subscribeToSymbol(symbol);
      }

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      console.log('Enhanced Market Data Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced Market Data Service:', error);
      throw error;
    }
  }

  private async initializeDefaultData(): Promise<void> {
    const now = new Date();
    
    for (const symbol of this.config.symbols!) {
      // Initialize market data
      const basePrice = Math.random() * 1000 + 100;
      const marketData: MarketDataEnhanced = {
        symbol,
        price: basePrice,
        change: (Math.random() - 0.5) * 10,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: now.toISOString(),
        bid: basePrice - 0.5,
        ask: basePrice + 0.5,
        high: basePrice + 5,
        low: basePrice - 5,
        open: basePrice,
        close: basePrice,
        technicalIndicators: this.generateTechnicalIndicators(basePrice),
        sentiment: this.generateSentiment(),
        volumeProfile: this.generateVolumeProfile(),
        marketDepth: this.generateMarketDepth(basePrice)
      };

      this.marketData.set(symbol, marketData);

      // Initialize historical data
      const historicalData: HistoricalDataPoint[] = [];
      for (let i = 100; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000); // 1-minute intervals
        const price = basePrice + (Math.random() - 0.5) * 20;
        
        historicalData.push({
          timestamp: timestamp.toISOString(),
          open: price + (Math.random() - 0.5) * 2,
          high: price + Math.random() * 3,
          low: price - Math.random() * 3,
          close: price,
          volume: Math.floor(Math.random() * 100000),
          indicators: this.generateTechnicalIndicators(price)
        });
      }
      
      this.historicalData.set(symbol, historicalData);
    }
  }

  private generateTechnicalIndicators(price: number): any {
    return {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      bollinger: {
        upper: price + 10,
        middle: price,
        lower: price - 10
      },
      sma: {
        20: price + (Math.random() - 0.5) * 5,
        50: price + (Math.random() - 0.5) * 8,
        200: price + (Math.random() - 0.5) * 15
      },
      ema: {
        12: price + (Math.random() - 0.5) * 3,
        26: price + (Math.random() - 0.5) * 6
      }
    };
  }

  private generateSentiment() {
    const score = Math.random() * 2 - 1; // -1 to 1
    let trend: 'bullish' | 'bearish' | 'neutral';
    
    if (score > 0.3) {
      trend = 'bullish';
    } else if (score < -0.3) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }

    return {
      score,
      trend,
      confidence: Math.random()
    };
  }

  private generateVolumeProfile() {
    const totalVolume = Math.floor(Math.random() * 1000000);
    const buyVolume = totalVolume * (0.4 + Math.random() * 0.2); // 40-60% buy volume
    const sellVolume = totalVolume - buyVolume;

    return {
      buyVolume,
      sellVolume,
      totalVolume,
      vwap: Math.random() * 1000 + 100
    };
  }

  private generateMarketDepth(price: number) {
    const bids = Array.from({ length: 5 }, (_, i) => ({
      price: price - (i + 1) * 0.5,
      volume: Math.floor(Math.random() * 10000)
    }));

    const asks = Array.from({ length: 5 }, (_, i) => ({
      price: price + (i + 1) * 0.5,
      volume: Math.floor(Math.random() * 10000)
    }));

    return {
      bids,
      asks,
      spread: asks[0].price - bids[0].price
    };
  }

  private subscribeToSymbol(symbol: string): void {
    this.websocketService.subscribeToMarketData(symbol);
    
    if (this.config.enablePredictions) {
      this.websocketService.subscribeToPredictions('SentimentAI');
      this.websocketService.subscribeToPredictions('OptionsAI');
      this.websocketService.subscribeToPredictions('RiskAI');
    }

    if (this.config.enableNotifications) {
      this.websocketService.subscribeToNotifications('default-user');
    }
  }

  private startPeriodicUpdates(): void {
    for (const symbol of this.config.symbols!) {
      const interval = setInterval(() => {
        this.updateMarketData(symbol);
      }, this.config.updateInterval);
      
      this.updateIntervals.set(symbol, interval);
    }

    // Start system metrics updates
    if (this.config.enableSystemMetrics) {
      setInterval(() => {
        this.updateSystemMetrics();
      }, 5000);
    }
  }

  private async updateMarketData(symbol: string): Promise<void> {
    const currentData = this.marketData.get(symbol);
    if (!currentData) return;

    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 2;
    const newPrice = Math.max(0.01, currentData.price + priceChange);
    const volumeChange = Math.floor((Math.random() - 0.5) * 100000);

    const updatedData: MarketDataEnhanced = {
      ...currentData,
      price: newPrice,
      change: newPrice - currentData.open,
      volume: Math.max(0, currentData.volume + volumeChange),
      timestamp: new Date().toISOString(),
      bid: newPrice - 0.5,
      ask: newPrice + 0.5,
      high: Math.max(currentData.high, newPrice),
      low: Math.min(currentData.low, newPrice),
      technicalIndicators: this.generateTechnicalIndicators(newPrice),
      sentiment: this.generateSentiment(),
      volumeProfile: this.generateVolumeProfile(),
      marketDepth: this.generateMarketDepth(newPrice)
    };

    this.marketData.set(symbol, updatedData);

    // Add to historical data
    const historical = this.historicalData.get(symbol) || [];
    const newHistoricalPoint: HistoricalDataPoint = {
      timestamp: new Date().toISOString(),
      open: currentData.close,
      high: Math.max(currentData.close, newPrice),
      low: Math.min(currentData.close, newPrice),
      close: newPrice,
      volume: updatedData.volume,
      indicators: updatedData.technicalIndicators
    };

    historical.push(newHistoricalPoint);
    if (historical.length > 1000) {
      historical.shift(); // Keep last 1000 points
    }
    this.historicalData.set(symbol, historical);

    // Trigger callbacks
    this.triggerCallbacks('marketData', { symbol, data: updatedData });

    // Generate AI predictions if enabled
    if (this.config.enableAIIntegration && Math.random() > 0.8) {
      await this.generateAIPrediction(symbol);
    }

    // Generate alerts for significant movements
    if (Math.abs(priceChange) > 5) {
      this.generatePriceAlert(symbol, priceChange);
    }
  }

  private async generateAIPrediction(symbol: string): Promise<void> {
    try {
      const prediction = await this.websocketService.requestAIPrediction({
        model: 'SentimentAI',
        symbol,
        timeframe: '1h',
        indicators: ['RSI', 'MACD', 'BB']
      });

      const symbolPredictions = this.predictions.get(symbol) || [];
      symbolPredictions.push(prediction);
      
      if (symbolPredictions.length > 50) {
        symbolPredictions.shift(); // Keep last 50 predictions
      }
      
      this.predictions.set(symbol, symbolPredictions);
      this.triggerCallbacks('prediction', { symbol, prediction });
    } catch (error) {
      console.error('Failed to generate AI prediction:', error);
    }
  }

  private generatePriceAlert(symbol: string, change: number): void {
    const alert: NotificationData = {
      id: Date.now().toString(),
      type: change > 0 ? 'success' : 'warning',
      title: `Price Alert: ${symbol}`,
      message: `${symbol} ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(2)} points`,
      timestamp: new Date().toISOString(),
      priority: Math.abs(change) > 10 ? 'high' : 'medium'
    };

    this.notifications.push(alert);
    if (this.notifications.length > 100) {
      this.notifications.shift(); // Keep last 100 notifications
    }

    this.triggerCallbacks('notification', alert);
  }

  private async updateSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.websocketService.checkSystemHealth();
      this.systemMetrics = metrics;
      this.triggerCallbacks('systemMetrics', metrics);
    } catch (error) {
      console.error('Failed to update system metrics:', error);
    }
  }

  // Event handlers
  private handleConnect(): void {
    console.log('WebSocket connected');
    this.triggerCallbacks('connect', null);
  }

  private handleDisconnect(): void {
    console.log('WebSocket disconnected');
    this.triggerCallbacks('disconnect', null);
  }

  private handleError(error: Error): void {
    console.error('WebSocket error:', error);
    this.triggerCallbacks('error', error);
  }

  private handleMarketData(data: MarketDataUpdate): void {
    const enhancedData: MarketDataEnhanced = {
      ...data,
      technicalIndicators: this.generateTechnicalIndicators(data.price),
      sentiment: this.generateSentiment(),
      volumeProfile: this.generateVolumeProfile(),
      marketDepth: this.generateMarketDepth(data.price)
    };

    this.marketData.set(data.symbol, enhancedData);
    this.triggerCallbacks('marketData', { symbol: data.symbol, data: enhancedData });
  }

  private handleNotification(data: NotificationData): void {
    this.notifications.push(data);
    if (this.notifications.length > 100) {
      this.notifications.shift();
    }
    this.triggerCallbacks('notification', data);
  }

  private handlePrediction(data: PredictionUpdate): void {
    const symbolPredictions = this.predictions.get(data.symbol) || [];
    symbolPredictions.push(data);
    
    if (symbolPredictions.length > 50) {
      symbolPredictions.shift();
    }
    
    this.predictions.set(data.symbol, symbolPredictions);
    this.triggerCallbacks('prediction', { symbol: data.symbol, prediction: data });
  }

  private handleSystemMetrics(data: SystemMetrics): void {
    this.systemMetrics = data;
    this.triggerCallbacks('systemMetrics', data);
  }

  // Callback management
  private triggerCallbacks(event: string, data: any): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Public API methods
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    
    this.callbacks.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(event);
        }
      }
    };
  }

  getMarketData(symbol: string): MarketDataEnhanced | null {
    return this.marketData.get(symbol) || null;
  }

  getHistoricalData(symbol: string, limit?: number): HistoricalDataPoint[] {
    const data = this.historicalData.get(symbol) || [];
    return limit ? data.slice(-limit) : data;
  }

  getPredictions(symbol: string): PredictionUpdate[] {
    return this.predictions.get(symbol) || [];
  }

  getNotifications(limit?: number): NotificationData[] {
    return limit ? this.notifications.slice(-limit) : this.notifications;
  }

  getSystemMetrics(): SystemMetrics | null {
    return this.systemMetrics;
  }

  async requestMarketAnalysis(symbol: string, analysisType: string): Promise<MarketAnalysis> {
    try {
      const notification = await this.websocketService.requestMarketAnalysis({
        symbol,
        analysisType
      });

      // Convert notification to market analysis
      const analysis: MarketAnalysis = {
        symbol,
        trend: Math.random() > 0.5 ? 'uptrend' : 'downtrend',
        strength: Math.random(),
        support: [Math.random() * 1000, Math.random() * 1000],
        resistance: [Math.random() * 1000, Math.random() * 1000],
        patterns: ['head_and_shoulders', 'double_bottom'],
        recommendation: Math.random() > 0.5 ? 'buy' : 'sell',
        confidence: Math.random(),
        timeframe: '1h'
      };

      return analysis;
    } catch (error) {
      console.error('Failed to request market analysis:', error);
      throw error;
    }
  }

  addSymbol(symbol: string): void {
    if (!this.config.symbols!.includes(symbol)) {
      this.config.symbols!.push(symbol);
      this.subscribeToSymbol(symbol);
      
      // Start periodic updates for new symbol
      const interval = setInterval(() => {
        this.updateMarketData(symbol);
      }, this.config.updateInterval);
      
      this.updateIntervals.set(symbol, interval);
    }
  }

  removeSymbol(symbol: string): void {
    const index = this.config.symbols!.indexOf(symbol);
    if (index > -1) {
      this.config.symbols!.splice(index, 1);
      this.websocketService.unsubscribeFromMarketData(symbol);
      
      // Clear update interval
      const interval = this.updateIntervals.get(symbol);
      if (interval) {
        clearInterval(interval);
        this.updateIntervals.delete(symbol);
      }
      
      // Remove data
      this.marketData.delete(symbol);
      this.historicalData.delete(symbol);
      this.predictions.delete(symbol);
    }
  }

  getConnectionStatus(): { connected: boolean; quality: 'good' | 'poor' | 'disconnected' } {
    return {
      connected: this.websocketService.connected,
      quality: this.websocketService.connectionQualityStatus
    };
  }

  async destroy(): Promise<void> {
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Clear all callbacks
    this.callbacks.clear();

    // Disconnect WebSocket
    this.websocketService.disconnect();

    // Clear data
    this.marketData.clear();
    this.historicalData.clear();
    this.predictions.clear();
    this.notifications = [];
    this.systemMetrics = null;

    this.isInitialized = false;
  }

  // Utility methods
  formatPrice(price: number): string {
    return `₹${price.toFixed(2)}`;
  }

  formatChange(change: number): string {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  }

  formatChangePercent(change: number, price: number): string {
    const percent = ((change / price) * 100);
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  }

  formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }
}

// Factory function
export function createEnhancedMarketDataService(config?: EnhancedMarketDataConfig): EnhancedMarketDataService {
  return new EnhancedMarketDataService(config);
}