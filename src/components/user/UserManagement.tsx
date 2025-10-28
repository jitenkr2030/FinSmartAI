'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  userService, 
  UserProfile, 
  UserPreferences, 
  SecuritySettings, 
  Session,
  OnboardingStep,
  UserActivity,
  ReferralData
} from '@/lib/services/userService';

interface UserManagementProps {
  userId?: string;
  showSecurity?: boolean;
  showActivity?: boolean;
  showReferrals?: boolean;
  showOnboarding?: boolean;
}

export function UserManagement({ 
  userId, 
  showSecurity = true, 
  showActivity = true, 
  showReferrals = true,
  showOnboarding = true
}: UserManagementProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  
  const [preferencesForm, setPreferencesForm] = useState({
    language: 'en' as 'en' | 'hi',
    timezone: 'Asia/Kolkata',
    currency: 'inr' as 'inr' | 'usd' | 'eur',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketAlerts: true,
      portfolioUpdates: true,
      subscriptionReminders: true,
      featureUpdates: false,
    },
    dashboard: {
      defaultView: 'overview' as 'overview' | 'portfolio' | 'analytics' | 'trading',
      watchlist: [] as string[],
      favoriteCharts: [] as string[],
      layout: 'grid' as 'grid' | 'list',
      theme: 'auto' as 'light' | 'dark' | 'auto',
    },
    trading: {
      defaultOrderType: 'market' as 'market' | 'limit' | 'stop_loss' | 'stop_limit',
      riskTolerance: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
      maxPositionSize: 100000,
      autoStopLoss: true,
      defaultStopLossPercentage: 5,
      defaultTakeProfitPercentage: 10,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
    step: 'setup' | 'verify' | 'complete';
  } | null>(null);

  const [twoFactorToken, setTwoFactorToken] = useState('');

  const { toast } = useToast();

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load profile
      const profileResponse = await userService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
        setProfileForm({
          fullName: profileResponse.data.fullName,
          email: profileResponse.data.email,
          phone: profileResponse.data.phone || '',
        });
      }

      // Load preferences
      const preferencesResponse = await userService.getPreferences();
      if (preferencesResponse.success && preferencesResponse.data) {
        setPreferences(preferencesResponse.data);
        setPreferencesForm(preferencesResponse.data);
      }

      // Load security settings
      if (showSecurity) {
        const securityResponse = await userService.getSecuritySettings();
        if (securityResponse.success && securityResponse.data) {
          setSecuritySettings(securityResponse.data);
        }

        const sessionsResponse = await userService.getActiveSessions();
        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data);
        }
      }

      // Load activity
      if (showActivity) {
        const activityResponse = await userService.getUserActivity(20);
        if (activityResponse.success && activityResponse.data) {
          setActivities(activityResponse.data);
        }
      }

      // Load onboarding
      if (showOnboarding) {
        const onboardingResponse = await userService.getOnboardingSteps();
        if (onboardingResponse.success && onboardingResponse.data) {
          setOnboardingSteps(onboardingResponse.data);
        }
      }

      // Load referrals
      if (showReferrals) {
        const referralResponse = await userService.getReferralData();
        if (referralResponse.success && referralResponse.data) {
          setReferralData(referralResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showSecurity, showActivity, showOnboarding, showReferrals, toast]);

  const handleUpdateProfile = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const response = await userService.updateProfile(profileForm);
      
      if (response.success && response.data) {
        setProfile(response.data);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [profileForm, toast]);

  const handleUpdatePreferences = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const response = await userService.updatePreferences(preferencesForm);
      
      if (response.success && response.data) {
        setPreferences(response.data);
        toast({
          title: 'Success',
          description: 'Preferences updated successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to update preferences');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [preferencesForm, toast]);

  const handleChangePassword = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    const validation = userService.validatePassword(passwordForm.newPassword);
    if (!validation.isValid) {
      toast({
        title: 'Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [passwordForm, toast]);

  const handleEnableTwoFactor = useCallback(async () => {
    try {
      const response = await userService.enableTwoFactor();
      
      if (response.success && response.data) {
        setTwoFactorSetup({
          qrCode: response.data.qrCode,
          secret: response.data.secret,
          backupCodes: [],
          step: 'verify',
        });
      } else {
        throw new Error(response.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enable 2FA',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleVerifyTwoFactor = useCallback(async () => {
    if (!twoFactorToken) {
      toast({
        title: 'Error',
        description: 'Please enter the verification code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await userService.verifyTwoFactor(twoFactorToken);
      
      if (response.success && response.data) {
        setTwoFactorSetup({
          ...twoFactorSetup!,
          backupCodes: response.data.backupCodes,
          step: 'complete',
        });
        
        // Reload security settings
        const securityResponse = await userService.getSecuritySettings();
        if (securityResponse.success && securityResponse.data) {
          setSecuritySettings(securityResponse.data);
        }
        
        toast({
          title: 'Success',
          description: 'Two-factor authentication enabled successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to verify 2FA');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify 2FA',
        variant: 'destructive',
      });
    }
  }, [twoFactorToken, twoFactorSetup, toast]);

  const handleDisableTwoFactor = useCallback(async () => {
    try {
      const response = await userService.disableTwoFactor(''); // Token would be required in real implementation
      
      if (response.success) {
        // Reload security settings
        const securityResponse = await userService.getSecuritySettings();
        if (securityResponse.success && securityResponse.data) {
          setSecuritySettings(securityResponse.data);
        }
        
        toast({
          title: 'Success',
          description: 'Two-factor authentication disabled',
        });
      } else {
        throw new Error(response.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disable 2FA',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleTerminateSession = useCallback(async (sessionId: string) => {
    try {
      const response = await userService.terminateSession(sessionId);
      
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast({
          title: 'Success',
          description: 'Session terminated successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to terminate session');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to terminate session',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCompleteOnboardingStep = useCallback(async (stepId: string) => {
    try {
      const response = await userService.completeOnboardingStep(stepId);
      
      if (response.success && response.data) {
        setOnboardingSteps(prev => 
          prev.map(step => 
            step.id === stepId ? response.data! : step
          )
        );
        toast({
          title: 'Success',
          description: 'Step completed successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to complete step');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete step',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleGenerateReferralLink = useCallback(async () => {
    try {
      const response = await userService.generateReferralLink();
      
      if (response.success && response.data) {
        setReferralData(prev => prev ? { ...prev, ...response.data! } : response.data!);
        
        // Copy to clipboard
        navigator.clipboard.writeText(response.data.referralLink);
        toast({
          title: 'Success',
          description: 'Referral link generated and copied to clipboard',
        });
      } else {
        throw new Error(response.error || 'Failed to generate referral link');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate referral link',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const formatDateTime = userService.formatDateTime;
  const formatRelativeTime = userService.formatRelativeTime;
  const getActivityIcon = userService.getActivityIcon;
  const getActivityColor = userService.getActivityColor;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {showSecurity && <TabsTrigger value="security">Security</TabsTrigger>}
          {showActivity && <TabsTrigger value="activity">Activity</TabsTrigger>}
          {showReferrals && <TabsTrigger value="referrals">Referrals</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={profile?.emailVerified ? "default" : "secondary"}>
                  {profile?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                </Badge>
                <Badge variant={profile?.isActive ? "default" : "destructive"}>
                  {profile?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <Button 
                onClick={handleUpdateProfile}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {showOnboarding && onboardingSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Complete these steps to get the most out of FinSmartAI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onboardingSteps
                    .sort((a, b) => a.order - b.order)
                    .map(step => (
                      <div key={step.id} className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-gray-200'
                        }`}>
                          {step.completed ? '✓' : step.order}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        {!step.completed && (
                          <Button
                            onClick={() => handleCompleteOnboardingStep(step.id)}
                            size="sm"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Preferences */}
              <div>
                <h4 className="font-medium mb-4">General</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={preferencesForm.language} 
                      onValueChange={(value: 'en' | 'hi') => 
                        setPreferencesForm(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={preferencesForm.timezone} 
                      onValueChange={(value) => 
                        setPreferencesForm(prev => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={preferencesForm.currency} 
                      onValueChange={(value: 'inr' | 'usd' | 'eur') => 
                        setPreferencesForm(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inr">INR (₹)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Preferences */}
              <div>
                <h4 className="font-medium mb-4">Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={preferencesForm.notifications.email}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <Switch
                        id="push-notifications"
                        checked={preferencesForm.notifications.push}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <Switch
                        id="sms-notifications"
                        checked={preferencesForm.notifications.sms}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="market-alerts">Market Alerts</Label>
                      <Switch
                        id="market-alerts"
                        checked={preferencesForm.notifications.marketAlerts}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, marketAlerts: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="portfolio-updates">Portfolio Updates</Label>
                      <Switch
                        id="portfolio-updates"
                        checked={preferencesForm.notifications.portfolioUpdates}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, portfolioUpdates: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subscription-reminders">Subscription Reminders</Label>
                      <Switch
                        id="subscription-reminders"
                        checked={preferencesForm.notifications.subscriptionReminders}
                        onCheckedChange={(checked) =>
                          setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, subscriptionReminders: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dashboard Preferences */}
              <div>
                <h4 className="font-medium mb-4">Dashboard</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-view">Default View</Label>
                    <Select 
                      value={preferencesForm.dashboard.defaultView} 
                      onValueChange={(value: 'overview' | 'portfolio' | 'analytics' | 'trading') => 
                        setPreferencesForm(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, defaultView: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="layout">Layout</Label>
                    <Select 
                      value={preferencesForm.dashboard.layout} 
                      onValueChange={(value: 'grid' | 'list') => 
                        setPreferencesForm(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, layout: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={preferencesForm.dashboard.theme} 
                      onValueChange={(value: 'light' | 'dark' | 'auto') => 
                        setPreferencesForm(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, theme: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleUpdatePreferences}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {showSecurity && (
          <TabsContent value="security" className="space-y-4">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                >
                  {isSaving ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                {twoFactorSetup ? (
                  <div className="space-y-4">
                    {twoFactorSetup.step === 'verify' && (
                      <>
                        <div className="text-center">
                          <p className="mb-4">Scan this QR code with your authenticator app:</p>
                          <div className="bg-white p-4 rounded-lg inline-block">
                            {/* QR code would be rendered here */}
                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                              QR Code
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Or enter this code manually: {twoFactorSetup.secret}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="verification-code">Verification Code</Label>
                          <Input
                            id="verification-code"
                            placeholder="Enter 6-digit code"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value)}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleVerifyTwoFactor}>
                            Verify & Enable
                          </Button>
                          <Button 
                            onClick={() => setTwoFactorSetup(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {twoFactorSetup.step === 'complete' && (
                      <div className="space-y-4">
                        <Alert>
                          <AlertDescription>
                            Two-factor authentication has been enabled successfully!
                          </AlertDescription>
                        </Alert>
                        <div>
                          <h4 className="font-medium mb-2">Backup Codes</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {twoFactorSetup.backupCodes.map((code, index) => (
                              <code key={index} className="bg-muted p-2 rounded text-sm">
                                {code}
                              </code>
                            ))}
                          </div>
                        </div>
                        <Button onClick={() => setTwoFactorSetup(null)}>
                          Finish Setup
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {securitySettings?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {securitySettings?.twoFactorEnabled 
                          ? 'Your account is protected with 2FA'
                          : 'Add an extra layer of security to your account'
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {securitySettings?.twoFactorEnabled ? (
                        <Button 
                          onClick={handleDisableTwoFactor}
                          variant="outline"
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button onClick={handleEnableTwoFactor}>
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.browser} on {session.os} • {session.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {formatRelativeTime(session.lastActive)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.isCurrent && (
                          <Badge variant="outline">Current Session</Badge>
                        )}
                        {!session.isCurrent && (
                          <Button
                            onClick={() => handleTerminateSession(session.id)}
                            variant="outline"
                            size="sm"
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showActivity && (
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent account activity and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <span className="text-sm">●</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showReferrals && (
          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Invite friends and earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {referralData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{referralData.successfulReferrals}</p>
                        <p className="text-sm text-muted-foreground">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">₹{referralData.totalEarnings}</p>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                      </div>
                      <div className="text-center">
                        <Button onClick={handleGenerateReferralLink}>
                          Generate Link
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Your Referral Code</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value={referralData.referralCode} readOnly />
                        <Button 
                          onClick={() => navigator.clipboard.writeText(referralData.referralLink)}
                          variant="outline"
                        >
                          Copy Link
                        </Button>
                      </div>
                    </div>

                    {referralData.referredUsers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Referred Users</h4>
                        <div className="space-y-2">
                          {referralData.referredUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined: {formatDateTime(user.joinedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                  {user.subscriptionStatus}
                                </Badge>
                                <p className="text-sm font-medium mt-1">₹{user.earnings}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}