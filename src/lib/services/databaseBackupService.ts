import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/services/monitoringService';
import { db } from '@/lib/db';

const execAsync = promisify(exec);

// Backup configuration
interface BackupConfig {
  storage: {
    localPath: string;
    cloudStorage?: {
      provider: 'aws' | 'gcp' | 'azure';
      bucket: string;
      region: string;
      accessKey?: string;
      secretKey?: string;
    };
  };
  schedule: {
    enabled: boolean;
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    retention: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  compression: {
    enabled: boolean;
    level: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
  notification: {
    enabled: boolean;
    webhook?: string;
    email?: {
      smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
      };
      from: string;
      to: string[];
    };
  };
}

// Backup metadata
interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  checksum: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration?: number;
  error?: string;
  location: {
    local: string;
    cloud?: string;
  };
  tables: string[];
  encryption?: {
    algorithm: string;
    keyId?: string;
  };
}

// Backup statistics
interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Date;
  lastBackupSize?: number;
  successRate: number;
  averageDuration: number;
  nextScheduled?: Date;
}

export class DatabaseBackupService {
  private config: BackupConfig;
  private backupQueue: Array<{
    id: string;
    type: 'full' | 'incremental' | 'differential';
    priority: 'high' | 'normal' | 'low';
    scheduledFor: Date;
  }> = [];
  private isRunning = false;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      storage: {
        localPath: process.env.BACKUP_PATH || './backups',
        cloudStorage: process.env.CLOUD_STORAGE_PROVIDER ? {
          provider: process.env.CLOUD_STORAGE_PROVIDER as 'aws' | 'gcp' | 'azure',
          bucket: process.env.CLOUD_STORAGE_BUCKET || '',
          region: process.env.CLOUD_STORAGE_REGION || '',
          accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY,
          secretKey: process.env.CLOUD_STORAGE_SECRET_KEY,
        } : undefined
      },
      schedule: {
        enabled: process.env.BACKUP_SCHEDULE_ENABLED === 'true',
        interval: (process.env.BACKUP_SCHEDULE_INTERVAL as any) || 'daily',
        retention: {
          daily: parseInt(process.env.BACKUP_RETENTION_DAILY || '7'),
          weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY || '4'),
          monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY || '12'),
        }
      },
      compression: {
        enabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
        level: parseInt(process.env.BACKUP_COMPRESSION_LEVEL || '6'),
      },
      encryption: {
        enabled: process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
        algorithm: process.env.BACKUP_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        key: process.env.BACKUP_ENCRYPTION_KEY,
      },
      notification: {
        enabled: process.env.BACKUP_NOTIFICATION_ENABLED === 'true',
        webhook: process.env.BACKUP_WEBHOOK_URL,
        email: process.env.BACKUP_EMAIL_ENABLED === 'true' ? {
          smtp: {
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER || '',
            password: process.env.SMTP_PASSWORD || '',
          },
          from: process.env.EMAIL_FROM || '',
          to: process.env.EMAIL_TO?.split(',') || [],
        } : undefined
      }
    };

    // Override with provided config
    if (config) {
      this.config = this.mergeConfig(this.config, config);
    }

    this.initialize();
  }

  private mergeConfig(base: BackupConfig, override: Partial<BackupConfig>): BackupConfig {
    return {
      storage: { ...base.storage, ...override.storage },
      schedule: { ...base.schedule, ...override.schedule },
      compression: { ...base.compression, ...override.compression },
      encryption: { ...base.encryption, ...override.encryption },
      notification: { ...base.notification, ...override.notification }
    };
  }

  private async initialize(): Promise<void> {
    try {
      // Create backup directory
      await fs.mkdir(this.config.storage.localPath, { recursive: true });
      
      // Initialize backup queue
      if (this.config.schedule.enabled) {
        this.scheduleNextBackup();
      }

      logger.info('Database backup service initialized', {
        config: {
          storage: {
            localPath: this.config.storage.localPath,
            cloudStorage: this.config.storage.cloudStorage ? {
              provider: this.config.storage.cloudStorage.provider,
              bucket: this.config.storage.cloudStorage.bucket,
              region: this.config.storage.cloudStorage.region
            } : null
          },
          schedule: this.config.schedule,
          compression: this.config.compression,
          encryption: {
            enabled: this.config.encryption.enabled,
            algorithm: this.config.encryption.algorithm
          },
          notification: {
            enabled: this.config.notification.enabled
          }
        }
      });
    } catch (error) {
      logger.error('Failed to initialize backup service:', error);
      throw error;
    }
  }

  // Create a full backup
  async createFullBackup(priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const timestamp = new Date();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      size: 0,
      checksum: '',
      type: 'full',
      status: 'pending',
      location: {
        local: path.join(this.config.storage.localPath, `full_${backupId}.sql`)
      },
      tables: []
    };

    try {
      logger.info('Starting full database backup', { backupId, timestamp });

      // Update status to in_progress
      metadata.status = 'in_progress';
      await this.saveMetadata(metadata);

      const startTime = Date.now();

      // Get all table names
      const tables = await this.getTableNames();
      metadata.tables = tables;

      // Create backup file
      const backupContent = await this.dumpDatabase();
      
      // Compress if enabled
      let finalContent = backupContent;
      let extension = '.sql';
      
      if (this.config.compression.enabled) {
        finalContent = await this.compress(backupContent);
        extension = '.sql.gz';
        metadata.location.local = path.join(this.config.storage.localPath, `full_${backupId}${extension}`);
      }

      // Encrypt if enabled
      if (this.config.encryption.enabled) {
        finalContent = await this.encrypt(finalContent);
        extension += '.enc';
        metadata.location.local = path.join(this.config.storage.localPath, `full_${backupId}${extension}`);
        metadata.encryption = {
          algorithm: this.config.encryption.algorithm
        };
      }

      // Write backup file
      await fs.writeFile(metadata.location.local, finalContent);
      
      // Calculate checksum and size
      metadata.checksum = this.calculateChecksum(finalContent);
      metadata.size = finalContent.length;
      metadata.duration = Date.now() - startTime;
      metadata.status = 'completed';

      // Save metadata
      await this.saveMetadata(metadata);

      // Upload to cloud storage if configured
      if (this.config.storage.cloudStorage) {
        try {
          const cloudPath = await this.uploadToCloud(metadata.location.local, backupId);
          metadata.location.cloud = cloudPath;
          await this.saveMetadata(metadata);
        } catch (error) {
          logger.error('Failed to upload backup to cloud storage:', error);
        }
      }

      // Send notification
      if (this.config.notification.enabled) {
        await this.sendNotification('backup_completed', metadata);
      }

      logger.info('Full database backup completed', {
        backupId,
        duration: metadata.duration,
        size: metadata.size,
        location: metadata.location
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = (error as Error).message;
      await this.saveMetadata(metadata);

      logger.error('Full database backup failed', { backupId, error });

      if (this.config.notification.enabled) {
        await this.sendNotification('backup_failed', metadata);
      }

      throw error;
    }
  }

  // Create an incremental backup
  async createIncrementalBackup(priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const timestamp = new Date();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      size: 0,
      checksum: '',
      type: 'incremental',
      status: 'pending',
      location: {
        local: path.join(this.config.storage.localPath, `incremental_${backupId}.sql`)
      },
      tables: []
    };

    try {
      logger.info('Starting incremental database backup', { backupId, timestamp });

      metadata.status = 'in_progress';
      await this.saveMetadata(metadata);

      const startTime = Date.now();

      // Get tables with changes since last backup
      const tables = await this.getChangedTables();
      metadata.tables = tables;

      // Create incremental backup
      const backupContent = await this.dumpDatabaseIncremental(tables);
      
      // Process backup content (compression, encryption)
      let finalContent = backupContent;
      let extension = '.sql';
      
      if (this.config.compression.enabled) {
        finalContent = await this.compress(backupContent);
        extension = '.sql.gz';
        metadata.location.local = path.join(this.config.storage.localPath, `incremental_${backupId}${extension}`);
      }

      if (this.config.encryption.enabled) {
        finalContent = await this.encrypt(finalContent);
        extension += '.enc';
        metadata.location.local = path.join(this.config.storage.localPath, `incremental_${backupId}${extension}`);
        metadata.encryption = {
          algorithm: this.config.encryption.algorithm
        };
      }

      await fs.writeFile(metadata.location.local, finalContent);
      
      metadata.checksum = this.calculateChecksum(finalContent);
      metadata.size = finalContent.length;
      metadata.duration = Date.now() - startTime;
      metadata.status = 'completed';

      await this.saveMetadata(metadata);

      // Upload to cloud storage
      if (this.config.storage.cloudStorage) {
        try {
          const cloudPath = await this.uploadToCloud(metadata.location.local, backupId);
          metadata.location.cloud = cloudPath;
          await this.saveMetadata(metadata);
        } catch (error) {
          logger.error('Failed to upload backup to cloud storage:', error);
        }
      }

      if (this.config.notification.enabled) {
        await this.sendNotification('backup_completed', metadata);
      }

      logger.info('Incremental database backup completed', {
        backupId,
        duration: metadata.duration,
        size: metadata.size,
        tables: tables.length
      });

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = (error as Error).message;
      await this.saveMetadata(metadata);

      logger.error('Incremental database backup failed', { backupId, error });

      if (this.config.notification.enabled) {
        await this.sendNotification('backup_failed', metadata);
      }

      throw error;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupId: string, options: {
    force?: boolean;
    preRestoreScript?: string;
    postRestoreScript?: string;
  } = {}): Promise<void> {
    try {
      logger.info('Starting database restore', { backupId, options });

      // Get backup metadata
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      if (metadata.status !== 'completed') {
        throw new Error(`Backup is not completed: ${backupId}`);
      }

      // Download from cloud if necessary
      let backupPath = metadata.location.local;
      if (metadata.location.cloud && !await this.fileExists(backupPath)) {
        backupPath = await this.downloadFromCloud(metadata.location.cloud, backupId);
      }

      // Read backup file
      let backupContent = await fs.readFile(backupPath);

      // Decrypt if encrypted
      if (metadata.encryption) {
        backupContent = await this.decrypt(backupContent);
      }

      // Decompress if compressed
      if (backupPath.endsWith('.gz')) {
        backupContent = await this.decompress(backupContent);
      }

      // Execute pre-restore script
      if (options.preRestoreScript) {
        await this.executeScript(options.preRestoreScript);
      }

      // Restore database
      await this.restoreDatabaseFromContent(backupContent.toString());

      // Execute post-restore script
      if (options.postRestoreScript) {
        await this.executeScript(options.postRestoreScript);
      }

      logger.info('Database restore completed', { backupId });

      if (this.config.notification.enabled) {
        await this.sendNotification('restore_completed', metadata);
      }
    } catch (error) {
      logger.error('Database restore failed', { backupId, error });

      if (this.config.notification.enabled) {
        await this.sendNotification('restore_failed', { backupId, error: (error as Error).message });
      }

      throw error;
    }
  }

  // Get backup statistics
  async getBackupStats(): Promise<BackupStats> {
    try {
      const backups = await this.listBackups();
      const completedBackups = backups.filter(b => b.status === 'completed');
      
      const stats: BackupStats = {
        totalBackups: backups.length,
        totalSize: completedBackups.reduce((sum, b) => sum + b.size, 0),
        successRate: backups.length > 0 ? (completedBackups.length / backups.length) * 100 : 0,
        averageDuration: completedBackups.length > 0 
          ? completedBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBackups.length 
          : 0
      };

      if (completedBackups.length > 0) {
        const latestBackup = completedBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        stats.lastBackup = latestBackup.timestamp;
        stats.lastBackupSize = latestBackup.size;
      }

      // Calculate next scheduled backup
      if (this.config.schedule.enabled) {
        stats.nextScheduled = this.calculateNextScheduledBackup();
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      throw error;
    }
  }

  // List all backups
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const metadataPath = path.join(this.config.storage.localPath, 'metadata');
      const files = await fs.readdir(metadataPath);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(metadataPath, file), 'utf-8');
            const metadata = JSON.parse(content);
            backups.push(metadata);
          } catch (error) {
            logger.warn('Failed to read backup metadata:', { file, error });
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  // Delete a backup
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Delete local file
      if (await this.fileExists(metadata.location.local)) {
        await fs.unlink(metadata.location.local);
      }

      // Delete from cloud storage
      if (metadata.location.cloud) {
        await this.deleteFromCloud(metadata.location.cloud);
      }

      // Delete metadata
      const metadataPath = path.join(this.config.storage.localPath, 'metadata', `${backupId}.json`);
      if (await this.fileExists(metadataPath)) {
        await fs.unlink(metadataPath);
      }

      logger.info('Backup deleted', { backupId });
    } catch (error) {
      logger.error('Failed to delete backup:', { backupId, error });
      throw error;
    }
  }

  // Verify backup integrity
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      let backupPath = metadata.location.local;
      
      // Download from cloud if necessary
      if (metadata.location.cloud && !await this.fileExists(backupPath)) {
        backupPath = await this.downloadFromCloud(metadata.location.cloud, backupId);
      }

      // Read backup file
      let backupContent = await fs.readFile(backupPath);

      // Decrypt if encrypted
      if (metadata.encryption) {
        backupContent = await this.decrypt(backupContent);
      }

      // Decompress if compressed
      if (backupPath.endsWith('.gz')) {
        backupContent = await this.decompress(backupContent);
      }

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum(backupContent);
      const isValid = calculatedChecksum === metadata.checksum;

      logger.info('Backup verification completed', { backupId, isValid });

      return isValid;
    } catch (error) {
      logger.error('Backup verification failed:', { backupId, error });
      return false;
    }
  }

  // Private helper methods
  private generateBackupId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataDir = path.join(this.config.storage.localPath, 'metadata');
    await fs.mkdir(metadataDir, { recursive: true });
    
    const metadataPath = path.join(metadataDir, `${metadata.id}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = path.join(this.config.storage.localPath, 'metadata', `${backupId}.json`);
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private calculateChecksum(content: Buffer): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async getTableNames(): Promise<string[]> {
    // This would query the database for table names
    // For SQLite, it would be: SELECT name FROM sqlite_master WHERE type='table'
    return ['users', 'predictions', 'market_data', 'user_portfolios', 'api_keys'];
  }

  private async getChangedTables(): Promise<string[]> {
    // This would query the database for tables with changes since last backup
    // For now, return all tables
    return await this.getTableNames();
  }

  private async dumpDatabase(): Promise<string> {
    // This would create a full database dump
    // For SQLite, it would use .dump command or similar
    return '-- Full database dump placeholder\n';
  }

  private async dumpDatabaseIncremental(tables: string[]): Promise<string> {
    // This would create an incremental dump for specific tables
    return `-- Incremental dump for tables: ${tables.join(', ')}\n`;
  }

  private async restoreDatabaseFromContent(content: string): Promise<void> {
    // This would restore the database from the dump content
    logger.info('Restoring database from content', { contentLength: content.length });
  }

  private async compress(content: string): Promise<Buffer> {
    // Dynamic import for zlib
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(content, { level: this.config.compression.level }, (error: Error, result: Buffer) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  private async decompress(content: Buffer): Promise<Buffer> {
    // Dynamic import for zlib
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(content, (error: Error, result: Buffer) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  private async encrypt(content: Buffer): Promise<Buffer> {
    if (!this.config.encryption.key) {
      throw new Error('Encryption key is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const algorithm = this.config.encryption.algorithm;
    const key = Buffer.from(this.config.encryption.key, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    const encrypted = Buffer.concat([iv, cipher.update(content), cipher.final()]);

    return encrypted;
  }

  private async decrypt(content: Buffer): Promise<Buffer> {
    if (!this.config.encryption.key) {
      throw new Error('Encryption key is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const algorithm = this.config.encryption.algorithm;
    const key = Buffer.from(this.config.encryption.key, 'hex');
    const iv = content.slice(0, 16);
    const encrypted = content.slice(16);

    const decipher = crypto.createDecipher(algorithm, key);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted;
  }

  private async uploadToCloud(localPath: string, backupId: string): Promise<string> {
    if (!this.config.storage.cloudStorage) {
      throw new Error('Cloud storage not configured');
    }

    const { provider, bucket, region } = this.config.storage.cloudStorage;
    const cloudPath = `backups/${backupId}.sql`;

    // This would upload to the specified cloud provider
    // For AWS S3, it would use the AWS SDK
    // For GCP Cloud Storage, it would use the Google Cloud SDK
    // For Azure Blob Storage, it would use the Azure SDK

    logger.info('Uploading backup to cloud storage', {
      provider,
      bucket,
      region,
      cloudPath
    });

    return `${provider}://${bucket}/${cloudPath}`;
  }

  private async downloadFromCloud(cloudPath: string, backupId: string): Promise<string> {
    // This would download from the specified cloud provider
    const localPath = path.join(this.config.storage.localPath, `downloaded_${backupId}.sql`);
    
    logger.info('Downloading backup from cloud storage', {
      cloudPath,
      localPath
    });

    return localPath;
  }

  private async deleteFromCloud(cloudPath: string): Promise<void> {
    // This would delete from the specified cloud provider
    logger.info('Deleting backup from cloud storage', { cloudPath });
  }

  private async executeScript(script: string): Promise<void> {
    // This would execute the provided SQL script
    logger.info('Executing script', { scriptLength: script.length });
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const now = new Date();

      // Group backups by type and retention period
      const dailyBackups = backups.filter(b => b.type === 'full' || b.type === 'incremental');
      const weeklyBackups = backups.filter(b => b.type === 'full');
      const monthlyBackups = backups.filter(b => b.type === 'full');

      // Clean up old daily backups
      const dailyRetention = this.config.schedule.retention.daily;
      const oldDailyBackups = dailyBackups
        .filter(b => {
          const daysOld = Math.floor((now.getTime() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24));
          return daysOld > dailyRetention;
        })
        .slice(dailyRetention); // Keep the most recent ones

      // Clean up old weekly backups
      const weeklyRetention = this.config.schedule.retention.weekly;
      const oldWeeklyBackups = weeklyBackups
        .filter(b => {
          const weeksOld = Math.floor((now.getTime() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 7));
          return weeksOld > weeklyRetention;
        })
        .slice(weeklyRetention);

      // Clean up old monthly backups
      const monthlyRetention = this.config.schedule.retention.monthly;
      const oldMonthlyBackups = monthlyBackups
        .filter(b => {
          const monthsOld = Math.floor((now.getTime() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30));
          return monthsOld > monthlyRetention;
        })
        .slice(monthlyRetention);

      // Delete old backups
      const backupsToDelete = [...oldDailyBackups, ...oldWeeklyBackups, ...oldMonthlyBackups];
      
      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup.id);
          logger.info('Cleaned up old backup', { backupId: backup.id, age: backup.timestamp });
        } catch (error) {
          logger.error('Failed to cleanup old backup:', { backupId: backup.id, error });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  private scheduleNextBackup(): void {
    const nextBackup = this.calculateNextScheduledBackup();
    if (nextBackup) {
      const delay = nextBackup.getTime() - Date.now();
      
      setTimeout(async () => {
        try {
          await this.createFullBackup();
          this.scheduleNextBackup(); // Schedule next backup
        } catch (error) {
          logger.error('Scheduled backup failed:', error);
          this.scheduleNextBackup(); // Retry
        }
      }, delay);
    }
  }

  private calculateNextScheduledBackup(): Date | null {
    if (!this.config.schedule.enabled) {
      return null;
    }

    const now = new Date();
    const next = new Date(now);

    switch (this.config.schedule.interval) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0); // Start of day
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        next.setHours(0, 0, 0, 0); // Start of day
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1); // Start of month
        next.setHours(0, 0, 0, 0);
        break;
      default:
        return null;
    }

    return next;
  }

  private async sendNotification(type: 'backup_completed' | 'backup_failed' | 'restore_completed' | 'restore_failed', metadata?: BackupMetadata, extra?: any): Promise<void> {
    if (!this.config.notification.enabled) {
      return;
    }

    try {
      const message = {
        type,
        timestamp: new Date().toISOString(),
        metadata,
        ...extra
      };

      // Send webhook notification
      if (this.config.notification.webhook) {
        await fetch(this.config.notification.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      }

      // Send email notification
      if (this.config.notification.email) {
        // This would send email using nodemailer or similar
        logger.info('Email notification would be sent', { type, metadata });
      }

      logger.info('Notification sent', { type });
    } catch (error) {
      logger.error('Failed to send notification:', { type, error });
    }
  }
}

// Export singleton instance
export const databaseBackupService = new DatabaseBackupService();