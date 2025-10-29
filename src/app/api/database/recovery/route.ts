import { NextRequest, NextResponse } from 'next/server';
import { databaseRecoveryService } from '@/lib/services/databaseRecoveryService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/database/recovery - List recovery plans
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_LOGS],
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') as 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back' | null;

      const plans = await databaseRecoveryService.listRecoveryPlans();
      
      // Filter by status if specified
      const filteredPlans = status 
        ? plans.filter(plan => plan.status === status)
        : plans;

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          plans: paginatedPlans,
          pagination: {
            current: page,
            total: Math.ceil(filteredPlans.length / limit),
            count: filteredPlans.length,
            limit
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to list recovery plans',
          code: 'LIST_RECOVERY_PLANS_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/database/recovery - Create recovery plan
export const POST = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { 
        backupId, 
        targetDatabase = 'default', 
        strategy = 'full', 
        tables = [], 
        force = false 
      } = body;

      if (!backupId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Backup ID is required',
            code: 'BACKUP_ID_REQUIRED'
          },
          { status: 400 }
        );
      }

      if (!['full', 'partial', 'point_in_time'].includes(strategy)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid recovery strategy',
            code: 'INVALID_RECOVERY_STRATEGY'
          },
          { status: 400 }
        );
      }

      const plan = await databaseRecoveryService.createRecoveryPlan({
        backupId,
        targetDatabase,
        strategy,
        tables,
        force
      });

      return NextResponse.json({
        success: true,
        data: plan
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create recovery plan',
          code: 'CREATE_RECOVERY_PLAN_FAILED'
        },
        { status: 500 }
      );
    }
  }
);