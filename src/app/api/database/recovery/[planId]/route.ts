import { NextRequest, NextResponse } from 'next/server';
import { databaseRecoveryService } from '@/lib/services/databaseRecoveryService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

interface RouteParams {
  params: {
    planId: string;
  };
}

// GET /api/database/recovery/[planId] - Get recovery plan details
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_LOGS],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { planId } = context.params;
      
      const plan = await databaseRecoveryService.getRecoveryPlan(planId);
      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            error: 'Recovery plan not found',
            code: 'RECOVERY_PLAN_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: plan
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get recovery plan',
          code: 'GET_RECOVERY_PLAN_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/database/recovery/[planId] - Delete recovery plan
export const DELETE = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { planId } = context.params;
      
      await databaseRecoveryService.deleteRecoveryPlan(planId);

      return NextResponse.json({
        success: true,
        message: 'Recovery plan deleted successfully'
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete recovery plan',
          code: 'DELETE_RECOVERY_PLAN_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/database/recovery/[planId]/execute - Execute recovery plan
export async function POST(req: NextRequest, context: RouteParams) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { planId } = context.params;
        const body = await req.json();
        const { dryRun = false, force = false, maxRetries } = body;

        const plan = await databaseRecoveryService.executeRecoveryPlan(planId, {
          dryRun,
          force,
          maxRetries
        });

        return NextResponse.json({
          success: true,
          data: plan
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to execute recovery plan',
            code: 'EXECUTE_RECOVERY_PLAN_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/database/recovery/[planId]/rollback - Rollback recovery
export async function PUT(req: NextRequest, context: RouteParams) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { planId } = context.params;
        
        const plan = await databaseRecoveryService.rollbackRecovery(planId);

        return NextResponse.json({
          success: true,
          data: plan
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to rollback recovery',
            code: 'ROLLBACK_RECOVERY_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/database/recovery/[planId]/validate - Validate recovery plan
export async function PATCH(req: NextRequest, context: RouteParams) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const { planId } = context.params;
        
        const validation = await databaseRecoveryService.validateRecoveryPlan(planId);

        return NextResponse.json({
          success: true,
          data: validation
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to validate recovery plan',
            code: 'VALIDATE_RECOVERY_PLAN_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}