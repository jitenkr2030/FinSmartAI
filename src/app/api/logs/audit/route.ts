import { NextRequest, NextResponse } from 'next/server';
import { auditTrailService, AuditEventType, AuditResourceType, AuditSeverity } from '@/lib/services/auditTrailService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/audit - Search and retrieve audit logs
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse search parameters
      const userId = searchParams.get('userId') || undefined;
      const eventType = searchParams.get('eventType') as AuditEventType | null;
      const resourceType = searchParams.get('resourceType') as AuditResourceType | null;
      const severity = searchParams.get('severity') as AuditSeverity | null;
      const category = searchParams.get('category') || undefined;
      const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
      const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
      const tags = searchParams.get('tags')?.split(',') || undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const sortBy = searchParams.get('sortBy') || 'timestamp';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Query audit events
      const result = await auditTrailService.queryAuditEvents({
        userId,
        eventType,
        resourceType,
        severity,
        category,
        startTime,
        endTime,
        tags,
        limit,
        offset: (page - 1) * limit,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      return NextResponse.json({
        success: true,
        data: {
          events: result.events,
          pagination: {
            current: page,
            total: Math.ceil(result.total / limit),
            count: result.total,
            limit,
            hasMore: result.hasMore
          },
          search: {
            userId,
            eventType,
            resourceType,
            severity,
            category,
            startTime,
            endTime,
            tags
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to search audit logs',
          code: 'SEARCH_AUDIT_LOGS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/logs/audit - Create audit event
export const POST = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const {
        eventType,
        resourceType,
        resourceId,
        action,
        details,
        result = 'success',
        severity = AuditSeverity.MEDIUM,
        tags = []
      } = body;

      if (!eventType || !resourceType || !action) {
        return NextResponse.json(
          {
            success: false,
            error: 'eventType, resourceType, and action are required',
            code: 'MISSING_REQUIRED_FIELDS'
          },
          { status: 400 }
        );
      }

      if (!Object.values(AuditEventType).includes(eventType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid audit event type',
            code: 'INVALID_EVENT_TYPE'
          },
          { status: 400 }
        );
      }

      if (!Object.values(AuditResourceType).includes(resourceType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid resource type',
            code: 'INVALID_RESOURCE_TYPE'
          },
          { status: 400 }
        );
      }

      // Create audit event
      const auditId = await auditTrailService.logAuditEvent({
        eventType,
        resourceType,
        resourceId,
        action,
        userId: user?.id || 'system',
        details: details || {},
        result,
        severity,
        tags,
        req: req,
        metadata: {
          createdBy: user?.id,
          createdAt: new Date().toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          auditId,
          message: 'Audit event created successfully'
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create audit event',
          code: 'CREATE_AUDIT_EVENT_FAILED'
        },
        { status: 500 }
      );
    }
  }
);