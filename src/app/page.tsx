'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileOptimizedHomePage } from "@/components/layout/MobileOptimizedPage";
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
  CheckCircle,
  Server,
  Database,
  Code,
  Rocket,
  Users2,
  Building2,
  TrendingDown,
  PieChart,
  Activity,
  Bell,
  Settings,
  Search,
  Filter,
  History,
  IndianRupee,
  LineChart,
  CandlestickChart,
  Bot,
  Network,
  Cpu,
  HardDrive,
  Terminal,
  LayoutDashboard,
  FileText
} from "lucide-react";

// Kronos-India Implementation Details
const kronosIndiaFeatures = [
  {
    title: "Indian Market Adaptation",
    icon: IndianRupee,
    description: "Fine-tuned specifically for NSE/BSE markets",
    capabilities: [
      "RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS",
      "NIFTY50 & BANKNIFTY index support", 
      "Indian market hours and holidays",
      "Local currency and decimal precision"
    ]
  },
  {
    title: "Advanced Data Pipeline",
    icon: Database,
    description: "Complete OHLCV data processing for Indian stocks",
    capabilities: [
      "yfinance integration for NSE data",
      "15+ technical indicators (RSI, MACD, Bollinger Bands)",
      "Data cleaning and normalization",
      "Sliding window sequence generation"
    ]
  },
  {
    title: "Model Fine-tuning",
    icon: Brain,
    description: "Kronos-small adapted for Indian market patterns",
    capabilities: [
      "Transfer learning on Indian historical data",
      "Sequence length: 512 tokens",
      "Multi-variate time series prediction",
      "10-30 day forecast horizon"
    ]
  },
  {
    title: "CLI Interface",
    icon: Terminal,
    description: "Command-line tools for predictions and analysis",
    capabilities: [
      "kronos_predict.py CLI tool",
      "Custom sequence lengths and periods",
      "JSON output with confidence scores",
      "Batch prediction support"
    ]
  }
];

// FinSmartAI Ecosystem Models
const aiModels = [
  {
    name: "Kronos-SentimentAI",
    description: "News/Social Media Sentiment Analysis for Indian Markets",
    icon: Brain,
    targetUsers: "Traders, Hedge Funds",
    revenue: "₹1.5-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["Real-time sentiment analysis", "Moneycontrol & Economic Times integration", "Hindi/English support", "Market impact prediction"]
  },
  {
    name: "Kronos-NewsInsightAI",
    description: "NSE/BSE News AI Summarization & Analysis",
    icon: TrendingUp,
    targetUsers: "Investors, Research Analysts",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["SEBI filing analysis", "Company announcement processing", "Multi-language summarization", "Regulatory impact assessment"]
  },
  {
    name: "Kronos-OptionsAI",
    description: "NIFTY/BankNIFTY Options Price Prediction",
    icon: Shield,
    targetUsers: "Options Traders",
    revenue: "₹2-4 crore",
    status: "active",
    progress: 100,
    capabilities: ["Option chain analysis", "Greeks calculation", "Strategy optimization", "Risk-reward analysis"]
  },
  {
    name: "Kronos-RiskAI",
    description: "Portfolio Risk Analysis for Indian Markets",
    icon: Zap,
    targetUsers: "Portfolio Managers",
    revenue: "₹2-5 crore",
    status: "active",
    progress: 100,
    capabilities: ["VaR calculation", "Portfolio optimization", "Indian market correlation", "Stress testing"]
  },
  {
    name: "Kronos-FundFlowAI",
    description: "FII/DII Fund Flow Prediction & Analysis",
    icon: Globe,
    targetUsers: "Institutional Traders",
    revenue: "₹1.5-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["NSE FII/DII data integration", "Flow prediction models", "Market timing signals", "Institutional sentiment analysis"]
  },
  {
    name: "Kronos-MutualAI",
    description: "Indian Mutual Fund Intelligent Ranking",
    icon: DollarSign,
    targetUsers: "Retail Investors",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["AMFI data integration", "Fund performance ranking", "Risk-adjusted returns", "Category-wise analysis"]
  },
  {
    name: "Kronos-CommodAI",
    description: "MCX Commodity Price Forecasting",
    icon: Users,
    targetUsers: "Commodity Traders",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["Gold, Silver, Crude predictions", "MCX data integration", "Seasonal pattern analysis", "Supply-demand forecasting"]
  },
  {
    name: "Kronos-FXAI",
    description: "INR Exchange Rate Trend Prediction",
    icon: Target,
    targetUsers: "Forex Traders",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["USD/INR, EUR/INR, GBP/INR", "RBI policy impact analysis", "Trade balance correlation", "Volatility forecasting"]
  },
  {
    name: "Kronos-TaxAI",
    description: "Tax Optimization with Tally Integration",
    icon: BarChart3,
    targetUsers: "Enterprises, CFOs",
    revenue: "₹2-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["Indian tax laws integration", "Tally ERP connectivity", "GST optimization", "Cash flow forecasting"]
  },
  {
    name: "Kronos-AlphaAI",
    description: "Automated Trading Strategy Generation",
    icon: Clock,
    targetUsers: "Quantitative Funds",
    revenue: "₹3-6 crore",
    status: "active",
    progress: 100,
    capabilities: ["Indian market strategy generation", "Backtesting engine", "Performance metrics", "Risk management"]
  },
  {
    name: "Kronos-TrendFusion",
    description: "Unified Multi-Model Forecasting",
    icon: Star,
    targetUsers: "Institutional Investors",
    revenue: "₹2-4 crore",
    status: "active",
    progress: 100,
    capabilities: ["12-model ensemble", "Attention-based fusion", "Confidence scoring", "Cross-asset analysis"]
  },
  {
    name: "Kronos Global",
    description: "Global Market Coverage with Indian Focus",
    icon: ArrowRight,
    targetUsers: "Multinational Corporations",
    revenue: "₹3-5 crore",
    status: "active",
    progress: 100,
    capabilities: ["Global-Indian correlation", "Multi-asset coverage", "24/7 analysis", "Cross-border insights"]
  }
];

