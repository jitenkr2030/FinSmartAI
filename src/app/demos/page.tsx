"use client";

import { useState } from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import ModelDemo from "@/components/demos/ModelDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Target, 
  Globe, 
  DollarSign, 
  BarChart3, 
  Zap,
  Clock,
  Star,
  ArrowRight,
  Play,
  Activity
} from "lucide-react";

export default function DemosPage() {
  const featuredModels = [
    {
      name: "SentimentAI",
      icon: Brain,
      description: "Analyze market sentiment from news and social media",
      color: "blue",
      category: "sentiment"
    },
    {
      name: "OptionsAI",
      icon: Shield,
      description: "Calculate option Greeks and predict prices",
      color: "purple",
      category: "derivatives"
    },
    {
      name: "RiskAI",
      icon: Target,
      description: "Portfolio risk analysis and metrics",
      color: "red",
      category: "risk"
    }
  ];

  const allModels = [
    ...featuredModels,
    {
      name: "NewsInsightAI",
      icon: TrendingUp,
      description: "AI-powered news summarization and analysis",
      color: "green",
      category: "news"
    },
    {
      name: "FundFlowAI",
      icon: Globe,
      description: "FII/DII flow prediction and analysis",
      color: "orange",
      category: "institutional"
    },
    {
      name: "AlphaAI",
      icon: Zap,
      description: "Automated trading strategy generation",
      color: "yellow",
      category: "trading"
    }
  ];

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interactive Demos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Try our AI models with live demonstrations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Live Demos
            </Badge>
          </div>
        </div>

        {/* Featured Demos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Demos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredModels.map((model) => (
              <ModelDemo
                key={model.name}
                modelName={model.name}
                icon={model.icon}
                description={model.description}
                color={model.color}
              />
            ))}
          </div>
        </div>

        {/* All Model Demos */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Models</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="derivatives">Derivatives</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allModels.map((model) => (
                <ModelDemo
                  key={model.name}
                  modelName={model.name}
                  icon={model.icon}
                  description={model.description}
                  color={model.color}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allModels.filter(m => m.category === 'sentiment').map((model) => (
                <ModelDemo
                  key={model.name}
                  modelName={model.name}
                  icon={model.icon}
                  description={model.description}
                  color={model.color}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="derivatives" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allModels.filter(m => m.category === 'derivatives').map((model) => (
                <ModelDemo
                  key={model.name}
                  modelName={model.name}
                  icon={model.icon}
                  description={model.description}
                  color={model.color}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allModels.filter(m => m.category === 'risk').map((model) => (
                <ModelDemo
                  key={model.name}
                  modelName={model.name}
                  icon={model.icon}
                  description={model.description}
                  color={model.color}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allModels.filter(m => m.category === 'trading').map((model) => (
                <ModelDemo
                  key={model.name}
                  modelName={model.name}
                  icon={model.icon}
                  description={model.description}
                  color={model.color}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Demo Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Statistics</CardTitle>
            <CardDescription>
              Real-time demo usage and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Demos Run Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">98.2%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">847ms</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">4.8/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">User Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}