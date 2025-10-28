import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { logger } from '@/lib/services/monitoringService';
import { SecurityMiddleware, RateLimiter, RateLimiters } from './securityService';

// Enhanced rate limiting with Redis support
interface EnhancedRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextRequest, key: string) => void;
  burstLimit?: number; // Allow burst requests
  distributed?: boolean; // Use distributed rate limiting
  whiteList?: string[]; // IP whitelist
  blackList?: string[]; // IP blacklist
}

// Advanced threat detection patterns
interface ThreatDetectionConfig {
  enableBotDetection: boolean;
  enableSuspiciousPatternDetection: boolean;
  enableGeolocationBlocking?: boolean;
  blockedCountries?: string[];
  suspiciousUserAgents?: string[];
  suspiciousPatterns?: RegExp[];
  requestThreshold?: number;
  timeWindow?: number;
}

// Request analysis interface
interface RequestAnalysis {
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  isSuspicious: boolean;
  threatScore: number;
  detectedThreats: string[];
}

// Enhanced security event types
type SecurityEventType = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_REQUEST'
  | 'POTENTIAL_ATTACK'
  | 'AUTH_FAILURE'
  | 'CSRF_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'BOT_DETECTED'
  | 'DDOS_ATTEMPT';

interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  request: RequestAnalysis;
  details: Record<string, any>;
}

// Enhanced rate limiter with advanced features
export class EnhancedRateLimiter extends RateLimiter {
  private config: EnhancedRateLimitConfig;
  private requestHistory = new Map<string, number[]>();
  private threatDetector: ThreatDetector;

  constructor(config: EnhancedRateLimitConfig, threatDetector?: ThreatDetector) {
    super(config);
    this.config = config;
    this.threatDetector = threatDetector || new ThreatDetector();
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // 1. Check IP whitelist/blacklist
      const ip = this.getClientIP(req);
      if (this.config.blackList?.includes(ip)) {
        return this.blockRequest('IP blacklisted', req);
      }

      if (this.config.whiteList && !this.config.whiteList.includes(ip)) {
        return this.blockRequest('IP not whitelisted', req);
      }

      // 2. Analyze request for threats
      const analysis = await this.threatDetector.analyzeRequest(req);
      if (analysis.isSuspicious) {
        logger.warn('Suspicious request detected', analysis);
        
        if (analysis.threatScore > 0.8) {
          return this.blockRequest('High threat score', req);
        }
      }

      // 3. Generate rate limit key
      const key = this.config.keyGenerator 
        ? this.config.keyGenerator(req)
        : this.getEnhancedKey(req);

      // 4. Check burst limit first
      if (this.config.burstLimit) {
        const burstKey = `${key}:burst`;
        const burstCount = await this.getBurstCount(burstKey);
        
        if (burstCount >= this.config.burstLimit) {
          return this.rateLimitResponse(key, 'Burst limit exceeded');
        }
      }

      // 5. Check standard rate limit
      const current = await this.store.get(key);
      
      if (current && current.count >= this.config.maxRequests) {
        if (this.config.onLimitReached) {
          this.config.onLimitReached(req, key);
        }
        
        logger.warn('Rate limit exceeded', {
          key,
          count: current.count,
          max: this.config.maxRequests,
          path: req.nextUrl.pathname,
          ip: req.ip || 'unknown',
          threatScore: analysis.threatScore
        });
        
        return this.rateLimitResponse(key, 'Rate limit exceeded');
      }

      // 6. Increment counter
      await this.store.increment(key);

      // 7. Update request history for analysis
      this.updateRequestHistory(key);

      return null;
    } catch (error) {
      logger.error('Enhanced rate limiting error:', error);
      return null;
    }
  }

  private getClientIP(req: NextRequest): string {
    return req.ip || 
           req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
  }

  private getEnhancedKey(req: NextRequest): string {
    const ip = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const path = req.nextUrl.pathname;
    
    // Include more context for better rate limiting
    return `${ip}:${userAgent}:${path}`;
  }

  private async getBurstCount(key: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - 1000; // 1 second burst window
    
    const history = this.requestHistory.get(key) || [];
    const recentRequests = history.filter(time => time > windowStart);
    
    return recentRequests.length;
  }

  private updateRequestHistory(key: string): void {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];
    
    history.push(now);
    
    // Keep only last 1000 requests
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    this.requestHistory.set(key, history);
  }

  private blockRequest(reason: string, req: NextRequest): NextResponse {
    logger.warn('Request blocked', { reason, path: req.nextUrl.pathname });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        details: { reason }
      },
      { status: 403 }
    );
  }

  private rateLimitResponse(key: string, message: string): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: this.config.maxRequests,
          window: this.config.windowMs,
          key
        }
      },
      { status: 429 }
    );
  }
}

