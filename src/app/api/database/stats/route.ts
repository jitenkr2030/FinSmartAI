import { NextRequest, NextResponse } from 'next/server';
import { databaseBackupService, databaseRecoveryService } from '@/lib/services/databaseBackupService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/database/stats - Get database backup and recovery statistics
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_LOGS],
  async (req: NextRequest, user) => {
    try {
      // Get backup statistics
      const backupStats = await databaseBackupService.getBackupStats();
      
      // Get recovery statistics
      const recoveryStats = await databaseRecoveryService.getRecoveryStats();

      // Get system information
      const systemInfo = await getSystemInfo();

      // Get recent activity
      const recentActivity = await getRecentActivity();

      return NextResponse.json({
        success: true,
        data: {
          backup: backupStats,
          recovery: recoveryStats,
          system: systemInfo,
          recentActivity
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get database statistics',
          code: 'GET_DATABASE_STATS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// Helper functions
async function getSystemInfo() {
  // Dynamic imports for Node.js modules
  const os = await import('os');
  const fs = await import('fs');
  
  // Get disk space information
  const stats = fs.statSync(process.cwd());
  const diskSpace = {
    total: stats.blocks * stats.bsize,
    free: stats.bavail * stats.bsize,
    used: (stats.blocks - stats.bfree) * stats.bsize,
    usage: ((stats.blocks - stats.bfree) / stats.blocks) * 100
  };

  // Get memory information
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryInfo = {
    total: totalMemory,
    free: freeMemory,
    used: totalMemory - freeMemory,
    usage: ((totalMemory - freeMemory) / totalMemory) * 100
  };

  // Get CPU information
  const cpuInfo = {
    count: os.cpus().length,
    model: os.cpus()[0]?.model || 'Unknown',
    load: os.loadavg()
  };

  // Get uptime
  const uptime = os.uptime();

  return {
    disk: diskSpace,
    memory: memoryInfo,
    cpu: cpuInfo,
    uptime,
    timestamp: new Date().toISOString()
  };
}

async function getRecentActivity() {
  try {
    // Get recent backups
    const backups = await databaseBackupService.listBackups();
    const recentBackups = backups.slice(0, 5).map(backup => ({
      id: backup.id,
      type: 'backup',
      subtype: backup.type,
      status: backup.status,
      timestamp: backup.timestamp,
      size: backup.size,
      duration: backup.duration
    }));

    // Get recent recovery plans
    const recoveryPlans = await databaseRecoveryService.listRecoveryPlans();
    const recentRecoveries = recoveryPlans.slice(0, 5).map(plan => ({
      id: plan.id,
      type: 'recovery',
      subtype: plan.strategy,
      status: plan.status,
      timestamp: plan.startTime || plan.timestamp,
      duration: plan.actualDuration,
      backupId: plan.backupId
    }));

    // Combine and sort by timestamp
    const allActivity = [...recentBackups, ...recentRecoveries]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return allActivity;
  } catch (error) {
    return [];
  }
}