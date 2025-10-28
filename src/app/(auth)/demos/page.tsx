"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Play,
  Settings,
  CheckCircle,
  Activity,
  IndianRupee,
  LineChart,
  CandlestickChart,
  Bot,
  Network,
  Cpu,
  HardDrive,
  Terminal
} from "lucide-react";

// FinSmartAI AI Models Data
const aiModels = [
  {
    id: "sentiment-ai",
    name: "Kronos-SentimentAI",
    description: "News/Social Media Sentiment Analysis for Indian Markets",
    icon: Brain,
    category: "sentiment",
    targetUsers: "Traders, Hedge Funds",
    status: "active",
    progress: 100,
    capabilities: [
      "Real-time sentiment analysis",
      "Moneycontrol & Economic Times integration", 
      "Hindi/English support",
      "Market impact prediction"
    ],
    demoAvailable: true,
    apiEndpoints: 4
  },
  {
    id: "news-insight-ai",
    name: "Kronos-NewsInsightAI", 
    description: "NSE/BSE News AI Summarization & Analysis",
    icon: TrendingUp,
    category: "news",
    targetUsers: "Investors, Research Analysts",
    status: "active",
    progress: 100,
    capabilities: [
      "SEBI filing analysis",
      "Company announcement processing", 
      "Multi-language summarization",
      "Regulatory impact assessment"
    ],
    demoAvailable: true,
    apiEndpoints: 6
  },
  {
    id: "options-ai",
    name: "Kronos-OptionsAI",
    description: "NIFTY/BankNIFTY Options Price Prediction", 
    icon: Shield,
    category: "derivatives",
    targetUsers: "Options Traders",
    status: "active",
    progress: 100,
    capabilities: [
      "Option chain analysis",
      "Greeks calculation",
      "Strategy optimization", 
      "Risk-reward analysis"
    ],
    demoAvailable: true,
    apiEndpoints: 8
  },
  {
    id: "risk-ai",
    name: "Kronos-RiskAI",
    description: "Portfolio Risk Analysis for Indian Markets",
    icon: Zap,
    category: "risk",
    targetUsers: "Portfolio Managers",
    status: "active",
    progress: 100,
    capabilities: [
      "VaR calculation",
      "Portfolio optimization",
      "Indian market correlation",
      "Stress testing"
    ],
    demoAvailable: true,
    apiEndpoints: 5
  },
  {
    id: "fund-flow-ai",
    name: "Kronos-FundFlowAI",
    description: "FII/DII Fund Flow Prediction & Analysis",
    icon: Globe,
    category: "institutional",
    targetUsers: "Institutional Traders",
    status: "active", 
    progress: 100,
    capabilities: [
      "NSE FII/DII data integration",
      "Flow prediction models",
      "Market timing signals",
      "Institutional sentiment analysis"
    ],
    demoAvailable: true,
    apiEndpoints: 4
  },
  {
    id: "mutual-ai",
    name: "Kronos-MutualAI",
    description: "Indian Mutual Fund Intelligent Ranking",
    icon: DollarSign,
    category: "mutual-funds",
    targetUsers: "Retail Investors",
    status: "active",
    progress: 100,
    capabilities: [
      "AMFI data integration",
      "Fund performance ranking",
      "Risk-adjusted returns",
      "Category-wise analysis"
    ],
    demoAvailable: true,
    apiEndpoints: 3
  },
  {
    id: "commod-ai",
    name: "Kronos-CommodAI",
    description: "MCX Commodity Price Forecasting",
    icon: Users,
    category: "commodities",
    targetUsers: "Commodity Traders",
    status: "active",
    progress: 100,
    capabilities: [
      "Gold, Silver, Crude predictions",
      "MCX data integration",
      "Seasonal pattern analysis",
      "Supply-demand forecasting"
    ],
    demoAvailable: false,
    apiEndpoints: 3
  },
  {
    id: "fx-ai", 
    name: "Kronos-FXAI",
    description: "INR Exchange Rate Trend Prediction",
    icon: Target,
    category: "forex",
    targetUsers: "Forex Traders",
    status: "active",
    progress: 100,
    capabilities: [
      "USD/INR, EUR/INR, GBP/INR",
      "RBI policy impact analysis",
      "Trade balance correlation", 
      "Volatility forecasting"
    ],
    demoAvailable: false,
    apiEndpoints: 3
  },
  {
    id: "tax-ai",
    name: "Kronos-TaxAI",
    description: "Tax Optimization with Tally Integration",
    icon: BarChart3,
    category: "enterprise",
    targetUsers: "Enterprises, CFOs",
    status: "active",
    progress: 100,
    capabilities: [
      "Indian tax laws integration",
      "Tally ERP connectivity",
      "GST optimization",
      "Cash flow forecasting"
    ],
    demoAvailable: false,
    apiEndpoints: 6
  },
  {
    id: "alpha-ai",
    name: "Kronos-AlphaAI",
    description: "Automated Trading Strategy Generation",
    icon: Clock,
    category: "quantitative",
    targetUsers: "Quantitative Funds",
    status: "active",
    progress: 100,
    capabilities: [
      "Indian market strategy generation",
      "Backtesting engine",
      "Performance metrics",
      "Risk management"
    ],
    demoAvailable: false,
    apiEndpoints: 7
  },
  {
    id: "trend-fusion-ai",
    name: "Kronos-TrendFusion",
    description: "Unified Multi-Model Forecasting",
    icon: Star,
    category: "ensemble",
    targetUsers: "Institutional Investors",
    status: "active",
    progress: 100,
    capabilities: [
      "12-model ensemble",
      "Attention-based fusion",
      "Confidence scoring",
      "Cross-asset analysis"
    ],
    demoAvailable: false,
    apiEndpoints: 5
  },
  {
    id: "global-ai",
    name: "Kronos Global",
    description: "Global Market Coverage with Indian Focus",
    icon: ArrowRight,
    category: "global",
    targetUsers: "Multinational Corporations",
    status: "active",
    progress: 100,
    capabilities: [
      "Global-Indian correlation",
      "Multi-asset coverage",
      "24/7 analysis",
      "Cross-border insights"
    ],
    demoAvailable: false,
    apiEndpoints: 8
  }
];

