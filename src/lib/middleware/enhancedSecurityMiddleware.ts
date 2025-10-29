import { NextRequest, NextResponse } from 'next/server';
import { enhancedSecurityMiddleware } from '@/lib/services/enhancedSecurityService';
import { logger } from '@/lib/services/monitoringService';

// Middleware configuration
interface MiddlewareConfig {
  enableRateLimiting: boolean;
  enableThreatDetection: boolean;
  enableCSRFProtection: boolean;
  enableSecurityHeaders: boolean;
  enableAuthValidation: boolean;
  paths: {
    protected: string[];
    public: string[];
    api: string[];
    static: string[];
  };
  rateLimiting: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindow: number;
    customLimits: Record<string, { limit: number; window: number }>;
  };
}

// Default configuration
const defaultConfig: MiddlewareConfig = {
  enableRateLimiting: true,
  enableThreatDetection: true,
  enableCSRFProtection: true,
  enableSecurityHeaders: true,
  enableAuthValidation: true,
  paths: {
    protected: [
      '/api/predict',
      '/api/sentiment',
      '/api/risk',
      '/api/options',
      '/api/fundflow',
      '/api/portfolio',
      '/api/database',
      '/api/logs',
      '/api/payment',
      '/api/export',
      '/dashboard',
      '/analytics',
      '/billing'
    ],
    public: [
      '/',
      '/auth/signin',
      '/auth/signup',
      '/api/health',
      '/api/models',
      '/docs',
      '/favicon.ico',
      '/_next/static',
      '/_next/image'
    ],
    api: [
      '/api/'
    ],
    static: [
      '/_next/static',
      '/_next/image',
      '/favicon.ico',
      '/images',
      '/fonts'
    ]
  },
  rateLimiting: {
    enabled: true,
    defaultLimit: 100,
    defaultWindow: 15 * 60 * 1000, // 15 minutes
    customLimits: {
      '/api/auth': { limit: 5, window: 15 * 60 * 1000 },
      '/api/predict': { limit: 10, window: 60 * 1000 },
      '/api/sentiment': { limit: 20, window: 60 * 1000 },
      '/api/upload': { limit: 5, window: 60 * 60 * 1000 }
    }
  }
};

// Custom rate limiter for specific paths
class PathBasedRateLimiter {
  private config: MiddlewareConfig;
  private limiters = new Map<string, any>();

  constructor(config: MiddlewareConfig) {
    this.config = config;
    this.initializeLimiters();
  }

  private initializeLimiters() {
    // Initialize rate limiters for different path patterns
    Object.entries(this.config.rateLimiting.customLimits).forEach(([path, limits]) => {
      this.limiters.set(path, {
        requests: new Map<string, { count: number; resetTime: number }>(),
        limit: limits.limit,
        window: limits.window
      });
    });
  }

  async checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
    if (!this.config.rateLimiting.enabled) {
      return null;
    }

    const path = req.nextUrl.pathname;
    const ip = this.getClientIP(req);
    const key = `${ip}:${path}`;

    // Find appropriate limiter for this path
    let limiter = null;
    for (const [limiterPath, limiterConfig] of this.limiters.entries()) {
      if (path.startsWith(limiterPath)) {
        limiter = limiterConfig;
        break;
      }
    }

    // Use default limiter if no specific one found
    if (!limiter) {
      limiter = {
        requests: new Map<string, { count: number; resetTime: number }>(),
        limit: this.config.rateLimiting.defaultLimit,
        window: this.config.rateLimiting.defaultWindow
      };
    }

    const now = Date.now();
    const request = limiter.requests.get(key);

    // Clean up expired requests
    if (request && now > request.resetTime) {
      limiter.requests.delete(key);
    }

    // Check if limit exceeded
    if (request && request.count >= limiter.limit) {
      logger.warn('Rate limit exceeded', {
        path,
        ip,
        count: request.count,
        limit: limiter.limit,
        window: limiter.window
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: limiter.limit,
            window: limiter.window,
            resetTime: request.resetTime
          }
        },
        { status: 429 }
      );
    }

    // Update request count
    if (!request) {
      limiter.requests.set(key, {
        count: 1,
        resetTime: now + limiter.window
      });
    } else {
      request.count++;
    }

    return null;
  }

  private getClientIP(req: NextRequest): string {
    return req.ip || 
           req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
  }
}

// CSRF protection middleware
class CSRFProtection {
  private config: MiddlewareConfig;

  constructor(config: MiddlewareConfig) {
    this.config = config;
  }

