'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Bell, 
  Settings, 
  ArrowRight, 
  ArrowLeft, 
  Star,
  Brain,
  Zap,
  Globe,
  DollarSign,
  Users,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb
} from 'lucide-react';

interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  
  // Professional Information
  company: string;
  jobTitle: string;
  experience: string;
  industry: string;
  tradingExperience: string;
  
  // Goals and Preferences
  primaryGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: string;
  preferredAssets: string[];
  tradingFrequency: string;
  
  // Platform Preferences
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketAlerts: boolean;
    systemUpdates: boolean;
  };
  interfaceTheme: 'light' | 'dark' | 'auto';
  language: string;
  
  // Subscription Plan
  planType: 'basic' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  promoCode?: string;
  
  // Terms and Conditions
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  estimatedTime: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to FinSmartAI",
    description: "Get started with your personalized financial AI journey",
    icon: Brain,
    required: true,
    estimatedTime: "2 minutes"
  },
  {
    id: 2,
    title: "Personal Information",
    description: "Tell us about yourself to personalize your experience",
    icon: User,
    required: true,
    estimatedTime: "3 minutes"
  },
  {
    id: 3,
    title: "Professional Background",
    description: "Help us understand your professional context",
    icon: Briefcase,
    required: true,
    estimatedTime: "3 minutes"
  },
  {
    id: 4,
    title: "Investment Goals",
    description: "Define your financial objectives and preferences",
    icon: Target,
    required: true,
    estimatedTime: "5 minutes"
  },
  {
    id: 5,
    title: "Platform Preferences",
    description: "Customize your platform experience",
    icon: Settings,
    required: false,
    estimatedTime: "2 minutes"
  },
  {
    id: 6,
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs",
    icon: DollarSign,
    required: true,
    estimatedTime: "3 minutes"
  },
  {
    id: 7,
    title: "Complete Setup",
    description: "Review and finalize your account setup",
    icon: CheckCircle,
    required: true,
    estimatedTime: "1 minute"
  }
];

