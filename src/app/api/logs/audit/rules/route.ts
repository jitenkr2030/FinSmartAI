import { NextRequest, NextResponse } from 'next/server';
import { auditTrailService } from '@/lib/services/auditTrailService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/logs/audit/rules - Get alert rules
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const rules = await auditTrailService.getAlertRules();

      return NextResponse.json({
        success: true,
        data: {
          rules,
          count: rules.length
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get alert rules',
          code: 'GET_ALERT_RULES_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/logs/audit/rules - Create alert rule
export const POST = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { name, description, conditions, actions, severity, cooldownPeriod = 15 } = body;

      if (!name || !conditions || !actions) {
        return NextResponse.json(
          {
            success: false,
            error: 'name, conditions, and actions are required',
            code: 'MISSING_REQUIRED_FIELDS'
          },
          { status: 400 }
        );
      }

      // Create alert rule
      const ruleId = await auditTrailService.createAlertRule({
        name,
        description: description || '',
        enabled: true,
        conditions,
        actions,
        severity,
        cooldownPeriod
      });

      return NextResponse.json({
        success: true,
        data: {
          ruleId,
          message: 'Alert rule created successfully'
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create alert rule',
          code: 'CREATE_ALERT_RULE_FAILED'
        },
        { status: 500 }
      );
    }
  }
);