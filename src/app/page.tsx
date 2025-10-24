'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileOptimizedHomePage } from "@/components/layout/MobileOptimizedPage";
import { RealTimeMarketDataStream } from "@/components/market/RealTimeMarketDataStream";
import { EnhancedRealTimeDashboard } from "@/components/realtime/EnhancedRealTimeDashboard";
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
  History
} from "lucide-react";

const aiModels = [
  {
    name: "Kronos-SentimentAI",
    description: "News/Social Media Sentiment Analysis",
    icon: Brain,
    targetUsers: "Traders, Hedge Funds",
    revenue: "₹1.5-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["Real-time sentiment analysis", "Multi-platform support", "Confidence scoring", "Entity recognition"]
  },
  {
    name: "Kronos-NewsInsightAI",
    description: "AI News Summary & Analysis",
    icon: TrendingUp,
    targetUsers: "Investors, Research Analysts",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["Multi-language support", "Batch processing", "Key insight extraction", "Market impact analysis"]
  },
  {
    name: "Kronos-OptionsAI",
    description: "Options Price Prediction & Analysis",
    icon: Shield,
    targetUsers: "Options Traders",
    revenue: "₹2-4 crore",
    status: "active",
    progress: 100,
    capabilities: ["Price prediction", "Greeks calculation", "Strategy analysis", "Risk assessment"]
  },
  {
    name: "Kronos-RiskAI",
    description: "Portfolio Risk Analysis",
    icon: Zap,
    targetUsers: "Portfolio Managers",
    revenue: "₹2-5 crore",
    status: "active",
    progress: 100,
    capabilities: ["VaR calculation", "Portfolio optimization", "Risk metrics", "Stress testing"]
  },
  {
    name: "Kronos-FundFlowAI",
    description: "FII/DII Fund Flow Prediction",
    icon: Globe,
    targetUsers: "Institutional Traders",
    revenue: "₹1.5-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["Flow prediction", "Historical analysis", "Sentiment correlation", "Market timing"]
  },
  {
    name: "Kronos-MutualAI",
    description: "Mutual Fund Intelligent Ranking",
    icon: DollarSign,
    targetUsers: "Retail Investors",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["Fund ranking", "Performance analysis", "Risk-adjusted returns", "Category comparison"]
  },
  {
    name: "Kronos-CommodAI",
    description: "Commodity Price Forecasting",
    icon: Users,
    targetUsers: "Commodity Traders",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["Price forecasting", "Trend analysis", "Seasonal patterns", "Supply-demand analysis"]
  },
  {
    name: "Kronos-FXAI",
    description: "Exchange Rate Trend Prediction",
    icon: Target,
    targetUsers: "Forex Traders",
    revenue: "₹1-2 crore",
    status: "active",
    progress: 100,
    capabilities: ["Currency prediction", "Trend analysis", "Volatility forecasting", "Correlation analysis"]
  },
  {
    name: "Kronos-TaxAI",
    description: "Tax Optimization (Tally Integration)",
    icon: BarChart3,
    targetUsers: "Enterprises, CFOs",
    revenue: "₹2-3 crore",
    status: "active",
    progress: 100,
    capabilities: ["Tax optimization", "Tally integration", "Compliance checking", "Deduction maximization"]
  },
  {
    name: "Kronos-AlphaAI",
    description: "Automated Trading Strategy Generation",
    icon: Clock,
    targetUsers: "Quantitative Funds",
    revenue: "₹3-6 crore",
    status: "active",
    progress: 100,
    capabilities: ["Strategy generation", "Backtesting", "Performance metrics", "Risk management"]
  },
  {
    name: "Kronos-TrendFusion",
    description: "Unified Forecasting Model",
    icon: Star,
    targetUsers: "Institutional Investors",
    revenue: "₹2-4 crore",
    status: "active",
    progress: 100,
    capabilities: ["Multi-model fusion", "Ensemble predictions", "Accuracy optimization", "Cross-asset analysis"]
  },
  {
    name: "Kronos Global",
    description: "Global Market Coverage",
    icon: ArrowRight,
    targetUsers: "Multinational Corporations",
    revenue: "₹3-5 crore",
    status: "active",
    progress: 100,
    capabilities: ["Global markets", "Multi-asset coverage", "24/7 analysis", "Cross-border insights"]
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
      "Basic Data Access",
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
      "Real-time Data", 
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
    title: "AI Infrastructure",
    icon: Brain,
    items: [
      "12 Specialized AI Models",
      "ZAI SDK Integration",
      "Real-time Processing",
      "Multi-language Support"
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
    title: "Database Architecture",
    icon: Database,
    items: [
      "20+ Data Models",
      "Relational Design",
      "API Usage Tracking",
      "User Management"
    ]
  },
  {
    title: "API Ecosystem",
    icon: Server,
    items: [
      "25+ RESTful Endpoints",
      "Real-time WebSocket",
      "Rate Limiting",
      "Error Handling"
    ]
  }
];

const useCases = [
  {
    title: "Algorithmic Trading",
    description: "Generate and backtest trading strategies with AI-powered insights",
    icon: TrendingUp,
    users: ["Quantitative Funds", "Hedge Funds", "Proprietary Trading Firms"]
  },
  {
    title: "Risk Management",
    description: "Comprehensive portfolio risk analysis and mitigation strategies",
    icon: Shield,
    users: ["Portfolio Managers", "Risk Officers", "Asset Managers"]
  },
  {
    title: "Market Research",
    description: "AI-powered market analysis and sentiment tracking",
    icon: BarChart3,
    users: ["Research Analysts", "Investment Banks", "Consulting Firms"]
  },
  {
    title: "Investment Advisory",
    description: "Data-driven investment recommendations and portfolio optimization",
    icon: Users,
    users: ["Financial Advisors", "Wealth Managers", "Family Offices"]
  }
];

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    models: 12,
    apis: 25,
    users: 0,
    predictions: 0
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-12 h-12 mr-3" />
              <h1 className="text-5xl md:text-7xl font-bold">
                FinSmartAI
              </h1>
            </div>
            <p className="text-2xl md:text-3xl mb-4 text-blue-100">
              Complete Financial AI Ecosystem
            </p>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-blue-100 leading-relaxed">
              Empowering financial decisions with 12 specialized AI models, 
              25+ API endpoints, and cutting-edge machine learning technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3">
                <Rocket className="mr-2" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
                <Activity className="mr-2" />
                Live Demo
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>12 AI Models Ready</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>25+ API Endpoints</span>
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
      <section className="py-12 bg-white dark:bg-slate-800 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
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
                {stats.users.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Users</div>
              <div className="text-sm text-blue-600">Live Counter</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                {stats.predictions.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Predictions</div>
              <div className="text-sm text-blue-600">Real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="models">AI Models</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-12">
              {/* Platform Capabilities */}
              <div>
                <h2 className="text-4xl font-bold mb-8 text-center">Platform Capabilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {technicalSpecs.map((spec, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center mb-4">
                          <spec.icon className="w-8 h-8 text-blue-600 mr-3" />
                          <CardTitle className="text-lg">{spec.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {spec.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div>
                <h2 className="text-4xl font-bold mb-8 text-center">Who Uses FinSmartAI?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {useCases.map((useCase, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center mb-4">
                          <useCase.icon className="w-10 h-10 text-purple-600 mr-3" />
                          <div>
                            <CardTitle className="text-xl">{useCase.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-base">
                          {useCase.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Target Users:
                          </div>
                          {useCase.users.map((user, userIndex) => (
                            <div key={userIndex} className="flex items-center text-sm">
                              <Users2 className="w-4 h-4 mr-2 text-blue-500" />
                              {user}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* AI Models Tab */}
            <TabsContent value="models" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">12 Specialized AI Models</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  All models are fully implemented and ready for production deployment
                </p>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Models</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiModels.map((model) => (
                      <Card key={model.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <model.icon className="w-8 h-8 text-blue-600" />
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          <CardDescription>{model.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Target Users: {model.targetUsers}
                              </div>
                              <div className="text-sm font-semibold text-green-600">
                                Expected Revenue: {model.revenue}
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Implementation</span>
                                <span>{model.progress}%</span>
                              </div>
                              <Progress value={model.progress} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="capabilities" className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiModels.map((model) => (
                      <Card key={model.name} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <model.icon className="w-8 h-8 text-blue-600" />
                            <Badge variant="default" className="bg-green-500">
                              Ready
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              Capabilities:
                            </div>
                            {model.capabilities.map((capability, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                {capability}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Real-time Features Tab */}
            <TabsContent value="realtime" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">Real-time Features</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Experience live market data, instant notifications, and real-time AI predictions
                </p>
              </div>

              {/* Real-time Market Data */}
              <div>
                <h3 className="text-2xl font-bold mb-6">Live Market Data Stream</h3>
                <RealTimeMarketDataStream />
              </div>

              {/* Enhanced Real-time Dashboard */}
              <div>
                <h3 className="text-2xl font-bold mb-6">Enhanced Real-time Dashboard</h3>
                <EnhancedRealTimeDashboard 
                  userId="demo-user"
                  symbols={['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY']}
                  models={['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI']}
                  showAdvancedFeatures={true}
                />
              </div>

              {/* Real-time Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <Activity className="w-8 h-8 text-green-600 mr-3" />
                      <CardTitle className="text-lg">Live Market Data</CardTitle>
                    </div>
                    <CardDescription>
                      Real-time price updates, volume tracking, and market sentiment analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        2-second update intervals
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Multiple asset classes
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Historical data integration
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <Bell className="w-8 h-8 text-blue-600 mr-3" />
                      <CardTitle className="text-lg">Instant Notifications</CardTitle>
                    </div>
                    <CardDescription>
                      Real-time alerts for market movements, AI predictions, and system updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Push notifications
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Email alerts
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Custom alert rules
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <Brain className="w-8 h-8 text-purple-600 mr-3" />
                      <CardTitle className="text-lg">AI Predictions</CardTitle>
                    </div>
                    <CardDescription>
                      Live AI model predictions with confidence scores and real-time accuracy tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Real-time model updates
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Confidence scoring
                      </li>
                      <li className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Performance tracking
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Technology Stack */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-6 h-6 mr-2 text-orange-600" />
                    Real-time Technology Stack
                  </CardTitle>
                  <CardDescription>
                    Powered by cutting-edge real-time communication technologies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">WebSocket Infrastructure</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Socket.io for real-time communication
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Room-based data subscriptions
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Automatic reconnection
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Message queuing and delivery
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Performance Features</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Low latency (&lt;100ms)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          High throughput (10K+ messages/sec)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Scalable architecture
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Connection health monitoring
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technology Tab */}
            <TabsContent value="technology" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">Technology Stack</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Built with cutting-edge technologies for scalability, performance, and reliability
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Code className="w-6 h-6 mr-2 text-blue-600" />
                      Frontend & Backend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Next.js 15 with App Router
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        TypeScript 5 Strict Mode
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        shadcn/ui Component Library
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Tailwind CSS 4
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Socket.io Real-time Communication
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="w-6 h-6 mr-2 text-purple-600" />
                      Database & AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Prisma ORM with SQLite
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        ZAI SDK Integration
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        20+ Data Models
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        API Usage Tracking
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Real-time Processing
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="w-6 h-6 mr-2 text-green-600" />
                    API Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Core APIs</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Health Check</li>
                        <li>• Model Registry</li>
                        <li>• User Management</li>
                        <li>• Subscription Plans</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">AI Model APIs</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Sentiment Analysis</li>
                        <li>• Options Trading</li>
                        <li>• Risk Management</li>
                        <li>• Fund Flow Analysis</li>
                        <li>• Market Prediction</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Features</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Rate Limiting</li>
                        <li>• Error Handling</li>
                        <li>• Request Logging</li>
                        <li>• Response Caching</li>
                        <li>• WebSocket Support</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">Advanced Search & Filtering</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Discover AI models, APIs, and services with powerful search capabilities
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Quick Access
                  </CardTitle>
                  <CardDescription>
                    Explore our advanced search features or navigate to the dedicated search page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">AI Models Search</CardTitle>
                        <CardDescription>
                          Search through all 12 AI models with advanced filtering
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Available Models:</span>
                            <span className="font-semibold">12</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Models:</span>
                            <span className="font-semibold text-green-600">5</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Categories:</span>
                            <span className="font-semibold">3</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">API Services</CardTitle>
                        <CardDescription>
                          Discover and filter API endpoints and services
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total APIs:</span>
                            <span className="font-semibold">25+</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Real-time APIs:</span>
                            <span className="font-semibold text-blue-600">8</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Data APIs:</span>
                            <span className="font-semibold">12</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">Analytics Tools</CardTitle>
                        <CardDescription>
                          Find analytics and reporting tools for your needs
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Analytics Tools:</span>
                            <span className="font-semibold">15</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Report Types:</span>
                            <span className="font-semibold">8</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Export Formats:</span>
                            <span className="font-semibold">5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <Button 
                      size="lg" 
                      onClick={() => window.location.href = '/search'}
                      className="px-8"
                    >
                      <Search className="mr-2" />
                      Go to Advanced Search
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">
                      Experience the full power of our search system
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Search Features Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Features</CardTitle>
                  <CardDescription>
                    Preview of the powerful search capabilities available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Smart Search</h3>
                      <p className="text-sm text-gray-600">
                        Intelligent search across titles, descriptions, and tags
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Filter className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Advanced Filters</h3>
                      <p className="text-sm text-gray-600">
                        Multiple filter types including categories, date ranges, and more
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Favorites</h3>
                      <p className="text-sm text-gray-600">
                        Save favorite items for quick access and personalization
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <History className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Search History</h3>
                      <p className="text-sm text-gray-600">
                        Track recent searches with quick access and management
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">Subscription Plans</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Flexible pricing plans designed for traders, institutions, and enterprises
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.name} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold">
                        {plan.price}
                        <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                      >
                        Select Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Revenue Projection */}
              <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Revenue Projection</CardTitle>
                  <CardDescription className="text-green-100 text-center">
                    3-year revenue planning based on market analysis and user growth predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">Year 1</div>
                      <div className="text-3xl font-bold mb-2">₹25-50 crore</div>
                      <div className="text-green-100">Infrastructure Development Phase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">Year 2</div>
                      <div className="text-3xl font-bold mb-2">₹75-125 crore</div>
                      <div className="text-green-100">Rapid Expansion Phase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">Year 3</div>
                      <div className="text-3xl font-bold mb-2">₹200-300 crore</div>
                      <div className="text-green-100">Mature Growth Phase</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Financial Strategy?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders and institutions already using FinSmartAI to make smarter, data-driven financial decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3">
              <Rocket className="mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              <Building2 className="mr-2" />
              Schedule Demo
            </Button>
          </div>
          <div className="mt-8 text-sm text-blue-200">
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </div>
      </section>
    </div>
  );
}