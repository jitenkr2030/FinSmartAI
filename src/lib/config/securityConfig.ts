// Security configuration for the application

export interface SecurityConfig {
  // Rate limiting configuration
  rateLimiting: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindowMs: number;
    enableBurstProtection: boolean;
    burstLimit: number;
    burstWindowMs: number;
    enableDistributedRateLimiting: boolean;
    redisUrl?: string;
    customLimits: Record<string, {
      limit: number;
      windowMs: number;
      burstLimit?: number;
    }>;
    whiteList: string[];
    blackList: string[];
  };

  // Threat detection configuration
  threatDetection: {
    enabled: boolean;
    enableBotDetection: boolean;
    enablePatternDetection: boolean;
    enableRateAbuseDetection: boolean;
    enableAnomalyDetection: boolean;
    suspiciousUserAgents: string[];
    suspiciousPatterns: string[];
    requestThreshold: number;
    timeWindowMs: number;
    threatScoreThreshold: number;
    autoBlockThreshold: number;
    blockDurationMs: number;
  };

  // Authentication configuration
  authentication: {
    enabled: boolean;
    jwtSecret: string;
    jwtExpiration: string;
    refreshTokenExpiration: string;
    enableMFA: boolean;
    maxLoginAttempts: number;
    lockoutDurationMs: number;
    sessionTimeoutMs: number;
    enableSessionValidation: boolean;
  };

  // CSRF protection configuration
  csrf: {
    enabled: boolean;
    tokenSize: number;
    tokenExpirationMs: number;
    headerName: string;
    cookieName: string;
    secureCookie: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };

  // Security headers configuration
  headers: {
    enabled: boolean;
    cspEnabled: boolean;
    cspPolicy: {
      defaultSrc: string[];
      scriptSrc: string[];
      styleSrc: string[];
      imgSrc: string[];
      fontSrc: string[];
      connectSrc: string[];
      frameSrc: string[];
      objectSrc: string[];
      baseUri: string[];
      formAction: string[];
      frameAncestors: string[];
    };
    hstsEnabled: boolean;
    hstsMaxAge: number;
    hstsIncludeSubDomains: boolean;
    hstsPreload: boolean;
    enableXSSProtection: boolean;
    enableContentTypeOptions: boolean;
    enableFrameOptions: boolean;
    frameOption: 'DENY' | 'SAMEORIGIN';
    enableReferrerPolicy: boolean;
    referrerPolicy: string;
    enablePermissionsPolicy: boolean;
    permissionsPolicy: string;
  };

  // Input validation configuration
  inputValidation: {
    enabled: boolean;
    maxInputLength: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    sanitizeInput: boolean;
    preventSQLInjection: boolean;
    preventXSS: boolean;
    validateEmail: boolean;
    validatePhone: boolean;
    customValidators: Record<string, (input: any) => boolean>;
  };

  // Encryption configuration
  encryption: {
    enabled: boolean;
    algorithm: string;
    keySize: number;
    ivSize: number;
    encryptionKey: string;
    enableFieldEncryption: boolean;
    encryptedFields: string[];
  };

  // Logging and monitoring configuration
  logging: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logSecurityEvents: boolean;
    logApiCalls: boolean;
    logAuthEvents: boolean;
    logRateLimitEvents: boolean;
    logThreatEvents: boolean;
    enableStructuredLogging: boolean;
    enableAuditLogging: boolean;
    auditLogRetentionDays: number;
    enableRealTimeAlerts: boolean;
    alertWebhook?: string;
    alertEmail?: string;
  };

  // CORS configuration
  cors: {
    enabled: boolean;
    origin: string | string[];
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };

  // API security configuration
  api: {
    enableApiKeyAuth: boolean;
    enableBearerTokenAuth: boolean;
    enableBasicAuth: boolean;
    apiKeyHeader: string;
    rateLimitApiKeys: boolean;
    enableApiDocumentation: boolean;
    enableOpenAPI: boolean;
    enableGraphQL: boolean;
    enableGraphQLIntrospection: boolean;
    enableREST: boolean;
    enableWebSocket: boolean;
    enableGraphQLSubscriptions: boolean;
  };

  // Database security configuration
  database: {
    enableConnectionPooling: boolean;
    maxConnections: number;
    connectionTimeoutMs: number;
    enableQueryLogging: boolean;
    enableSlowQueryDetection: boolean;
    slowQueryThresholdMs: number;
    enableQueryValidation: boolean;
    enableDataEncryption: boolean;
    enableBackupEncryption: boolean;
    enableAuditTrails: boolean;
    enableRowLevelSecurity: boolean;
  };

  // File upload security configuration
  fileUpload: {
    enabled: boolean;
    maxFileSize: number;
    allowedTypes: string[];
    allowedExtensions: string[];
    scanForViruses: boolean;
    scanForMalware: boolean;
    enableFileValidation: boolean;
    enableFileEncryption: boolean;
    storagePath: string;
    enableCDN: boolean;
    cdnUrl?: string;
  };

  // Session management configuration
  session: {
    enabled: boolean;
    store: 'memory' | 'redis' | 'database';
    cookieName: string;
    cookieSecure: boolean;
    cookieSameSite: 'strict' | 'lax' | 'none';
    cookieHttpOnly: boolean;
    maxAge: number;
    rolling: boolean;
    resave: boolean;
    saveUninitialized: boolean;
    proxy: boolean;
    touchAfter: number;
  };

  // WebSocket security configuration
  websocket: {
    enabled: boolean;
    enableAuthentication: boolean;
    enableRateLimiting: boolean;
    maxConnectionsPerIP: number;
    messageSizeLimit: number;
    enableMessageValidation: boolean;
    enableOriginValidation: boolean;
    allowedOrigins: string[];
    enablePingPong: boolean;
    pingIntervalMs: number;
    pingTimeoutMs: number;
  };

  // Environment-specific configuration
  environment: {
    name: 'development' | 'staging' | 'production';
    debug: boolean;
    enableSecurityTesting: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
    enableFeatureFlags: boolean;
    enableAATesting: boolean;
    enableE2ETesting: boolean;
    enableLoadTesting: boolean;
  };
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  rateLimiting: {
    enabled: true,
    defaultLimit: 100,
    defaultWindowMs: 15 * 60 * 1000, // 15 minutes
    enableBurstProtection: true,
    burstLimit: 20,
    burstWindowMs: 1000, // 1 second
    enableDistributedRateLimiting: false,
    customLimits: {
      '/api/auth': { limit: 5, windowMs: 15 * 60 * 1000 },
      '/api/predict': { limit: 10, windowMs: 60 * 1000 },
      '/api/sentiment': { limit: 20, windowMs: 60 * 1000 },
      '/api/upload': { limit: 5, windowMs: 60 * 60 * 1000 },
      '/api/database': { limit: 10, windowMs: 60 * 60 * 1000 },
    },
    whiteList: [],
    blackList: []
  },

  threatDetection: {
    enabled: true,
    enableBotDetection: true,
    enablePatternDetection: true,
    enableRateAbuseDetection: true,
    enableAnomalyDetection: true,
    suspiciousUserAgents: [
      'bot',
      'crawler',
      'spider',
      'scanner',
      'test',
      'curl',
      'wget',
      'python-requests',
      'postman',
      'insomnia'
    ],
    suspiciousPatterns: [
      '<script[^>]*>.*?<\\/script>',
      'javascript:',
      'on\\w+\\s*=',
      'union.*select',
      'drop.*table',
      'exec\\s*\\(',
      'system\\s*\\(',
      '\\.\\./\\.\\/',
      'etc\\/passwd',
      'cmd\\.exe',
      'powershell',
      '/bin/bash',
      'eval\\(',
      'document\\.',
      'window\\.',
      'alert\\(',
      'prompt\\(',
      'confirm\\('
    ],
    requestThreshold: 100,
    timeWindowMs: 60 * 1000, // 1 minute
    threatScoreThreshold: 0.7,
    autoBlockThreshold: 0.8,
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },

  authentication: {
    enabled: true,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: '1h',
    refreshTokenExpiration: '7d',
    enableMFA: false,
    maxLoginAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
    sessionTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
    enableSessionValidation: true
  },

  csrf: {
    enabled: true,
    tokenSize: 32,
    tokenExpirationMs: 3600 * 1000, // 1 hour
    headerName: 'x-csrf-token',
    cookieName: 'csrf-token',
    secureCookie: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },

  headers: {
    enabled: true,
    cspEnabled: true,
    cspPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    },
    hstsEnabled: process.env.NODE_ENV === 'production',
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    enableXSSProtection: true,
    enableContentTypeOptions: true,
    enableFrameOptions: true,
    frameOption: 'DENY',
    enableReferrerPolicy: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    enablePermissionsPolicy: true,
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()'
  },

  inputValidation: {
    enabled: true,
    maxInputLength: 10000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    sanitizeInput: true,
    preventSQLInjection: true,
    preventXSS: true,
    validateEmail: true,
    validatePhone: true,
    customValidators: {}
  },

  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keySize: 32,
    ivSize: 16,
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    enableFieldEncryption: true,
    encryptedFields: ['password', 'ssn', 'creditCard', 'apiKey']
  },

  logging: {
    enabled: true,
    logLevel: 'info',
    logSecurityEvents: true,
    logApiCalls: true,
    logAuthEvents: true,
    logRateLimitEvents: true,
    logThreatEvents: true,
    enableStructuredLogging: true,
    enableAuditLogging: true,
    auditLogRetentionDays: 90,
    enableRealTimeAlerts: true,
    alertWebhook: process.env.SECURITY_ALERT_WEBHOOK,
    alertEmail: process.env.SECURITY_ALERT_EMAIL
  },

  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  api: {
    enableApiKeyAuth: true,
    enableBearerTokenAuth: true,
    enableBasicAuth: false,
    apiKeyHeader: 'x-api-key',
    rateLimitApiKeys: true,
    enableApiDocumentation: true,
    enableOpenAPI: true,
    enableGraphQL: false,
    enableGraphQLIntrospection: false,
    enableREST: true,
    enableWebSocket: true,
    enableGraphQLSubscriptions: false
  },

  database: {
    enableConnectionPooling: true,
    maxConnections: 20,
    connectionTimeoutMs: 30000,
    enableQueryLogging: false,
    enableSlowQueryDetection: true,
    slowQueryThresholdMs: 1000,
    enableQueryValidation: true,
    enableDataEncryption: true,
    enableBackupEncryption: true,
    enableAuditTrails: true,
    enableRowLevelSecurity: false
  },

  fileUpload: {
    enabled: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    scanForViruses: false,
    scanForMalware: false,
    enableFileValidation: true,
    enableFileEncryption: true,
    storagePath: './uploads',
    enableCDN: false
  },

  session: {
    enabled: true,
    store: 'memory',
    cookieName: 'session-id',
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieSameSite: 'strict',
    cookieHttpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    rolling: true,
    resave: false,
    saveUninitialized: false,
    proxy: false,
    touchAfter: 0
  },

  websocket: {
    enabled: true,
    enableAuthentication: true,
    enableRateLimiting: true,
    maxConnectionsPerIP: 10,
    messageSizeLimit: 1024 * 1024, // 1MB
    enableMessageValidation: true,
    enableOriginValidation: true,
    allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
    enablePingPong: true,
    pingIntervalMs: 30000, // 30 seconds
    pingTimeoutMs: 5000 // 5 seconds
  },

  environment: {
    name: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    debug: process.env.NODE_ENV !== 'production',
    enableSecurityTesting: process.env.NODE_ENV !== 'production',
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableFeatureFlags: true,
    enableAATesting: process.env.NODE_ENV !== 'production',
    enableE2ETesting: process.env.NODE_ENV !== 'production',
    enableLoadTesting: process.env.NODE_ENV !== 'production'
  }
};