// Threat detection system
export class ThreatDetector {
  private config: ThreatDetectionConfig;
  private requestLog: RequestAnalysis[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = new Map<string, number>();

  constructor(config?: Partial<ThreatDetectionConfig>) {
    this.config = {
      enableBotDetection: true,
      enableSuspiciousPatternDetection: true,
      suspiciousUserAgents: [
        'bot',
        'crawler',
        'spider',
        'scanner',
        'test',
        'curl',
        'wget',
        'python-requests'
      ],
      suspiciousPatterns: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /union.*select/gi,
        /drop.*table/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /\.\.\/\.\//gi,
        /etc\/passwd/gi,
        /cmd\.exe/gi,
        /powershell/gi
      ],
      requestThreshold: 100,
      timeWindow: 60 * 1000, // 1 minute
      ...config
    };
  }

  async analyzeRequest(req: NextRequest): Promise<RequestAnalysis> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const method = req.method;
    const path = req.nextUrl.pathname;
    
    // Extract headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse body if available
    let body: any;
    try {
      if (req.body) {
        const bodyText = await req.text();
        body = JSON.parse(bodyText);
      }
    } catch (error) {
      // Body parsing failed, might be malicious
      body = null;
    }

    const analysis: RequestAnalysis = {
      ip,
      userAgent,
      method,
      path,
      headers,
      body,
      timestamp: Date.now(),
      isSuspicious: false,
      threatScore: 0,
      detectedThreats: []
    };

    // Run threat detection
    if (this.config.enableBotDetection) {
      this.detectBots(analysis);
    }

    if (this.config.enableSuspiciousPatternDetection) {
      this.detectSuspiciousPatterns(analysis);
    }

    this.detectRateAbuse(analysis);
    this.detectAnomalousBehavior(analysis);

    return analysis;
  }

  private getClientIP(req: NextRequest): string {
    return req.ip || 
           req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
  }

  private detectBots(analysis: RequestAnalysis): void {
    const userAgent = analysis.userAgent.toLowerCase();
    
    for (const botPattern of this.config.suspiciousUserAgents || []) {
      if (userAgent.includes(botPattern.toLowerCase())) {
        analysis.isSuspicious = true;
        analysis.threatScore += 0.3;
        analysis.detectedThreats.push('BOT_DETECTED');
        break;
      }
    }

    // Check for missing or suspicious headers
    const requiredHeaders = ['accept', 'accept-language'];
    const missingHeaders = requiredHeaders.filter(header => !analysis.headers[header]);
    
    if (missingHeaders.length > 0) {
      analysis.isSuspicious = true;
      analysis.threatScore += 0.2;
      analysis.detectedThreats.push('MISSING_HEADERS');
    }
  }

  private detectSuspiciousPatterns(analysis: RequestAnalysis): void {
    const checkString = (str: string) => {
      for (const pattern of this.config.suspiciousPatterns || []) {
        if (pattern.test(str)) {
          return true;
        }
      }
      return false;
    };

    // Check path
    if (checkString(analysis.path)) {
      analysis.isSuspicious = true;
      analysis.threatScore += 0.5;
      analysis.detectedThreats.push('SUSPICIOUS_PATH');
    }

    // Check headers
    for (const [key, value] of Object.entries(analysis.headers)) {
      if (checkString(key) || checkString(value)) {
        analysis.isSuspicious = true;
        analysis.threatScore += 0.4;
        analysis.detectedThreats.push('SUSPICIOUS_HEADERS');
        break;
      }
    }

    // Check body
    if (analysis.body && typeof analysis.body === 'object') {
      const bodyStr = JSON.stringify(analysis.body);
      if (checkString(bodyStr)) {
        analysis.isSuspicious = true;
        analysis.threatScore += 0.6;
        analysis.detectedThreats.push('SUSPICIOUS_BODY');
      }
    }
  }

  private detectRateAbuse(analysis: RequestAnalysis): void {
    const now = Date.now();
    const windowStart = now - (this.config.timeWindow || 60 * 1000);
    
    // Filter recent requests from same IP
    const recentRequests = this.requestLog.filter(req => 
      req.ip === analysis.ip && req.timestamp > windowStart
    );

    if (recentRequests.length > (this.config.requestThreshold || 100)) {
      analysis.isSuspicious = true;
      analysis.threatScore += 0.7;
      analysis.detectedThreats.push('RATE_ABUSE');
    }

    // Add to request log
    this.requestLog.push(analysis);
    
    // Keep log size manageable
    if (this.requestLog.length > 10000) {
      this.requestLog.splice(0, this.requestLog.length - 10000);
    }
  }

  private detectAnomalousBehavior(analysis: RequestAnalysis): void {
    // Check for unusual request methods
    const unusualMethods = ['TRACE', 'CONNECT', 'OPTIONS'];
    if (unusualMethods.includes(analysis.method)) {
      analysis.isSuspicious = true;
      analysis.threatScore += 0.3;
      analysis.detectedThreats.push('UNUSUAL_METHOD');
    }

    // Check for large payloads
    const contentLength = parseInt(analysis.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      analysis.isSuspicious = true;
      analysis.threatScore += 0.4;
      analysis.detectedThreats.push('LARGE_PAYLOAD');
    }

    // Check for unusual content types
    const contentType = analysis.headers['content-type'] || '';
    const unusualTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
    if (unusualTypes.some(type => contentType.includes(type))) {
      analysis.isSuspicious = true;
      analysis.threatScore += 0.2;
      analysis.detectedThreats.push('UNUSUAL_CONTENT_TYPE');
    }
  }

  blockIP(ip: string, reason: string, duration: number = 60 * 60 * 1000): void {
    this.blockedIPs.add(ip);
    logger.warn('IP blocked', { ip, reason, duration });
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }
}

