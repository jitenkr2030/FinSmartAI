import { NextRequest, NextResponse } from 'next/server';
import { databaseBackupService } from '@/lib/services/databaseBackupService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

interface RouteParams {
  params: {
    backupId: string;
  };
}

// GET /api/database/backups/[backupId] - Get backup details
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_LOGS],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { backupId } = context.params;
      
      const backup = await databaseBackupService.getBackupMetadata(backupId);
      if (!backup) {
        return NextResponse.json(
          {
            success: false,
            error: 'Backup not found',
            code: 'BACKUP_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: backup
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get backup',
          code: 'GET_BACKUP_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/database/backups/[backupId] - Delete backup
export const DELETE = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { backupId } = context.params;
      
      await databaseBackupService.deleteBackup(backupId);

      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete backup',
          code: 'DELETE_BACKUP_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/database/backups/[backupId]/verify - Verify backup integrity
export async function POST(req: NextRequest, context: RouteParams) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { backupId } = context.params;
        
        const isValid = await databaseBackupService.verifyBackup(backupId);

        return NextResponse.json({
          success: true,
          data: {
            backupId,
            isValid
          }
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to verify backup',
            code: 'VERIFY_BACKUP_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/database/backups/[backupId]/restore - Restore from backup
export async function PUT(req: NextRequest, context: RouteParams) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { backupId } = context.params;
        const body = await req.json();
        const { force = false, preRestoreScript, postRestoreScript } = body;

        await databaseBackupService.restoreDatabase(backupId, {
          force,
          preRestoreScript,
          postRestoreScript
        });

        return NextResponse.json({
          success: true,
          message: 'Database restore completed successfully'
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to restore database',
            code: 'RESTORE_DATABASE_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}