  validateCSRF(req: NextRequest): boolean {
    if (!this.config.enableCSRFProtection) {
      return true;
    }

    const method = req.method;
    
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
      return true;
    }

    // Skip for API requests that use bearer tokens
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return true;
    }

    const csrfToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;

    return csrfToken === cookieToken;
  }

  generateCSRFToken(): string {
    return crypto.randomUUID();
  }
}

// Security headers middleware
class SecurityHeaders {
  private config: MiddlewareConfig;

  constructor(config: MiddlewareConfig) {
    this.config = config;
  }

  getHeaders(): Record<string, string> {
    if (!this.config.enableSecurityHeaders) {
      return {};
    }

    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https:",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "require-trusted-types-for 'script'"
      ].join('; ')
    };
  }
}

// Authentication validation middleware
class AuthValidation {
  private config: MiddlewareConfig;

  constructor(config: MiddlewareConfig) {
    this.config = config;
  }

  async validateAuth(req: NextRequest): Promise<NextResponse | null> {
    if (!this.config.enableAuthValidation) {
      return null;
    }

    const path = req.nextUrl.pathname;
    const isProtectedPath = this.config.paths.protected.some(protectedPath => 
      path.startsWith(protectedPath)
    );

    const isPublicPath = this.config.paths.public.some(publicPath => 
      path.startsWith(publicPath)
    );

    // Skip validation for public paths
    if (isPublicPath) {
      return null;
    }

    // Require authentication for protected paths
    if (isProtectedPath) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        logger.warn('Unauthorized access attempt', { path });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // Validate token (simplified - in production, use proper JWT validation)
      try {
        // Here you would validate the JWT token
        // For now, just check if it's not empty
        if (!token || token.length < 10) {
          throw new Error('Invalid token');
        }
      } catch (error) {
        logger.warn('Invalid token', { path, error });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      }
    }

    return null;
  }
}

// Main enhanced security middleware
export class EnhancedSecurityMiddleware {
  private config: MiddlewareConfig;
  private rateLimiter: PathBasedRateLimiter;
  private csrfProtection: CSRFProtection;
  private securityHeaders: SecurityHeaders;
  private authValidation: AuthValidation;

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.rateLimiter = new PathBasedRateLimiter(this.config);
    this.csrfProtection = new CSRFProtection(this.config);
    this.securityHeaders = new SecurityHeaders(this.config);
    this.authValidation = new AuthValidation(this.config);
  }

  async middleware(req: NextRequest): Promise<NextResponse> {
    try {
      const path = req.nextUrl.pathname;

      // Skip middleware for static files
      const isStaticPath = this.config.paths.static.some(staticPath => 
        path.startsWith(staticPath)
      );

      if (isStaticPath) {
        return NextResponse.next();
      }

      // 1. Apply enhanced security middleware (threat detection, etc.)
      if (this.config.enableThreatDetection) {
        const enhancedResponse = await enhancedSecurityMiddleware.middleware(req);
        if (enhancedResponse) {
          return enhancedResponse;
        }
      }

      // 2. Apply rate limiting
      const rateLimitResponse = await this.rateLimiter.checkRateLimit(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // 3. Validate authentication
      const authResponse = await this.authValidation.validateAuth(req);
      if (authResponse) {
        return authResponse;
      }

      // 4. Validate CSRF
      if (!this.csrfProtection.validateCSRF(req)) {
        logger.warn('CSRF validation failed', { path, method: req.method });
        
        return NextResponse.json(
          {
            success: false,
            error: 'CSRF validation failed',
            code: 'CSRF_FAILED'
          },
          { status: 403 }
        );
      }

      // 5. Add security headers and continue
      const response = NextResponse.next();
      const securityHeaders = this.securityHeaders.getHeaders();
      
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add CSRF token for safe methods if not present
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const existingToken = req.cookies.get('csrf-token')?.value;
        if (!existingToken) {
          const csrfToken = this.csrfProtection.generateCSRFToken();
          response.cookies.set('csrf-token', csrfToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600 // 1 hour
          });
        }
      }

      return response;
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
}

// Export singleton instance
export const enhancedSecurityMiddlewareInstance = new EnhancedSecurityMiddleware();

// Export middleware function for Next.js
export async function middleware(req: NextRequest): Promise<NextResponse> {
  return await enhancedSecurityMiddlewareInstance.middleware(req);
}

// Export configuration for customization
export { defaultConfig, MiddlewareConfig };