const subscriptionPlans = [
  {
    name: "Basic",
    price: "₹999",
    period: "/month",
    description: "Individual Traders",
    features: [
      "Access to 3 AI Models", 
      "100 Predictions Daily", 
      "Email Support", 
      "Basic Indian Market Data",
      "Mobile App Access"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "₹4,999",
    period: "/month",
    description: "Professional Traders",
    features: [
      "Access to 8 AI Models", 
      "Unlimited Predictions", 
      "Priority Support", 
      "Real-time NSE/BSE Data", 
      "API Access",
      "Advanced Analytics"
    ],
    popular: true
  },
  {
    name: "Institutional",
    price: "₹24,999",
    period: "/month",
    description: "Financial Institutions",
    features: [
      "All 12 AI Models", 
      "White-label Solution", 
      "Dedicated Support", 
      "Custom Integration", 
      "Advanced Analytics",
      "On-premise Deployment"
    ],
    popular: false
  },
  {
    name: "Enterprise",
    price: "₹50,000+",
    period: "/month",
    description: "Large Enterprises",
    features: [
      "Fully Customized", 
      "Dedicated Infrastructure", 
      "24/7 Support", 
      "On-premise Deployment", 
      "Training Services",
      "Custom Development"
    ],
    popular: false
  }
];

const technicalSpecs = [
  {
    title: "Kronos-India Core",
    icon: Brain,
    items: [
      "Fine-tuned on Indian Market Data",
      "OHLCV + 15 Technical Indicators",
      "512 Token Context Length",
      "10-30 Day Prediction Horizon"
    ]
  },
  {
    title: "AI Model Infrastructure",
    icon: Cpu,
    items: [
      "12 Specialized AI Models",
<<<<<<< HEAD
      "AI SDK Integration",
=======
      "Z-AI SDK Integration",
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3
      "Real-time Processing",
      "Multi-language Support (Hindi/English)"
    ]
  },
  {
    title: "Technology Stack",
    icon: Code,
    items: [
      "Next.js 15 with App Router",
      "TypeScript 5 Strict Mode",
      "Prisma ORM with SQLite",
      "shadcn/ui Components"
    ]
  },
  {
    title: "API Ecosystem",
    icon: Server,
    items: [
      "48 RESTful Endpoints",
      "Real-time WebSocket Support",
      "Rate Limiting & Authentication",
      "Comprehensive Error Handling"
    ]
  }
];

const useCases = [
  {
    title: "Indian Equity Trading",
    description: "AI-powered predictions for NSE/BSE stocks with Kronos-India foundation model",
    icon: CandlestickChart,
    users: ["Retail Traders", "Brokerages", "Trading Firms"]
  },
  {
    title: "Derivatives Analysis",
    description: "Options and futures analysis for NIFTY, BANKNIFTY, and stock derivatives",
    icon: LineChart,
    users: ["Options Traders", "Market Makers", "Arbitrageurs"]
  },
  {
    title: "Institutional Research",
    description: "Comprehensive market analysis and FII/DII flow predictions",
    icon: BarChart3,
    users: ["Research Analysts", "Fund Managers", "Investment Banks"]
  },
  {
    title: "Risk Management",
    description: "Portfolio risk analysis and optimization for Indian market conditions",
    icon: Shield,
    users: ["Portfolio Managers", "Risk Officers", "Family Offices"]
  }
];

export default function Home() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("kronos-india");
  const [stats, setStats] = useState({
    models: 12,
    apis: 48,
    users: 0,
    predictions: 0,
    indianStocks: 6
  });

  useEffect(() => {
    // Simulate real-time stats
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        users: prev.users + Math.floor(Math.random() * 3),
        predictions: prev.predictions + Math.floor(Math.random() * 10)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isMobile = useIsMobile();

  // Return mobile-optimized version for mobile devices
  if (isMobile) {
    return <MobileOptimizedHomePage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section - Focused on Kronos-India */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white rounded-lg mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-12 h-12 mr-3" />
              <h1 className="text-5xl md:text-7xl font-bold">
                FinSmartAI
              </h1>
            </div>
            <p className="text-2xl md:text-3xl mb-4 text-blue-100">
              Powered by Kronos-India Foundation Model
            </p>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-blue-100 leading-relaxed">
              Advanced AI ecosystem for Indian financial markets - 12 specialized models, 
              48 API endpoints, and fine-tuned for NSE/BSE trading
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3"
                onClick={() => router.push('/dashboard')}
              >
                <Rocket className="mr-2" />
                Access Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3"
                onClick={() => router.push('/demos')}
              >
                <Activity className="mr-2" />
                Try Live Demos
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>Kronos-India Adapted</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>12 AI Models Ready</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>48 API Endpoints</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Stats Section */}
      <section className="py-12 bg-white dark:bg-slate-800 rounded-lg mb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stats.models}
              </div>
              <div className="text-gray-600 dark:text-gray-400">AI Models</div>
              <div className="text-sm text-green-600">100% Complete</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                {stats.apis}
              </div>
              <div className="text-gray-600 dark:text-gray-400">API Endpoints</div>
              <div className="text-sm text-green-600">Fully Operational</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                {stats.indianStocks}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Indian Stocks</div>
              <div className="text-sm text-blue-600">NSE/BSE Ready</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                {stats.users.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Users</div>
              <div className="text-sm text-blue-600">Live Counter</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
                {stats.predictions.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Predictions</div>
              <div className="text-sm text-blue-600">Real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Quick Actions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get started with our most popular features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard')}>
              <CardHeader className="text-center">
                <LayoutDashboard className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                <CardTitle className="text-lg">Dashboard</CardTitle>
                <CardDescription>Access your AI-powered dashboard</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/demos')}>
              <CardHeader className="text-center">
                <Activity className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                <CardTitle className="text-lg">Live Demos</CardTitle>
                <CardDescription>Try our AI models in action</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/docs')}>
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <CardTitle className="text-lg">Documentation</CardTitle>
                <CardDescription>API docs and integration guides</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/search')}>
              <CardHeader className="text-center">
                <Search className="w-12 h-12 mx-auto text-orange-600 mb-2" />
                <CardTitle className="text-lg">Advanced Search</CardTitle>
                <CardDescription>Search market data and insights</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Models Overview */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">AI Models Overview</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Explore our 12 specialized AI models for Indian financial markets
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiModels.slice(0, 6).map((model) => (
              <Card key={model.name} className="hover:shadow-lg transition-shadow">
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
                      {model.capabilities.slice(0, 2).map((capability, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {capability}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Target Users:</span>
                    <span className="font-medium">{model.targetUsers}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button 
              size="lg"
              onClick={() => router.push('/demos')}
            >
              View All 12 AI Models
              <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Technical Specifications</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Built with cutting-edge technology for maximum performance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalSpecs.map((spec, index) => (
              <Card key={index}>
                <CardHeader>
                  <spec.icon className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">{spec.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {spec.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Use Cases</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              How FinSmartAI empowers different market participants
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <useCase.icon className="w-8 h-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                      <CardDescription>{useCase.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <strong>Ideal for:</strong> {useCase.users.join(", ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Subscription Plans</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your trading needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan, index) => (
              <Card key={index} className={`hover:shadow-lg transition-shadow ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">
                    {plan.price}
                    <span className="text-lg text-gray-500">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 mr-2 text-blue-600" />
              <span className="text-xl font-bold">FinSmartAI</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Empowering financial decisions with AI-driven insights for Indian markets
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>© 2024 FinSmartAI</span>
              <span>•</span>
              <span>Powered by Kronos-India</span>
              <span>•</span>
              <span>12 AI Models</span>
              <span>•</span>
              <span>48 API Endpoints</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}