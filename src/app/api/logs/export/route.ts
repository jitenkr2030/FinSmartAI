import { NextRequest, NextResponse } from 'next/server';
import { logManagementService } from '@/lib/services/logManagementService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/export - Export logs
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse export parameters
      const format = (searchParams.get('format') || 'json') as 'json' | 'csv' | 'xml' | 'txt';
      const compression = searchParams.get('compression') === 'true';
      const includeSensitive = searchParams.get('includeSensitive') === 'true';
      
      // Parse filters
      const level = searchParams.get('level')?.split(',') as any[] || undefined;
      const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
      const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
      const userId = searchParams.get('userId')?.split(',') || undefined;
      const statusCode = searchParams.get('statusCode')?.split(',').map(Number) || undefined;

      // Export logs
      const exportResult = await logManagementService.exportLogs({
        format,
        compression,
        includeSensitiveData: includeSensitive,
        filters: {
          level,
          startTime,
          endTime,
          userId,
          statusCode
        }
      });

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', exportResult.format);
      headers.set('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      headers.set('Content-Length', exportResult.size.toString());

      // Return the exported data
      return new NextResponse(exportResult.data, {
        status: 200,
        headers
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to export logs',
          code: 'EXPORT_LOGS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);