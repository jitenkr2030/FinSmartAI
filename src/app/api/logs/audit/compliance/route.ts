import { NextRequest, NextResponse } from 'next/server';
import { auditTrailService } from '@/lib/services/auditTrailService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/audit/compliance - Get compliance standards
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const standards = await auditTrailService.getComplianceStandards();

      return NextResponse.json({
        success: true,
        data: {
          standards,
          count: standards.length
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get compliance standards',
          code: 'GET_COMPLIANCE_STANDARDS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/logs/audit/compliance/[standardId]/enable - Enable compliance standard
export async function POST(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const standardId = searchParams.get('standardId');

        if (!standardId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Standard ID is required',
              code: 'STANDARD_ID_REQUIRED'
            },
            { status: 400 }
          );
        }

        await auditTrailService.enableComplianceStandard(standardId);

        return NextResponse.json({
          success: true,
          message: `Compliance standard ${standardId} enabled successfully`
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to enable compliance standard',
            code: 'ENABLE_COMPLIANCE_STANDARD_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/logs/audit/compliance/[standardId]/disable - Disable compliance standard
export async function PUT(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const standardId = searchParams.get('standardId');

        if (!standardId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Standard ID is required',
              code: 'STANDARD_ID_REQUIRED'
            },
            { status: 400 }
          );
        }

        await auditTrailService.disableComplianceStandard(standardId);

        return NextResponse.json({
          success: true,
          message: `Compliance standard ${standardId} disabled successfully`
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to disable compliance standard',
            code: 'DISABLE_COMPLIANCE_STANDARD_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// GET /api/logs/audit/compliance/[standardId]/validate - Validate compliance standard
export async function GET(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.VIEW_LOGS, PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const standardId = searchParams.get('standardId');

        if (!standardId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Standard ID is required',
              code: 'STANDARD_ID_REQUIRED'
            },
            { status: 400 }
          );
        }

        const validation = await auditTrailService.validateCompliance(standardId);

        return NextResponse.json({
          success: true,
          data: validation
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to validate compliance standard',
            code: 'VALIDATE_COMPLIANCE_STANDARD_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}