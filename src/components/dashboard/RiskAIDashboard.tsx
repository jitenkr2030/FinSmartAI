"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Shield, BarChart3, PieChart, Target } from "lucide-react";

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  holdings: PortfolioHolding[];
  riskMetrics: PortfolioRiskMetric[];
}

interface PortfolioHolding {
  id: string;
  portfolioId: string;
  instrumentId: string;
  quantity: number;
  avgPrice: number;
  instrument: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    exchange: string;
    currency: string;
  };
}

interface PortfolioRiskMetric {
  id: string;
  portfolioId: string;
  metricType: string;
  value: number;
  timestamp: string;
}

interface RiskAnalysis {
  var_95: number;
  cvar_95: number;
  beta: number;
  sharpe_ratio: number;
  volatility: number;
  max_drawdown: number;
  correlation_matrix: number[][];
  risk_contribution: Array<{
    symbol: string;
    contribution: number;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
    impact: string;
  }>;
  ai_analysis: string;
}

interface RiskAIDashboardProps {
  userId: string;
}

export default function RiskAIDashboard({ userId }: RiskAIDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, [userId]);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch(`/api/portfolio?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setPortfolios(data.data.portfolios);
        if (data.data.portfolios.length > 0) {
          setSelectedPortfolio(data.data.portfolios[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = async () => {
    if (!selectedPortfolio) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch('/api/risk/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId: selectedPortfolio.id,
          riskMetrics: ['var', 'cvar', 'beta', 'sharpe'],
          userId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRiskAnalysis(data.data.riskAnalysis);
        // Refresh portfolios to get updated risk metrics
        await fetchPortfolios();
      }
    } catch (error) {
      console.error('Error analyzing risk:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskLevel = (value: number, type: string) => {
    switch (type) {
      case 'var':
      case 'cvar':
        return value > 0.15 ? 'high' : value > 0.08 ? 'medium' : 'low';
      case 'volatility':
        return value > 0.25 ? 'high' : value > 0.15 ? 'medium' : 'low';
      case 'max_drawdown':
        return value > 0.3 ? 'high' : value > 0.15 ? 'medium' : 'low';
      case 'beta':
        return value > 1.5 ? 'high' : value > 1.0 ? 'medium' : 'low';
      default:
        return 'medium';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingDown className="w-4 h-4" />;
      case 'low': return <Shield className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const calculatePortfolioValue = (portfolio: Portfolio) => {
    return portfolio.holdings.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.avgPrice * 1.05); // 5% gain assumption
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">RiskAI Dashboard</h2>
          <p className="text-gray-600">Advanced portfolio risk analysis and management</p>
        </div>
        <Button 
          onClick={analyzeRisk}
          disabled={!selectedPortfolio || analyzing}
          className="flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Analyze Risk
            </>
          )}
        </Button>
      </div>

      {/* Portfolio Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => {
          const value = calculatePortfolioValue(portfolio);
          const isSelected = selectedPortfolio?.id === portfolio.id;
          
          return (
            <Card 
              key={portfolio.id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setSelectedPortfolio(portfolio)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                  {isSelected && <Badge variant="default">Selected</Badge>}
                </div>
                <CardDescription>{portfolio.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Holdings:</span>
                    <span>{portfolio.holdings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">₹{(value / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Risk Metrics:</span>
                    <span>{portfolio.riskMetrics.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPortfolio && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(calculatePortfolioValue(selectedPortfolio) / 100000).toFixed(2)}L
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedPortfolio.holdings.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedPortfolio.riskMetrics.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Last Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {riskAnalysis ? 'Just now' : 'Not analyzed'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Holdings Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Composition</CardTitle>
                <CardDescription>Current holdings and their values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedPortfolio.holdings.map((holding) => {
                    const value = holding.quantity * holding.avgPrice * 1.05;
                    const totalValue = calculatePortfolioValue(selectedPortfolio);
                    const percentage = (value / totalValue) * 100;
                    
                    return (
                      <div key={holding.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {holding.instrument.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{holding.instrument.symbol}</div>
                            <div className="text-sm text-gray-600">
                              {holding.quantity} shares @ ₹{holding.avgPrice}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{(value / 100000).toFixed(2)}L</div>
                          <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {riskAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Metrics</CardTitle>
                    <CardDescription>Key risk indicators for your portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getRiskIcon(getRiskLevel(riskAnalysis.var_95, 'var'))}
                          VaR (95%)
                        </span>
                        <div className="text-right">
                          <div className={`font-medium ${getRiskColor(getRiskLevel(riskAnalysis.var_95, 'var'))}`}>
                            {(riskAnalysis.var_95 * 100).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {getRiskLevel(riskAnalysis.var_95, 'var').toUpperCase()} risk
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getRiskIcon(getRiskLevel(riskAnalysis.cvar_95, 'cvar'))}
                          CVaR (95%)
                        </span>
                        <div className="text-right">
                          <div className={`font-medium ${getRiskColor(getRiskLevel(riskAnalysis.cvar_95, 'cvar'))}`}>
                            {(riskAnalysis.cvar_95 * 100).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {getRiskLevel(riskAnalysis.cvar_95, 'cvar').toUpperCase()} risk
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getRiskIcon(getRiskLevel(riskAnalysis.beta, 'beta'))}
                          Beta
                        </span>
                        <div className="text-right">
                          <div className={`font-medium ${getRiskColor(getRiskLevel(riskAnalysis.beta, 'beta'))}`}>
                            {riskAnalysis.beta.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getRiskLevel(riskAnalysis.beta, 'beta').toUpperCase()} risk
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getRiskIcon(getRiskLevel(riskAnalysis.volatility, 'volatility'))}
                          Volatility
                        </span>
                        <div className="text-right">
                          <div className={`font-medium ${getRiskColor(getRiskLevel(riskAnalysis.volatility, 'volatility'))}`}>
                            {(riskAnalysis.volatility * 100).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {getRiskLevel(riskAnalysis.volatility, 'volatility').toUpperCase()} risk
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Sharpe Ratio
                        </span>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {riskAnalysis.sharpe_ratio.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {riskAnalysis.sharpe_ratio > 1.5 ? 'Excellent' : riskAnalysis.sharpe_ratio > 1.0 ? 'Good' : 'Fair'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>AI Risk Analysis</CardTitle>
                    <CardDescription>Comprehensive risk assessment by Kronos-RiskAI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{riskAnalysis.ai_analysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click "Analyze Risk" to perform risk analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Holdings</CardTitle>
                <CardDescription>Complete breakdown of your portfolio holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Symbol</th>
                        <th className="text-left py-2">Name</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Avg Price</th>
                        <th className="text-right py-2">Current Value</th>
                        <th className="text-right py-2">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPortfolio.holdings.map((holding) => {
                        const currentValue = holding.quantity * holding.avgPrice * 1.05;
                        const totalCost = holding.quantity * holding.avgPrice;
                        const gainLoss = currentValue - totalCost;
                        const gainLossPercent = (gainLoss / totalCost) * 100;
                        
                        return (
                          <tr key={holding.id} className="border-b">
                            <td className="py-2 font-medium">{holding.instrument.symbol}</td>
                            <td className="py-2">{holding.instrument.name}</td>
                            <td className="py-2 text-right">{holding.quantity}</td>
                            <td className="py-2 text-right">₹{holding.avgPrice.toFixed(2)}</td>
                            <td className="py-2 text-right">₹{(currentValue / 100000).toFixed(2)}L</td>
                            <td className={`py-2 text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}₹{(gainLoss / 100000).toFixed(2)}L ({gainLossPercent.toFixed(1)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {riskAnalysis?.recommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {riskAnalysis.recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{rec.type}</CardTitle>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{rec.message}</p>
                      <div className="text-sm font-medium text-blue-600">
                        Impact: {rec.impact}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Perform risk analysis to get recommendations</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}