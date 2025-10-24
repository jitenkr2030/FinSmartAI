import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Request Types
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// AI Model Types
export interface AIModelRequest {
  modelName: string;
  inputData: Record<string, any>;
  parameters?: Record<string, any>;
}

export interface AIModelResponse {
  prediction: any;
  confidence: number;
  processingTime: number;
  modelVersion: string;
  metadata?: Record<string, any>;
}

// Market Data Types
export interface MarketDataRequest {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface MarketDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// News Data Types
export interface NewsRequest {
  symbols?: string[];
  keywords?: string[];
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: number;
  relevance?: number;
}

// Portfolio Types
export interface PortfolioRequest {
  name: string;
  description?: string;
  holdings: Array<{
    symbol: string;
    quantity: number;
    avgPrice: number;
  }>;
}

export interface PortfolioAnalysis {
  totalValue: number;
  totalReturn: number;
  dailyReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  riskMetrics: Record<string, number>;
  holdings: Array<{
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    return: number;
    weight: number;
  }>;
}

// Subscription Types
export interface SubscriptionRequest {
  planId: string;
  paymentMethodId?: string;
}

export interface SubscriptionResponse {
  id: string;
  planId: string;
  status: string;
  startedAt: string;
  endsAt?: string;
  features: string[];
  usage: Record<string, number>;
}

class ApiClient {
  private instance: AxiosInstance;
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.instance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (!error.config?.skipErrorHandling) {
          this.handleError(error);
        }
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/auth/login';
          break;
        case 403:
          console.error('Access forbidden:', data.message);
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 500:
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API error:', data.message);
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Generic request methods
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.get(url, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.post(url, data, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.put(url, data, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.delete(url, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // AI Model Methods
  async predictModel(request: AIModelRequest): Promise<ApiResponse<AIModelResponse>> {
    return this.post<AIModelResponse>('/predict', request);
  }

  async getModelInfo(modelName: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/models/${modelName}`);
  }

  async getModels(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/models');
  }

  // Market Data Methods
  async getMarketData(request: MarketDataRequest): Promise<ApiResponse<MarketDataPoint[]>> {
    return this.get<MarketDataPoint[]>('/market/data', { params: request });
  }

  async getRealTimePrice(symbol: string): Promise<ApiResponse<number>> {
    return this.get<number>(`/market/price/${symbol}`);
  }

  // News Methods
  async getNews(request: NewsRequest): Promise<ApiResponse<NewsArticle[]>> {
    return this.get<NewsArticle[]>('/news', { params: request });
  }

  async summarizeNews(articleId: string): Promise<ApiResponse<string>> {
    return this.post<string>(`/news/${articleId}/summarize`);
  }

  // Portfolio Methods
  async createPortfolio(request: PortfolioRequest): Promise<ApiResponse<any>> {
    return this.post<any>('/portfolio', request);
  }

  async getPortfolio(portfolioId: string): Promise<ApiResponse<PortfolioAnalysis>> {
    return this.get<PortfolioAnalysis>(`/portfolio/${portfolioId}`);
  }

  async analyzePortfolio(portfolioId: string): Promise<ApiResponse<PortfolioAnalysis>> {
    return this.post<PortfolioAnalysis>(`/portfolio/${portfolioId}/analyze`);
  }

  // Subscription Methods
  async createSubscription(request: SubscriptionRequest): Promise<ApiResponse<SubscriptionResponse>> {
    return this.post<SubscriptionResponse>('/subscription', request);
  }

  async getSubscription(): Promise<ApiResponse<SubscriptionResponse>> {
    return this.get<SubscriptionResponse>('/subscription');
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/subscription/${subscriptionId}/cancel`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }

  // WebSocket connection for real-time data
  createWebSocketConnection(url: string = '/ws'): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${url}`;
    return new WebSocket(wsUrl);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// React hook for API client
export const useApiClient = () => {
  return apiClient;
};