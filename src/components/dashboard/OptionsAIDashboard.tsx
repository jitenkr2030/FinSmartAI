"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, TrendingUp, BarChart3, Target, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface OptionData {
  underlying: string;
  strike: number;
  expiry: string;
  optionType: string;
  currentPrice: number;
  volatility?: number;
  riskFreeRate?: number;
  dividendYield?: number;
}

interface PricingResult {
  fairValue: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  impliedVolatility: number;
  probabilityITM: number;
  breakEven: number;
  confidence: number;
  modelUsed: string;
  marketConditions: string;
  recommendations: any[];
}

interface StrategyAnalysis {
  suitability: string;
  riskRewardRatio: number;
  maxProfit: number | string;
  maxLoss: number | string;
  breakEvenPoints: number[];
  probabilityOfSuccess: number;
  riskLevel: string;
  recommendations: any[];
}

export default function OptionsAIDashboard() {
  const [optionData, setOptionData] = useState<OptionData>({
    underlying: "NIFTY",
    strike: 19500,
    expiry: "",
    optionType: "call",
    currentPrice: 19450,
    volatility: 0.18,
    riskFreeRate: 0.065,
    dividendYield: 0.02
  });

  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [strategyAnalysis, setStrategyAnalysis] = useState<StrategyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pricing");

  const handlePriceOption = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/options/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optionData)
      });

      const data = await response.json();
      if (data.success) {
        setPricingResult(data.data.pricing);
      }
    } catch (error) {
      console.error("Error pricing option:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStrategy = async () => {
    setLoading(true);
    try {
      const strategyData = {
        strategy: "long_call",
        underlying: optionData.underlying,
        options: [{
          strike: optionData.strike,
          type: optionData.optionType,
          premium: pricingResult?.fairValue || 100
        }],
        marketConditions: "neutral",
        riskTolerance: "moderate"
      };

      const response = await fetch("/api/options/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategyData)
      });

      const data = await response.json();
      if (data.success) {
        setStrategyAnalysis(data.data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing strategy:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGreeks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/options/greeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...optionData,
          calculations: ["delta", "gamma", "theta", "vega", "rho"],
          includeSensitivity: true
        })
      });

      const data = await response.json();
      if (data.success && pricingResult) {
        setPricingResult({
          ...pricingResult,
          greeks: data.data.greeks.greeks
        });
      }
    } catch (error) {
      console.error("Error calculating Greeks:", error);
    } finally {
      setLoading(false);
    }
  };

  const setExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setOptionData({
      ...optionData,
      expiry: date.toISOString().split('T')[0]
    });
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">OptionsAI</h2>
          <p className="text-muted-foreground">
            Advanced derivatives pricing and strategy analysis
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Calculator className="w-4 h-4 mr-1" />
          Options Pricing Engine
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">Option Pricing</TabsTrigger>
          <TabsTrigger value="strategy">Strategy Analysis</TabsTrigger>
          <TabsTrigger value="greeks">Greeks & Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Option Pricing Parameters
              </CardTitle>
              <CardDescription>
                Configure option parameters for AI-powered pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="underlying">Underlying</Label>
                <Input
                  id="underlying"
                  value={optionData.underlying}
                  onChange={(e) => setOptionData({...optionData, underlying: e.target.value})}
                  placeholder="NIFTY, BANKNIFTY, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strike">Strike Price</Label>
                <Input
                  id="strike"
                  type="number"
                  value={optionData.strike}
                  onChange={(e) => setOptionData({...optionData, strike: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPrice">Current Price</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  value={optionData.currentPrice}
                  onChange={(e) => setOptionData({...optionData, currentPrice: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionType">Option Type</Label>
                <Select 
                  value={optionData.optionType} 
                  onValueChange={(value) => setOptionData({...optionData, optionType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={optionData.expiry}
                  onChange={(e) => setOptionData({...optionData, expiry: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Expiry</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiryDate(7)}
                  >
                    7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiryDate(30)}
                  >
                    30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiryDate(90)}
                  >
                    90 days
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volatility">Volatility (%)</Label>
                <Input
                  id="volatility"
                  type="number"
                  step="0.01"
                  value={(optionData.volatility || 0) * 100}
                  onChange={(e) => setOptionData({...optionData, volatility: parseFloat(e.target.value) / 100})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
                <Input
                  id="riskFreeRate"
                  type="number"
                  step="0.01"
                  value={(optionData.riskFreeRate || 0) * 100}
                  onChange={(e) => setOptionData({...optionData, riskFreeRate: parseFloat(e.target.value) / 100})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
                <Input
                  id="dividendYield"
                  type="number"
                  step="0.01"
                  value={(optionData.dividendYield || 0) * 100}
                  onChange={(e) => setOptionData({...optionData, dividendYield: parseFloat(e.target.value) / 100})}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={handlePriceOption} 
              disabled={loading || !optionData.expiry}
              className="flex-1"
            >
              {loading ? "Calculating..." : "Calculate Option Price"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCalculateGreeks}
              disabled={loading || !optionData.expiry}
            >
              Calculate Greeks
            </Button>
          </div>

          {pricingResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Option Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Fair Value:</span>
                    <span className="font-semibold">₹{pricingResult.fairValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Implied Volatility:</span>
                    <span className="font-semibold">{(pricingResult.impliedVolatility * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probability ITM:</span>
                    <span className="font-semibold">{(pricingResult.probabilityITM * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break-even:</span>
                    <span className="font-semibold">₹{pricingResult.breakEven.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <Badge variant={pricingResult.confidence > 0.7 ? "default" : "secondary"}>
                      {(pricingResult.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Option Greeks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Delta:</span>
                    <span className="font-semibold">{pricingResult.greeks.delta.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gamma:</span>
                    <span className="font-semibold">{pricingResult.greeks.gamma.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Theta:</span>
                    <span className="font-semibold">{pricingResult.greeks.theta.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vega:</span>
                    <span className="font-semibold">{pricingResult.greeks.vega.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rho:</span>
                    <span className="font-semibold">{pricingResult.greeks.rho.toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Market Conditions:</span>
                    <Badge variant="outline">{pricingResult.marketConditions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Used:</span>
                    <span className="text-sm">{pricingResult.modelUsed}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Recommendations:</span>
                    {pricingResult.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded">
                        {rec.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Strategy Analysis
              </CardTitle>
              <CardDescription>
                Analyze options strategies for risk-reward optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy Type</Label>
                  <Select defaultValue="long_call">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long_call">Long Call</SelectItem>
                      <SelectItem value="long_put">Long Put</SelectItem>
                      <SelectItem value="covered_call">Covered Call</SelectItem>
                      <SelectItem value="straddle">Straddle</SelectItem>
                      <SelectItem value="strangle">Strangle</SelectItem>
                      <SelectItem value="butterfly">Butterfly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select defaultValue="moderate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAnalyzeStrategy} 
                disabled={loading || !pricingResult}
                className="w-full"
              >
                {loading ? "Analyzing Strategy..." : "Analyze Strategy"}
              </Button>
            </CardContent>
          </Card>

          {strategyAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strategy Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Suitability:</span>
                    <Badge variant={strategyAnalysis.suitability === 'high' ? 'default' : 'secondary'}>
                      {strategyAnalysis.suitability}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk/Reward Ratio:</span>
                    <span className="font-semibold">{strategyAnalysis.riskRewardRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Profit:</span>
                    <span className="font-semibold text-green-600">
                      {typeof strategyAnalysis.maxProfit === 'string' 
                        ? strategyAnalysis.maxProfit 
                        : `₹${strategyAnalysis.maxProfit.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Loss:</span>
                    <span className="font-semibold text-red-600">
                      {typeof strategyAnalysis.maxLoss === 'string' 
                        ? strategyAnalysis.maxLoss 
                        : `₹${strategyAnalysis.maxLoss.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Probability:</span>
                    <span className="font-semibold">{(strategyAnalysis.probabilityOfSuccess * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <Badge className={getRiskColor(strategyAnalysis.riskLevel)}>
                      {strategyAnalysis.riskLevel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Break-even Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Break-even Points:</span>
                    {strategyAnalysis.breakEvenPoints.map((point, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Point {index + 1}:</span>
                        <span className="font-semibold">₹{point.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Recommendations:</span>
                    {strategyAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded">
                        <div className="font-medium">{rec.action.replace(/_/g, ' ')}</div>
                        <div>{rec.message}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="greeks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Greeks & Risk Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive Greeks calculation and sensitivity analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Greeks analysis is integrated into the Option Pricing tab.
                  Calculate an option price to see detailed Greeks analysis.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("pricing")}
                >
                  Go to Option Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}