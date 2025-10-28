import { apiClient } from './apiClient';

// User types
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  subscription?: UserSubscription;
}

export interface UserPreferences {
  language: 'en' | 'hi';
  timezone: string;
  currency: 'inr' | 'usd' | 'eur';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  trading: TradingPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketAlerts: boolean;
  portfolioUpdates: boolean;
  subscriptionReminders: boolean;
  featureUpdates: boolean;
}

export interface DashboardPreferences {
  defaultView: 'overview' | 'portfolio' | 'analytics' | 'trading';
  watchlist: string[];
  favoriteCharts: string[];
  layout: 'grid' | 'list';
  theme: 'light' | 'dark' | 'auto';
}

export interface TradingPreferences {
  defaultOrderType: 'market' | 'limit' | 'stop_loss' | 'stop_limit';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxPositionSize: number;
  autoStopLoss: boolean;
  defaultStopLossPercentage: number;
  defaultTakeProfitPercentage: number;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  startedAt: string;
  endsAt?: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
  usage: SubscriptionUsage;
}

export interface SubscriptionUsage {
  apiCalls: { used: number; limit: number };
  predictions: { used: number; limit: number };
  storage: { used: number; limit: number };
  models: { used: number; limit: number };
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface UserActivity {
  id: string;
  type: 'login' | 'prediction' | 'portfolio_update' | 'subscription_change' | 'settings_update';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  allowedIpRanges: string[];
  lastPasswordChange: string;
  activeSessions: Session[];
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  referredUsers: ReferredUser[];
}

export interface ReferredUser {
  id: string;
  email: string;
  fullName: string;
  joinedAt: string;
  subscriptionStatus: string;
  earnings: number;
}

class UserService {
  // Profile Management
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get('/user/profile');
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put('/user/profile', profileData);
  }

  async updateAvatar(avatarFile: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    return apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteAvatar(): Promise<ApiResponse<boolean>> {
    return apiClient.delete('/user/avatar');
  }

  // Preferences
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    return apiClient.get('/user/preferences');
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return apiClient.put('/user/preferences', preferences);
  }

  async resetPreferences(): Promise<ApiResponse<UserPreferences>> {
    return apiClient.post('/user/preferences/reset');
  }

  // Security
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    return apiClient.get('/user/security');
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>> {
    return apiClient.put('/user/security', settings);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return apiClient.post('/user/2fa/enable');
  }

  async verifyTwoFactor(token: string): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return apiClient.post('/user/2fa/verify', { token });
  }

  async disableTwoFactor(token: string): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/2fa/disable', { token });
  }

  async getActiveSessions(): Promise<ApiResponse<Session[]>> {
    return apiClient.get('/user/sessions');
  }

  async terminateSession(sessionId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`/user/sessions/${sessionId}`);
  }

  async terminateAllOtherSessions(): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/sessions/terminate-others');
  }

  // Onboarding
  async getOnboardingSteps(): Promise<ApiResponse<OnboardingStep[]>> {
    return apiClient.get('/user/onboarding');
  }

  async completeOnboardingStep(stepId: string): Promise<ApiResponse<OnboardingStep>> {
    return apiClient.post(`/user/onboarding/${stepId}/complete`);
  }

  async skipOnboarding(): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/onboarding/skip');
  }

  async resetOnboarding(): Promise<ApiResponse<OnboardingStep[]>> {
    return apiClient.post('/user/onboarding/reset');
  }

  // Activity
  async getUserActivity(limit: number = 50, offset: number = 0): Promise<ApiResponse<UserActivity[]>> {
    return apiClient.get('/user/activity', {
      params: { limit, offset },
    });
  }

  async getActivityStats(): Promise<ApiResponse<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    recentActivity: UserActivity[];
  }>> {
    return apiClient.get('/user/activity/stats');
  }

  // Referrals
  async getReferralData(): Promise<ApiResponse<ReferralData>> {
    return apiClient.get('/user/referrals');
  }

  async generateReferralLink(): Promise<ApiResponse<{ referralCode: string; referralLink: string }>> {
    return apiClient.post('/user/referrals/generate');
  }

  // Subscription Management
  async getUserSubscription(): Promise<ApiResponse<UserSubscription>> {
    return apiClient.get('/user/subscription');
  }

  async getSubscriptionUsage(): Promise<ApiResponse<SubscriptionUsage>> {
    return apiClient.get('/user/subscription/usage');
  }

  async upgradeSubscription(planId: string): Promise<ApiResponse<UserSubscription>> {
    return apiClient.post('/user/subscription/upgrade', { planId });
  }

  async downgradeSubscription(planId: string): Promise<ApiResponse<UserSubscription>> {
    return apiClient.post('/user/subscription/downgrade', { planId });
  }

  // Watchlist
  async getWatchlist(): Promise<ApiResponse<string[]>> {
    return apiClient.get('/user/watchlist');
  }

  async addToWatchlist(symbol: string): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/watchlist', { symbol });
  }

  async removeFromWatchlist(symbol: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`/user/watchlist/${symbol}`);
  }

  async reorderWatchlist(symbols: string[]): Promise<ApiResponse<boolean>> {
    return apiClient.put('/user/watchlist/reorder', { symbols });
  }

  // Notifications
  async getNotifications(limit: number = 20, unreadOnly: boolean = false): Promise<ApiResponse<any[]>> {
    return apiClient.get('/user/notifications', {
      params: { limit, unreadOnly },
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
    return apiClient.put(`/user/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<boolean>> {
    return apiClient.put('/user/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`/user/notifications/${notificationId}`);
  }

  // Export Data
  async exportUserData(): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    return apiClient.post('/user/export');
  }

  async downloadUserData(exportId: string): Promise<Blob> {
    const response = await fetch(`/api/user/export/${exportId}/download`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download user data');
    }

    return response.blob();
  }

  // Account Deletion
  async requestAccountDeletion(): Promise<ApiResponse<{ confirmationCode: string }>> {
    return apiClient.post('/user/delete-request');
  }

  async confirmAccountDeletion(confirmationCode: string, password: string): Promise<ApiResponse<boolean>> {
    return apiClient.post('/user/delete-confirm', {
      confirmationCode,
      password,
    });
  }

  // Utility methods
  formatDateTime(dateString: string, includeTime: boolean = true): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    };
    return date.toLocaleDateString('en-IN', options);
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return this.formatDateTime(dateString, false);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'login':
        return 'log-in';
      case 'prediction':
        return 'brain';
      case 'portfolio_update':
        return 'briefcase';
      case 'subscription_change':
        return 'credit-card';
      case 'settings_update':
        return 'settings';
      default:
        return 'activity';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'login':
        return 'text-blue-600';
      case 'prediction':
        return 'text-green-600';
      case 'portfolio_update':
        return 'text-purple-600';
      case 'subscription_change':
        return 'text-orange-600';
      case 'settings_update':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  }
}

// Export singleton instance
export const userService = new UserService();

// Export class for custom instances
export { UserService };

// React hook for user service
export const useUserService = () => {
  return userService;
};