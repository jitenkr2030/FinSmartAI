import { NextRequest, NextResponse } from 'next/server';
import { enhancedMonitoringService, monitoringMiddleware, logResponse } from '@/lib/services/enhancedMonitoringService';
import { logger } from '@/lib/services/monitoringService';

// Middleware configuration
interface MonitoringMiddlewareConfig {
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enablePerformanceTracking: boolean;
  enableSecurityMonitoring: boolean;
  enableBusinessMetrics: boolean;
  logRequestBody: boolean;
  logResponseBody: boolean;
  sampleRate: number;
  excludePaths: string[];
  excludeMethods: string[];
  sensitiveHeaders: string[];
  sensitivePaths: string[];
}

// Default configuration
const defaultConfig: MonitoringMiddlewareConfig = {
  enableRequestLogging: true,
  enableResponseLogging: true,
  enablePerformanceTracking: true,
  enableSecurityMonitoring: true,
  enableBusinessMetrics: true,
  logRequestBody: false,
  logResponseBody: false,
  sampleRate: 1.0,
  excludePaths: [
    '/_next/static',
    '/_next/image',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ],
  excludeMethods: ['OPTIONS', 'HEAD'],
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-csrf-token'
  ],
  sensitivePaths: [
    '/api/auth',
    '/api/user',
    '/api/payment'
  ]
};

// Enhanced monitoring middleware
export class MonitoringMiddleware {
  private config: MonitoringMiddlewareConfig;

  constructor(config?: Partial<MonitoringMiddlewareConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // Check if request should be excluded
      if (this.shouldExcludeRequest(req)) {
        return null;
      }

      // Apply enhanced monitoring middleware
      const monitoringResult = await monitoringMiddleware(req);
      if (monitoringResult) {
        return monitoringResult;
      }

      return null;
    } catch (error) {
      logger.error('Monitoring middleware error', { error });
      return null;
    }
  }

  // Check if request should be excluded from monitoring
  private shouldExcludeRequest(req: NextRequest): boolean {
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Check excluded paths
    if (this.config.excludePaths.some(excludedPath => path.startsWith(excludedPath))) {
      return true;
    }

    // Check excluded methods
    if (this.config.excludeMethods.includes(method)) {
      return true;
    }

    // Check sampling rate
    if (Math.random() > this.config.sampleRate) {
      return true;
    }

    return false;
  }

  // Wrap NextResponse to enable response logging
  static wrapResponse(response: NextResponse, req: NextRequest): NextResponse {
    // Log response asynchronously
    logResponse(req, response).catch(error => {
      logger.error('Failed to log response', { error });
    });

    return response;
  }

  // Get monitoring statistics
  getStatistics(): any {
    return {
      requestLogs: enhancedMonitoringService.getRequestLogs().length,
      businessMetrics: enhancedMonitoringService.getBusinessMetrics(),
      performanceMetrics: enhancedMonitoringService.getPerformanceMetrics(),
    };
  }

  // Get request logs with filtering
  getRequestLogs(filters?: {
    path?: string;
    method?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): any[] {
    const logs = enhancedMonitoringService.getRequestLogs(filters);
    
    if (filters?.limit) {
      return logs.slice(-filters.limit);
    }
    
    return logs;
  }

  // Get health status
  getHealthStatus(): any {
    const businessMetrics = enhancedMonitoringService.getBusinessMetrics();
    const performanceMetrics = enhancedMonitoringService.getPerformanceMetrics();
    
    const totalRequests = businessMetrics.apiCalls.total;
    const errorRate = totalRequests > 0 ? businessMetrics.apiCalls.failed / totalRequests : 0;
    
    // Get average response time
    const responseTimes = Object.values(performanceMetrics)
      .filter(metric => metric.average !== undefined)
      .map(metric => metric.average);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      status: errorRate < 0.05 && avgResponseTime < 5000 ? 'healthy' : 'degraded',
      metrics: {
        totalRequests,
        errorRate: errorRate * 100,
        avgResponseTime,
        activeUsers: businessMetrics.users.active,
        totalPredictions: businessMetrics.models.predictions,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const monitoringMiddlewareInstance = new MonitoringMiddleware();

// Export middleware function for Next.js
export async function middleware(req: NextRequest): Promise<NextResponse | null> {
  return await monitoringMiddlewareInstance.middleware(req);
}

// Export response wrapper
export { wrapResponse };