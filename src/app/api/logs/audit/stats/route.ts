import { NextRequest, NextResponse } from 'next/server';
import { auditTrailService } from '@/lib/services/auditTrailService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/audit/stats - Get audit statistics
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse filter parameters
      const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
      const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
      const userId = searchParams.get('userId') || undefined;
      const resourceType = searchParams.get('resourceType') || undefined;

      // Get audit statistics
      const stats = await auditTrailService.getAuditStatistics({
        startTime,
        endTime,
        userId,
        resourceType: resourceType as any
      });

      return NextResponse.json({
        success: true,
        data: {
          statistics: stats,
          summary: {
            totalEvents: stats.totalEvents,
            successRate: stats.successRate,
            uniqueUsers: stats.topUsers.length,
            uniqueResources: stats.topResources.length,
            timeRange: {
              start: startTime,
              end: endTime
            }
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get audit statistics',
          code: 'GET_AUDIT_STATS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);