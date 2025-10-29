import { NextRequest, NextResponse } from 'next/server';
import { logManagementService } from '@/lib/services/logManagementService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// POST /api/logs/management/cleanup - Clean up old logs
export async function POST(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const body = await req.json();
        const { logTypes } = body; // Optional: specific log types to clean up

        // Perform cleanup
        const cleanupResult = await logManagementService.cleanupOldLogs();

        // Log the cleanup action
        await logManagementService.advancedLogger?.audit('system.logs.cleanup', 'logs', {
          action: 'cleanup_old_logs',
          performedBy: user?.id,
          cleanedLogs: cleanupResult.cleanedLogs,
          reclaimedSpace: cleanupResult.reclaimedSpace,
          details: cleanupResult.details
        }, 'success');

        return NextResponse.json({
          success: true,
          data: cleanupResult
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to cleanup logs',
            code: 'CLEANUP_LOGS_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/logs/management/rotate - Rotate log files
export async function PUT(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        // Perform log rotation
        await logManagementService.rotateLogs();

        // Log the rotation action
        await logManagementService.advancedLogger?.audit('system.logs.rotate', 'logs', {
          action: 'rotate_log_files',
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }, 'success');

        return NextResponse.json({
          success: true,
          message: 'Log rotation completed successfully'
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to rotate logs',
            code: 'ROTATE_LOGS_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/logs/management/archive - Archive old logs
export async function PATCH(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        // Perform log archiving
        const archiveResult = await logManagementService.archiveLogs();

        // Log the archive action
        await logManagementService.advancedLogger?.audit('system.logs.archive', 'logs', {
          action: 'archive_old_logs',
          performedBy: user?.id,
          archivedLogs: archiveResult.archivedLogs,
          archiveSize: archiveResult.archiveSize,
          archivePath: archiveResult.archivePath
        }, 'success');

        return NextResponse.json({
          success: true,
          data: archiveResult
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to archive logs',
            code: 'ARCHIVE_LOGS_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// GET /api/logs/management/health - Check log system health
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      // Check log health
      const healthCheck = await logManagementService.checkLogHealth();

      return NextResponse.json({
        success: true,
        data: healthCheck
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check log health',
          code: 'HEALTH_CHECK_FAILED'
        },
        { status: 500 }
      );
    }
  }
);