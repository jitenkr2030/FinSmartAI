'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3, 
  Clock, 
  Star, 
  ArrowRight,
  CheckCircle,
  Server,
  Database,
  Code,
  Rocket,
  Users2,
  Building2,
  TrendingDown,
  PieChart,
  Activity,
  Search,
  Bell,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  BookOpen,
  Video,
  FileText,
  Download,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';

interface OnboardingData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  
  // Step 2: Experience and Goals
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryGoal: 'trading' | 'investing' | 'research' | 'risk_management' | 'portfolio_management';
  tradingFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  riskTolerance: 'low' | 'medium' | 'high' | 'aggressive';
  
  // Step 3: Interests and Preferences
  interestedModels: string[];
  preferredMarkets: string[];
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Step 4: Subscription Plan
  plan: 'basic' | 'professional' | 'institutional' | 'enterprise';
  
  // Step 5: Final Setup
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent: boolean;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
    icon: User
  },
  {
    id: 2,
    title: "Experience & Goals",
    description: "Your trading background and objectives",
    icon: Target
  },
  {
    id: 3,
    title: "Preferences",
    description: "Customize your experience",
    icon: Settings
  },
  {
    id: 4,
    title: "Choose Plan",
    description: "Select the right plan for you",
    icon: DollarSign
  },
  {
    id: 5,
    title: "Final Setup",
    description: "Review and complete setup",
    icon: CheckCircle
  }
];

const aiModels = [
  { id: 'sentiment', name: 'SentimentAI', description: 'News/Social Media Analysis' },
  { id: 'news', name: 'NewsInsightAI', description: 'AI News Summary & Analysis' },
  { id: 'options', name: 'OptionsAI', description: 'Options Price Prediction' },
  { id: 'risk', name: 'RiskAI', description: 'Portfolio Risk Analysis' },
  { id: 'fundflow', name: 'FundFlowAI', description: 'FII/DII Fund Flow Prediction' },
  { id: 'mutual', name: 'MutualAI', description: 'Mutual Fund Ranking' },
  { id: 'commod', name: 'CommodAI', description: 'Commodity Price Forecasting' },
  { id: 'fx', name: 'FXAI', description: 'Exchange Rate Prediction' },
  { id: 'tax', name: 'TaxAI', description: 'Tax Optimization' },
  { id: 'alpha', name: 'AlphaAI', description: 'Trading Strategy Generation' },
  { id: 'trend', name: 'TrendFusion', description: 'Unified Forecasting' },
  { id: 'global', name: 'Global', description: 'Global Market Coverage' }
];

const markets = [
  { id: 'equity', name: 'Equity Markets' },
  { id: 'derivatives', name: 'Derivatives' },
  { id: 'commodities', name: 'Commodities' },
  { id: 'forex', name: 'Forex' },
  { id: 'fixed_income', name: 'Fixed Income' },
  { id: 'crypto', name: 'Cryptocurrency' }
];

const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹999',
    period: '/month',
    description: 'Perfect for individual traders',
    features: ['3 AI Models', '100 Predictions/Day', 'Email Support', 'Mobile App'],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '₹4,999',
    period: '/month',
    description: 'For serious traders and analysts',
    features: ['8 AI Models', 'Unlimited Predictions', 'Priority Support', 'API Access'],
    popular: true
  },
  {
    id: 'institutional',
    name: 'Institutional',
    price: '₹24,999',
    period: '/month',
    description: 'For financial institutions',
    features: ['All 12 AI Models', 'White-label', 'Dedicated Support', 'Custom Integration'],
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹50,000+',
    period: '/month',
    description: 'Custom enterprise solutions',
    features: ['Custom AI Models', 'On-premise Deployment', '24/7 Support', 'SLA Guarantee'],
    popular: false
  }
];

