import { apiClient } from './apiClient';

// Analytics types
export interface AnalyticsTimeRange {
  start: string;
  end: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  winRate: number;
  profitFactor: number;
}

export interface RiskMetrics {
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  expectedShortfall: number;
  beta: number;
  correlation: number;
  downsideRisk: number;
  upsideRisk: number;
  trackingError: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalReturn: number;
  dailyReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  riskMetrics: RiskMetrics;
  performanceMetrics: PerformanceMetrics;
  assetAllocation: AssetAllocation[];
  sectorAllocation: SectorAllocation[];
  geographicAllocation: GeographicAllocation[];
  topHoldings: TopHolding[];
  drawdownHistory: DrawdownData[];
  returnsHistory: ReturnsData[];
}

export interface AssetAllocation {
  assetClass: string;
  value: number;
  percentage: number;
  return: number;
  risk: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  return: number;
  risk: number;
}

export interface GeographicAllocation {
  region: string;
  value: number;
  percentage: number;
  return: number;
  risk: number;
}

export interface TopHolding {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  return: number;
  risk: number;
}

export interface DrawdownData {
  date: string;
  value: number;
  drawdown: number;
}

export interface ReturnsData {
  date: string;
  portfolioReturn: number;
  benchmarkReturn?: number;
  alpha?: number;
}

export interface ModelPerformance {
  modelName: string;
  modelType: string;
  totalPredictions: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgConfidence: number;
  processingTime: number;
  cost: number;
  lastUpdated: string;
  performanceHistory: PerformanceHistory[];
}

export interface PerformanceHistory {
  date: string;
  accuracy: number;
  predictions: number;
  confidence: number;
}

export interface UsageAnalytics {
  totalApiCalls: number;
  totalPredictions: number;
  totalCost: number;
  avgProcessingTime: number;
  peakUsageTime: string;
  usageByModel: UsageByModel[];
  usageByHour: UsageByHour[];
  usageByDay: UsageByDay[];
  costBreakdown: CostBreakdown[];
}

export interface UsageByModel {
  modelName: string;
  calls: number;
  percentage: number;
  cost: number;
  avgProcessingTime: number;
}

export interface UsageByHour {
  hour: number;
  calls: number;
  cost: number;
}

