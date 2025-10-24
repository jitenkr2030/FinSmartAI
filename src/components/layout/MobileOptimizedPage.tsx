'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MobileOptimizedLayout, MobileCard, MobileStatsGrid, MobileActionButton } from './MobileOptimizedLayout';
import { MobileRealTimeMarketData } from '../mobile/MobileRealTimeMarketData';
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
  Settings
} from 'lucide-react';

interface MobileStat {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileFeature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'beta' | 'coming-soon';
  progress?: number;
}

export function MobileOptimizedHomePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    models: 12,
    apis: 25,
    users: 0,
    predictions: 0
  });

  useEffect(() => {
    // Simulate real-time stats
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        users: prev.users + Math.floor(Math.random() * 3),
        predictions: prev.predictions + Math.floor(Math.random() * 10)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const mobileStats: MobileStat[] = [
    {
      label: "AI Models",
      value: stats.models,
      change: "100% Complete",
      changeType: "positive",
      icon: Brain
    },
    {
      label: "API Endpoints",
      value: stats.apis,
      change: "Operational",
      changeType: "positive",
      icon: Server
    },
    {
      label: "Active Users",
      value: stats.users.toLocaleString(),
      change: "Live",
      changeType: "neutral",
      icon: Users
    },
    {
      label: "Predictions",
      value: stats.predictions.toLocaleString(),
      change: "Real-time",
      changeType: "neutral",
      icon: Activity
    }
  ];

  const features: MobileFeature[] = [
    {
      title: "Real-time Market Data",
      description: "Live market data with advanced charting",
      icon: TrendingUp,
      status: "active",
      progress: 100
    },
    {
      title: "AI Predictions",
      description: "12 specialized AI models for analysis",
      icon: Brain,
      status: "active",
      progress: 100
    },
    {
      title: "Portfolio Management",
      description: "Track and optimize your investments",
      icon: PieChart,
      status: "active",
      progress: 100
    },
    {
      title: "Risk Analysis",
      description: "Advanced risk assessment tools",
      icon: Shield,
      status: "active",
      progress: 100
    },
    {
      title: "Mobile App",
      description: "Native iOS and Android apps",
      icon: Smartphone,
      status: "beta",
      progress: 85
    },
    {
      title: "API Access",
      description: "RESTful API with WebSocket support",
      icon: Code,
      status: "active",
      progress: 100
    }
  ];

  const subscriptionPlans = [
    {
      name: "Basic",
      price: "₹999",
      period: "/month",
      description: "Individual Traders",
      features: ["3 AI Models", "100 Predictions Daily", "Email Support", "Mobile App"],
      popular: false
    },
    {
      name: "Professional",
      price: "₹4,999",
      period: "/month",
      description: "Professional Traders",
      features: ["8 AI Models", "Unlimited Predictions", "Priority Support", "API Access"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹24,999+",
      period: "/month",
      description: "Institutions",
      features: ["All AI Models", "White-label", "Dedicated Support", "Custom Integration"],
      popular: false
    }
  ];

  return (
    <MobileOptimizedLayout 
      title="FinSmartAI" 
      actions={
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>
      }
    >
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <MobileCard className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Brain className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold">FinSmartAI</h1>
            <p className="text-blue-100">Complete Financial AI Ecosystem</p>
            <p className="text-sm text-blue-100 leading-relaxed">
              12 AI models • 25+ APIs • Real-time analysis
            </p>
            <div className="flex flex-col gap-3">
              <MobileActionButton icon={Rocket} fullWidth>
                Get Started
              </MobileActionButton>
              <MobileActionButton icon={Activity} variant="outline" fullWidth>
                Live Demo
              </MobileActionButton>
            </div>
          </div>
        </MobileCard>

        {/* Stats Grid */}
        <MobileStatsGrid stats={mobileStats} />

        {/* Real-time Market Data */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Live Market Data</h2>
          <MobileRealTimeMarketData />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <MobileActionButton icon={TrendingUp} variant="outline">
            Market Data
          </MobileActionButton>
          <MobileActionButton icon={Brain} variant="outline">
            AI Models
          </MobileActionButton>
          <MobileActionButton icon={PieChart} variant="outline">
            Portfolio
          </MobileActionButton>
          <MobileActionButton icon={BarChart3} variant="outline">
            Analytics
          </MobileActionButton>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Platform Features</h2>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <MobileCard key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <Badge 
                        variant={
                          feature.status === 'active' ? 'default' :
                          feature.status === 'beta' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {feature.status === 'active' ? 'Active' :
                         feature.status === 'beta' ? 'Beta' : 'Coming Soon'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {feature.description}
                    </p>
                    {feature.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{feature.progress}%</span>
                        </div>
                        <Progress value={feature.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose Your Plan</h2>
          <div className="space-y-3">
            {subscriptionPlans.map((plan, index) => (
              <MobileCard 
                key={index} 
                className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <div className="text-center space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                  </div>
                  <div className="space-y-1">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center justify-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <MobileActionButton 
                    icon={ArrowRight} 
                    variant={plan.popular ? 'default' : 'outline'}
                    fullWidth
                  >
                    Get Started
                  </MobileActionButton>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <MobileCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">NIFTY 50 Alert</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <Badge variant="outline">Market</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Prediction Complete</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                <Badge variant="outline">AI</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">System Update</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <Badge variant="outline">System</Badge>
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <MobileActionButton icon={BarChart3} variant="outline">
              Dashboard
            </MobileActionButton>
            <MobileActionButton icon={Users} variant="outline">
              Profile
            </MobileActionButton>
            <MobileActionButton icon={Bell} variant="outline">
              Notifications
            </MobileActionButton>
            <MobileActionButton icon={Settings} variant="outline">
              Settings
            </MobileActionButton>
          </div>
        </div>
      </div>
    </MobileOptimizedLayout>
  );
}

// Add smartphone icon import
const Smartphone = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);