import { NextRequest, NextResponse } from 'next/server';
import { logger, PerformanceMonitor, ErrorTracker } from '@/lib/services/monitoringService';
import { securityConfig } from '@/lib/config/securityConfig';

// Request/Response logging interface
interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  userAgent: string;
  ip: string;
  userId?: string;
  sessionId?: string;
  requestBody?: any;
  requestSize: number;
  responseStatus: number;
  responseSize: number;
  responseTime: number;
  responseBody?: any;
  error?: string;
  stackTrace?: string;
  securityFlags: {
    isSuspicious: boolean;
    threatScore: number;
    rateLimited: boolean;
    authenticated: boolean;
    authorized: boolean;
  };
  performance: {
    cpuTime?: number;
    memoryUsage?: number;
    databaseTime?: number;
    externalApiTime?: number;
  };
  metadata: {
    environment: string;
    version: string;
    requestId: string;
    traceId: string;
    spanId: string;
  };
}

// Monitoring configuration interface
interface MonitoringConfig {
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enablePerformanceTracking: boolean;
  enableSecurityMonitoring: boolean;
  enableErrorTracking: boolean;
  enableBusinessMetrics: boolean;
  logRequestBody: boolean;
  logResponseBody: boolean;
  logSensitiveHeaders: boolean;
  sensitiveHeaders: string[];
  sensitivePaths: string[];
  sampleRate: number;
  maxLogSize: number;
  retentionPeriod: number;
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
  };
}

// Business metrics interface
interface BusinessMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    byEndpoint: Record<string, { total: number; successful: number; failed: number }>;
  };
  users: {
    active: number;
    new: number;
    returning: number;
  };
  models: {
    predictions: number;
    accuracy: number;
    byModel: Record<string, { predictions: number; accuracy: number }>;
  };
  revenue: {
    total: number;
    bySubscription: Record<string, number>;
  };
}