interface UserOnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export function UserOnboardingFlow({ onComplete, onSkip }: UserOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    experience: 'beginner',
    primaryGoal: 'trading',
    tradingFrequency: 'weekly',
    riskTolerance: 'medium',
    interestedModels: [],
    preferredMarkets: [],
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    },
    plan: 'professional',
    acceptTerms: false,
    acceptPrivacy: false,
    marketingConsent: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field.split('.')[0]]: {
        ...prev[field.split('.')[0] as any],
        [field.split('.')[1]]: value
      }
    }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(item)
        ? (prev[field] as string[]).filter(i => i !== item)
        : [...(prev[field] as string[]), item]
    }));
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Welcome to FinSmartAI!',
        description: 'Your account has been set up successfully.',
      });
      
      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return data.firstName && data.lastName && data.email;
      case 2:
        return data.experience && data.primaryGoal;
      case 3:
        return data.interestedModels.length > 0;
      case 4:
        return data.plan;
      case 5:
        return data.acceptTerms && data.acceptPrivacy;
      default:
        return true;
    }
  };

  const getStepProgress = () => {
    return ((currentStep - 1) / (onboardingSteps.length - 1)) * 100;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to FinSmartAI</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Let's get to know you better to personalize your experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  value={data.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  value={data.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => updateData('email', e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                type="tel"
                value={data.phone}
                onChange={(e) => updateData('phone', e.target.value)}
                placeholder="+91 XXXXXXXXXX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input
                  value={data.company}
                  onChange={(e) => updateData('company', e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input
                  value={data.jobTitle}
                  onChange={(e) => updateData('jobTitle', e.target.value)}
                  placeholder="Your job title"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Trading Profile</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Help us understand your trading experience and goals
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Experience Level *</label>
              <Select value={data.experience} onValueChange={(value) => updateData('experience', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                  <SelectItem value="expert">Expert (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Primary Goal *</label>
              <Select value={data.primaryGoal} onValueChange={(value) => updateData('primaryGoal', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trading">Active Trading</SelectItem>
                  <SelectItem value="investing">Long-term Investing</SelectItem>
                  <SelectItem value="research">Market Research</SelectItem>
                  <SelectItem value="risk_management">Risk Management</SelectItem>
                  <SelectItem value="portfolio_management">Portfolio Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trading Frequency</label>
              <Select value={data.tradingFrequency} onValueChange={(value) => updateData('tradingFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
              <Select value={data.riskTolerance} onValueChange={(value) => updateData('riskTolerance', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Conservative</SelectItem>
                  <SelectItem value="medium">Medium - Balanced</SelectItem>
                  <SelectItem value="high">High - Growth</SelectItem>
                  <SelectItem value="aggressive">Aggressive - Speculative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customize Your Experience</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select your interests and notification preferences
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">AI Models of Interest *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      data.interestedModels.includes(model.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => toggleArrayItem('interestedModels', model.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{model.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{model.description}</p>
                      </div>
                      <Checkbox
                        checked={data.interestedModels.includes(model.id)}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Preferred Markets</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                      data.preferredMarkets.includes(market.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => toggleArrayItem('preferredMarkets', market.id)}
                  >
                    <Checkbox
                      checked={data.preferredMarkets.includes(market.id)}
                      onChange={() => {}}
                      className="mx-auto mb-2"
                    />
                    <span className="text-sm font-medium">{market.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Notification Preferences</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email Notifications</span>
                  </div>
                  <Switch
                    checked={data.notificationPreferences.email}
                    onCheckedChange={(checked) => updateNestedData('notificationPreferences.email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Push Notifications</span>
                  </div>
                  <Switch
                    checked={data.notificationPreferences.push}
                    onCheckedChange={(checked) => updateNestedData('notificationPreferences.push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS Notifications</span>
                  </div>
                  <Switch
                    checked={data.notificationPreferences.sms}
                    onCheckedChange={(checked) => updateNestedData('notificationPreferences.sms', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Plan</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select the plan that best fits your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    data.plan === plan.id
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  } ${plan.popular ? 'relative' : ''}`}
                  onClick={() => updateData('plan', plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600">Most Popular</Badge>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className="font-semibold mb-1">{plan.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>
                    <div className="mb-3">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-center text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                      data.plan === plan.id 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {data.plan === plan.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.plan && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  You selected the {subscriptionPlans.find(p => p.id === data.plan)?.name} plan. 
                  You can change your plan anytime from your account settings.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Almost Done!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Review your information and complete the setup
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span>{data.firstName} {data.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span>{data.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                  <span className="capitalize">{data.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span>{subscriptionPlans.find(p => p.id === data.plan)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Selected Models:</span>
                  <span>{data.interestedModels.length} AI Models</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={data.acceptTerms}
                  onCheckedChange={(checked) => updateData('acceptTerms', checked)}
                />
                <label htmlFor="terms" className="text-sm leading-relaxed">
                  I accept the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and 
                  <a href="#" className="text-blue-600 hover:underline"> Community Guidelines</a> *
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={data.acceptPrivacy}
                  onCheckedChange={(checked) => updateData('acceptPrivacy', checked)}
                />
                <label htmlFor="privacy" className="text-sm leading-relaxed">
                  I have read and agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={data.marketingConsent}
                  onCheckedChange={(checked) => updateData('marketingConsent', checked)}
                />
                <label htmlFor="marketing" className="text-sm leading-relaxed">
                  I would like to receive marketing communications, product updates, and special offers
                </label>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">What's Next?</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Access to your selected AI models</li>
                    <li>• Personalized dashboard setup</li>
                    <li>• Welcome tutorial and guidance</li>
                    <li>• 24/7 customer support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 mr-2 text-blue-600" />
              <h1 className="text-2xl font-bold">FinSmartAI</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Complete your setup in just a few steps</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep} of {onboardingSteps.length}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step.id <= currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="text-sm hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  {React.createElement(onboardingSteps[currentStep - 1].icon, { 
                    className: "w-5 h-5 text-blue-600 dark:text-blue-400" 
                  })}
                </div>
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
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <SkipBack className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={skipOnboarding}>
                Skip for now
              </Button>

              {currentStep < onboardingSteps.length ? (
                <Button 
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={completeOnboarding}
                  disabled={!validateStep(currentStep) || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Rocket className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Switch component for consistency
function Switch({ checked, onCheckedChange }: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void 
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}