"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  DollarSign, 
  BarChart3, 
  Zap,
  Clock,
  Target,
  Shield,
  Globe,
  Play,
  Settings,
  ArrowRight,
  Plus
} from "lucide-react";

const aiModels = [
  {
    name: "SentimentAI",
    icon: Brain,
    status: "active",
    usage: 85,
    predictions: 1247,
    accuracy: 94.2,
    color: "blue"
  },
  {
    name: "NewsInsightAI",
    icon: TrendingUp,
    status: "active",
    usage: 72,
    predictions: 856,
    accuracy: 91.8,
    color: "green"
  },
  {
    name: "OptionsAI",
    icon: Shield,
    status: "active",
    usage: 68,
    predictions: 623,
    accuracy: 89.5,
    color: "purple"
  },
  {
    name: "RiskAI",
    icon: Target,
    status: "active",
    usage: 91,
    predictions: 1432,
    accuracy: 96.1,
    color: "red"
  },
  {
    name: "FundFlowAI",
    icon: Globe,
    status: "active",
    usage: 76,
    predictions: 789,
    accuracy: 92.3,
    color: "orange"
  },
  {
    name: "AlphaAI",
    icon: Zap,
    status: "active",
    usage: 82,
    predictions: 967,
    accuracy: 88.7,
    color: "yellow"
  }
];

const recentActivity = [
  {
    id: 1,
    model: "SentimentAI",
    action: "Analyzed market sentiment",
    result: "Bullish sentiment detected",
    time: "2 minutes ago",
    status: "success"
  },
  {
    id: 2,
    model: "OptionsAI",
    action: "Calculated option Greeks",
    result: "Delta: 0.67, Gamma: 0.12",
    time: "5 minutes ago",
    status: "success"
  },
  {
    id: 3,
    model: "RiskAI",
    action: "Portfolio risk analysis",
    result: "VaR: 2.3%, Sharpe: 1.8",
    time: "8 minutes ago",
    status: "success"
  },
  {
    id: 4,
    model: "AlphaAI",
    action: "Generated trading strategy",
    result: "Momentum strategy created",
    time: "12 minutes ago",
    status: "success"
  },
  {
    id: 5,
    model: "FundFlowAI",
    action: "Predicted institutional flows",
    result: "FII inflow expected",
    time: "15 minutes ago",
    status: "success"
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPredictions: 0,
    activeModels: 12,
    apiCalls: 0,
    accuracy: 0
  });

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        totalPredictions: prev.totalPredictions + Math.floor(Math.random() * 5),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 10),
        accuracy: Math.min(99.9, prev.accuracy + (Math.random() - 0.5) * 0.1)
      }));
    }, 3000);

    // Initial stats
    setStats({
      totalPredictions: 5891,
      activeModels: 12,
      apiCalls: 15420,
      accuracy: 92.4
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your AI-powered financial overview
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeModels}/12</div>
            <p className="text-xs text-muted-foreground">
              All models operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Models Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active AI Models</h2>
              <Button variant="outline" size="sm">
                View All Models
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiModels.map((model) => (
                <Card key={model.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <model.icon className={`h-5 w-5 text-${model.color}-600`} />
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Usage</span>
                        <span>{model.usage}%</span>
                      </div>
                      <Progress value={model.usage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Predictions</div>
                        <div className="font-semibold">{model.predictions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Accuracy</div>
                        <div className="font-semibold">{model.accuracy}%</div>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Use Model
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All AI Models</CardTitle>
              <CardDescription>
                Complete overview of all 12 AI models and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <model.icon className={`h-6 w-6 text-${model.color}-600`} />
                      <div>
                        <h3 className="font-semibold">{model.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {model.predictions.toLocaleString()} predictions • {model.accuracy}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Usage</div>
                        <div className="font-semibold">{model.usage}%</div>
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest AI model activities and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{activity.model}</h3>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                      <p className="text-sm font-medium text-blue-600">{activity.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>
                  Accuracy trends across all AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiModels.map((model) => (
                    <div key={model.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <model.icon className={`h-4 w-4 text-${model.color}-600`} />
                        <span className="text-sm">{model.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={model.accuracy} className="w-20 h-2" />
                        <span className="text-sm font-medium">{model.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Current usage patterns across models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiModels.map((model) => (
                    <div key={model.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <model.icon className={`h-4 w-4 text-${model.color}-600`} />
                        <span className="text-sm">{model.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={model.usage} className="w-20 h-2" />
                        <span className="text-sm font-medium">{model.usage}%</span>
                      </div>
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