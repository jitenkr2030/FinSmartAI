import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';
import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

// Log entry interface
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// Logger configuration interface
export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text' | 'combined';
  transports: {
    console: {
      enabled: boolean;
      level: LogLevel;
      colorize: boolean;
    };
    file: {
      enabled: boolean;
      level: LogLevel;
      filename: string;
      maxSize: string;
      maxFiles: number;
      datePattern?: string;
    };
    database: {
      enabled: boolean;
      level: LogLevel;
      retentionDays: number;
    };
  };
  filters: {
    excludePaths: string[];
    excludeHeaders: string[];
    sensitiveFields: string[];
  };
  sampling: {
    enabled: boolean;
    rate: number;
    sampleKey?: string;
  };
}

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  requestId: string;
  metadata?: Record<string, any>;
}

export class AdvancedLogger {
  private winston: winston.Logger;
  private config: LoggerConfig;
  private auditLogBuffer: AuditLogEntry[] = [];
  private requestContext = new Map<string, any>();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = this.mergeConfig(this.config, config);
    }

    this.winston = this.createWinstonLogger();
    this.initialize();
  }

  private getDefaultConfig(): LoggerConfig {
    return {
      level: LogLevel.INFO,
      format: 'json',
      transports: {
        console: {
          enabled: true,
          level: LogLevel.INFO,
          colorize: true
        },
        file: {
          enabled: true,
          level: LogLevel.DEBUG,
          filename: 'logs/app.log',
          maxSize: '20m',
          maxFiles: 14,
          datePattern: 'YYYY-MM-DD'
        },
        database: {
          enabled: true,
          level: LogLevel.INFO,
          retentionDays: 90
        }
      },
      filters: {
        excludePaths: ['/health', '/metrics'],
        excludeHeaders: ['authorization', 'cookie'],
        sensitiveFields: ['password', 'token', 'key', 'secret', 'credit_card']
      },
      sampling: {
        enabled: true,
        rate: 0.1,
        sampleKey: 'requestId'
      }
    };
  }

  private mergeConfig(base: LoggerConfig, override: Partial<LoggerConfig>): LoggerConfig {
    return {
      ...base,
      ...override,
      transports: {
        ...base.transports,
        ...override.transports,
        console: { ...base.transports.console, ...override.transports?.console },
        file: { ...base.transports.file, ...override.transports?.file },
        database: { ...base.transports.database, ...override.transports?.database }
      },
      filters: {
        ...base.filters,
        ...override.filters,
        excludePaths: [...base.filters.excludePaths, ...(override.filters?.excludePaths || [])],
        excludeHeaders: [...base.filters.excludeHeaders, ...(override.filters?.excludeHeaders || [])],
        sensitiveFields: [...base.filters.sensitiveFields, ...(override.filters?.sensitiveFields || [])]
      },
      sampling: {
        ...base.sampling,
        ...override.sampling
      }
    };
  }

  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.transports.console.enabled) {
      transports.push(new winston.transports.Console({
        level: this.config.transports.console.level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
          this.config.transports.console.colorize ? winston.format.colorize() : winston.format.uncolorize()
        )
      }));
    }

    // File transport
    if (this.config.transports.file.enabled) {
      const logDir = path.dirname(this.config.transports.file.filename);
      fs.mkdir(logDir, { recursive: true }).catch(() => {});

      transports.push(new winston.transports.File({
        level: this.config.transports.file.level,
        filename: this.config.transports.file.filename,
        maxsize: this.parseSize(this.config.transports.file.maxSize),
        maxFiles: this.config.transports.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      }));
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false,
      rejectionHandlers: [
        (error) => {
          this.error('Unhandled promise rejection', { error });
        }
      ],
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ]
    });
  }

  private async initialize(): Promise<void> {
    // Create log directories
    try {
      await fs.mkdir('logs', { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }

    // Setup process event handlers
    process.on('uncaughtException', (error) => {
      this.error('Uncaught exception', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error('Unhandled rejection', { reason, promise });
    });

    // Start audit log flush interval
    setInterval(() => this.flushAuditLogs(), 5000); // Flush every 5 seconds
  }

  // Main logging methods
  log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta: this.sanitizeMeta(meta),
      ...this.getCurrentContext()
    };

    // Apply sampling if enabled
    if (this.config.sampling.enabled && this.shouldSample(entry)) {
      return;
    }

    // Apply filters
    if (this.shouldFilter(entry)) {
      return;
    }

    this.winston.log(level, message, entry);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  verbose(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.VERBOSE, message, meta);
  }

  // HTTP request logging
  logRequest(req: NextRequest, res: Response, responseTime: number): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: this.getLogLevelFromStatus(res.status),
      message: `${req.method} ${req.nextUrl.pathname}`,
      meta: {
        statusCode: res.status,
        responseTime,
        contentLength: res.headers.get('content-length'),
        contentType: res.headers.get('content-type')
      },
      ...this.extractRequestInfo(req)
    };

    this.log(entry.level, entry.message, entry.meta);
  }

  // Audit logging
  audit(action: string, resource: string, details: Record<string, any>, result: 'success' | 'failure' | 'partial' = 'success'): void {
    const context = this.getCurrentContext();
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId: context.userId || 'anonymous',
      action,
      resource,
      details: this.sensitiveDataFilter(details),
      result,
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
      sessionId: context.sessionId || 'unknown',
      requestId: context.requestId || this.generateRequestId(),
      metadata: context.meta
    };

    this.auditLogBuffer.push(auditEntry);

    // Log to winston as well
    this.info(`AUDIT: ${action} on ${resource}`, {
      audit: auditEntry,
      result
    });
  }

  // Context management
  setRequestContext(requestId: string, context: Record<string, any>): void {
    this.requestContext.set(requestId, context);
  }

  clearRequestContext(requestId: string): void {
    this.requestContext.delete(requestId);
  }

  private getCurrentContext(): Record<string, any> {
    // In a real implementation, this would get context from async storage
    // For now, return empty context
    return {};
  }

  // Query and search methods
  async queryLogs(filters: {
    level?: LogLevel;
    startTime?: Date;
    endTime?: Date;
    userId?: string;
    path?: string;
    limit?: number;
    offset?: number;
  }): Promise<LogEntry[]> {
    // This would query logs from database or files
    // For now, return empty array
    return [];
  }

  async queryAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: Date;
    endTime?: Date;
    result?: 'success' | 'failure' | 'partial';
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    // This would query audit logs from database
    // For now, return empty array
    return [];
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    recentErrors: LogEntry[];
    auditStats: {
      totalAudits: number;
      auditsByAction: Record<string, number>;
      successRate: number;
    };
  }> {
    // This would calculate statistics from stored logs
    return {
      totalLogs: 0,
      logsByLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.DEBUG]: 0,
        [LogLevel.VERBOSE]: 0
      },
      recentErrors: [],
      auditStats: {
        totalAudits: 0,
        auditsByAction: {},
        successRate: 0
      }
    };
  }

  // Export methods
  async exportLogs(filters: {
    startTime?: Date;
    endTime?: Date;
    level?: LogLevel;
    format: 'json' | 'csv';
  }): Promise<string> {
    // This would export logs in the specified format
    return '';
  }

  async exportAuditLogs(filters: {
    startTime?: Date;
    endTime?: Date;
    userId?: string;
    format: 'json' | 'csv';
  }): Promise<string> {
    // This would export audit logs in the specified format
    return '';
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    // Clean old logs based on retention policy
    if (this.config.transports.file.enabled) {
      await this.cleanupOldFiles();
    }

    if (this.config.transports.database.enabled) {
      await this.cleanupOldDatabaseLogs();
    }
  }

  // Private helper methods
  private parseSize(size: string): number {
    const units = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+)([kmg]?)b?$/);
    if (!match) return 1024 * 1024; // Default to 1MB
    return parseInt(match[1]) * units[match[2] as keyof typeof units] * units.b;
  }

  private sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta) return undefined;
    return this.sensitiveDataFilter(meta);
  }

  private sensitiveDataFilter(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (this.config.filters.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sensitiveDataFilter(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private shouldSample(entry: LogEntry): boolean {
    if (!this.config.sampling.enabled) return false;
    
    const sampleKey = this.config.sampling.sampleKey || 'requestId';
    const keyValue = entry[sampleKey as keyof LogEntry];
    
    if (!keyValue) return false;
    
    // Simple hash-based sampling
    const hash = this.simpleHash(String(keyValue));
    return (hash % 100) >= (this.config.sampling.rate * 100);
  }

  private shouldFilter(entry: LogEntry): boolean {
    // Filter by path
    if (entry.path && this.config.filters.excludePaths.includes(entry.path)) {
      return true;
    }

    // Filter by level
    if (entry.level === LogLevel.DEBUG && this.config.level !== LogLevel.DEBUG) {
      return true;
    }

    return false;
  }

  private extractRequestInfo(req: NextRequest): Record<string, any> {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (!this.config.filters.excludeHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    return {
      requestId: this.generateRequestId(),
      path: req.nextUrl.pathname,
      method: req.method,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      headers
    };
  }

  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
  }

  private getLogLevelFromStatus(status: number): LogLevel {
    if (status >= 500) return LogLevel.ERROR;
    if (status >= 400) return LogLevel.WARN;
    if (status >= 300) return LogLevel.INFO;
    return LogLevel.DEBUG;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async flushAuditLogs(): Promise<void> {
    if (this.auditLogBuffer.length === 0) return;

    const logsToFlush = [...this.auditLogBuffer];
    this.auditLogBuffer = [];

    try {
      // This would save audit logs to database
      // For now, just log to winston
      for (const log of logsToFlush) {
        this.winston.info('Audit log flushed', { audit: log });
      }
    } catch (error) {
      this.error('Failed to flush audit logs', { error });
      // Re-add failed logs to buffer
      this.auditLogBuffer.unshift(...logsToFlush);
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    // This would clean up old log files based on retention policy
  }

  private async cleanupOldDatabaseLogs(): Promise<void> {
    // This would clean up old database logs based on retention policy
  }
}

// Export singleton instance
export const advancedLogger = new AdvancedLogger();