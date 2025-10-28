"use client";

import { useState } from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { 
  RealTimeLineChart, 
  RealTimeAreaChart, 
  RealTimeBarChart, 
  RealTimePieChart,
  MarketDataStream 
} from "@/components/charts/RealTimeChart";
import { RealTimeAnalyticsDashboard } from "@/components/analytics/RealTimeAnalyticsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, TrendingDown, DollarSign, BarChart3, Settings } from "lucide-react";

export default function AnalyticsPage() {
  const [showEnhancedAnalytics, setShowEnhancedAnalytics] = useState(false);

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time data visualization and market insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => setShowEnhancedAnalytics(!showEnhancedAnalytics)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>{showEnhancedAnalytics ? 'Simple View' : 'Advanced Analytics'}</span>
            </Button>
          </div>
        </div>

        {showEnhancedAnalytics ? (
          <RealTimeAnalyticsDashboard 
            userId="current-user"
            symbols={['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY']}
            models={['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI']}
            showAdvancedFeatures={true}
            enableRealTimeUpdates={true}
          />
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Bullish</div>
                  <p className="text-xs text-muted-foreground">
                    +0.85% positive sentiment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trading Volume</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹2.1B</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.3% improvement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">147</div>
                  <p className="text-xs text-muted-foreground">
                    23 buy, 8 sell signals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="market" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="market">Market Data</TabsTrigger>
                <TabsTrigger value="models">AI Models</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="market" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeLineChart 
                    title="Market Index Movement"
                    description="Real-time NIFTY 50 movement"
                    color="#3b82f6"
                  />
                  <RealTimeAreaChart 
                    title="Trading Volume"
                    description="Volume trends across market segments"
                    color="#10b981"
                  />
                </div>
                <MarketDataStream />
              </TabsContent>

              <TabsContent value="models" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeBarChart 
                    title="Model Usage Distribution"
                    description="Current usage across AI models"
                    color="#f59e0b"
                  />
                  <RealTimePieChart 
                    title="Model Performance Share"
                    description="Performance contribution by model type"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeAreaChart 
                    title="Model Accuracy Trends"
                    description="Real-time accuracy monitoring"
                    color="#8b5cf6"
                  />
                  <RealTimeLineChart 
                    title="Prediction Volume"
                    description="Number of predictions over time"
                    color="#ef4444"
                  />
                </div>
              </TabsContent>

              <TabsContent value="predictions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeLineChart 
                    title="Sentiment Predictions"
                    description="Real-time sentiment analysis results"
                    color="#06b6d4"
                  />
                  <RealTimeAreaChart 
                    title="Price Predictions"
                    description="AI-generated price forecasts"
                    color="#10b981"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeBarChart 
                    title="Prediction Confidence"
                    description="Confidence levels across predictions"
                    color="#f59e0b"
                  />
                  <RealTimePieChart 
                    title="Prediction Types"
                    description="Distribution of prediction categories"
                  />
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeLineChart 
                    title="System Performance"
                    description="Real-time system metrics"
                    color="#3b82f6"
                  />
                  <RealTimeAreaChart 
                    title="API Response Time"
                    description="Average response times"
                    color="#10b981"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RealTimeBarChart 
                    title="Error Rates"
                    description="System error monitoring"
                    color="#ef4444"
                  />
                  <RealTimePieChart 
                    title="Resource Usage"
                    description="System resource distribution"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AuthWrapper>
  );
}