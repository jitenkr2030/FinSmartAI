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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  analyticsService, 
  PortfolioAnalytics, 
  PerformanceMetrics, 
  RiskMetrics,
  AssetAllocation,
  ModelPerformance,
  UsageAnalytics,
  MarketAnalytics,
  AnalyticsTimeRange,
  ReportConfig,
  GeneratedReport
} from '@/lib/services/analyticsService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  CandlestickChart,
  Candlestick
} from 'recharts';

interface AdvancedAnalyticsProps {
  portfolioId?: string;
  showPortfolio?: boolean;
  showModels?: boolean;
  showUsage?: boolean;
  showMarket?: boolean;
  showReports?: boolean;
}

export function AdvancedAnalytics({ 
  portfolioId,
  showPortfolio = true, 
  showModels = true, 
  showUsage = true, 
  showMarket = true,
  showReports = true
}: AdvancedAnalyticsProps) {
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [marketAnalytics, setMarketAnalytics] = useState<MarketAnalytics | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<AnalyticsTimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    interval: '1d'
  });
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState('portfolio');

  const { toast } = useToast();

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [portfolioId, selectedTimeRange]);

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load portfolio analytics
      if (showPortfolio && portfolioId) {
        const portfolioResponse = await analyticsService.getPortfolioAnalytics(portfolioId, selectedTimeRange);
        if (portfolioResponse.success && portfolioResponse.data) {
          setPortfolioAnalytics(portfolioResponse.data);
        }
      }

      // Load model performance
      if (showModels) {
        const modelsResponse = await analyticsService.getModelPerformance(selectedModel, selectedTimeRange);
        if (modelsResponse.success && modelsResponse.data) {
          setModelPerformance(modelsResponse.data);
        }
      }

      // Load usage analytics
      if (showUsage) {
        const usageResponse = await analyticsService.getUsageAnalytics(selectedTimeRange);
        if (usageResponse.success && usageResponse.data) {
          setUsageAnalytics(usageResponse.data);
        }
      }

      // Load market analytics
      if (showMarket) {
        const marketResponse = await analyticsService.getMarketAnalytics();
        if (marketResponse.success && marketResponse.data) {
          setMarketAnalytics(marketResponse.data);
        }
      }

      // Load reports
      if (showReports) {
        const reportsResponse = await analyticsService.getReports();
        if (reportsResponse.success && reportsResponse.data) {
          setReports(reportsResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, selectedTimeRange, selectedModel, showPortfolio, showModels, showUsage, showMarket, showReports, toast]);

  const handleGenerateReport = useCallback(async (config: ReportConfig) => {
    try {
      const response = await analyticsService.generateReport(config);
      
      if (response.success && response.data) {
        setReports(prev => [response.data!, ...prev]);
        toast({
          title: 'Success',
          description: 'Report generated successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDownloadReport = useCallback(async (reportId: string) => {
    try {
      const blob = await analyticsService.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const formatPercentage = analyticsService.formatPercentage;
  const formatCurrency = analyticsService.formatCurrency;
  const formatLargeNumber = analyticsService.formatLargeNumber;
  const getRiskLevelColor = analyticsService.getRiskLevelColor;
  const getTrendIcon = analyticsService.getTrendIcon;
  const getSignalColor = analyticsService.getSignalColor;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Comprehensive analytics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <Label>Time Range</Label>
              <Select
                value={selectedTimeRange.interval}
                onValueChange={(value: any) => setSelectedTimeRange(prev => ({
                  ...prev,
                  interval: value,
                  start: new Date(Date.now() - (value === '1d' ? 1 : value === '1w' ? 7 : value === '1M' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString()
                }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                  <SelectItem value="1M">1 Month</SelectItem>
                  <SelectItem value="3M">3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  {modelPerformance.map(model => (
                    <SelectItem key={model.modelName} value={model.modelName}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadAnalyticsData} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {showPortfolio && <TabsTrigger value="portfolio">Portfolio</TabsTrigger>}
          {showModels && <TabsTrigger value="models">Models</TabsTrigger>}
          {showUsage && <TabsTrigger value="usage">Usage</TabsTrigger>}
          {showMarket && <TabsTrigger value="market">Market</TabsTrigger>}
          {showReports && <TabsTrigger value="reports">Reports</TabsTrigger>}
        </TabsList>

        {showPortfolio && portfolioAnalytics && (
          <TabsContent value="portfolio" className="space-y-4">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(portfolioAnalytics.totalValue)}</div>
                  <p className={`text-xs ${portfolioAnalytics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(portfolioAnalytics.totalReturn)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Daily Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(portfolioAnalytics.dailyReturn)}</div>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Volatility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(portfolioAnalytics.volatility)}</div>
                  <p className="text-xs text-muted-foreground">Annualized</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioAnalytics.sharpeRatio.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Risk-adjusted</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={portfolioAnalytics.returnsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="portfolioReturn" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={portfolioAnalytics.assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ assetClass, percentage }) => `${assetClass} ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {portfolioAnalytics.assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioAnalytics.topHoldings.slice(0, 5).map((holding, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{holding.symbol}</p>
                          <p className="text-sm text-muted-foreground">{holding.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(holding.value)}</p>
                          <p className={`text-sm ${holding.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(holding.return)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Value at Risk (95%)</p>
                    <p className="text-lg font-semibold">{formatCurrency(portfolioAnalytics.riskMetrics.var_95)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CVaR (95%)</p>
                    <p className="text-lg font-semibold">{formatCurrency(portfolioAnalytics.riskMetrics.cvar_95)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beta</p>
                    <p className="text-lg font-semibold">{portfolioAnalytics.riskMetrics.beta.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-lg font-semibold">{formatPercentage(portfolioAnalytics.maxDrawdown)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showModels && (
          <TabsContent value="models" className="space-y-4">
            {/* Model Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelPerformance.slice(0, 3).map((model, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{model.modelName}</CardTitle>
                    <CardDescription>{model.modelType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{formatPercentage(model.accuracy)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Predictions</span>
                        <span className="font-medium">{formatLargeNumber(model.totalPredictions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg Time</span>
                        <span className="font-medium">{model.processingTime.toFixed(0)}ms</span>
                      </div>
                      <Progress value={model.accuracy * 100} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Model Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={modelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="modelName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#8884d8" />
                    <Bar dataKey="precision" fill="#82ca9d" />
                    <Bar dataKey="recall" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Model Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelPerformance.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{model.modelName}</p>
                        <p className="text-sm text-muted-foreground">
                          {model.totalPredictions} predictions • {model.cost.toFixed(2)} cost
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={model.accuracy > 0.8 ? 'default' : model.accuracy > 0.6 ? 'secondary' : 'destructive'}>
                          {formatPercentage(model.accuracy)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showUsage && usageAnalytics && (
          <TabsContent value="usage" className="space-y-4">
            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatLargeNumber(usageAnalytics.totalApiCalls)}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatLargeNumber(usageAnalytics.totalPredictions)}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(usageAnalytics.totalCost)}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageAnalytics.avgProcessingTime.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">Per request</p>
                </CardContent>
              </Card>
            </div>

            {/* Usage by Model */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usageAnalytics.usageByModel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ modelName, percentage }) => `${modelName} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {usageAnalytics.usageByModel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageAnalytics.usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="calls" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="cost" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageAnalytics.costBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(item.percentage)} of total cost
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.amount)}</p>
                        <Badge variant={item.trend === 'up' ? 'destructive' : item.trend === 'down' ? 'default' : 'secondary'}>
                          {item.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showMarket && marketAnalytics && (
          <TabsContent value="market" className="space-y-4">
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Market Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{marketAnalytics.marketTrend}</div>
                  <p className="text-xs text-muted-foreground">Current trend</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketAnalytics.marketSentiment.toFixed(2)}</div>
                  <Progress value={Math.abs(marketAnalytics.marketSentiment) * 100} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Volatility Index</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketAnalytics.volatilityIndex.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">VIX</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Fear & Greed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketAnalytics.fearGreedIndex.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground">Index</p>
                </CardContent>
              </Card>
            </div>

            {/* Sector Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={marketAnalytics.sectorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="performance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Movers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Gainers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {marketAnalytics.topGainers.slice(0, 5).map((gainer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{gainer.symbol}</p>
                          <p className="text-sm text-muted-foreground">{gainer.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{formatPercentage(gainer.changePercent)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(gainer.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Losers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {marketAnalytics.topLosers.slice(0, 5).map((loser, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{loser.symbol}</p>
                          <p className="text-sm text-muted-foreground">{loser.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">{formatPercentage(loser.changePercent)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(loser.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Market Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {marketAnalytics.marketIndicators.map((indicator, index) => (
                    <div key={index} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{indicator.name}</span>
                        <Badge variant={getSignalColor(indicator.signal)}>
                          {indicator.signal.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{indicator.value.toFixed(2)}</p>
                      <Progress value={indicator.strength * 100} className="mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showReports && (
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Analytics Reports</h3>
              <Button 
                onClick={() => handleGenerateReport({
                  type: 'portfolio',
                  format: 'pdf',
                  timeRange: selectedTimeRange,
                  includeCharts: true,
                  includeRecommendations: true,
                  sections: ['overview', 'performance', 'risk', 'allocation']
                })}
              >
                Generate Report
              </Button>
            </div>

            <div className="space-y-3">
              {reports.map(report => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.type} • {report.format.toUpperCase()} • {report.pages} pages
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generated: {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleDownloadReport(report.id)}
                          variant="outline"
                          size="sm"
                        >
                          Download
                        </Button>
                        <Badge variant="outline">
                          {(report.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No reports available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}