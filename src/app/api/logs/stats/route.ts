import { NextRequest, NextResponse } from 'next/server';
import { advancedLogger } from '@/lib/services/advancedLogger';
import { logManagementService } from '@/lib/services/logManagementService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/stats - Get log statistics
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const refresh = searchParams.get('refresh') === 'true';

      // Get comprehensive log statistics
      const logStats = await advancedLogger.getLogStats();
      const managementStats = await logManagementService.getStatistics(refresh);
      const healthCheck = await logManagementService.checkLogHealth();

      // Combine statistics
      const combinedStats = {
        logs: logStats,
        management: managementStats,
        health: healthCheck,
        summary: {
          totalLogs: managementStats.totalLogs,
          totalSize: managementStats.totalSize,
          errorRate: managementStats.errorRate,
          healthy: healthCheck.healthy,
          issuesCount: healthCheck.issues.length,
          lastUpdated: new Date().toISOString()
        }
      };

      return NextResponse.json({
        success: true,
        data: combinedStats
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get log statistics',
          code: 'GET_LOG_STATS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);