export function ComprehensiveUserOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    timezone: '',
    company: '',
    jobTitle: '',
    experience: '',
    industry: '',
    tradingExperience: '',
    primaryGoals: [],
    riskTolerance: 'moderate',
    investmentHorizon: '',
    preferredAssets: [],
    tradingFrequency: '',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false,
      marketAlerts: true,
      systemUpdates: true
    },
    interfaceTheme: 'auto',
    language: 'en',
    planType: 'professional',
    billingCycle: 'monthly',
    promoCode: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { toast } = useToast();

  const updateOnboardingData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNotificationPreference = (key: keyof OnboardingData['notificationPreferences'], value: boolean) => {
    setOnboardingData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setOnboardingData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return true; // Welcome step is always valid
      case 2:
        return onboardingData.firstName.trim() !== '' &&
               onboardingData.lastName.trim() !== '' &&
               onboardingData.email.trim() !== '' &&
               onboardingData.country.trim() !== '';
      case 3:
        return onboardingData.experience.trim() !== '' &&
               onboardingData.industry.trim() !== '' &&
               onboardingData.tradingExperience.trim() !== '';
      case 4:
        return onboardingData.primaryGoals.length > 0 &&
               onboardingData.riskTolerance.trim() !== '' &&
               onboardingData.investmentHorizon.trim() !== '' &&
               onboardingData.preferredAssets.length > 0;
      case 5:
        return true; // Preferences step is optional
      case 6:
        return onboardingData.planType.trim() !== '';
      case 7:
        return onboardingData.acceptTerms && onboardingData.acceptPrivacy;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      if (currentStep < onboardingSteps.length) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: 'Validation Error',
        description: 'Please accept the terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Welcome to FinSmartAI!',
        description: 'Your account has been set up successfully',
      });
      
      // Here you would typically save the data and redirect to dashboard
      console.log('Onboarding completed:', onboardingData);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepProgress = () => {
    return (currentStep / onboardingSteps.length) * 100;
  };

  const renderStepContent = () => {
    const StepIcon = onboardingSteps[currentStep - 1].icon;
    
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <StepIcon className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to FinSmartAI</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Embark on a transformative journey into AI-powered financial intelligence. 
              Our platform will help you make smarter, data-driven investment decisions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="text-center">
                <CardContent className="p-4">
                  <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">12 AI Models</h3>
                  <p className="text-sm text-gray-600">Specialized financial AI models</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Real-time Data</h3>
                  <p className="text-sm text-gray-600">Live market data and analytics</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Secure Platform</h3>
                  <p className="text-sm text-gray-600">Enterprise-grade security</p>
                </CardContent>
              </Card>
            </div>
            
            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertDescription>
                This onboarding process will take approximately 15-20 minutes. 
                You can save your progress and return later if needed.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">First Name *</label>
                <Input
                  value={onboardingData.firstName}
                  onChange={(e) => updateOnboardingData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Last Name *</label>
                <Input
                  value={onboardingData.lastName}
                  onChange={(e) => updateOnboardingData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address *</label>
                <Input
                  type="email"
                  value={onboardingData.email}
                  onChange={(e) => updateOnboardingData('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  type="tel"
                  value={onboardingData.phone}
                  onChange={(e) => updateOnboardingData('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Country *</label>
                <Select value={onboardingData.country} onValueChange={(value) => updateOnboardingData('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="SG">Singapore</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <Select value={onboardingData.timezone} onValueChange={(value) => updateOnboardingData('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                    <SelectItem value="CST">Central Time (CST)</SelectItem>
                    <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                    <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                    <SelectItem value="IST">Indian Standard Time (IST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="CET">Central European Time (CET)</SelectItem>
                    <SelectItem value="JST">Japan Standard Time (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Professional Background</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Company</label>
                <Input
                  value={onboardingData.company}
                  onChange={(e) => updateOnboardingData('company', e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Title</label>
                <Input
                  value={onboardingData.jobTitle}
                  onChange={(e) => updateOnboardingData('jobTitle', e.target.value)}
                  placeholder="Enter your job title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Years of Experience *</label>
                <Select value={onboardingData.experience} onValueChange={(value) => updateOnboardingData('experience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-15">11-15 years</SelectItem>
                    <SelectItem value="15+">15+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Industry *</label>
                <Select value={onboardingData.industry} onValueChange={(value) => updateOnboardingData('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Banking & Finance</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Trading Experience *</label>
                <Select value={onboardingData.tradingExperience} onValueChange={(value) => updateOnboardingData('tradingExperience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your trading experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Experience</SelectItem>
                    <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="expert">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Investment Goals & Preferences</h3>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Investment Goals *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'Wealth Building', 'Retirement Planning', 'Income Generation',
                  'Capital Preservation', 'Speculation', 'Tax Optimization',
                  'Education Funding', 'Home Purchase', 'Business Investment'
                ].map(goal => (
                  <Button
                    key={goal}
                    variant={onboardingData.primaryGoals.includes(goal) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('primaryGoals', goal)}
                    className="justify-start"
                  >
                    {goal}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Risk Tolerance *</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'conservative', label: 'Conservative', desc: 'Low risk, steady returns' },
                  { value: 'moderate', label: 'Moderate', desc: 'Balanced risk and returns' },
                  { value: 'aggressive', label: 'Aggressive', desc: 'High risk, high returns' }
                ].map(option => (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all ${
                      onboardingData.riskTolerance === option.value 
                        ? 'border-blue-500 bg-blue-50 dark:bg-slate-800' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => updateOnboardingData('riskTolerance', option.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="font-semibold mb-1">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Investment Horizon *</label>
                <Select value={onboardingData.investmentHorizon} onValueChange={(value) => updateOnboardingData('investmentHorizon', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your horizon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term (0-1 year)</SelectItem>
                    <SelectItem value="medium-term">Medium-term (1-5 years)</SelectItem>
                    <SelectItem value="long-term">Long-term (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Trading Frequency</label>
                <Select value={onboardingData.tradingFrequency} onValueChange={(value) => updateOnboardingData('tradingFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Asset Classes *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  'Stocks', 'Bonds', 'Mutual Funds', 'ETFs',
                  'Options', 'Futures', 'Forex', 'Commodities',
                  'Real Estate', 'Cryptocurrency', 'Cash', 'Other'
                ].map(asset => (
                  <Button
                    key={asset}
                    variant={onboardingData.preferredAssets.includes(asset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredAssets', asset)}
                    className="justify-start"
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Platform Preferences</h3>
            
            <div>
              <h4 className="font-medium mb-3">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Notifications</span>
                  </div>
                  <Switch
                    checked={onboardingData.notificationPreferences.email}
                    onCheckedChange={(checked) => updateNotificationPreference('email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Push Notifications</span>
                  </div>
                  <Switch
                    checked={onboardingData.notificationPreferences.push}
                    onCheckedChange={(checked) => updateNotificationPreference('push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>SMS Notifications</span>
                  </div>
                  <Switch
                    checked={onboardingData.notificationPreferences.sms}
                    onCheckedChange={(checked) => updateNotificationPreference('sms', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Market Alerts</span>
                  </div>
                  <Switch
                    checked={onboardingData.notificationPreferences.marketAlerts}
                    onCheckedChange={(checked) => updateNotificationPreference('marketAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>System Updates</span>
                  </div>
                  <Switch
                    checked={onboardingData.notificationPreferences.systemUpdates}
                    onCheckedChange={(checked) => updateNotificationPreference('systemUpdates', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Interface Theme</label>
                <Select value={onboardingData.interfaceTheme} onValueChange={(value: any) => updateOnboardingData('interfaceTheme', value)}>
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
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={onboardingData.language} onValueChange={(value) => updateOnboardingData('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Choose Your Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Basic',
                  price: '₹999',
                  period: '/month',
                  description: 'Perfect for individual traders',
                  features: ['3 AI Models', '100 Predictions Daily', 'Email Support', 'Basic Analytics'],
                  popular: false,
                  value: 'basic'
                },
                {
                  name: 'Professional',
                  price: '₹4,999',
                  period: '/month',
                  description: 'For professional traders',
                  features: ['8 AI Models', 'Unlimited Predictions', 'Priority Support', 'Advanced Analytics', 'API Access'],
                  popular: true,
                  value: 'professional'
                },
                {
                  name: 'Enterprise',
                  price: '₹24,999',
                  period: '/month',
                  description: 'For institutions and teams',
                  features: ['All 12 AI Models', 'White-label Solution', '24/7 Support', 'Custom Integration', 'Dedicated Account Manager'],
                  popular: false,
                  value: 'enterprise'
                }
              ].map(plan => (
                <Card 
                  key={plan.value}
                  className={`cursor-pointer transition-all ${
                    onboardingData.planType === plan.value 
                      ? 'border-blue-500 border-2 bg-blue-50 dark:bg-slate-800' 
                      : 'hover:shadow-md'
                  } ${plan.popular ? 'relative' : ''}`}
                  onClick={() => updateOnboardingData('planType', plan.value)}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Billing Cycle</label>
                <Select value={onboardingData.billingCycle} onValueChange={(value: any) => updateOnboardingData('billingCycle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Promo Code (Optional)</label>
                <Input
                  value={onboardingData.promoCode}
                  onChange={(e) => updateOnboardingData('promoCode', e.target.value)}
                  placeholder="Enter promo code"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review & Complete Setup</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span>{onboardingData.firstName} {onboardingData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{onboardingData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span>{onboardingData.country}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investment Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Tolerance:</span>
                    <span className="capitalize">{onboardingData.riskTolerance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span>{onboardingData.tradingExperience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goals:</span>
                    <span>{onboardingData.primaryGoals.length} selected</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="capitalize">{onboardingData.planType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing:</span>
                    <span className="capitalize">{onboardingData.billingCycle}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={onboardingData.acceptTerms}
                      onCheckedChange={(checked) => updateOnboardingData('acceptTerms', checked)}
                    />
                    <span className="text-sm">I accept the Terms and Conditions *</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={onboardingData.acceptPrivacy}
                      onCheckedChange={(checked) => updateOnboardingData('acceptPrivacy', checked)}
                    />
                    <span className="text-sm">I accept the Privacy Policy *</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={onboardingData.acceptMarketing}
                      onCheckedChange={(checked) => updateOnboardingData('acceptMarketing', checked)}
                    />
                    <span className="text-sm">I want to receive marketing emails</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                By completing this setup, you agree to our Terms of Service and Privacy Policy. 
                You can modify these settings later in your account preferences.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup Your Account</h1>
            <Badge variant="outline">
              {currentStep} of {onboardingSteps.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              {onboardingSteps[currentStep - 1].required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              <span className="text-sm text-gray-600">
                ~{onboardingSteps[currentStep - 1].estimatedTime}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {completedSteps.map(step => (
                <CheckCircle key={step} className="w-4 h-4 text-green-500" />
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              {(() => {
                const StepIcon = onboardingSteps[currentStep - 1].icon;
                return <StepIcon className="w-6 h-6 text-blue-600" />;
              })()}
              <div>
                <CardTitle>{onboardingSteps[currentStep - 1].title}</CardTitle>
                <CardDescription>{onboardingSteps[currentStep - 1].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  step.id === currentStep
                    ? 'bg-blue-600'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === onboardingSteps.length ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}