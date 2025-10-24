import { DatabaseBackupService } from '@/lib/services/databaseBackupService';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    backup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock file system operations
const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
};

jest.mock('fs', () => mockFs);

// Mock crypto for encryption
jest.mock('crypto', () => ({
  createCipheriv: jest.fn(() => ({
    update: jest.fn().mockReturnValue('encrypted'),
    final: jest.fn().mockReturnValue('data'),
  })),
  createDecipheriv: jest.fn(() => ({
    update: jest.fn().mockReturnValue('decrypted'),
    final: jest.fn().mockReturnValue('data'),
  })),
  randomBytes: jest.fn().mockReturnValue('mock-iv'),
}));

// Mock zlib for compression
jest.mock('zlib', () => ({
  gzipSync: jest.fn().mockReturnValue('compressed-data'),
  gunzipSync: jest.fn().mockReturnValue('original-data'),
}));

describe('DatabaseBackupService', () => {
  let backupService: DatabaseBackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    backupService = new DatabaseBackupService();
  });

  describe('createFullBackup', () => {
    it('should create a full backup successfully', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        size: 1024,
        filePath: '/backups/full-backup-123.sql',
        createdAt: new Date(),
      };

      (db.backup.create as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.createFullBackup('high');

      expect(result).toEqual(mockBackup);
      expect(db.backup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'full',
          priority: 'high',
          status: 'completed',
        }),
      });
    });

    it('should handle backup creation errors', async () => {
      (db.backup.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(backupService.createFullBackup('high')).rejects.toThrow('Database error');
    });

    it('should use default priority when not specified', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        priority: 'normal',
      };

      (db.backup.create as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.createFullBackup();

      expect(result.priority).toBe('normal');
    });
  });

  describe('createIncrementalBackup', () => {
    it('should create an incremental backup successfully', async () => {
      const mockBackup = {
        id: 'backup-456',
        type: 'incremental',
        status: 'completed',
        size: 512,
        filePath: '/backups/incremental-backup-456.sql',
        createdAt: new Date(),
      };

      (db.backup.create as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.createIncrementalBackup('normal');

      expect(result).toEqual(mockBackup);
      expect(db.backup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'incremental',
          priority: 'normal',
          status: 'completed',
        }),
      });
    });

    it('should find last full backup for incremental', async () => {
      const lastFullBackup = {
        id: 'backup-123',
        type: 'full',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      (db.backup.findMany as jest.Mock).mockResolvedValue([lastFullBackup]);
      (db.backup.create as jest.Mock).mockResolvedValue({
        id: 'backup-456',
        type: 'incremental',
        basedOn: 'backup-123',
      });

      await backupService.createIncrementalBackup();

      expect(db.backup.findMany).toHaveBeenCalledWith({
        where: {
          type: 'full',
          status: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          type: 'full',
          status: 'completed',
          size: 1024,
          createdAt: new Date(),
        },
        {
          id: 'backup-2',
          type: 'incremental',
          status: 'completed',
          size: 512,
          createdAt: new Date(),
        },
      ];

      (db.backup.findMany as jest.Mock).mockResolvedValue(mockBackups);

      const result = await backupService.listBackups();

      expect(result).toEqual(mockBackups);
      expect(db.backup.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter backups by type', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          type: 'full',
          status: 'completed',
          size: 1024,
          createdAt: new Date(),
        },
      ];

      (db.backup.findMany as jest.Mock).mockResolvedValue(mockBackups);

      const result = await backupService.listBackups('full');

      expect(result).toEqual(mockBackups);
      expect(db.backup.findMany).toHaveBeenCalledWith({
        where: {
          type: 'full',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('getBackup', () => {
    it('should get a specific backup', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        size: 1024,
        createdAt: new Date(),
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.getBackup('backup-123');

      expect(result).toEqual(mockBackup);
      expect(db.backup.findUnique).toHaveBeenCalledWith({
        where: { id: 'backup-123' },
      });
    });

    it('should return null for non-existent backup', async () => {
      (db.backup.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await backupService.getBackup('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup successfully', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        filePath: '/backups/backup-123.sql',
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);
      (db.backup.delete as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.deleteBackup('backup-123');

      expect(result).toEqual(mockBackup);
      expect(db.backup.delete).toHaveBeenCalledWith({
        where: { id: 'backup-123' },
      });
    });

    it('should throw error for non-existent backup', async () => {
      (db.backup.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(backupService.deleteBackup('non-existent')).rejects.toThrow('Backup not found');
    });
  });

  describe('restoreBackup', () => {
    it('should restore a backup successfully', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        filePath: '/backups/backup-123.sql',
        size: 1024,
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);

      const result = await backupService.restoreBackup('backup-123', 'target-db');

      expect(result).toEqual({
        success: true,
        message: 'Backup restored successfully',
        backupId: 'backup-123',
        targetDatabase: 'target-db',
        restoredAt: expect.any(Date),
      });
    });

    it('should throw error for non-existent backup', async () => {
      (db.backup.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(backupService.restoreBackup('non-existent', 'target-db'))
        .rejects.toThrow('Backup not found');
    });

    it('should handle restore errors', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        filePath: '/backups/backup-123.sql',
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);

      // Simulate restore error
      jest.spyOn(backupService as any, 'executeRestore').mockRejectedValue(new Error('Restore failed'));

      await expect(backupService.restoreBackup('backup-123', 'target-db'))
        .rejects.toThrow('Restore failed');
    });
  });

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          type: 'full',
          status: 'completed',
          size: 1024,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          id: 'backup-2',
          type: 'incremental',
          status: 'completed',
          size: 512,
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          id: 'backup-3',
          type: 'full',
          status: 'failed',
          size: 0,
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        },
      ];

      (db.backup.findMany as jest.Mock).mockResolvedValue(mockBackups);

      const stats = await backupService.getBackupStats();

      expect(stats).toEqual({
        totalBackups: 3,
        successfulBackups: 2,
        failedBackups: 1,
        totalSize: 1536,
        averageSize: 768,
        lastBackup: expect.any(Date),
        oldestBackup: expect.any(Date),
        backupTypes: {
          full: 2,
          incremental: 1,
        },
      });
    });

    it('should handle empty backup list', async () => {
      (db.backup.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await backupService.getBackupStats();

      expect(stats).toEqual({
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalSize: 0,
        averageSize: 0,
        lastBackup: null,
        oldestBackup: null,
        backupTypes: {
          full: 0,
          incremental: 0,
        },
      });
    });
  });

  describe('cleanupOldBackups', () => {
    it('should clean up old backups based on retention policy', async () => {
      const oldBackups = [
        {
          id: 'backup-old-1',
          type: 'full',
          status: 'completed',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: 'backup-old-2',
          type: 'incremental',
          status: 'completed',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
      ];

      const recentBackups = [
        {
          id: 'backup-recent',
          type: 'full',
          status: 'completed',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      (db.backup.findMany as jest.Mock).mockResolvedValue([...oldBackups, ...recentBackups]);
      (db.backup.delete as jest.Mock).mockResolvedValue({});

      const result = await backupService.cleanupOldBackups(7); // Keep last 7 days

      expect(result.deletedCount).toBe(2);
      expect(db.backup.delete).toHaveBeenCalledTimes(2);
    });

    it('should not delete recent backups', async () => {
      const recentBackups = [
        {
          id: 'backup-recent-1',
          type: 'full',
          status: 'completed',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: 'backup-recent-2',
          type: 'incremental',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ];

      (db.backup.findMany as jest.Mock).mockResolvedValue(recentBackups);

      const result = await backupService.cleanupOldBackups(7);

      expect(result.deletedCount).toBe(0);
      expect(db.backup.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateBackup', () => {
    it('should validate a backup file successfully', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        filePath: '/backups/backup-123.sql',
        checksum: 'valid-checksum',
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);

      // Mock file system operations
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1024 });

      const result = await backupService.validateBackup('backup-123');

      expect(result).toEqual({
        valid: true,
        fileExists: true,
        size: 1024,
        checksum: 'valid-checksum',
      });
    });

    it('should return invalid for non-existent file', async () => {
      const mockBackup = {
        id: 'backup-123',
        type: 'full',
        status: 'completed',
        filePath: '/backups/backup-123.sql',
      };

      (db.backup.findUnique as jest.Mock).mockResolvedValue(mockBackup);

      mockFs.existsSync.mockReturnValue(false);

      const result = await backupService.validateBackup('backup-123');

      expect(result).toEqual({
        valid: false,
        fileExists: false,
        error: 'Backup file does not exist',
      });
    });
  });
});