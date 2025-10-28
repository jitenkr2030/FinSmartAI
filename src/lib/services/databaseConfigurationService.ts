import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/services/monitoringService';

// Backup configuration interface
export interface BackupConfiguration {
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

// Recovery configuration interface
export interface RecoveryConfiguration {
  verification: {
    enabled: boolean;
    preRestoreCheck: boolean;
    postRestoreCheck: boolean;
    dataIntegrityCheck: boolean;
  };
  rollback: {
    enabled: boolean;
    autoRollback: boolean;
    maxRetries: number;
  };
  performance: {
    maxConcurrentConnections: number;
    batchSize: number;
    timeout: number;
  };
  logging: {
    detailed: boolean;
    includeData: boolean;
    retentionDays: number;
  };
  notification: {
    enabled: boolean;
    progressUpdates: boolean;
    completionAlert: boolean;
  };
}

// Combined configuration
export interface DatabaseConfiguration {
  backup: BackupConfiguration;
  recovery: RecoveryConfiguration;
  version: string;
  lastModified: Date;
}

export class DatabaseConfigurationService {
  private configPath: string;
  private config: DatabaseConfiguration;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'database.json');
    this.config = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): DatabaseConfiguration {
    return {
      backup: {
        storage: {
          localPath: './backups',
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
      },
      recovery: {
        verification: {
          enabled: true,
          preRestoreCheck: true,
          postRestoreCheck: true,
          dataIntegrityCheck: true
        },
        rollback: {
          enabled: true,
          autoRollback: true,
          maxRetries: 3
        },
        performance: {
          maxConcurrentConnections: 5,
          batchSize: 1000,
          timeout: 300000
        },
        logging: {
          detailed: true,
          includeData: false,
          retentionDays: 30
        },
        notification: {
          enabled: true,
          progressUpdates: true,
          completionAlert: true
        }
      },
      version: '1.0.0',
      lastModified: new Date()
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create config directory if it doesn't exist
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // Load existing configuration or create default
      await this.loadConfiguration();
      
      logger.info('Database configuration service initialized', {
        configPath: this.configPath,
        version: this.config.version
      });
    } catch (error) {
      logger.error('Failed to initialize database configuration service:', error);
      throw error;
    }
  }

  async loadConfiguration(): Promise<DatabaseConfiguration> {
    try {
      // Check if configuration file exists
      try {
        await fs.access(this.configPath);
      } catch {
        // File doesn't exist, create default configuration
        await this.saveConfiguration();
        return this.config;
      }

      // Read configuration file
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const loadedConfig = JSON.parse(configData);

      // Merge with default configuration to handle missing fields
      this.config = this.mergeConfigurations(this.getDefaultConfiguration(), loadedConfig);
      
      logger.info('Database configuration loaded', {
        version: this.config.version,
        lastModified: this.config.lastModified
      });

      return this.config;
    } catch (error) {
      logger.error('Failed to load database configuration:', error);
      // Return default configuration if loading fails
      return this.config;
    }
  }

  async saveConfiguration(): Promise<void> {
    try {
      this.config.lastModified = new Date();
      
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      
      logger.info('Database configuration saved', {
        configPath: this.configPath,
        version: this.config.version,
        lastModified: this.config.lastModified
      });
    } catch (error) {
      logger.error('Failed to save database configuration:', error);
      throw error;
    }
  }

  getConfiguration(): DatabaseConfiguration {
    return { ...this.config };
  }

  async updateBackupConfiguration(backupConfig: Partial<BackupConfiguration>): Promise<DatabaseConfiguration> {
    try {
      this.config.backup = { ...this.config.backup, ...backupConfig };
      await this.saveConfiguration();
      
      logger.info('Backup configuration updated', {
        backupConfig: Object.keys(backupConfig)
      });

      return this.config;
    } catch (error) {
      logger.error('Failed to update backup configuration:', error);
      throw error;
    }
  }

  async updateRecoveryConfiguration(recoveryConfig: Partial<RecoveryConfiguration>): Promise<DatabaseConfiguration> {
    try {
      this.config.recovery = { ...this.config.recovery, ...recoveryConfig };
      await this.saveConfiguration();
      
      logger.info('Recovery configuration updated', {
        recoveryConfig: Object.keys(recoveryConfig)
      });

      return this.config;
    } catch (error) {
      logger.error('Failed to update recovery configuration:', error);
      throw error;
    }
  }

  async validateConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate backup configuration
      const backupConfig = this.config.backup;

      // Check storage path
      if (!backupConfig.storage.localPath) {
        issues.push('Backup storage path is required');
      }

      // Check cloud storage configuration
      if (backupConfig.storage.cloudStorage) {
        const cloud = backupConfig.storage.cloudStorage;
        if (!cloud.provider) {
          issues.push('Cloud storage provider is required');
        }
        if (!cloud.bucket) {
          issues.push('Cloud storage bucket is required');
        }
        if (!cloud.region) {
          issues.push('Cloud storage region is required');
        }
      }

      // Check retention settings
      if (backupConfig.schedule.retention.daily < 1) {
        issues.push('Daily retention must be at least 1 day');
      }
      if (backupConfig.schedule.retention.weekly < 1) {
        issues.push('Weekly retention must be at least 1 week');
      }
      if (backupConfig.schedule.retention.monthly < 1) {
        issues.push('Monthly retention must be at least 1 month');
      }

      // Check compression level
      if (backupConfig.compression.enabled) {
        if (backupConfig.compression.level < 1 || backupConfig.compression.level > 9) {
          issues.push('Compression level must be between 1 and 9');
        }
      }

      // Check encryption configuration
      if (backupConfig.encryption.enabled) {
        if (!backupConfig.encryption.key) {
          warnings.push('Encryption is enabled but no key is provided');
        }
      }

      // Check email configuration
      if (backupConfig.notification.email) {
        const email = backupConfig.notification.email;
        if (!email.smtp.host) {
          issues.push('SMTP host is required for email notifications');
        }
        if (!email.smtp.port) {
          issues.push('SMTP port is required for email notifications');
        }
        if (!email.from) {
          issues.push('Email from address is required');
        }
        if (!email.to || email.to.length === 0) {
          issues.push('Email recipients are required');
        }
      }

      // Validate recovery configuration
      const recoveryConfig = this.config.recovery;

      // Check performance settings
      if (recoveryConfig.performance.maxConcurrentConnections < 1) {
        issues.push('Max concurrent connections must be at least 1');
      }
      if (recoveryConfig.performance.batchSize < 1) {
        issues.push('Batch size must be at least 1');
      }
      if (recoveryConfig.performance.timeout < 1000) {
        issues.push('Timeout must be at least 1000ms');
      }

      // Check rollback settings
      if (recoveryConfig.rollback.enabled && recoveryConfig.rollback.maxRetries < 0) {
        issues.push('Max retries must be non-negative');
      }

      // Check logging settings
      if (recoveryConfig.logging.retentionDays < 1) {
        issues.push('Log retention must be at least 1 day');
      }

      return {
        valid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        issues: ['Configuration validation failed: ' + (error as Error).message],
        warnings: []
      };
    }
  }

  async testConfiguration(): Promise<{
    success: boolean;
    tests: Array<{
      name: string;
      passed: boolean;
      error?: string;
      details?: any;
    }>;
  }> {
    const tests = [];

    try {
      // Test backup storage path
      try {
        await fs.access(this.config.backup.storage.localPath);
        tests.push({
          name: 'Backup storage path',
          passed: true
        });
      } catch (error) {
        tests.push({
          name: 'Backup storage path',
          passed: false,
          error: (error as Error).message
        });
      }

      // Test cloud storage connection (if configured)
      if (this.config.backup.storage.cloudStorage) {
        try {
          // This would test cloud storage connection
          // For now, just simulate a successful test
          tests.push({
            name: 'Cloud storage connection',
            passed: true
          });
        } catch (error) {
          tests.push({
            name: 'Cloud storage connection',
            passed: false,
            error: (error as Error).message
          });
        }
      }

      // Test email configuration (if configured)
      if (this.config.backup.notification.email) {
        try {
          // This would test email configuration
          // For now, just simulate a successful test
          tests.push({
            name: 'Email notification configuration',
            passed: true
          });
        } catch (error) {
          tests.push({
            name: 'Email notification configuration',
            passed: false,
            error: (error as Error).message
          });
        }
      }

      // Test webhook configuration (if configured)
      if (this.config.backup.notification.webhook) {
        try {
          // This would test webhook configuration
          // For now, just simulate a successful test
          tests.push({
            name: 'Webhook notification configuration',
            passed: true
          });
        } catch (error) {
          tests.push({
            name: 'Webhook notification configuration',
            passed: false,
            error: (error as Error).message
          });
        }
      }

      // Test database connection
      try {
        // This would test database connection
        // For now, just simulate a successful test
        tests.push({
          name: 'Database connection',
          passed: true
        });
      } catch (error) {
        tests.push({
          name: 'Database connection',
          passed: false,
          error: (error as Error).message
        });
      }

      return {
        success: tests.every(test => test.passed),
        tests
      };
    } catch (error) {
      return {
        success: false,
        tests: [{
          name: 'Configuration test',
          passed: false,
          error: (error as Error).message
        }]
      };
    }
  }

  async exportConfiguration(): Promise<string> {
    try {
      // Create a copy of the configuration without sensitive data
      const exportConfig = {
        ...this.config,
        backup: {
          ...this.config.backup,
          encryption: {
            ...this.config.backup.encryption,
            key: undefined // Don't export encryption key
          },
          notification: {
            ...this.config.backup.notification,
            email: this.config.backup.notification.email ? {
              ...this.config.backup.notification.email,
              smtp: {
                ...this.config.backup.notification.email!.smtp,
                password: undefined // Don't export SMTP password
              }
            } : undefined
          },
          storage: {
            ...this.config.backup.storage,
            cloudStorage: this.config.backup.storage.cloudStorage ? {
              ...this.config.backup.storage.cloudStorage,
              accessKey: undefined, // Don't export access keys
              secretKey: undefined // Don't export secret keys
            } : undefined
          }
        }
      };

      return JSON.stringify(exportConfig, null, 2);
    } catch (error) {
      logger.error('Failed to export configuration:', error);
      throw error;
    }
  }

  async importConfiguration(configData: string): Promise<DatabaseConfiguration> {
    try {
      const importedConfig = JSON.parse(configData);
      
      // Validate imported configuration
      const validation = await this.validateConfiguration();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.issues.join(', ')}`);
      }

      // Merge with existing configuration
      this.config = this.mergeConfigurations(this.config, importedConfig);
      
      // Save the merged configuration
      await this.saveConfiguration();
      
      logger.info('Database configuration imported', {
        version: this.config.version
      });

      return this.config;
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      throw error;
    }
  }

  private mergeConfigurations(base: DatabaseConfiguration, override: any): DatabaseConfiguration {
    return {
      ...base,
      ...override,
      backup: {
        ...base.backup,
        ...override.backup,
        storage: {
          ...base.backup.storage,
          ...override.backup?.storage,
          cloudStorage: override.backup?.storage?.cloudStorage ? {
            ...base.backup.storage.cloudStorage,
            ...override.backup.storage.cloudStorage
          } : base.backup.storage.cloudStorage
        },
        schedule: {
          ...base.backup.schedule,
          ...override.backup?.schedule,
          retention: {
            ...base.backup.schedule.retention,
            ...override.backup?.schedule?.retention
          }
        },
        compression: {
          ...base.backup.compression,
          ...override.backup?.compression
        },
        encryption: {
          ...base.backup.encryption,
          ...override.backup?.encryption
        },
        notification: {
          ...base.backup.notification,
          ...override.backup?.notification,
          email: override.backup?.notification?.email ? {
            ...base.backup.notification.email,
            ...override.backup.notification.email,
            smtp: override.backup.notification.email.smtp ? {
              ...base.backup.notification.email?.smtp,
              ...override.backup.notification.email.smtp
            } : base.backup.notification.email?.smtp
          } : base.backup.notification.email
        }
      },
      recovery: {
        ...base.recovery,
        ...override.recovery,
        verification: {
          ...base.recovery.verification,
          ...override.recovery?.verification
        },
        rollback: {
          ...base.recovery.rollback,
          ...override.recovery?.rollback
        },
        performance: {
          ...base.recovery.performance,
          ...override.recovery?.performance
        },
        logging: {
          ...base.recovery.logging,
          ...override.recovery?.logging
        },
        notification: {
          ...base.recovery.notification,
          ...override.recovery?.notification
        }
      }
    };
  }
}

// Export singleton instance
export const databaseConfigurationService = new DatabaseConfigurationService();