// Enhanced monitoring service
export class EnhancedMonitoringService {
  private config: MonitoringConfig;
  private requestLogs: RequestLog[] = [];
  private businessMetrics: BusinessMetrics;
  private alertManager: AlertManager;
  private metricsCollector: MetricsCollector;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enableRequestLogging: true,
      enableResponseLogging: true,
      enablePerformanceTracking: true,
      enableSecurityMonitoring: true,
      enableErrorTracking: true,
      enableBusinessMetrics: true,
      logRequestBody: false,
      logResponseBody: false,
      logSensitiveHeaders: false,
      sensitiveHeaders: ['authorization', 'cookie', 'set-cookie', 'x-api-key'],
      sensitivePaths: ['/api/auth', '/api/user'],
      sampleRate: 1.0,
      maxLogSize: 10000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      enableRealTimeAlerts: true,
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        throughput: 1000, // 1000 requests per minute
        memoryUsage: 0.9, // 90%
      },
      ...config
    };

    this.businessMetrics = this.initializeBusinessMetrics();
    this.alertManager = new AlertManager(this.config);
    this.metricsCollector = new MetricsCollector();

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // Log incoming request
  async logRequest(req: NextRequest): Promise<RequestLog | null> {
    if (!this.config.enableRequestLogging) {
      return null;
    }

    // Check sampling rate
    if (Math.random() > this.config.sampleRate) {
      return null;
    }

    try {
      const requestId = this.generateRequestId();
      const traceId = this.generateTraceId();
      const spanId = this.generateSpanId();

      // Parse query parameters
      const query: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((value, key) => {
        query[key] = value;
      });

      // Parse headers
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        if (!this.config.sensitiveHeaders.includes(key.toLowerCase()) || this.config.logSensitiveHeaders) {
          headers[key] = value;
        }
      });

      // Parse body if enabled and not sensitive path
      let requestBody: any = undefined;
      let requestSize = 0;

      if (this.config.logRequestBody && !this.isSensitivePath(req.nextUrl.pathname)) {
        try {
          const bodyText = await req.text();
          requestSize = bodyText.length;
          
          if (bodyText) {
            try {
              requestBody = JSON.parse(bodyText);
            } catch {
              requestBody = bodyText;
            }
          }
        } catch (error) {
          logger.warn('Failed to parse request body', { error, requestId });
        }
      }

      const requestLog: RequestLog = {
        id: requestId,
        timestamp: Date.now(),
        method: req.method,
        url: req.url,
        path: req.nextUrl.pathname,
        query,
        headers,
        userAgent: req.headers.get('user-agent') || 'unknown',
        ip: this.getClientIP(req),
        requestBody,
        requestSize,
        responseStatus: 0,
        responseSize: 0,
        responseTime: 0,
        securityFlags: {
          isSuspicious: false,
          threatScore: 0,
          rateLimited: false,
          authenticated: false,
          authorized: false,
        },
        performance: {},
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          requestId,
          traceId,
          spanId,
        },
      };

      // Add to request logs
      this.requestLogs.push(requestLog);

      // Store request context for response logging
      req.headers.set('x-request-id', requestId);
      req.headers.set('x-trace-id', traceId);
      req.headers.set('x-span-id', spanId);

      return requestLog;
    } catch (error) {
      logger.error('Failed to log request', { error });
      return null;
    }
  }

  // Log outgoing response
  async logResponse(req: NextRequest, response: NextResponse, requestLog?: RequestLog): Promise<void> {
    if (!this.config.enableResponseLogging || !requestLog) {
      return;
    }

    try {
      const startTime = requestLog.timestamp;
      const responseTime = Date.now() - startTime;

      // Parse response body if enabled
      let responseBody: any = undefined;
      let responseSize = 0;

      if (this.config.logResponseBody && !this.isSensitivePath(req.nextUrl.pathname)) {
        try {
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          responseSize = responseText.length;
          
          if (responseText) {
            try {
              responseBody = JSON.parse(responseText);
            } catch {
              responseBody = responseText;
            }
          }
        } catch (error) {
          logger.warn('Failed to parse response body', { error, requestId: requestLog.id });
        }
      }

      // Update request log with response data
      const updatedLog: RequestLog = {
        ...requestLog,
        responseStatus: response.status,
        responseSize,
        responseTime,
        responseBody,
        performance: {
          ...requestLog.performance,
          cpuTime: this.getCPUTime(),
          memoryUsage: this.getMemoryUsage(),
        },
      };

      // Update the request log
      const index = this.requestLogs.findIndex(log => log.id === requestLog.id);
      if (index !== -1) {
        this.requestLogs[index] = updatedLog;
      }

      // Track performance metrics
      if (this.config.enablePerformanceTracking) {
        this.trackPerformanceMetrics(updatedLog);
      }

      // Track business metrics
      if (this.config.enableBusinessMetrics) {
        this.trackBusinessMetrics(updatedLog);
      }

      // Check for alerts
      if (this.config.enableRealTimeAlerts) {
        this.checkAlerts(updatedLog);
      }

      // Log the complete request/response
      this.logCompleteRequest(updatedLog);
    } catch (error) {
      logger.error('Failed to log response', { error, requestId: requestLog?.id });
    }
  }

  // Track performance metrics
  private trackPerformanceMetrics(log: RequestLog): void {
    // Track API response time
    PerformanceMonitor.trackApiCall(log.path, log.responseTime);

    // Track memory usage
    if (log.performance.memoryUsage) {
      this.metricsCollector.record('memory_usage', log.performance.memoryUsage);
    }

    // Track response times by endpoint
    this.metricsCollector.record('response_time', log.responseTime, {
      endpoint: log.path,
      method: log.method,
      status: log.responseStatus.toString(),
    });

    // Track request throughput
    this.metricsCollector.increment('request_count', {
      endpoint: log.path,
      method: log.method,
      status: log.responseStatus.toString(),
    });
  }

  // Track business metrics
  private trackBusinessMetrics(log: RequestLog): void {
    // Update API call metrics
    this.businessMetrics.apiCalls.total++;
    
    if (log.responseStatus >= 200 && log.responseStatus < 400) {
      this.businessMetrics.apiCalls.successful++;
    } else {
      this.businessMetrics.apiCalls.failed++;
    }

    // Update endpoint-specific metrics
    const endpointKey = log.path;
    if (!this.businessMetrics.apiCalls.byEndpoint[endpointKey]) {
      this.businessMetrics.apiCalls.byEndpoint[endpointKey] = {
        total: 0,
        successful: 0,
        failed: 0,
      };
    }

    this.businessMetrics.apiCalls.byEndpoint[endpointKey].total++;
    if (log.responseStatus >= 200 && log.responseStatus < 400) {
      this.businessMetrics.apiCalls.byEndpoint[endpointKey].successful++;
    } else {
      this.businessMetrics.apiCalls.byEndpoint[endpointKey].failed++;
    }

    // Track model-specific metrics
    if (log.path.startsWith('/api/') && log.requestBody?.model) {
      const modelName = log.requestBody.model;
      if (!this.businessMetrics.models.byModel[modelName]) {
        this.businessMetrics.models.byModel[modelName] = {
          predictions: 0,
          accuracy: 0,
        };
      }
      this.businessMetrics.models.byModel[modelName].predictions++;
      this.businessMetrics.models.predictions++;
    }
  }

  // Check for alert conditions
  private checkAlerts(log: RequestLog): void {
    // Check response time threshold
    if (log.responseTime > this.config.alertThresholds.responseTime) {
      this.alertManager.triggerAlert({
        type: 'slow_response',
        severity: 'warning',
        message: `Slow response detected: ${log.path} took ${log.responseTime}ms`,
        data: {
          path: log.path,
          responseTime: log.responseTime,
          threshold: this.config.alertThresholds.responseTime,
        },
      });
    }

    // Check error rate threshold
    const errorRate = this.businessMetrics.apiCalls.failed / this.businessMetrics.apiCalls.total;
    if (errorRate > this.config.alertThresholds.errorRate && this.businessMetrics.apiCalls.total > 100) {
      this.alertManager.triggerAlert({
        type: 'high_error_rate',
        severity: 'critical',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        data: {
          errorRate,
          threshold: this.config.alertThresholds.errorRate,
          totalRequests: this.businessMetrics.apiCalls.total,
          failedRequests: this.businessMetrics.apiCalls.failed,
        },
      });
    }

    // Check memory usage threshold
    if (log.performance.memoryUsage && log.performance.memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.alertManager.triggerAlert({
        type: 'high_memory_usage',
        severity: 'warning',
        message: `High memory usage detected: ${(log.performance.memoryUsage * 100).toFixed(2)}%`,
        data: {
          memoryUsage: log.performance.memoryUsage,
          threshold: this.config.alertThresholds.memoryUsage,
        },
      });
    }
  }

  // Log complete request/response
  private logCompleteRequest(log: RequestLog): void {
    // Sanitize log data
    const sanitizedLog = this.sanitizeLog(log);

    // Log to Winston
    logger.info('API Request/Response', {
      requestId: log.id,
      method: log.method,
      path: log.path,
      status: log.responseStatus,
      responseTime: log.responseTime,
      ip: log.ip,
      userAgent: log.userAgent,
    });

    // Track error if present
    if (log.responseStatus >= 400) {
      ErrorTracker.trackApiError(log.path, {
        message: `HTTP ${log.responseStatus}`,
        stack: log.stackTrace,
      }, log.responseStatus);
    }
  }

  // Sanitize log data for security
  private sanitizeLog(log: RequestLog): Partial<RequestLog> {
    const sanitized = { ...log };

    // Remove sensitive data
    if (sanitized.requestBody) {
      sanitized.requestBody = this.sanitizeData(sanitized.requestBody);
    }

    if (sanitized.responseBody) {
      sanitized.responseBody = this.sanitizeData(sanitized.responseBody);
    }

    // Remove sensitive headers
    if (sanitized.headers) {
      sanitized.headers = this.sanitizeHeaders(sanitized.headers);
    }

    return sanitized;
  }

  // Sanitize data by removing sensitive fields
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'creditcard'];
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Sanitize headers
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (this.config.sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Check if path is sensitive
  private isSensitivePath(path: string): boolean {
    return this.config.sensitivePaths.some(sensitivePath => 
      path.startsWith(sensitivePath)
    );
  }

  // Get client IP address
  private getClientIP(req: NextRequest): string {
    return req.ip || 
           req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
  }

  // Get CPU time (simplified)
  private getCPUTime(): number {
    return process.cpuUsage().user / 1000000; // Convert to seconds
  }

  // Get memory usage
  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    return used.heapUsed / total;
  }

  // Generate request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate trace ID
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate span ID
  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize business metrics
  private initializeBusinessMetrics(): BusinessMetrics {
    return {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
      },
      users: {
        active: 0,
        new: 0,
        returning: 0,
      },
      models: {
        predictions: 0,
        accuracy: 0,
        byModel: {},
      },
      revenue: {
        total: 0,
        bySubscription: {},
      },
    };
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000); // Clean up every hour
  }

  // Clean up old logs
  private cleanupOldLogs(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.requestLogs = this.requestLogs.filter(log => log.timestamp > cutoff);

    // Keep log size manageable
    if (this.requestLogs.length > this.config.maxLogSize) {
      this.requestLogs = this.requestLogs.slice(-this.config.maxLogSize);
    }
  }

  // Get request logs
  getRequestLogs(filters?: {
    path?: string;
    method?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
  }): RequestLog[] {
    let filteredLogs = [...this.requestLogs];

    if (filters) {
      if (filters.path) {
        filteredLogs = filteredLogs.filter(log => log.path === filters.path);
      }
      if (filters.method) {
        filteredLogs = filteredLogs.filter(log => log.method === filters.method);
      }
      if (filters.status) {
        filteredLogs = filteredLogs.filter(log => log.responseStatus === filters.status);
      }
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }
    }

    return filteredLogs;
  }

  // Get business metrics
  getBusinessMetrics(): BusinessMetrics {
    return { ...this.businessMetrics };
  }

  // Get performance metrics
  getPerformanceMetrics(): any {
    return this.metricsCollector.getMetrics();
  }
}

