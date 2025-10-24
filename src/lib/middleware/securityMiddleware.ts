import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/services/advancedLogger';

// Security middleware configuration
interface SecurityConfig {
  enableRateLimiting: boolean;
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
const defaultConfig: SecurityConfig = {
  enableRateLimiting: true,
  enableCSRFProtection: true,
  enableSecurityHeaders: true,
  enableAuthValidation: true,
  paths: {
    protected: [
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
      '/api/database': { limit: 10, window: 60 * 1000 },
      '/api/upload': { limit: 5, window: 60 * 60 * 1000 }
    }
  }
};

// Simple rate limiter implementation
class RateLimiter {
  private config: SecurityConfig;
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  async checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
    if (!this.config.rateLimiting.enabled) {
      return null;
    }

    const path = req.nextUrl.pathname;
    const ip = this.getClientIP(req);
    const key = `${ip}:${path}`;

    // Find appropriate limit for this path
    let limit = this.config.rateLimiting.defaultLimit;
    let window = this.config.rateLimiting.defaultWindow;

    for (const [limitPath, limits] of Object.entries(this.config.rateLimiting.customLimits)) {
      if (path.startsWith(limitPath)) {
        limit = limits.limit;
        window = limits.window;
        break;
      }
    }

    const now = Date.now();
    const request = this.requests.get(key);

    // Clean up expired requests
    if (request && now > request.resetTime) {
      this.requests.delete(key);
    }

    // Check if limit exceeded
    if (request && request.count >= limit) {
      logger.warn('Rate limit exceeded', {
        path,
        ip,
        count: request.count,
        limit,
        window
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit,
            window,
            resetTime: request.resetTime
          }
        },
        { status: 429 }
      );
    }

    // Update request count
    if (!request) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + window
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

// Security headers middleware
class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
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
        "object-src 'none'"
      ].join('; ')
    };
  }
}

// Authentication validation middleware
class AuthValidation {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
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

      // Basic token validation (in production, use proper JWT validation)
      try {
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

// Main security middleware
export class SecurityMiddleware {
  private config: SecurityConfig;
  private rateLimiter: RateLimiter;
  private securityHeaders: SecurityHeaders;
  private authValidation: AuthValidation;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.rateLimiter = new RateLimiter(this.config);
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

      // 1. Apply rate limiting
      const rateLimitResponse = await this.rateLimiter.checkRateLimit(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // 2. Validate authentication
      const authResponse = await this.authValidation.validateAuth(req);
      if (authResponse) {
        return authResponse;
      }

      // 3. Add security headers and continue
      const response = NextResponse.next();
      const securityHeaders = this.securityHeaders.getHeaders();
      
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

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
export const securityMiddleware = new SecurityMiddleware();

// Export middleware function for Next.js
export async function middleware(req: NextRequest): Promise<NextResponse> {
  return await securityMiddleware.middleware(req);
}

// Export configuration for customization
export { defaultConfig, SecurityConfig };