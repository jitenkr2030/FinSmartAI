"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Shield, Activity, BarChart3, Settings, Users, DollarSign, Globe, Target, Zap, AlertCircle, CheckCircle, Clock } from "lucide-react";

import ModelRegistry from "@/components/dashboard/ModelRegistry";
import RiskAIDashboard from "@/components/dashboard/RiskAIDashboard";
import SentimentAIDashboard from "@/components/dashboard/SentimentAIDashboard";

interface SystemMetrics {
  totalModels: number;
  activeModels: number;
  totalUsers: number;
  activeUsers: number;
  totalPredictions: number;
  todayPredictions: number;
  systemUptime: string;
  apiHealth: 'healthy' | 'warning' | 'error';
}

interface ModelStatus {
  name: string;
  status: 'active' | 'development' | 'planned' | 'error';
  health: number; // 0-100
  lastUsed: string;
  predictions: number;
}

interface UnifiedDashboardProps {
  userId?: string;
}

export default function UnifiedDashboard({ userId }: UnifiedDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalModels: 12,
    activeModels: 2,
    totalUsers: 0,
    activeUsers: 0,
    totalPredictions: 0,
    todayPredictions: 0,
    systemUptime: '99.9%',
    apiHealth: 'healthy'
  });
  
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([
    { name: 'Kronos-SentimentAI', status: 'active', health: 95, lastUsed: '2 min ago', predictions: 1250 },
    { name: 'Kronos-RiskAI', status: 'active', health: 98, lastUsed: '5 min ago', predictions: 890 },
    { name: 'Kronos-NewsInsight', status: 'development', health: 75, lastUsed: '1 hour ago', predictions: 234 },
    { name: 'Kronos-OptionsAI', status: 'development', health: 60, lastUsed: '2 hours ago', predictions: 156 },
    { name: 'Kronos-FundFlowAI', status: 'development', health: 45, lastUsed: '3 hours ago', predictions: 89 },
    { name: 'Kronos-MutualAI', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 },
    { name: 'Kronos-CommodAI', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 },
    { name: 'Kronos-FXAI', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 },
    { name: 'Kronos-TaxAI', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 },
    { name: 'Kronos-AlphaAI', status: 'development', health: 30, lastUsed: '4 hours ago', predictions: 45 },
    { name: 'Kronos-TrendFusion', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 },
    { name: 'Kronos Global', status: 'planned', health: 0, lastUsed: 'never', predictions: 0 }
  ]);

  useEffect(() => {
    // In a real application, this would fetch actual metrics from the API
    fetchSystemMetrics();
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      // Mock API call - in production, this would fetch real data
      const mockMetrics: SystemMetrics = {
        totalModels: 12,
        activeModels: 2,
        totalUsers: 1247,
        activeUsers: 342,
        totalPredictions: 15420,
        todayPredictions: 1245,
        systemUptime: '99.9%',
        apiHealth: 'healthy'
      };
      setSystemMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'development': return 'text-blue-600';
      case 'planned': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'development': return <Activity className="w-4 h-4" />;
      case 'planned': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    if (health >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getApiHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">FinSmartAI Unified Dashboard</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete ecosystem management and monitoring for all 12 AI models
          </p>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemMetrics.activeModels}/{systemMetrics.totalModels}</div>
              <div className="text-sm text-gray-600">Active Models</div>
              <Progress value={(systemMetrics.activeModels / systemMetrics.totalModels) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemMetrics.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
              <div className="text-xs text-gray-500 mt-1">{systemMetrics.totalUsers} Total Users</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemMetrics.todayPredictions}</div>
              <div className="text-sm text-gray-600">Today</div>
              <div className="text-xs text-gray-500 mt-1">{systemMetrics.totalPredictions} Total</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getApiHealthColor(systemMetrics.apiHealth)}`}>
                {systemMetrics.systemUptime}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className={`text-xs ${getApiHealthColor(systemMetrics.apiHealth)} mt-1`}>
                API: {systemMetrics.apiHealth.toUpperCase()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Model Status Overview</CardTitle>
            <CardDescription>Current status and health of all AI models in the ecosystem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelStatuses.map((model) => (
                <div key={model.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(model.status)}
                      <span className="font-medium text-sm">{model.name}</span>
                    </div>
                    <Badge variant={model.status === 'active' ? 'default' : model.status === 'development' ? 'secondary' : 'outline'}>
                      {model.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Health:</span>
                      <span className={`font-medium ${getHealthColor(model.health)}`}>
                        {model.health > 0 ? `${model.health}%` : 'N/A'}
                      </span>
                    </div>
                    
                    {model.health > 0 && (
                      <Progress value={model.health} className="h-1" />
                    )}
                    
                    <div className="flex justify-between text-xs">
                      <span>Last Used:</span>
                      <span>{model.lastUsed}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span>Predictions:</span>
                      <span>{model.predictions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Model Registry</TabsTrigger>
            <TabsTrigger value="risk">RiskAI</TabsTrigger>
            <TabsTrigger value="sentiment">SentimentAI</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Models Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Models</CardTitle>
                  <CardDescription>Currently operational AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelStatuses.filter(m => m.status === 'active').map((model) => (
                      <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-600">{model.predictions} predictions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getHealthColor(model.health)}`}>
                            {model.health}%
                          </div>
                          <div className="text-xs text-gray-500">{model.lastUsed}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Development Models */}
              <Card>
                <CardHeader>
                  <CardTitle>Development Models</CardTitle>
                  <CardDescription>Models currently in development</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelStatuses.filter(m => m.status === 'development').map((model) => (
                      <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-600">{model.predictions} predictions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getHealthColor(model.health)}`}>
                            {model.health}%
                          </div>
                          <div className="text-xs text-gray-500">{model.lastUsed}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time system metrics and performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {systemMetrics.systemUptime}
                    </div>
                    <div className="text-sm text-gray-600">System Uptime</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {systemMetrics.todayPredictions}
                    </div>
                    <div className="text-sm text-gray-600">Predictions Today</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ↑ 12% from yesterday
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {systemMetrics.activeUsers}
                    </div>
                    <div className="text-sm text-gray-600">Active Users</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ↑ 8% from last hour
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models">
            <ModelRegistry />
          </TabsContent>

          <TabsContent value="risk">
            <RiskAIDashboard userId={userId} />
          </TabsContent>

          <TabsContent value="sentiment">
            <SentimentAIDashboard userId={userId} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Usage Analytics</CardTitle>
                  <CardDescription>Usage patterns across all AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelStatuses
                      .filter(m => m.predictions > 0)
                      .sort((a, b) => b.predictions - a.predictions)
                      .map((model, index) => (
                        <div key={model.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{model.name}</span>
                            <span>{model.predictions} predictions</span>
                          </div>
                          <Progress 
                            value={(model.predictions / Math.max(...modelStatuses.map(m => m.predictions))) * 100} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health Trends</CardTitle>
                  <CardDescription>Health metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Model Health</span>
                      <span className="text-sm text-green-600">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="text-sm text-green-600">124ms</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-green-600">0.3%</span>
                    </div>
                    <Progress value={97} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Satisfaction</span>
                      <span className="text-sm text-green-600">4.8/5</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Projection</CardTitle>
                <CardDescription>Financial performance metrics and projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">₹25-50C</div>
                    <div className="text-sm text-gray-600">Year 1 Revenue</div>
                    <div className="text-xs text-gray-500 mt-1">Infrastructure Phase</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">₹75-125C</div>
                    <div className="text-sm text-gray-600">Year 2 Revenue</div>
                    <div className="text-xs text-gray-500 mt-1">Expansion Phase</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">₹200-300C</div>
                    <div className="text-sm text-gray-600">Year 3 Revenue</div>
                    <div className="text-xs text-gray-500 mt-1">Maturity Phase</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Current Monthly Run Rate</div>
                      <div className="text-sm text-gray-600">Based on active subscriptions and usage</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">₹2.1C</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}