// Alert manager
class AlertManager {
  private config: MonitoringConfig;
  private alerts: any[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  triggerAlert(alert: {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    data: any;
  }): void {
    const alertWithTimestamp = {
      ...alert,
      timestamp: Date.now(),
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.alerts.push(alertWithTimestamp);

    // Log alert
    logger.warn('Alert triggered', alertWithTimestamp);

    // Send to external monitoring if configured
    if (this.config.enableRealTimeAlerts) {
      this.sendAlert(alertWithTimestamp);
    }
  }

  private sendAlert(alert: any): void {
    // Send to Sentry
    try {
      const { Sentry } = require('@/lib/services/monitoringService');
      Sentry.captureMessage(alert.message, {
        level: alert.severity,
        tags: {
          alert_type: alert.type,
          alert_severity: alert.severity,
        },
        extra: alert.data,
      });
    } catch (error) {
      logger.error('Failed to send alert to Sentry', { error });
    }

    // Send to webhook if configured
    if (securityConfig.logging.alertWebhook) {
      this.sendWebhook(alert);
    }
  }

  private async sendWebhook(alert: any): Promise<void> {
    try {
      const response = await fetch(securityConfig.logging.alertWebhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        logger.error('Failed to send webhook alert', {
          status: response.status,
          alert,
        });
      }
    } catch (error) {
      logger.error('Failed to send webhook alert', { error, alert });
    }
  }

  getAlerts(): any[] {
    return [...this.alerts];
  }
}

// Metrics collector
class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();
  private counters: Map<string, number> = new Map();

  record(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push({
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  increment(name: string, tags?: Record<string, string>, value: number = 1): void {
    const key = this.getMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  getMetrics(): any {
    const result: any = {};

    // Get recorded metrics
    this.metrics.forEach((values, key) => {
      result[key] = {
        count: values.length,
        average: values.reduce((sum, v) => sum + v.value, 0) / values.length,
        min: Math.min(...values.map(v => v.value)),
        max: Math.max(...values.map(v => v.value)),
        latest: values[values.length - 1],
      };
    });

    // Get counters
    this.counters.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagString}}`;
  }
}

// Export singleton instance
export const enhancedMonitoringService = new EnhancedMonitoringService();

// Middleware for Next.js API routes
export async function monitoringMiddleware(req: NextRequest): Promise<NextResponse | null> {
  try {
    // Log request
    const requestLog = await enhancedMonitoringService.logRequest(req);
    
    // Store request log in headers for response logging
    if (requestLog) {
      req.headers.set('x-request-log-id', requestLog.id);
    }

    return null; // Allow request to proceed
  } catch (error) {
    logger.error('Monitoring middleware error', { error });
    return null; // Allow request to proceed even if monitoring fails
  }
}

// Response wrapper for logging responses
export async function logResponse(req: NextRequest, response: NextResponse): Promise<void> {
  try {
    const requestLogId = req.headers.get('x-request-log-id');
    if (requestLogId) {
      const requestLog = enhancedMonitoringService.getRequestLogs().find(log => log.id === requestLogId);
      if (requestLog) {
        await enhancedMonitoringService.logResponse(req, response, requestLog);
      }
    }
  } catch (error) {
    logger.error('Failed to log response', { error });
  }
}