const categories = [
  { id: "all", name: "All Models", icon: Brain },
  { id: "sentiment", name: "Sentiment", icon: Brain },
  { id: "news", name: "News Analysis", icon: TrendingUp },
  { id: "derivatives", name: "Derivatives", icon: Shield },
  { id: "risk", name: "Risk Management", icon: Zap },
  { id: "institutional", name: "Institutional", icon: Globe },
  { id: "mutual-funds", name: "Mutual Funds", icon: DollarSign },
  { id: "commodities", name: "Commodities", icon: Users },
  { id: "forex", name: "Forex", icon: Target },
  { id: "enterprise", name: "Enterprise", icon: BarChart3 },
  { id: "quantitative", name: "Quantitative", icon: Clock },
  { id: "ensemble", name: "Ensemble", icon: Star },
  { id: "global", name: "Global", icon: ArrowRight }
];

export default function DemosPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("models");

  const filteredModels = selectedCategory === "all" 
    ? aiModels 
    : aiModels.filter(model => model.category === selectedCategory);

  const availableDemos = filteredModels.filter(model => model.demoAvailable);
  const totalModels = filteredModels.length;
  const activeModels = filteredModels.filter(model => model.status === "active").length;

  const handleTryDemo = (modelId: string) => {
    setSelectedModel(modelId);
    setActiveTab("demo");
    console.log(`Starting demo for model: ${modelId}`);
  };

  const getModelById = (id: string) => {
    return aiModels.find(model => model.id === id);
  };

  const selectedModelData = selectedModel ? getModelById(selectedModel) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Models & Live Demos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Explore our 12 specialized AI models for Indian financial markets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{activeModels}/{totalModels}</div>
            <div className="text-sm text-gray-500">Models Active</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{availableDemos.length}</div>
            <div className="text-sm text-gray-500">Live Demos</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalModels}</div>
            <div className="text-sm text-gray-600">Specialized AI Models</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeModels}</div>
            <div className="text-sm text-gray-600">Production Ready</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Demos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{availableDemos.length}</div>
            <div className="text-sm text-gray-600">Try Live Now</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {filteredModels.reduce((sum, model) => sum + model.apiEndpoints, 0)}
            </div>
            <div className="text-sm text-gray-600">Total APIs</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Category</CardTitle>
          <CardDescription>
            Select a category to view specific AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count = category.id === "all" 
                ? aiModels.length 
                : aiModels.filter(model => model.category === category.id).length;
              
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <category.icon className="w-4 h-4" />
                  {category.name} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="demo" disabled={!selectedModelData}>
            Live Demo {selectedModelData && `- ${selectedModelData.name}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <model.icon className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                    </div>
                    <Badge 
                      variant={model.status === "active" ? "default" : "secondary"}
                      className={model.status === "active" ? "bg-green-500" : ""}
                    >
                      {model.status === "active" ? "Active" : "In Development"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {model.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Development Progress</span>
                      <span>{model.progress}%</span>
                    </div>
                    <Progress value={model.progress} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Capabilities:</div>
                    <div className="space-y-1">
                      {model.capabilities.slice(0, 3).map((capability, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {capability}
                        </div>
                      ))}
                      {model.capabilities.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{model.capabilities.length - 3} more capabilities
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Target Users:</span>
                    <span className="font-medium">{model.targetUsers}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">API Endpoints:</span>
                    <span className="font-medium">{model.apiEndpoints}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={!model.demoAvailable}
                    onClick={() => handleTryDemo(model.id)}
                  >
                    {model.demoAvailable ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Try Live Demo
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Demo Coming Soon
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          {selectedModelData && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <selectedModelData.icon className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">{selectedModelData.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {selectedModelData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Demo Interface */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold mb-2">Live Demo Interface</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Experience the power of {selectedModelData.name} in action
                    </p>
                  </div>
                  
                  {/* Demo Placeholder */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                      <h4 className="text-lg font-semibold mb-2">Interactive Demo</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This would be an interactive demo showing {selectedModelData.name} capabilities
                      </p>
                      <div className="space-y-2 text-left max-w-md mx-auto">
                        {selectedModelData.capabilities.map((capability, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {capability}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Technical Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="default" className="bg-green-500">
                          Production Ready
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">
                          {categories.find(c => c.id === selectedModelData.category)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Endpoints:</span>
                        <span className="font-medium">{selectedModelData.apiEndpoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Users:</span>
                        <span className="font-medium">{selectedModelData.targetUsers}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Integration Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Terminal className="w-4 h-4 mr-2" />
                        View API Documentation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Code className="w-4 h-4 mr-2" />
                        Download SDK
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Integration
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start Full Demo
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}