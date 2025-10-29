import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';
import winston from 'winston';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://your-sentry-dsn@example.com',
  environment: process.env.NODE_ENV || 'development',
  release: `finsmartai@${process.env.npm_package_version || '1.0.0'}`,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set beforeSend to filter out unwanted errors
  beforeSend(event) {
    // Filter out errors from localhost in development
    if (process.env.NODE_ENV === 'development' && 
        event.request && event.request.url && 
        event.request.url.includes('localhost')) {
      return null;
    }
    
    // Filter out specific error types that are not actionable
    if (event.request && event.request.headers && 
        event.request.headers['user-agent'] && 
        event.request.headers['user-agent'].includes('bot')) {
      return null;
    }
    
    return event;
  },
  
  // Integrations
  integrations: [
    new BrowserTracing(),
  ],
  
  // Performance monitoring
  tracesSampler: (samplingContext) => {
    // Sample based on the transaction name and context
    if (samplingContext.transactionContext.name === '/health') {
      return 0; // Don't sample health checks
    }
    
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'finsmartai-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add file transport for production only
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/production.log',
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 10,
  }));
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static timers: Map<string, number> = new Map();

  // Track API response times
  static trackApiCall(endpoint: string, duration: number) {
    const key = `api_${endpoint}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(duration);
    
    // Log slow API calls
    if (duration > 1000) {
      logger.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
    
    // Send to Sentry
    Sentry.captureMessage(`API Performance: ${endpoint}`, {
      level: 'info',
      tags: { endpoint, duration: duration.toString() },
      extra: { metrics: this.getMetrics(key) }
    });
  }

  // Start timing an operation
  static startTimer(name: string): string {
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, Date.now());
    return timerId;
  }

  // End timing an operation
  static endTimer(timerId: string, name?: string): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      logger.warn(`Timer not found: ${timerId}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(timerId);
    
    const operationName = name || timerId.split('_')[0];
    this.trackApiCall(operationName, duration);
    
    return duration;
  }

  // Get performance metrics
  static getMetrics(key: string) {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return null;
    
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }

  // Calculate percentile
  private static percentile(values: number[], p: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Get all metrics
  static getAllMetrics() {
    const result: any = {};
    this.metrics.forEach((_, key) => {
      result[key] = this.getMetrics(key);
    });
    return result;
  }

  // Clear old metrics
  static clearOldMetrics(maxAge: number = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;
    this.metrics.forEach((values, key) => {
      // Keep only recent metrics
      // This is a simplified version - in production you'd want to track timestamps
      if (values.length > 1000) {
        this.metrics.set(key, values.slice(-1000));
      }
    });
  }
}

// Error tracking utilities
export class ErrorTracker {
  // Track error with context
  static trackError(error: Error, context: any = {}) {
    logger.error('Error tracked:', {
      error: error.message,
      stack: error.stack,
      context,
    });
    
    // Send to Sentry
    Sentry.captureException(error, {
      extra: context,
      tags: {
        source: 'error-tracker',
        ...context.tags,
      },
    });
  }

  // Track API error
  static trackApiError(endpoint: string, error: any, statusCode: number) {
    const context = {
      endpoint,
      statusCode,
      method: error.config?.method || 'unknown',
      url: error.config?.url || 'unknown',
      userAgent: error.config?.headers?.['user-agent'] || 'unknown',
    };

    logger.error('API Error:', {
      endpoint,
      statusCode,
      error: error.message,
      context,
    });

    Sentry.captureMessage(`API Error: ${endpoint}`, {
      level: 'error',
      tags: {
        endpoint,
        statusCode: statusCode.toString(),
        source: 'api-error',
      },
      extra: context,
    });
  }

  // Track user action error
  static trackUserError(action: string, error: Error, userInfo: any = {}) {
    const context = {
      action,
      userInfo,
      timestamp: new Date().toISOString(),
    };

    logger.error('User Action Error:', {
      action,
      error: error.message,
      context,
    });

    Sentry.captureException(error, {
      extra: context,
      tags: {
        action,
        source: 'user-action',
      },
      user: userInfo,
    });
  }

  // Track performance warning
  static trackPerformanceWarning(operation: string, duration: number, threshold: number) {
    const context = {
      operation,
      duration,
      threshold,
      severity: duration > threshold * 2 ? 'high' : 'medium',
    };

    logger.warn('Performance Warning:', context);

    Sentry.captureMessage(`Performance Warning: ${operation}`, {
      level: 'warning',
      tags: {
        operation,
        source: 'performance-warning',
      },
      extra: context,
    });
  }
}

// Health check utilities
export class HealthChecker {
  private static checks: Map<string, () => Promise<boolean>> = new Map();

  // Register health check
  static register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check);
  }

  // Run all health checks
  static async runChecks(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
    uptime: number;
  }> {
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
        if (!results[name]) {
          allHealthy = false;
        }
      } catch (error) {
        logger.error(`Health check failed for ${name}:`, error);
        results[name] = false;
        allHealthy = false;
      }
    }

    const healthyCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    const status = allHealthy ? 'healthy' : 
                   healthyCount > 0 ? 'degraded' : 'unhealthy';

    return {
      status,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  // Default health checks
  static initializeDefaultChecks() {
    // Database health check
    this.register('database', async () => {
      try {
        // This would check database connectivity
        // For now, just return true
        return true;
      } catch {
        return false;
      }
    });

    // External API health check
    this.register('external-apis', async () => {
      try {
        // This would check external API connectivity
        // For now, just return true
        return true;
      } catch {
        return false;
      }
    });

    // Memory usage check
    this.register('memory', async () => {
      const used = process.memoryUsage();
      const os = await import('os');
      const total = os.totalmem();
      const percentage = (used.heapUsed / total) * 100;
      return percentage < 90; // Alert if using more than 90% of memory
    });

    // Disk space check
    this.register('disk', async () => {
      // This would check disk space
      // For now, just return true
      return true;
    });
  }
}

// Initialize default health checks
HealthChecker.initializeDefaultChecks();

// Periodic metrics cleanup
setInterval(() => {
  PerformanceMonitor.clearOldMetrics();
}, 300000); // Clean up every 5 minutes

// Export utilities
export { logger };
export { Sentry };

// Middleware for Express/Next.js API routes
export const monitoringMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const timerId = PerformanceMonitor.startTimer(req.path);
  
  // Track request
  logger.info('API Request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Override res.end to track response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = PerformanceMonitor.endTimer(timerId, req.path);
    const statusCode = res.statusCode;
    
    // Track performance
    PerformanceMonitor.trackApiCall(req.path, duration);
    
    // Track errors
    if (statusCode >= 400) {
      ErrorTracker.trackApiError(req.path, {
        message: `HTTP ${statusCode}`,
        stack: new Error().stack,
      }, statusCode);
    }
    
    // Log response
    logger.info('API Response:', {
      method: req.method,
      path: req.path,
      statusCode,
      duration,
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};