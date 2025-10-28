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
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw, AlertTriangle, CheckCircle, Target } from "lucide-react";

interface FlowAnalysis {
  marketSentiment: string;
  confidence: number;
  flowPatterns: any[];
  keyInsights: any[];
  predictions: any[];
  recommendations: any[];
  correlationWithMarket: number;
}

interface FlowPrediction {
  dailyPredictions: any[];
  weeklyPredictions: any[];
  monthlyPredictions: any[];
  aggregates: {
    fiiTotal: number;
    diiTotal: number;
    totalNet: number;
  };
  confidence: {
    overall: number;
    fii: number;
    dii: number;
  };
  tradingSignals: any[];
  scenarios: any[];
}

interface HistoricalData {
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  data: any[];
  summary: any;
  trends: any;
}

export default function FundFlowAIDashboard() {
  const [analysisParams, setAnalysisParams] = useState({
    startDate: "",
    endDate: "",
    segment: "all",
    includeFII: true,
    includeDII: true
  });

  const [predictionParams, setPredictionParams] = useState({
    predictionDays: 30,
    includeFII: true,
    includeDII: true,
    segment: "all"
  });

  const [historicalParams, setHistoricalParams] = useState({
    startDate: "",
    endDate: "",
    segment: "all",
    includeFII: true,
    includeDII: true
  });

  const [analysisResult, setAnalysisResult] = useState<FlowAnalysis | null>(null);
  const [predictionResult, setPredictionResult] = useState<FlowPrediction | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");

  const handleAnalyzeFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fundflow/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisParams)
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing flows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fundflow/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionParams)
      });

      const data = await response.json();
      if (data.success) {
        setPredictionResult(data.data.predictions);
      }
    } catch (error) {
      console.error("Error predicting flows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHistorical = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: historicalParams.startDate,
        endDate: historicalParams.endDate,
        segment: historicalParams.segment,
        includeFII: historicalParams.includeFII.toString(),
        includeDII: historicalParams.includeDII.toString()
      });

      const response = await fetch(`/api/fundflow/historical?${params}`);
      const data = await response.json();
      if (data.success) {
        setHistoricalData(data.data);
      }
    } catch (error) {
      console.error("Error getting historical data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    setAnalysisParams({
      ...analysisParams,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });

    setHistoricalParams({
      ...historicalParams,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'bg-green-100 text-green-800';
      case 'bearish': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'contrarian': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toFixed(0)} crores`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">FundFlowAI</h2>
          <p className="text-muted-foreground">
            Institutional fund flow analysis and prediction
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <BarChart3 className="w-4 h-4 mr-1" />
          Flow Analytics Engine
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Flow Analysis</TabsTrigger>
          <TabsTrigger value="prediction">Flow Prediction</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Flow Analysis Parameters
              </CardTitle>
              <CardDescription>
                Configure parameters for institutional flow analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="analysisStartDate">Start Date</Label>
                <Input
                  id="analysisStartDate"
                  type="date"
                  value={analysisParams.startDate}
                  onChange={(e) => setAnalysisParams({...analysisParams, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="analysisEndDate">End Date</Label>
                <Input
                  id="analysisEndDate"
                  type="date"
                  value={analysisParams.endDate}
                  onChange={(e) => setAnalysisParams({...analysisParams, endDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Market Segment</Label>
                <Select 
                  value={analysisParams.segment} 
                  onValueChange={(value) => setAnalysisParams({...analysisParams, segment: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="cash">Cash Market</SelectItem>
                    <SelectItem value="derivatives">Derivatives</SelectItem>
                    <SelectItem value="debt">Debt Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Sources</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={analysisParams.includeFII}
                      onChange={(e) => setAnalysisParams({...analysisParams, includeFII: e.target.checked})}
                    />
                    <span className="text-sm">Include FII</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={analysisParams.includeDII}
                      onChange={(e) => setAnalysisParams({...analysisParams, includeDII: e.target.checked})}
                    />
                    <span className="text-sm">Include DII</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quick Date Range</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(endDate.getDate() - 7);
                      setAnalysisParams({
                        ...analysisParams,
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      });
                    }}
                  >
                    7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(endDate.getDate() - 30);
                      setAnalysisParams({
                        ...analysisParams,
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      });
                    }}
                  >
                    30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setDefaultDates}
                  >
                    Set Default
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleAnalyzeFlows} 
            disabled={loading || !analysisParams.startDate || !analysisParams.endDate}
            className="w-full"
          >
            {loading ? "Analyzing Flows..." : "Analyze Institutional Flows"}
          </Button>

          {analysisResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Sentiment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Overall Sentiment:</span>
                    <Badge className={getSentimentColor(analysisResult.marketSentiment)}>
                      {analysisResult.marketSentiment}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-semibold">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Correlation:</span>
                    <span className="font-semibold">{(analysisResult.correlationWithMarket * 100).toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flow Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.flowPatterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{pattern.type.replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">{pattern.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.keyInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{insight.type.replace(/_/g, ' ')}</div>
                      <div>{insight.message}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Predictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.predictions.slice(0, 2).map((prediction, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{prediction.timeframe}</div>
                      <div className="text-muted-foreground">
                        FII: {prediction.fiiPrediction > 0 ? '+' : ''}{prediction.fiiPrediction.toFixed(1)}x
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{rec.action.replace(/_/g, ' ')}</div>
                      <div>{rec.message}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prediction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Flow Prediction Parameters
              </CardTitle>
              <CardDescription>
                Configure parameters for institutional flow prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="predictionDays">Prediction Days</Label>
                <Select 
                  value={predictionParams.predictionDays.toString()} 
                  onValueChange={(value) => setPredictionParams({...predictionParams, predictionDays: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="predictionSegment">Market Segment</Label>
                <Select 
                  value={predictionParams.segment} 
                  onValueChange={(value) => setPredictionParams({...predictionParams, segment: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="cash">Cash Market</SelectItem>
                    <SelectItem value="derivatives">Derivatives</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prediction Sources</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={predictionParams.includeFII}
                      onChange={(e) => setPredictionParams({...predictionParams, includeFII: e.target.checked})}
                    />
                    <span className="text-sm">Include FII</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={predictionParams.includeDII}
                      onChange={(e) => setPredictionParams({...predictionParams, includeDII: e.target.checked})}
                    />
                    <span className="text-sm">Include DII</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handlePredictFlows} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Predicting Flows..." : "Predict Future Flows"}
          </Button>

          {predictionResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prediction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>FII Total:</span>
                    <span className={`font-semibold ${predictionResult.aggregates.fiiTotal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(predictionResult.aggregates.fiiTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>DII Total:</span>
                    <span className={`font-semibold ${predictionResult.aggregates.diiTotal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(predictionResult.aggregates.diiTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Total:</span>
                    <span className={`font-semibold ${predictionResult.aggregates.totalNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(predictionResult.aggregates.totalNet)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <Badge variant={predictionResult.confidence.overall > 0.7 ? "default" : "secondary"}>
                      {(predictionResult.confidence.overall * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trading Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {predictionResult.tradingSignals.slice(0, 3).map((signal, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{signal.type.replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">{signal.message}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {signal.confidence.toFixed(0)}% confidence
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {predictionResult.scenarios.slice(0, 3).map((scenario, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-muted-foreground">{scenario.description}</div>
                      <div className="text-xs">Probability: {(scenario.probability * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historical Data Parameters
              </CardTitle>
              <CardDescription>
                Retrieve historical institutional flow data
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historicalStartDate">Start Date</Label>
                <Input
                  id="historicalStartDate"
                  type="date"
                  value={historicalParams.startDate}
                  onChange={(e) => setHistoricalParams({...historicalParams, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historicalEndDate">End Date</Label>
                <Input
                  id="historicalEndDate"
                  type="date"
                  value={historicalParams.endDate}
                  onChange={(e) => setHistoricalParams({...historicalParams, endDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historicalSegment">Market Segment</Label>
                <Select 
                  value={historicalParams.segment} 
                  onValueChange={(value) => setHistoricalParams({...historicalParams, segment: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="cash">Cash Market</SelectItem>
                    <SelectItem value="derivatives">Derivatives</SelectItem>
                    <SelectItem value="debt">Debt Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Sources</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={historicalParams.includeFII}
                      onChange={(e) => setHistoricalParams({...historicalParams, includeFII: e.target.checked})}
                    />
                    <span className="text-sm">Include FII</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={historicalParams.includeDII}
                      onChange={(e) => setHistoricalParams({...historicalParams, includeDII: e.target.checked})}
                    />
                    <span className="text-sm">Include DII</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={handleGetHistorical} 
              disabled={loading || !historicalParams.startDate || !historicalParams.endDate}
              className="flex-1"
            >
              {loading ? "Retrieving Data..." : "Get Historical Data"}
            </Button>
            {historicalData && (
              <Button 
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams({
                    startDate: historicalParams.startDate,
                    endDate: historicalParams.endDate,
                    segment: historicalParams.segment,
                    includeFII: historicalParams.includeFII.toString(),
                    includeDII: historicalParams.includeDII.toString(),
                    format: 'csv'
                  });
                  window.open(`/api/fundflow/historical?${params}`, '_blank');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>

          {historicalData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-semibold">{historicalData.period.totalDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points:</span>
                    <span className="font-semibold">{historicalData.data.length}</span>
                  </div>
                  {historicalData.summary.fii && (
                    <>
                      <div className="flex justify-between">
                        <span>FII Net Flow:</span>
                        <span className={`font-semibold ${historicalData.summary.fii.totalNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(historicalData.summary.fii.totalNet)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>FII Avg Daily:</span>
                        <span className="font-semibold">{formatCurrency(historicalData.summary.fii.avgDaily)}</span>
                      </div>
                    </>
                  )}
                  {historicalData.summary.dii && (
                    <>
                      <div className="flex justify-between">
                        <span>DII Net Flow:</span>
                        <span className={`font-semibold ${historicalData.summary.dii.totalNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(historicalData.summary.dii.totalNet)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>DII Avg Daily:</span>
                        <span className="font-semibold">{formatCurrency(historicalData.summary.dii.avgDaily)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trends & Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {historicalData.trends.fii && (
                    <div className="text-sm">
                      <div className="font-medium">FII Trend</div>
                      <div className="text-muted-foreground">
                        {historicalData.trends.fii.direction} ({(historicalData.trends.fii.strength * 100).toFixed(0)}% strength)
                      </div>
                    </div>
                  )}
                  {historicalData.trends.dii && (
                    <div className="text-sm">
                      <div className="font-medium">DII Trend</div>
                      <div className="text-muted-foreground">
                        {historicalData.trends.dii.direction} ({(historicalData.trends.dii.strength * 100).toFixed(0)}% strength)
                      </div>
                    </div>
                  )}
                  {historicalData.summary.combined && (
                    <div className="text-sm">
                      <div className="font-medium">FII-DII Correlation</div>
                      <div className="text-muted-foreground">
                        {(historicalData.summary.combined.correlation * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}