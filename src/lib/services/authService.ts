import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/services/monitoringService';

// JWT configuration
interface JWTConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Token interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Role-based access control
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM_USER: 'premium_user',
  API_USER: 'api_user',
  ANALYST: 'analyst'
} as const;

export const PERMISSIONS = {
  // General permissions
  READ_DASHBOARD: 'read_dashboard',
  READ_ANALYTICS: 'read_analytics',
  
  // AI model permissions
  USE_SENTIMENT_AI: 'use_sentiment_ai',
  USE_OPTIONS_AI: 'use_options_ai',
  USE_RISK_AI: 'use_risk_ai',
  USE_FUND_FLOW_AI: 'use_fund_flow_ai',
  
  // Trading permissions
  VIEW_PORTFOLIO: 'view_portfolio',
  MANAGE_PORTFOLIO: 'manage_portfolio',
  EXECUTE_TRADES: 'execute_trades',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs',
  MANAGE_API_KEYS: 'manage_api_keys',
  
  // API permissions
  API_ACCESS: 'api_access',
  API_PREDICTIONS: 'api_predictions',
  API_REALTIME_DATA: 'api_realtime_data'
} as const;

// Role-permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.READ_DASHBOARD,
    PERMISSIONS.READ_ANALYTICS,
    PERMISSIONS.USE_SENTIMENT_AI,
    PERMISSIONS.USE_OPTIONS_AI,
    PERMISSIONS.USE_RISK_AI,
    PERMISSIONS.USE_FUND_FLOW_AI,
    PERMISSIONS.VIEW_PORTFOLIO,
    PERMISSIONS.API_ACCESS,
    PERMISSIONS.API_PREDICTIONS,
    PERMISSIONS.API_REALTIME_DATA
  ],
  [ROLES.PREMIUM_USER]: [
    PERMISSIONS.READ_DASHBOARD,
    PERMISSIONS.READ_ANALYTICS,
    PERMISSIONS.USE_SENTIMENT_AI,
    PERMISSIONS.USE_OPTIONS_AI,
    PERMISSIONS.USE_RISK_AI,
    PERMISSIONS.USE_FUND_FLOW_AI,
    PERMISSIONS.VIEW_PORTFOLIO,
    PERMISSIONS.MANAGE_PORTFOLIO,
    PERMISSIONS.API_ACCESS,
    PERMISSIONS.API_PREDICTIONS
  ],
  [ROLES.USER]: [
    PERMISSIONS.READ_DASHBOARD,
    PERMISSIONS.READ_ANALYTICS,
    PERMISSIONS.USE_SENTIMENT_AI,
    PERMISSIONS.VIEW_PORTFOLIO,
    PERMISSIONS.API_ACCESS
  ],
  [ROLES.API_USER]: [
    PERMISSIONS.API_ACCESS,
    PERMISSIONS.API_PREDICTIONS,
    PERMISSIONS.API_REALTIME_DATA
  ]
};

// Authentication service
export class AuthService {
  private jwtConfig: JWTConfig;