// Security event logger
export class SecurityEventLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  logEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    // Keep array size manageable
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }

    // Log to monitoring system
    logger.warn('Security event', {
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      path: event.request.path,
      ip: event.request.ip,
      threatScore: event.request.threatScore,
      details: event.details
    });

    // Alert for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      this.alertSecurityTeam(event);
    }
  }

  getEvents(type?: SecurityEventType, severity?: string): SecurityEvent[] {
    return this.events.filter(event => {
      if (type && event.type !== type) return false;
      if (severity && event.severity !== severity) return false;
      return true;
    });
  }

  private alertSecurityTeam(event: SecurityEvent): void {
    // In a real implementation, this would send alerts to Slack, email, etc.
    console.error('SECURITY ALERT:', {
      type: event.type,
      severity: event.severity,
      path: event.request.path,
      ip: event.request.ip,
      timestamp: new Date(event.timestamp).toISOString()
    });
  }
}

// Enhanced security middleware
export class EnhancedSecurityMiddleware {
  private threatDetector: ThreatDetector;
  private eventLogger: SecurityEventLogger;
  private rateLimiters: Map<string, EnhancedRateLimiter> = new Map();

  constructor() {
    this.threatDetector = new ThreatDetector();
    this.eventLogger = new SecurityEventLogger();
    this.initializeRateLimiters();
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // 1. Analyze request for threats
      const analysis = await this.threatDetector.analyzeRequest(req);
      
      // 2. Log security events if suspicious
      if (analysis.isSuspicious) {
        this.eventLogger.logEvent({
          type: 'SUSPICIOUS_REQUEST',
          severity: analysis.threatScore > 0.7 ? 'high' : 'medium',
          timestamp: Date.now(),
          request: analysis,
          details: { threatScore: analysis.threatScore }
        });
      }

      // 3. Block high-threat requests
      if (analysis.threatScore > 0.8) {
        this.eventLogger.logEvent({
          type: 'POTENTIAL_ATTACK',
          severity: 'critical',
          timestamp: Date.now(),
          request: analysis,
          details: { threatScore: analysis.threatScore }
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            code: 'THREAT_DETECTED'
          },
          { status: 403 }
        );
      }

      // 4. Apply appropriate rate limiting
      const rateLimiter = this.getRateLimiter(req);
      const rateLimitResponse = await rateLimiter.middleware(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // 5. Apply existing security middleware
      const securityResponse = await securityMiddleware(req);
      if (securityResponse) {
        return securityResponse;
      }

      return null;
    } catch (error) {
      logger.error('Enhanced security middleware error:', error);
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

  private initializeRateLimiters(): void {
    // API rate limiter
    this.rateLimiters.set('api', new EnhancedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      burstLimit: 20,
      distributed: true,
      onLimitReached: (req, key) => {
        this.eventLogger.logEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'medium',
          timestamp: Date.now(),
          request: {
            ip: req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            method: req.method,
            path: req.nextUrl.pathname,
            headers: {},
            timestamp: Date.now(),
            isSuspicious: false,
            threatScore: 0,
            detectedThreats: []
          },
          details: { key }
        });
      }
    }, this.threatDetector));

    // Auth rate limiter (stricter)
    this.rateLimiters.set('auth', new EnhancedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      burstLimit: 2,
      distributed: true,
      onLimitReached: (req, key) => {
        this.eventLogger.logEvent({
          type: 'AUTH_FAILURE',
          severity: 'high',
          timestamp: Date.now(),
          request: {
            ip: req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            method: req.method,
            path: req.nextUrl.pathname,
            headers: {},
            timestamp: Date.now(),
            isSuspicious: false,
            threatScore: 0,
            detectedThreats: []
          },
          details: { key }
        });
      }
    }, this.threatDetector));
  }

  private getRateLimiter(req: NextRequest): EnhancedRateLimiter {
    const path = req.nextUrl.pathname;
    
    if (path.startsWith('/api/auth')) {
      return this.rateLimiters.get('auth')!;
    }
    
    return this.rateLimiters.get('api')!;
  }
}

// Export enhanced security middleware instance
export const enhancedSecurityMiddleware = new EnhancedSecurityMiddleware();

// Re-export original security middleware for compatibility
export { securityMiddleware } from './securityService';