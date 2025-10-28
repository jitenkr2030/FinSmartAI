"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Download,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Crown,
  Star,
  Zap,
  Building2
} from "lucide-react";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "₹999",
    period: "/month",
    description: "Perfect for individual traders",
    features: [
      "Access to 3 AI Models",
      "100 Predictions Daily",
      "Email Support",
      "Basic Data Access",
      "Mobile App Access"
    ],
    popular: false,
    icon: Star
  },
  {
    id: "professional",
    name: "Professional",
    price: "₹4,999",
    period: "/month",
    description: "For professional traders and analysts",
    features: [
      "Access to 8 AI Models",
      "Unlimited Predictions",
      "Priority Support",
      "Real-time Data",
      "API Access",
      "Advanced Analytics"
    ],
    popular: true,
    icon: Zap
  },
  {
    id: "institutional",
    name: "Institutional",
    price: "₹24,999",
    period: "/month",
    description: "For financial institutions",
    features: [
      "All 12 AI Models",
      "White-label Solution",
      "Dedicated Support",
      "Custom Integration",
      "Advanced Analytics",
      "On-premise Deployment"
    ],
    popular: false,
    icon: Building2
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹50,000+",
    period: "/month",
    description: "For large enterprises",
    features: [
      "Fully Customized",
      "Dedicated Infrastructure",
      "24/7 Support",
      "On-premise Deployment",
      "Training Services",
      "Custom Development"
    ],
    popular: false,
    icon: Crown
  }
];

const usageData = {
  currentPlan: "Professional",
  monthlyLimit: 10000,
  used: 7450,
  predictions: 7450,
  apiCalls: 15420,
  models: 8,
  nextBilling: "2024-02-15",
  amount: "₹4,999"
};

const billingHistory = [
  {
    id: 1,
    date: "2024-01-15",
    description: "Professional Plan - Monthly",
    amount: "₹4,999",
    status: "paid",
    invoice: "INV-2024-001"
  },
  {
    id: 2,
    date: "2023-12-15",
    description: "Professional Plan - Monthly",
    amount: "₹4,999",
    status: "paid",
    invoice: "INV-2023-012"
  },
  {
    id: 3,
    date: "2023-11-15",
    description: "Professional Plan - Monthly",
    amount: "₹4,999",
    status: "paid",
    invoice: "INV-2023-011"
  }
];

export default function SubscriptionManager() {
  const [selectedPlan, setSelectedPlan] = useState(usageData.currentPlan.toLowerCase());
  const usagePercentage = (usageData.used / usageData.monthlyLimit) * 100;

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    // In a real app, this would call an API to change the subscription
    console.log(`Changing to plan: ${planId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your subscription and billing preferences
          </p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Update Payment Method
        </Button>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Current Plan: {usageData.currentPlan}
          </CardTitle>
          <CardDescription>
            Your subscription details and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Amount</div>
              <div className="text-2xl font-bold">{usageData.amount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Billing Date</div>
              <div className="text-lg font-semibold flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {usageData.nextBilling}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">API Calls This Month</div>
              <div className="text-2xl font-bold">{usageData.apiCalls.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Models</div>
              <div className="text-2xl font-bold">{usageData.models}/12</div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Monthly Usage</span>
              <span>{usageData.used.toLocaleString()} / {usageData.monthlyLimit.toLocaleString()}</span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{usagePercentage.toFixed(1)}% used</span>
              <span>{usageData.monthlyLimit - usageData.used.toLocaleString()} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''} ${
                    selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <plan.icon className={`w-8 h-8 ${
                        plan.id === 'basic' ? 'text-gray-600' :
                        plan.id === 'professional' ? 'text-blue-600' :
                        plan.id === 'institutional' ? 'text-purple-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      onClick={() => handlePlanChange(plan.id)}
                    >
                      {selectedPlan === plan.id ? "Current Plan" : "Select Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your payment history and download invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          bill.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <div className="font-semibold">{bill.description}</div>
                        <div className="text-sm text-gray-500">{bill.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{bill.amount}</div>
                        <div className="text-sm text-gray-500">{bill.invoice}</div>
                      </div>
                      <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'}>
                        {bill.status === 'paid' ? 'Paid' : 'Failed'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                  Your current month's usage across all services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Calls</span>
                      <span>{usageData.apiCalls.toLocaleString()}</span>
                    </div>
                    <Progress value={(usageData.apiCalls / 20000) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Predictions</span>
                      <span>{usageData.predictions.toLocaleString()}</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage</span>
                      <span>2.3 GB / 10 GB</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bandwidth</span>
                      <span>45 GB / 100 GB</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Usage Breakdown</CardTitle>
                <CardDescription>
                  Usage distribution across AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { model: "SentimentAI", usage: 2340, percentage: 31 },
                    { model: "OptionsAI", usage: 1890, percentage: 25 },
                    { model: "RiskAI", usage: 1560, percentage: 21 },
                    { model: "AlphaAI", usage: 980, percentage: 13 },
                    { model: "NewsInsightAI", usage: 680, percentage: 9 }
                  ].map((item) => (
                    <div key={item.model}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.model}</span>
                        <span>{item.usage.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}