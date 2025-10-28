import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { logger } from '@/lib/services/monitoringService';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  onLimitReached?: (req: NextRequest, key: string) => void; // Callback when limit is reached
}

// Rate limit store interface
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, count: number, resetTime: number): Promise<void>;
  increment(key: string): Promise<{ count: number; resetTime: number }>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

// In-memory rate limit store (for development)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Check if window has expired
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, count: number, resetTime: number): Promise<void> {
    this.store.set(key, { count, resetTime });
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key);
    const now = Date.now();
    
    if (!existing) {
      const resetTime = now + 15 * 60 * 1000; // 15 minutes
      const data = { count: 1, resetTime };
      this.store.set(key, data);
      return data;
    }
    
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Rate limiting middleware
export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests default
      ...config
    };
    
    this.store = store || new MemoryRateLimitStore();
    
    // Start cleanup interval
    setInterval(() => this.store.cleanup(), this.config.windowMs);
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // Generate key for rate limiting
      const key = this.config.keyGenerator 
        ? this.config.keyGenerator(req)
        : this.getDefaultKey(req);
      
      // Get current count
      const current = await this.store.get(key);
      
      // Check if limit is exceeded
      if (current && current.count >= this.config.maxRequests) {
        if (this.config.onLimitReached) {
          this.config.onLimitReached(req, key);
        }
        
        logger.warn('Rate limit exceeded', {
          key,
          count: current.count,
          max: this.config.maxRequests,
          path: req.nextUrl.pathname,
          ip: req.ip || 'unknown'
        });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: this.config.maxRequests,
              window: this.config.windowMs,
              resetTime: current.resetTime
            }
          },
          { status: 429 }
        );
      }
      
      // Increment counter
      await this.store.increment(key);
      
      return null; // Allow request to proceed
    } catch (error) {
      logger.error('Rate limiting error:', error);
      return null; // Allow request to proceed if rate limiting fails
    }
  }

  private getDefaultKey(req: NextRequest): string {
    // Use IP address as default key
    const ip = req.ip || 
                req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
    
    // Add user agent for better identification
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    return `${ip}:${userAgent}:${req.nextUrl.pathname}`;
  }
}

// Input validation schemas
export const ValidationSchemas = {
  // Symbol validation
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol too long')
    .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    
  // Model validation
  model: z.enum(['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI'], {
    errorMap: () => ({ message: 'Invalid model type' })
  }),
  
  // Timeframe validation
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y'], {
    errorMap: () => ({ message: 'Invalid timeframe' })
  }),
  
  // Prediction request
  predictionRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    model: z.enum(['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI']).optional(),
    timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y']).optional()
  }),
  
  // Sentiment analysis request
  sentimentRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    sources: z.array(z.enum(['news', 'social', 'analyst'])).optional()
  }),
  
  // Risk analysis request
  riskRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y']).optional()
  }),
  
  // Options analysis request
  optionsRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid expiry date format').optional(),
    strikeRange: z.object({
      min: z.number().positive('Minimum strike must be positive'),
      max: z.number().positive('Maximum strike must be positive')
    }).optional()
  }),
  
  // Fund flow analysis request
  fundFlowRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y']).optional()
  }),
  
  // Portfolio request
  portfolioRequest: z.object({
    name: z.string().min(1, 'Portfolio name is required').max(100, 'Name too long'),
    holdings: z.array(z.object({
      symbol: z.string()
        .min(1, 'Symbol is required')
        .max(20, 'Symbol too long')
        .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
      quantity: z.number().int('Quantity must be integer').positive('Quantity must be positive'),
      averagePrice: z.number().positive('Average price must be positive')
    })).optional()
  }),
  
  // News summary request
  newsRequest: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol too long')
      .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format'),
    timeframe: z.enum(['1D', '7D', '30D']).optional(),
    limit: z.number().int('Limit must be integer').min(1, 'Limit must be at least 1').max(100, 'Limit too large').optional()
  })
};

