import { advancedLogger, LogLevel, LogEntry } from '@/lib/services/advancedLogger';
import { auditTrailService, ExtendedAuditLogEntry } from '@/lib/services/auditTrailService';
import fs from 'fs/promises';
import path from 'path';

// Log management configuration
export interface LogManagementConfig {
  retention: {
    applicationLogs: number; // days
    auditLogs: number; // days
    errorLogs: number; // days
    accessLogs: number; // days
  };
  rotation: {
    enabled: boolean;
    maxSize: string; // e.g., '100MB'
    maxFiles: number;
    compress: boolean;
    datePattern: string; // e.g., 'YYYY-MM-DD'
  };
  archiving: {
    enabled: boolean;
    archiveInterval: string; // e.g., '1d', '1w', '1m'
    archiveFormat: 'zip' | 'tar.gz';
    archiveDestination: 'local' | 's3' | 'gcs';
    compressionLevel: number;
  };
  indexing: {
    enabled: boolean;
    indexInterval: string; // e.g., '1h'
    searchEngine: 'elasticsearch' | 'algolia' | 'custom';
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      errorRate: number; // percentage
      logVolume: number; // MB per hour
      diskUsage: number; // percentage
    };
  };
}

// Log statistics
export interface LogStatistics {
  totalLogs: number;
  totalSize: number;
  logsByLevel: Record<LogLevel, number>;
  logsByService: Record<string, number>;
  errorRate: number;
  averageResponseTime: number;
  topErrors: Array<{
    error: string;
    count: number;
    lastOccurrence: Date;
  }>;
  diskUsage: {
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
  };
  retentionStatus: {
    logsToCleanup: number;
    spaceToReclaim: number;
    nextCleanup: Date;
  };
}

// Log export options
export interface LogExportOptions {
  format: 'json' | 'csv' | 'xml' | 'txt';
  compression: boolean;
  includeSensitiveData: boolean;
  filters: {
    level?: LogLevel[];
    service?: string[];
    startTime?: Date;
    endTime?: Date;
    userId?: string[];
    statusCode?: number[];
  };
}

// Log search options
export interface LogSearchOptions {
  query: string;
  filters: {
    level?: LogLevel[];
    service?: string[];
    startTime?: Date;
    endTime?: Date;
    userId?: string[];
    path?: string[];
    statusCode?: number[];
  };
  pagination: {
    page: number;
    limit: number;
  };
  sortBy: 'timestamp' | 'level' | 'service' | 'duration';
  sortOrder: 'asc' | 'desc';
}

// Log search result
export interface LogSearchResult {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchTime: number;
  facets: {
    levels: Record<LogLevel, number>;
    services: Record<string, number>;
    statusCodes: Record<number, number>;
    timeRange: {
      min: Date;
      max: Date;
    };
  };
}

export class LogManagementService {
  private config: LogManagementConfig;
  private logIndex: Map<string, LogEntry[]> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();
  private statisticsCache: LogStatistics | null = null;
  private lastStatisticsUpdate: Date | null = null;

  constructor(config?: Partial<LogManagementConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = this.mergeConfig(this.config, config);
    }

