import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createValidationError } from '@/lib/validations';

// Common validation schemas
export const schemas = {
  // User schemas
  user: {
    create: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(['user', 'admin', 'moderator']).optional()
    }),
    update: z.object({
      email: z.string().email().optional(),
      name: z.string().min(2).optional(),
      role: z.enum(['user', 'admin', 'moderator']).optional()
    }),
    login: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  },
  
  // Database schemas
  database: {
    backup: z.object({
      type: z.enum(['full', 'incremental', 'differential']),
      priority: z.enum(['high', 'normal', 'low']).optional()
    }),
    restore: z.object({
      backupId: z.string(),
      force: z.boolean().optional(),
      preRestoreScript: z.string().optional(),
      postRestoreScript: z.string().optional()
    }),
    config: z.object({
      storage: z.object({
        localPath: z.string(),
        cloudStorage: z.object({
          provider: z.enum(['aws', 'gcp', 'azure']),
          bucket: z.string(),
          region: z.string()
        }).optional()
      }).optional(),
      schedule: z.object({
        enabled: z.boolean(),
        interval: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
        retention: z.object({
          daily: z.number(),
          weekly: z.number(),
          monthly: z.number()
        })
      }).optional()
    })
  },
  
  // Log schemas
  logs: {
    query: z.object({
      level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      userId: z.string().optional(),
      path: z.string().optional(),
      limit: z.number().min(1).max(1000).optional(),
      offset: z.number().min(0).optional()
    }),
    export: z.object({
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
      format: z.enum(['json', 'csv'])
    }),
    audit: z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      result: z.enum(['success', 'failure', 'partial']).optional(),
      limit: z.number().min(1).max(1000).optional(),
      offset: z.number().min(0).optional()
    })
  },
  
  // Payment schemas
  payment: {
    intent: z.object({
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      paymentMethod: z.string(),
      description: z.string().optional()
    }),
    webhook: z.object({
      id: z.string(),
      status: z.string(),
      amount: z.number(),
      currency: z.string()
    })
  },
  
  // Sentiment analysis schemas
  sentiment: {
    analyze: z.object({
      text: z.string().min(1).max(5000),
      source: z.string().optional(),
      language: z.string().default('en')
    }),
    batch: z.object({
      texts: z.array(z.string().min(1).max(5000)).max(100),
      source: z.string().optional(),
      language: z.string().default('en')
    })
  },
  
  // Common schemas
  common: {
    pagination: z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20)
    }),
    id: z.object({
      id: z.string().min(1)
    }),
    dateRange: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    })
  }
};

export interface ValidationMiddlewareOptions {
  schema: z.ZodSchema<any>;
  source?: 'body' | 'query' | 'params';
  strict?: boolean;
  onError?: (error: any) => NextResponse;
}

export class ValidationMiddleware {
  static withSchema(options: ValidationMiddlewareOptions) {
    return async (req: NextRequest, context?: any) => {
      try {
        const { schema, source = 'body', strict = true, onError } = options;
        
        let data: any;
        
        // Extract data based on source
        switch (source) {
          case 'body':
            if (req.method === 'GET') {
              return NextResponse.json(
                { success: false, error: 'Cannot validate body for GET request' },
                { status: 400 }
              );
            }
            data = await req.json();
            break;
            
          case 'query':
            const url = new URL(req.url);
            data = Object.fromEntries(url.searchParams);
            break;
            
          case 'params':
            data = context?.params || {};
            break;
            
          default:
            return NextResponse.json(
              { success: false, error: 'Invalid validation source' },
              { status: 400 }
            );
        }
        
        // Validate data against schema
        const validatedData = await schema.parseAsync(data);
        
        // Add validated data to request context
        if (context) {
          context.validatedData = validatedData;
        }
        
        // If no context provided, return validated data
        if (!context) {
          return { success: true, data: validatedData };
        }
        
        return null; // Continue to next handler
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          if (onError) {
            return onError(error);
          }
          
          const validationError = createValidationError(error);
          return NextResponse.json(validationError, { status: 400 });
        }
        
        console.error('Validation middleware error:', error);
        return NextResponse.json(
          { success: false, error: 'Internal validation error' },
          { status: 500 }
        );
      }
    };
  }
  
  static withBodySchema(schema: z.ZodSchema<any>, options?: Omit<ValidationMiddlewareOptions, 'source'>) {
    return ValidationMiddleware.withSchema({ schema, source: 'body', ...options });
  }
  
  static withQuerySchema(schema: z.ZodSchema<any>, options?: Omit<ValidationMiddlewareOptions, 'source'>) {
    return ValidationMiddleware.withSchema({ schema, source: 'query', ...options });
  }
  
  static withParamsSchema(schema: z.ZodSchema<any>, options?: Omit<ValidationMiddlewareOptions, 'source'>) {
    return ValidationMiddleware.withSchema({ schema, source: 'params', ...options });
  }
  
  static validateRequest(
    bodySchema?: z.ZodSchema<any>,
    querySchema?: z.ZodSchema<any>,
    paramsSchema?: z.ZodSchema<any>
  ) {
    return async (req: NextRequest, context?: any) => {
      try {
        const validatedData: any = {};
        
        // Validate body if provided
        if (bodySchema && req.method !== 'GET') {
          const bodyData = await req.json();
          validatedData.body = await bodySchema.parseAsync(bodyData);
        }
        
        // Validate query if provided
        if (querySchema) {
          const url = new URL(req.url);
          const queryData = Object.fromEntries(url.searchParams);
          validatedData.query = await querySchema.parseAsync(queryData);
        }
        
        // Validate params if provided
        if (paramsSchema && context?.params) {
          validatedData.params = await paramsSchema.parseAsync(context.params);
        }
        
        // Add validated data to context
        if (context) {
          context.validatedData = validatedData;
        }
        
        return null; // Continue to next handler
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationError = createValidationError(error);
          return NextResponse.json(validationError, { status: 400 });
        }
        
        console.error('Request validation error:', error);
        return NextResponse.json(
          { success: false, error: 'Internal validation error' },
          { status: 500 }
        );
      }
    };
  }
}

// Helper function to create route handlers with validation
export function createValidatedRouteHandler(
  handler: (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse,
  options: {
    bodySchema?: z.ZodSchema<any>;
    querySchema?: z.ZodSchema<any>;
    paramsSchema?: z.ZodSchema<any>;
  }
) {
  return async (req: NextRequest, context: any) => {
    // Run validation middleware
    const validationError = await ValidationMiddleware.validateRequest(
      options.bodySchema,
      options.querySchema,
      options.paramsSchema
    )(req, context);
    
    if (validationError) {
      return validationError;
    }
    
    // Call the original handler
    return await handler(req, context);
  };
}

// Higher-order function for validating API routes
export function withValidation<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse,
  schemas: {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
  }
) {
  return async (req: NextRequest, context: any) => {
    try {
      const validatedData: any = {};
      
      // Validate body if schema provided
      if (schemas.body && req.method !== 'GET') {
        const body = await req.json();
        validatedData.body = await schemas.body.parseAsync(body);
      }
      
      // Validate query if schema provided
      if (schemas.query) {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        validatedData.query = await schemas.query.parseAsync(query);
      }
      
      // Validate params if schema provided
      if (schemas.params && context?.params) {
        validatedData.params = await schemas.params.parseAsync(context.params);
      }
      
      // Add validated data to context
      context.validatedData = validatedData;
      
      // Call the original handler
      return await handler(req, context);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = createValidationError(error);
        return NextResponse.json(validationError, { status: 400 });
      }
      
      console.error('Validation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal validation error' },
        { status: 500 }
      );
    }
  };
}