export interface UsageByDay {
  date: string;
  calls: number;
  cost: number;
  predictions: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MarketAnalytics {
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  marketSentiment: number;
  volatilityIndex: number;
  fearGreedIndex: number;
  marketCap: number;
  tradingVolume: number;
  sectorPerformance: SectorPerformance[];
  topGainers: TopMover[];
  topLosers: TopMover[];
  marketIndicators: MarketIndicator[];
}

export interface SectorPerformance {
  sector: string;
  performance: number;
  volume: number;
  marketCap: number;
  trend: 'up' | 'down' | 'sideways';
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface MarketIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
}

export interface ReportConfig {
  type: 'portfolio' | 'performance' | 'risk' | 'usage' | 'market';
  format: 'pdf' | 'excel' | 'csv';
  timeRange: AnalyticsTimeRange;
  includeCharts: boolean;
  includeRecommendations: boolean;
  sections: string[];
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  format: string;
  generatedAt: string;
  downloadUrl: string;
  expiresAt: string;
  size: number;
  pages?: number;
}

class AnalyticsService {
  // Portfolio Analytics
  async getPortfolioAnalytics(
    portfolioId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<PortfolioAnalytics>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}`, {
      params: timeRange,
    });
  }

  async getPerformanceMetrics(
    portfolioId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<PerformanceMetrics>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/performance`, {
      params: timeRange,
    });
  }

  async getRiskMetrics(
    portfolioId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<RiskMetrics>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/risk`, {
      params: timeRange,
    });
  }

  async getAssetAllocation(portfolioId: string): Promise<ApiResponse<AssetAllocation[]>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/allocation/assets`);
  }

  async getSectorAllocation(portfolioId: string): Promise<ApiResponse<SectorAllocation[]>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/allocation/sectors`);
  }

  async getGeographicAllocation(portfolioId: string): Promise<ApiResponse<GeographicAllocation[]>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/allocation/geographic`);
  }

  async getDrawdownHistory(
    portfolioId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<DrawdownData[]>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/drawdown`, {
      params: timeRange,
    });
  }

  async getReturnsHistory(
    portfolioId: string,
    timeRange: AnalyticsTimeRange,
    benchmark?: string
  ): Promise<ApiResponse<ReturnsData[]>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/returns`, {
      params: { ...timeRange, benchmark },
    });
  }

  // Model Performance Analytics
  async getModelPerformance(
    modelName?: string,
    timeRange?: AnalyticsTimeRange
  ): Promise<ApiResponse<ModelPerformance[]>> {
    const params = timeRange ? { ...timeRange } : {};
    if (modelName) params.modelName = modelName;

    return apiClient.get('/analytics/models/performance', { params });
  }

  async getModelAccuracyTrends(
    modelName: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<PerformanceHistory[]>> {
    return apiClient.get(`/analytics/models/${modelName}/accuracy-trends`, {
      params: timeRange,
    });
  }

  async getModelUsageStats(
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<UsageByModel[]>> {
    return apiClient.get('/analytics/models/usage', {
      params: timeRange,
    });
  }

  // Usage Analytics
  async getUsageAnalytics(timeRange: AnalyticsTimeRange): Promise<ApiResponse<UsageAnalytics>> {
    return apiClient.get('/analytics/usage', {
      params: timeRange,
    });
  }

  async getUsageByHour(timeRange: AnalyticsTimeRange): Promise<ApiResponse<UsageByHour[]>> {
    return apiClient.get('/analytics/usage/by-hour', {
      params: timeRange,
    });
  }

  async getUsageByDay(timeRange: AnalyticsTimeRange): Promise<ApiResponse<UsageByDay[]>> {
    return apiClient.get('/analytics/usage/by-day', {
      params: timeRange,
    });
  }

  async getCostBreakdown(timeRange: AnalyticsTimeRange): Promise<ApiResponse<CostBreakdown[]>> {
    return apiClient.get('/analytics/usage/cost-breakdown', {
      params: timeRange,
    });
  }

  // Market Analytics
  async getMarketAnalytics(): Promise<ApiResponse<MarketAnalytics>> {
    return apiClient.get('/analytics/market');
  }

  async getSectorPerformance(): Promise<ApiResponse<SectorPerformance[]>> {
    return apiClient.get('/analytics/market/sectors');
  }

  async getTopGainers(limit: number = 10): Promise<ApiResponse<TopMover[]>> {
    return apiClient.get('/analytics/market/gainers', {
      params: { limit },
    });
  }

  async getTopLosers(limit: number = 10): Promise<ApiResponse<TopMover[]>> {
    return apiClient.get('/analytics/market/losers', {
      params: { limit },
    });
  }

  async getMarketIndicators(): Promise<ApiResponse<MarketIndicator[]>> {
    return apiClient.get('/analytics/market/indicators');
  }

  // Advanced Analytics
  async getCorrelationMatrix(
    symbols: string[],
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<{ matrix: number[][]; symbols: string[] }>> {
    return apiClient.post('/analytics/correlation-matrix', {
      symbols,
      timeRange,
    });
  }

  async getMonteCarloSimulation(
    portfolioId: string,
    simulations: number = 10000,
    timeHorizon: number = 252 // trading days
  ): Promise<ApiResponse<{
    simulations: number[][];
    statistics: {
      mean: number;
      median: number;
      std: number;
      percentiles: number[];
    };
  }>> {
    return apiClient.post(`/analytics/portfolio/${portfolioId}/monte-carlo`, {
      simulations,
      timeHorizon,
    });
  }

  async getOptimizationSuggestions(
    portfolioId: string,
    riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ApiResponse<{
    suggestedAllocation: AssetAllocation[];
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
    reasoning: string;
  }>> {
    return apiClient.post(`/analytics/portfolio/${portfolioId}/optimize`, {
      riskTolerance,
    });
  }

  async getBacktestResults(
    strategyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ApiResponse<{
    returns: number[];
    cumulativeReturns: number[];
    drawdowns: number[];
    metrics: PerformanceMetrics;
    trades: Array<{
      date: string;
      action: 'buy' | 'sell';
      symbol: string;
      quantity: number;
      price: number;
      value: number;
    }>;
  }>> {
    return apiClient.get(`/analytics/strategies/${strategyId}/backtest`, {
      params: timeRange,
    });
  }

  // Reports
  async generateReport(config: ReportConfig): Promise<ApiResponse<GeneratedReport>> {
    return apiClient.post('/analytics/reports/generate', config);
  }

  async getReports(): Promise<ApiResponse<GeneratedReport[]>> {
    return apiClient.get('/analytics/reports');
  }

  async downloadReport(reportId: string): Promise<Blob> {
    const response = await fetch(`/api/analytics/reports/${reportId}/download`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  }

  async deleteReport(reportId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`/analytics/reports/${reportId}`);
  }

  // Real-time Analytics
  async getRealtimePortfolioMetrics(portfolioId: string): Promise<ApiResponse<{
    currentValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    unrealizedPnL: number;
    riskLevel: 'low' | 'medium' | 'high';
    alerts: string[];
  }>> {
    return apiClient.get(`/analytics/portfolio/${portfolioId}/realtime`);
  }

  async getRealtimeMarketSentiment(): Promise<ApiResponse<{
    sentiment: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    sources: string[];
    lastUpdated: string;
  }>> {
    return apiClient.get('/analytics/market/sentiment');
  }

  // Utility methods
  formatPercentage(value: number, decimals: number = 2): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }

  formatCurrency(value: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatLargeNumber(value: number): string {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'sideways':
        return 'minus';
      default:
        return 'activity';
    }
  }

  getSignalColor(signal: string): string {
    switch (signal) {
      case 'buy':
        return 'text-green-600';
      case 'sell':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.06): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    return stdDev !== 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  calculateMaxDrawdown(values: number[]): number {
    let maxDrawdown = 0;
    let peak = values[0];
    
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export class for custom instances
export { AnalyticsService };

// React hook for analytics service
export const useAnalyticsService = () => {
  return analyticsService;
};