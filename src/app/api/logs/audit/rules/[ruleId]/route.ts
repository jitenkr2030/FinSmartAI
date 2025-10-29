import { NextRequest, NextResponse } from 'next/server';
import { auditTrailService } from '@/lib/services/auditTrailService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

interface RouteParams {
  params: {
    ruleId: string;
  };
}

// GET /api/logs/audit/rules/[ruleId] - Get specific alert rule
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { ruleId } = context.params;
      
      const rules = await auditTrailService.getAlertRules();
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
            code: 'RULE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: rule
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get alert rule',
          code: 'GET_ALERT_RULE_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// PUT /api/logs/audit/rules/[ruleId] - Update alert rule
export const PUT = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { ruleId } = context.params;
      const body = await req.json();
      const { name, description, enabled, conditions, actions, severity, cooldownPeriod } = body;

      // Check if rule exists
      const rules = await auditTrailService.getAlertRules();
      const existingRule = rules.find(r => r.id === ruleId);
      
      if (!existingRule) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
            code: 'RULE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Update alert rule
      await auditTrailService.updateAlertRule(ruleId, {
        name,
        description,
        enabled,
        conditions,
        actions,
        severity,
        cooldownPeriod
      });

      return NextResponse.json({
        success: true,
        message: 'Alert rule updated successfully'
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update alert rule',
          code: 'UPDATE_ALERT_RULE_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/logs/audit/rules/[ruleId] - Delete alert rule
export const DELETE = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user, context: RouteParams) => {
    try {
      const { ruleId } = context.params;

      // Check if rule exists
      const rules = await auditTrailService.getAlertRules();
      const existingRule = rules.find(r => r.id === ruleId);
      
      if (!existingRule) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
            code: 'RULE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Delete alert rule
      await auditTrailService.deleteAlertRule(ruleId);

      return NextResponse.json({
        success: true,
        message: 'Alert rule deleted successfully'
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete alert rule',
          code: 'DELETE_ALERT_RULE_FAILED'
        },
        { status: 500 }
      );
    }
  }
);