// Environment-specific configurations
export const environmentConfigs: Record<string, Partial<SecurityConfig>> = {
  development: {
    rateLimiting: {
      enabled: false,
      defaultLimit: 1000,
      defaultWindowMs: 60 * 1000 // 1 minute
    },
    threatDetection: {
      enabled: false
    },
    logging: {
      logLevel: 'debug'
    },
    cors: {
      origin: ['*']
    },
    environment: {
      debug: true,
      enableSecurityTesting: true
    }
  },
  staging: {
    rateLimiting: {
      enabled: true,
      defaultLimit: 200,
      defaultWindowMs: 15 * 60 * 1000
    },
    threatDetection: {
      enabled: true,
      threatScoreThreshold: 0.8
    },
    logging: {
      logLevel: 'info'
    },
    cors: {
      origin: ['https://staging.yourdomain.com']
    },
    environment: {
      debug: false,
      enableSecurityTesting: true
    }
  },
  production: {
    rateLimiting: {
      enabled: true,
      defaultLimit: 100,
      defaultWindowMs: 15 * 60 * 1000,
      enableDistributedRateLimiting: true
    },
    threatDetection: {
      enabled: true,
      threatScoreThreshold: 0.6,
      autoBlockThreshold: 0.7
    },
    logging: {
      logLevel: 'warn',
      enableRealTimeAlerts: true
    },
    cors: {
      origin: ['https://yourdomain.com']
    },
    environment: {
      debug: false,
      enableSecurityTesting: false
    }
  }
};

// Get configuration for current environment
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = environmentConfigs[env] || {};
  
  return {
    ...defaultSecurityConfig,
    ...envConfig,
    environment: {
      ...defaultSecurityConfig.environment,
      name: env as any,
      ...envConfig.environment
    }
  };
}

// Validate configuration
export function validateSecurityConfig(config: SecurityConfig): boolean {
  // Basic validation
  if (!config.rateLimiting.enabled && config.threatDetection.enabled) {
    console.warn('Threat detection is enabled but rate limiting is disabled');
  }

  if (config.authentication.enabled && !config.authentication.jwtSecret) {
    console.warn('Authentication is enabled but JWT secret is not set');
  }

  if (config.encryption.enabled && !config.encryption.encryptionKey) {
    console.warn('Encryption is enabled but encryption key is not set');
  }

  return true;
}

// Export configuration getter
export const securityConfig = getSecurityConfig();