// Input validation middleware
export class InputValidator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = this.formatZodError(error);
        logger.warn('Input validation failed', {
          errors: formattedError,
          input: data
        });
        throw new ValidationError('Input validation failed', formattedError);
      }
      throw error;
    }
  }

  static validateRequest<T>(schema: z.ZodSchema<T>, req: NextRequest): T {
    return this.validate(schema, req);
  }

  static validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
    return this.validate(schema, body);
  }

  static validateQuery<T>(schema: z.ZodSchema<T>, query: URLSearchParams): T {
    const params: Record<string, string> = {};
    query.forEach((value, key) => {
      params[key] = value;
    });
    return this.validate(schema, params);
  }

  private static formatZodError(error: ZodError): Array<{
    field: string;
    message: string;
    code: string;
  }> {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
}

// Custom validation error
export class ValidationError extends Error {
  public readonly details: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(message: string, details: Array<{
    field: string;
    message: string;
    code: string;
  }>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Security middleware
export class SecurityMiddleware {
  // CSRF protection
  static validateCSRF(req: NextRequest): boolean {
    const method = req.method;
    
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
      return true;
    }
    
    const csrfToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;
    
    return csrfToken === cookieToken;
  }

  // Content Security Policy
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https:",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'"
      ].join('; ')
    };
  }

  // Security headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      ...this.getCSPHeaders()
    };
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[^\w\s.-]/g, '') // Keep only alphanumeric, spaces, dots, and hyphens
      .trim();
  }

  // SQL injection prevention
  static preventSQLInjection(input: string): string {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/gi,
      /(''|''|;|--|\/\*|\*\/|xp_|sp_)/gi,
      /(0x[0-9a-fA-F]+)/gi
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }

  // XSS prevention
  static preventXSS(input: string): string {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<\?php/gi,
      /<%[\s\S]*%>/gi
    ];
    
    let sanitized = input;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }
}

// Authentication middleware
export class AuthMiddleware {
  // Validate JWT token
  static validateToken(token: string): boolean {
    try {
      // In a real implementation, you would verify the JWT token
      // For now, just check if it's not empty
      return token && token.length > 0;
    } catch (error) {
      logger.error('Token validation error:', error);
      return false;
    }
  }

  // Extract token from request
  static extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  // Check authentication
  static isAuthenticated(req: NextRequest): boolean {
    const token = this.extractToken(req);
    return this.validateToken(token || '');
  }

  // Check authorization (role-based)
  static isAuthorized(req: NextRequest, requiredRoles: string[]): boolean {
    if (!this.isAuthenticated(req)) {
      return false;
    }
    
    // In a real implementation, you would check user roles from the token
    // For now, just return true
    return true;
  }
}

// Pre-configured rate limiters
export const RateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    onLimitReached: (req, key) => {
      logger.warn('API rate limit reached', { key, path: req.nextUrl.pathname });
    }
  }),
  
  // Auth rate limiter (stricter)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    onLimitReached: (req, key) => {
      logger.warn('Auth rate limit reached', { key, path: req.nextUrl.pathname });
    }
  }),
  
  // Prediction rate limiter
  predictions: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    onLimitReached: (req, key) => {
      logger.warn('Prediction rate limit reached', { key, path: req.nextUrl.pathname });
    }
  }),
  
  // File upload rate limiter
  uploads: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    onLimitReached: (req, key) => {
      logger.warn('Upload rate limit reached', { key, path: req.nextUrl.pathname });
    }
  })
};

// Combined security middleware
export async function securityMiddleware(req: NextRequest): Promise<NextResponse | null> {
  try {
    // 1. Apply rate limiting
    const rateLimitResponse = await RateLimiters.api.middleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // 2. Check authentication for protected routes
    const protectedRoutes = ['/api/predict', '/api/sentiment', '/api/risk', '/api/options', '/api/fundflow', '/api/portfolio'];
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));
    
    if (isProtectedRoute && !AuthMiddleware.isAuthenticated(req)) {
      logger.warn('Unauthorized access attempt', {
        path: req.nextUrl.pathname,
        ip: req.ip || 'unknown'
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }
    
    // 3. Validate CSRF for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !SecurityMiddleware.validateCSRF(req)) {
      logger.warn('CSRF validation failed', {
        path: req.nextUrl.pathname,
        method: req.method
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'CSRF validation failed',
          code: 'CSRF_FAILED'
        },
        { status: 403 }
      );
    }
    
    // 4. Add security headers to response
    const response = NextResponse.next();
    Object.entries(SecurityMiddleware.getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return null; // Allow request to proceed
  } catch (error) {
    logger.error('Security middleware error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}