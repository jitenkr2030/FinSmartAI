import { NextRequest, NextResponse } from 'next/server';
import { databaseBackupService } from '@/lib/services/databaseBackupService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/database/backups - List all backups
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_LOGS],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const type = searchParams.get('type') as 'full' | 'incremental' | 'differential' | null;

      const backups = await databaseBackupService.listBackups();
      
      // Filter by type if specified
      const filteredBackups = type 
        ? backups.filter(backup => backup.type === type)
        : backups;

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBackups = filteredBackups.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          backups: paginatedBackups,
          pagination: {
            current: page,
            total: Math.ceil(filteredBackups.length / limit),
            count: filteredBackups.length,
            limit
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to list backups',
          code: 'LIST_BACKUPS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/database/backups - Create a new backup
export const POST = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { type = 'full', priority = 'normal' } = body;

      if (!['full', 'incremental', 'differential'].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid backup type',
            code: 'INVALID_BACKUP_TYPE'
          },
          { status: 400 }
        );
      }

      if (!['high', 'normal', 'low'].includes(priority)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid priority',
            code: 'INVALID_PRIORITY'
          },
          { status: 400 }
        );
      }

      let backup;
      if (type === 'full') {
        backup = await databaseBackupService.createFullBackup(priority);
      } else if (type === 'incremental') {
        backup = await databaseBackupService.createIncrementalBackup(priority);
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Differential backups not yet implemented',
            code: 'NOT_IMPLEMENTED'
          },
          { status: 501 }
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
          error: 'Failed to create backup',
          code: 'CREATE_BACKUP_FAILED'
        },
        { status: 500 }
      );
    }
  }
);