  constructor() {
    this.jwtConfig = {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'finsmartai',
      audience: process.env.JWT_AUDIENCE || 'finsmartai-users'
    };
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(user: Partial<User>): string {
    const payload: TokenPayload = {
      userId: user.id!,
      email: user.email!,
      role: user.role!,
      permissions: user.permissions || []
    };

    return jwt.sign(payload, this.jwtConfig.secret, {
      expiresIn: this.jwtConfig.expiresIn,
      issuer: this.jwtConfig.issuer,
      audience: this.jwtConfig.audience
    });
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtConfig.secret, {
        issuer: this.jwtConfig.issuer,
        audience: this.jwtConfig.audience
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      logger.warn('Token verification failed', { error: (error as Error).message });
      return null;
    }
  }

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.jwtConfig.secret,
      { expiresIn: '30d' }
    );
  }

  // Verify refresh token
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtConfig.secret) as any;
      if (decoded.type !== 'refresh') {
        return null;
      }
      return { userId: decoded.userId };
    } catch (error) {
      logger.warn('Refresh token verification failed', { error: (error as Error).message });
      return null;
    }
  }

  // Extract token from request
  extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    const tokenCookie = req.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }
    
    return null;
  }

  // Get current user from request
  async getCurrentUser(req: NextRequest): Promise<User | null> {
    const token = this.extractToken(req);
    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    // In a real implementation, you would fetch user from database
    // For now, return a mock user based on token payload
    return {
      id: payload.userId,
      email: payload.email,
      username: payload.email.split('@')[0],
      role: payload.role,
      permissions: payload.permissions,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Login user
  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  } | null> {
    try {
      // In a real implementation, you would verify credentials against database
      // For now, simulate user lookup
      const user = await this.findUserByEmail(email);
      if (!user) {
        logger.warn('Login attempt with non-existent email', { email });
        return null;
      }

      const isValidPassword = await this.comparePassword(password, user.password);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { email });
        return null;
      }

      if (!user.isActive) {
        logger.warn('Login attempt by inactive user', { email });
        return null;
      }

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

      // Update last login
      await this.updateLastLogin(user.id);

      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });

      return {
        user: {
          ...user,
          password: '' // Don't return password
        },
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      return null;
    }
  }

  // Register user
  async register(userData: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  } | null> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        logger.warn('Registration attempt with existing email', { email: userData.email });
        return null;
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await this.createUser({
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        role: userData.role || ROLES.USER,
        permissions: ROLE_PERMISSIONS[userData.role || ROLES.USER]
      });

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

      logger.info('User registered successfully', { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return null;
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  } | null> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return null;
      }

      // Get user
      const user = await this.findUserById(decoded.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return null;
    }
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    try {
      // In a real implementation, you would invalidate the token in database
      // For now, just log the action
      logger.info('User logged out', { userId });
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  // Check if user has permission
  hasPermission(user: User, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(user: User, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(user: User, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  // Check if user has required role
  hasRole(user: User, role: string): boolean {
    return user.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(user: User, roles: string[]): boolean {
    return roles.some(role => this.hasRole(user, role));
  }

  // Authorization middleware factory
  requirePermission(permission: string) {
    return (req: NextRequest): NextResponse | null => {
      const user = this.getCurrentUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (!this.hasPermission(user, permission)) {
        logger.warn('Permission denied', { 
          userId: user.id, 
          permission,
          path: req.nextUrl.pathname 
        });
        
        return NextResponse.json(
          { success: false, error: 'Permission denied', code: 'PERMISSION_DENIED' },
          { status: 403 }
        );
      }

      return null;
    };
  }

  // Authorization middleware factory for multiple permissions
  requirePermissions(permissions: string[], requireAll: boolean = false) {
    return (req: NextRequest): NextResponse | null => {
      const user = this.getCurrentUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const hasRequiredPermissions = requireAll 
        ? this.hasAllPermissions(user, permissions)
        : this.hasAnyPermission(user, permissions);

      if (!hasRequiredPermissions) {
        logger.warn('Permission denied', { 
          userId: user.id, 
          permissions,
          requireAll,
          path: req.nextUrl.pathname 
        });
        
        return NextResponse.json(
          { success: false, error: 'Permission denied', code: 'PERMISSION_DENIED' },
          { status: 403 }
        );
      }

      return null;
    };
  }

  // Authorization middleware factory for roles
  requireRole(role: string) {
    return (req: NextRequest): NextResponse | null => {
      const user = this.getCurrentUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (!this.hasRole(user, role)) {
        logger.warn('Role required', { 
          userId: user.id, 
          userRole: user.role,
          requiredRole: role,
          path: req.nextUrl.pathname 
        });
        
        return NextResponse.json(
          { success: false, error: 'Permission denied', code: 'PERMISSION_DENIED' },
          { status: 403 }
        );
      }

      return null;
    };
  }

  // Mock database methods (in real implementation, these would interact with your database)
  private async findUserByEmail(email: string): Promise<User | null> {
    // Mock implementation - in real app, query database
    if (email === 'admin@finsmartai.com') {
      return {
        id: '1',
        email: 'admin@finsmartai.com',
        username: 'admin',
        role: ROLES.ADMIN,
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
        isActive: true,
        password: await this.hashPassword('admin123'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (email === 'user@finsmartai.com') {
      return {
        id: '2',
        email: 'user@finsmartai.com',
        username: 'user',
        role: ROLES.USER,
        permissions: ROLE_PERMISSIONS[ROLES.USER],
        isActive: true,
        password: await this.hashPassword('user123'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return null;
  }

  private async findUserById(id: string): Promise<User | null> {
    // Mock implementation
    if (id === '1') {
      return {
        id: '1',
        email: 'admin@finsmartai.com',
        username: 'admin',
        role: ROLES.ADMIN,
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
        isActive: true,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (id === '2') {
      return {
        id: '2',
        email: 'user@finsmartai.com',
        username: 'user',
        role: ROLES.USER,
        permissions: ROLE_PERMISSIONS[ROLES.USER],
        isActive: true,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return null;
  }

  private async createUser(userData: {
    email: string;
    username: string;
    password: string;
    role: string;
    permissions: string[];
  }): Promise<User> {
    // Mock implementation
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      username: userData.username,
      role: userData.role,
      permissions: userData.permissions,
      isActive: true,
      password: userData.password,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return user;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // Mock implementation - in real app, update database
    logger.info('Updating last login', { userId });
  }
}

// Export singleton instance
export const authService = new AuthService();