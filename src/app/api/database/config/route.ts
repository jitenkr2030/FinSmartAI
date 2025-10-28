import { NextRequest, NextResponse } from 'next/server';
import { databaseConfigurationService } from '@/lib/services/databaseConfigurationService';
import { SecurityMiddlewareFactory, PERMISSIONS } from '@/lib/middleware/securityMiddleware';

// GET /api/database/config - Get database configuration
export const GET = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const config = databaseConfigurationService.getConfiguration();
      
      // Remove sensitive information from response
      const safeConfig = {
        ...config,
        backup: {
          ...config.backup,
          encryption: {
            ...config.backup.encryption,
            key: undefined // Don't return encryption key
          },
          notification: {
            ...config.backup.notification,
            email: config.backup.notification.email ? {
              ...config.backup.notification.email,
              smtp: {
                ...config.backup.notification.email.smtp,
                password: undefined // Don't return SMTP password
              }
            } : undefined
          },
          storage: {
            ...config.backup.storage,
            cloudStorage: config.backup.storage.cloudStorage ? {
              ...config.backup.storage.cloudStorage,
              accessKey: undefined, // Don't return access keys
              secretKey: undefined // Don't return secret keys
            } : undefined
          }
        }
      };

      return NextResponse.json({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get database configuration',
          code: 'GET_CONFIG_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// PUT /api/database/config - Update database configuration
export const PUT = SecurityMiddlewareFactory.withPermissions(
  [PERMISSIONS.MANAGE_SYSTEM],
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { backup, recovery } = body;

      let updatedConfig;

      if (backup) {
        updatedConfig = await databaseConfigurationService.updateBackupConfiguration(backup);
      }

      if (recovery) {
        updatedConfig = await databaseConfigurationService.updateRecoveryConfiguration(recovery);
      }

      if (!backup && !recovery) {
        return NextResponse.json(
          {
            success: false,
            error: 'No configuration updates provided',
            code: 'NO_UPDATES_PROVIDED'
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedConfig
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update database configuration',
          code: 'UPDATE_CONFIG_FAILED'
        },
        { status: 500 }
      );
    }
  }
);

// POST /api/database/config/validate - Validate configuration
export async function POST(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const body = await req.json();
        const { backup, recovery } = body;

        // If configuration is provided, update it temporarily for validation
        if (backup) {
          await databaseConfigurationService.updateBackupConfiguration(backup);
        }

        if (recovery) {
          await databaseConfigurationService.updateRecoveryConfiguration(recovery);
        }

        const validation = await databaseConfigurationService.validateConfiguration();

        return NextResponse.json({
          success: true,
          data: validation
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to validate configuration',
            code: 'VALIDATE_CONFIG_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/database/config/test - Test configuration
export async function PATCH(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const testResult = await databaseConfigurationService.testConfiguration();

        return NextResponse.json({
          success: true,
          data: testResult
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to test configuration',
            code: 'TEST_CONFIG_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// GET /api/database/config/export - Export configuration
export async function OPTIONS(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const exportData = await databaseConfigurationService.exportConfiguration();

        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="database-config.json"'
          }
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to export configuration',
            code: 'EXPORT_CONFIG_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}

// POST /api/database/config/import - Import configuration
export async function IMPORT(req: NextRequest) {
  return SecurityMiddlewareFactory.withPermissions(
    [PERMISSIONS.MANAGE_SYSTEM],
    async (req: NextRequest, user) => {
      try {
        const formData = await req.formData();
        const file = formData.get('config') as File;

        if (!file) {
          return NextResponse.json(
            {
              success: false,
              error: 'No configuration file provided',
              code: 'NO_FILE_PROVIDED'
            },
            { status: 400 }
          );
        }

        const configData = await file.text();
        const importedConfig = await databaseConfigurationService.importConfiguration(configData);

        return NextResponse.json({
          success: true,
          data: importedConfig
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to import configuration',
            code: 'IMPORT_CONFIG_FAILED'
          },
          { status: 500 }
        );
      }
    }
  )(req);
}