    this.initialize();
  }

  private getDefaultConfig(): LogManagementConfig {
    return {
      retention: {
        applicationLogs: 30,
        auditLogs: 365,
        errorLogs: 90,
        accessLogs: 7
      },
      rotation: {
        enabled: true,
        maxSize: '100MB',
        maxFiles: 10,
        compress: true,
        datePattern: 'YYYY-MM-DD'
      },
      archiving: {
        enabled: true,
        archiveInterval: '1w',
        archiveFormat: 'tar.gz',
        archiveDestination: 'local',
        compressionLevel: 6
      },
      indexing: {
        enabled: true,
        indexInterval: '1h',
        searchEngine: 'custom'
      },
      monitoring: {
        enabled: true,
        alertThresholds: {
          errorRate: 5, // 5%
          logVolume: 1000, // 1000 MB per hour
          diskUsage: 80 // 80%
        }
      }
    };
  }

  private mergeConfig(base: LogManagementConfig, override: Partial<LogManagementConfig>): LogManagementConfig {
    return {
      ...base,
      ...override,
      retention: { ...base.retention, ...override.retention },
      rotation: { ...base.rotation, ...override.rotation },
      archiving: { ...base.archiving, ...override.archiving },
      indexing: { ...base.indexing, ...override.indexing },
      monitoring: { ...base.monitoring, ...override.monitoring }
    };
  }

  private async initialize(): Promise<void> {
    try {
      // Create log directories
      await this.createLogDirectories();

      // Initialize indexing
      if (this.config.indexing.enabled) {
        await this.initializeIndexing();
      }

      // Start background tasks
      this.startBackgroundTasks();

      // Load existing logs into index
      await this.loadExistingLogs();

      advancedLogger.info('Log management service initialized', {
        config: {
          retention: this.config.retention,
          rotation: this.config.rotation.enabled,
          archiving: this.config.archiving.enabled,
          indexing: this.config.indexing.enabled,
          monitoring: this.config.monitoring.enabled
        }
      });
    } catch (error) {
      advancedLogger.error('Failed to initialize log management service:', error);
      throw error;
    }
  }

  // Log search
  async searchLogs(options: LogSearchOptions): Promise<LogSearchResult> {
    const startTime = Date.now();

    try {
      // Build search query
      const searchResults = await this.performSearch(options);

      // Calculate facets
      const facets = await this.calculateFacets(searchResults.logs);

      const searchTime = Date.now() - startTime;

      return {
        logs: searchResults.logs,
        total: searchResults.total,
        page: options.pagination.page,
        limit: options.pagination.limit,
        hasMore: searchResults.hasMore,
        searchTime,
        facets
      };
    } catch (error) {
      advancedLogger.error('Failed to search logs:', error);
      throw error;
    }
  }

  // Log export
  async exportLogs(options: LogExportOptions): Promise<{
    data: string | Buffer;
    filename: string;
    size: number;
    format: string;
  }> {
    try {
      // Query logs based on filters
      const logs = await this.queryLogs(options.filters);

      // Convert to requested format
      let data: string | Buffer;
      let filename: string;
      let format: string;

      switch (options.format) {
        case 'json':
          data = JSON.stringify(logs, null, 2);
          filename = `logs_${new Date().toISOString().split('T')[0]}.json`;
          format = 'application/json';
          break;
        case 'csv':
          data = this.convertToCSV(logs);
          filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
          format = 'text/csv';
          break;
        case 'xml':
          data = this.convertToXML(logs);
          filename = `logs_${new Date().toISOString().split('T')[0]}.xml`;
          format = 'application/xml';
          break;
        case 'txt':
          data = this.convertToText(logs);
          filename = `logs_${new Date().toISOString().split('T')[0]}.txt`;
          format = 'text/plain';
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Apply compression if requested
      if (options.compression) {
        data = await this.compressData(data);
        filename += '.gz';
        format += '+gzip';
      }

      return {
        data,
        filename,
        size: Buffer.byteLength(data.toString()),
        format
      };
    } catch (error) {
      advancedLogger.error('Failed to export logs:', error);
      throw error;
    }
  }

  // Get log statistics
  async getStatistics(refresh = false): Promise<LogStatistics> {
    if (!refresh && this.statisticsCache && this.lastStatisticsUpdate) {
      const cacheAge = Date.now() - this.lastStatisticsUpdate.getTime();
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
        return this.statisticsCache;
      }
    }

    try {
      const stats = await this.calculateStatistics();
      this.statisticsCache = stats;
      this.lastStatisticsUpdate = new Date();

      return stats;
    } catch (error) {
      advancedLogger.error('Failed to calculate log statistics:', error);
      throw error;
    }
  }

  // Log cleanup
  async cleanupOldLogs(): Promise<{
    cleanedLogs: number;
    reclaimedSpace: number;
    details: Array<{
      logType: string;
      cleanedCount: number;
      reclaimedSpace: number;
    }>;
  }> {
    try {
      const now = new Date();
      const details: Array<{
        logType: string;
        cleanedCount: number;
        reclaimedSpace: number;
      }> = [];
      let totalCleaned = 0;
      let totalReclaimed = 0;

      // Clean application logs
      const appCleanup = await this.cleanupLogsByType('application', this.config.retention.applicationLogs);
      if (appCleanup.cleanedCount > 0) {
        details.push(appCleanup);
        totalCleaned += appCleanup.cleanedCount;
        totalReclaimed += appCleanup.reclaimedSpace;
      }

      // Clean audit logs
      const auditCleanup = await this.cleanupLogsByType('audit', this.config.retention.auditLogs);
      if (auditCleanup.cleanedCount > 0) {
        details.push(auditCleanup);
        totalCleaned += auditCleanup.cleanedCount;
        totalReclaimed += auditCleanup.reclaimedSpace;
      }

      // Clean error logs
      const errorCleanup = await this.cleanupLogsByType('error', this.config.retention.errorLogs);
      if (errorCleanup.cleanedCount > 0) {
        details.push(errorCleanup);
        totalCleaned += errorCleanup.cleanedCount;
        totalReclaimed += errorCleanup.reclaimedSpace;
      }

      // Clean access logs
      const accessCleanup = await this.cleanupLogsByType('access', this.config.retention.accessLogs);
      if (accessCleanup.cleanedCount > 0) {
        details.push(accessCleanup);
        totalCleaned += accessCleanup.cleanedCount;
        totalReclaimed += accessCleanup.reclaimedSpace;
      }

      advancedLogger.info('Log cleanup completed', {
        totalCleaned,
        totalReclaimed,
        details
      });

      return {
        cleanedLogs: totalCleaned,
        reclaimedSpace: totalReclaimed,
        details
      };
    } catch (error) {
      advancedLogger.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }

  // Log rotation
  async rotateLogs(): Promise<void> {
    if (!this.config.rotation.enabled) {
      return;
    }

    try {
      const logTypes = ['application', 'audit', 'error', 'access'];
      
      for (const logType of logTypes) {
        await this.rotateLogsByType(logType);
      }

      advancedLogger.info('Log rotation completed');
    } catch (error) {
      advancedLogger.error('Failed to rotate logs:', error);
      throw error;
    }
  }

  // Log archiving
  async archiveLogs(): Promise<{
    archivedLogs: number;
    archiveSize: number;
    archivePath: string;
  }> {
    if (!this.config.archiving.enabled) {
      throw new Error('Log archiving is not enabled');
    }

    try {
      const cutoffDate = this.getArchiveCutoffDate();
      const logsToArchive = await this.getLogsBeforeDate(cutoffDate);

      if (logsToArchive.length === 0) {
        return {
          archivedLogs: 0,
          archiveSize: 0,
          archivePath: ''
        };
      }

      // Create archive
      const archivePath = await this.createArchive(logsToArchive);
      const archiveSize = await this.getFileSize(archivePath);

      // Remove archived logs from active storage
      await this.removeArchivedLogs(logsToArchive);

      advancedLogger.info('Log archiving completed', {
        archivedLogs: logsToArchive.length,
        archiveSize,
        archivePath
      });

      return {
        archivedLogs: logsToArchive.length,
        archiveSize,
        archivePath
      };
    } catch (error) {
      advancedLogger.error('Failed to archive logs:', error);
      throw error;
    }
  }

  // Monitoring and alerts
  async checkLogHealth(): Promise<{
    healthy: boolean;
    issues: Array<{
      type: 'error_rate' | 'log_volume' | 'disk_usage' | 'index_health';
      severity: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }>;
  }> {
    if (!this.config.monitoring.enabled) {
      return {
        healthy: true,
        issues: []
      };
    }

    try {
      const issues: Array<{
        type: 'error_rate' | 'log_volume' | 'disk_usage' | 'index_health';
        severity: 'warning' | 'critical';
        message: string;
        value: number;
        threshold: number;
      }> = [];

      const stats = await this.getStatistics();

      // Check error rate
      if (stats.errorRate > this.config.monitoring.alertThresholds.errorRate) {
        issues.push({
          type: 'error_rate',
          severity: stats.errorRate > this.config.monitoring.alertThresholds.errorRate * 1.5 ? 'critical' : 'warning',
          message: `High error rate: ${stats.errorRate.toFixed(2)}%`,
          value: stats.errorRate,
          threshold: this.config.monitoring.alertThresholds.errorRate
        });
      }

      // Check disk usage
      if (stats.diskUsage.usagePercentage > this.config.monitoring.alertThresholds.diskUsage) {
        issues.push({
          type: 'disk_usage',
          severity: stats.diskUsage.usagePercentage > 95 ? 'critical' : 'warning',
          message: `High disk usage: ${stats.diskUsage.usagePercentage.toFixed(2)}%`,
          value: stats.diskUsage.usagePercentage,
          threshold: this.config.monitoring.alertThresholds.diskUsage
        });
      }

      // Check log volume (simplified)
      const logVolumeMB = stats.totalSize / (1024 * 1024);
      if (logVolumeMB > this.config.monitoring.alertThresholds.logVolume) {
        issues.push({
          type: 'log_volume',
          severity: 'warning',
          message: `High log volume: ${logVolumeMB.toFixed(2)}MB`,
          value: logVolumeMB,
          threshold: this.config.monitoring.alertThresholds.logVolume
        });
      }

      return {
        healthy: issues.length === 0,
        issues
      };
    } catch (error) {
      advancedLogger.error('Failed to check log health:', error);
      return {
        healthy: false,
        issues: [{
          type: 'index_health',
          severity: 'critical',
          message: 'Failed to check log health',
          value: 0,
          threshold: 0
        }]
      };
    }
  }

  // Private helper methods
  private async createLogDirectories(): Promise<void> {
    const directories = [
      'logs',
      'logs/application',
      'logs/audit',
      'logs/error',
      'logs/access',
      'logs/archive',
      'logs/index'
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        advancedLogger.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  private async initializeIndexing(): Promise<void> {
    advancedLogger.info('Initializing log indexing');
    // This would initialize the search index
  }

  private startBackgroundTasks(): Promise<void> {
    // Start log rotation scheduler
    if (this.config.rotation.enabled) {
      setInterval(() => this.rotateLogs(), 24 * 60 * 60 * 1000); // Daily
    }

    // Start archiving scheduler
    if (this.config.archiving.enabled) {
      setInterval(() => this.archiveLogs(), 7 * 24 * 60 * 60 * 1000); // Weekly
    }

    // Start cleanup scheduler
    setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000); // Daily

    // Start health check scheduler
    if (this.config.monitoring.enabled) {
      setInterval(() => this.checkLogHealth(), 5 * 60 * 1000); // Every 5 minutes
    }

    return Promise.resolve();
  }

  private async loadExistingLogs(): Promise<void> {
    // This would load existing logs into the search index
    advancedLogger.info('Loading existing logs into index');
  }

  private async performSearch(options: LogSearchOptions): Promise<{
    logs: LogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    // This would perform the actual search against the index
    // For now, return empty results
    return {
      logs: [],
      total: 0,
      hasMore: false
    };
  }

  private async calculateFacets(logs: LogEntry[]): Promise<LogSearchResult['facets']> {
    const levels: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.DEBUG]: 0,
      [LogLevel.VERBOSE]: 0
    };

    const services: Record<string, number> = {};
    const statusCodes: Record<number, number> = {};
    let minDate = new Date();
    let maxDate = new Date(0);

    for (const log of logs) {
      // Count by level
      if (log.level in levels) {
        levels[log.level]++;
      }

      // Count by service (extract from path or metadata)
      const service = log.path?.split('/')[1] || 'unknown';
      services[service] = (services[service] || 0) + 1;

      // Count by status code
      if (log.statusCode) {
        statusCodes[log.statusCode] = (statusCodes[log.statusCode] || 0) + 1;
      }

      // Update time range
      if (log.timestamp < minDate) minDate = log.timestamp;
      if (log.timestamp > maxDate) maxDate = log.timestamp;
    }

    return {
      levels,
      services,
      statusCodes,
      timeRange: {
        min: minDate,
        max: maxDate
      }
    };
  }

  private async queryLogs(filters: LogExportOptions['filters']): Promise<LogEntry[]> {
    // This would query logs from storage based on filters
    return [];
  }

  private convertToCSV(logs: LogEntry[]): string {
    const headers = [
      'timestamp', 'level', 'message', 'userId', 'path', 'method', 
      'statusCode', 'responseTime', 'ipAddress'
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.message.replace(/"/g, '""'), // Escape quotes for CSV
      log.userId || '',
      log.path || '',
      log.method || '',
      log.statusCode?.toString() || '',
      log.responseTime?.toString() || '',
      log.ipAddress || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private convertToXML(logs: LogEntry[]): string {
    const xmlLogs = logs.map(log => `
      <log>
        <timestamp>${log.timestamp.toISOString()}</timestamp>
        <level>${log.level}</level>
        <message><![CDATA[${log.message}]]></message>
        <userId>${log.userId || ''}</userId>
        <path>${log.path || ''}</path>
        <method>${log.method || ''}</method>
        <statusCode>${log.statusCode || ''}</statusCode>
        <responseTime>${log.responseTime || ''}</responseTime>
        <ipAddress>${log.ipAddress || ''}</ipAddress>
      </log>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <logs>
      ${xmlLogs}
    </logs>`;
  }

  private convertToText(logs: LogEntry[]): string {
    return logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const level = log.level.toUpperCase().padEnd(8);
      const message = log.message;
      const context = [
        log.userId && `User: ${log.userId}`,
        log.path && `Path: ${log.path}`,
        log.method && `Method: ${log.method}`,
        log.statusCode && `Status: ${log.statusCode}`,
        log.ipAddress && `IP: ${log.ipAddress}`
      ].filter(Boolean).join(' | ');

      return `[${timestamp}] ${level} ${message}${context ? ` | ${context}` : ''}`;
    }).join('\n');
  }

  private async compressData(data: string | Buffer): Promise<Buffer> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { level: this.config.archiving.compressionLevel }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  private async calculateStatistics(): Promise<LogStatistics> {
    // This would calculate real statistics from log storage
    // For now, return mock statistics
    return {
      totalLogs: 0,
      totalSize: 0,
      logsByLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.DEBUG]: 0,
        [LogLevel.VERBOSE]: 0
      },
      logsByService: {},
      errorRate: 0,
      averageResponseTime: 0,
      topErrors: [],
      diskUsage: {
        total: 0,
        used: 0,
        available: 0,
        usagePercentage: 0
      },
      retentionStatus: {
        logsToCleanup: 0,
        spaceToReclaim: 0,
        nextCleanup: new Date()
      }
    };
  }

  private async cleanupLogsByType(logType: string, retentionDays: number): Promise<{
    cleanedCount: number;
    reclaimedSpace: number;
    logType: string;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // This would clean up logs of the specified type
    return {
      cleanedCount: 0,
      reclaimedSpace: 0,
      logType
    };
  }

  private async rotateLogsByType(logType: string): Promise<void> {
    // This would rotate logs of the specified type
    advancedLogger.debug(`Rotating ${logType} logs`);
  }

  private getArchiveCutoffDate(): Date {
    const interval = this.config.archiving.archiveInterval;
    const cutoffDate = new Date();

    if (interval.endsWith('d')) {
      const days = parseInt(interval);
      cutoffDate.setDate(cutoffDate.getDate() - days);
    } else if (interval.endsWith('w')) {
      const weeks = parseInt(interval);
      cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
    } else if (interval.endsWith('m')) {
      const months = parseInt(interval);
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
    }

    return cutoffDate;
  }

  private async getLogsBeforeDate(date: Date): Promise<LogEntry[]> {
    // This would get logs before the specified date
    return [];
  }

  private async createArchive(logs: LogEntry[]): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const archivePath = path.join('logs', 'archive', `logs_${timestamp}.tar.gz`);

    // This would create an archive file
    return archivePath;
  }

  private async removeArchivedLogs(logs: LogEntry[]): Promise<void> {
    // This would remove archived logs from active storage
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const logManagementService = new LogManagementService();