import { NextRequest, NextResponse } from 'next/server';
import { advancedLogger, LogLevel } from '@/lib/services/advancedLogger';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs - Search and retrieve logs
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse search parameters
      const query = searchParams.get('query') || '';
      const level = searchParams.get('level') as LogLevel | null;
      const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
      const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
      const userId = searchParams.get('userId') || undefined;
      const path = searchParams.get('path') || undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const sortBy = searchParams.get('sortBy') || 'timestamp';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Query logs (this would use the log management service)
      const logs = await advancedLogger.queryLogs({
        level,
        startTime,
        endTime,
        userId,
        path,
        limit,
        offset: (page - 1) * limit
      });

      // Get total count for pagination
      const totalLogs = logs.length; // This would be a count query in real implementation

      return NextResponse.json({
        success: true,
        data: {
          logs,
          pagination: {
            current: page,
            total: Math.ceil(totalLogs / limit),
            count: totalLogs,
            limit
          },
          search: {
            query,
            level,
            startTime,
            endTime,
            userId,
            path
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to search logs',
          code: 'SEARCH_LOGS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/logs - Create a custom log entry
export const POST = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { level, message, meta } = body;

      if (!level || !message) {
        return NextResponse.json(
          {
            success: false,
            error: 'Level and message are required',
            code: 'MISSING_REQUIRED_FIELDS'
          },
          { status: 400 }
        );
      }

      if (!Object.values(LogLevel).includes(level)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid log level',
            code: 'INVALID_LOG_LEVEL'
          },
          { status: 400 }
        );
      }

      // Log the entry
      advancedLogger.log(level, message, {
        ...meta,
        userId: user?.id,
        action: 'manual_log_entry'
      });

      return NextResponse.json({
        success: true,
        message: 'Log entry created successfully'
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create log entry',
          code: 'CREATE_LOG_ENTRY_FAILED'
        },
        { status: 500 }
      );
    }
  }
);