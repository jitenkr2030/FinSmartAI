"use client";

import { useState } from "react";
import AdvancedSearch, { SearchResult, SearchFilter } from "@/components/search/AdvancedSearch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Shield, Zap, Globe, DollarSign, Users, Target, BarChart3, Clock, Star, ArrowRight, Search, Filter, History, SortAsc, Grid } from "lucide-react";

// Sample data for the advanced search demo
const sampleSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "Kronos-SentimentAI",
    description: "Advanced news and social media sentiment analysis for financial markets",
    category: "AI Models",
    status: "active",
    price: 29999,
    date: "2024-01-15",
    relevance: 0.95,
    tags: ["sentiment", "NLP", "news", "social-media", "real-time"],
    isFavorite: false
  },
  {
    id: "2",
    title: "Kronos-OptionsAI",
    description: "Options price prediction and Greeks calculation with AI-powered accuracy",
    category: "AI Models",
    status: "active",
    price: 49999,
    date: "2024-01-20",
    relevance: 0.92,
    tags: ["options", "pricing", "greeks", "derivatives", "risk"],
    isFavorite: true
  },
  {
    id: "3",
    title: "Kronos-RiskAI",
    description: "Comprehensive portfolio risk analysis and mitigation strategies",
    category: "AI Models",
    status: "active",
    price: 39999,
    date: "2024-01-25",
    relevance: 0.88,
    tags: ["risk", "portfolio", "VaR", "optimization", "stress-testing"],
    isFavorite: false
  },
  {
    id: "4",
    title: "Kronos-FundFlowAI",
    description: "FII/DII fund flow prediction and market timing analysis",
    category: "AI Models",
    status: "development",
    price: 24999,
    date: "2024-02-01",
    relevance: 0.85,
    tags: ["fund-flow", "FII", "DII", "market-timing", "institutional"],
    isFavorite: false
  },
  {
    id: "5",
    title: "Kronos-NewsInsightAI",
    description: "AI-powered news summarization and market impact analysis",
    category: "AI Models",
    status: "active",
    price: 19999,
    date: "2024-02-05",
    relevance: 0.90,
    tags: ["news", "summarization", "impact-analysis", "NLP", "batch-processing"],
    isFavorite: true
  },
  {
    id: "6",
    title: "Kronos-MutualAI",
    description: "Intelligent mutual fund ranking and performance analysis",
    category: "AI Models",
    status: "development",
    price: 14999,
    date: "2024-02-10",
    relevance: 0.82,
    tags: ["mutual-funds", "ranking", "performance", "risk-adjusted", "retail"],
    isFavorite: false
  },
  {
    id: "7",
    title: "Kronos-CommodAI",
    description: "Commodity price forecasting and trend analysis",
    category: "AI Models",
    status: "planned",
    price: 17999,
    date: "2024-02-15",
    relevance: 0.78,
    tags: ["commodities", "forecasting", "trends", "seasonal", "supply-demand"],
    isFavorite: false
  },
  {
    id: "8",
    title: "Kronos-FXAI",
    description: "Exchange rate trend prediction and currency analysis",
    category: "AI Models",
    status: "planned",
    price: 16999,
    date: "2024-02-20",
    relevance: 0.75,
    tags: ["forex", "currency", "trends", "volatility", "correlation"],
    isFavorite: false
  },
  {
    id: "9",
    title: "Kronos-TaxAI",
    description: "Tax optimization with Tally integration for enterprises",
    category: "AI Models",
    status: "development",
    price: 27999,
    date: "2024-02-25",
    relevance: 0.80,
    tags: ["tax", "optimization", "tally", "compliance", "enterprise"],
    isFavorite: false
  },
  {
    id: "10",
    title: "Kronos-AlphaAI",
    description: "Automated trading strategy generation and backtesting",
    category: "AI Models",
    status: "development",
    price: 59999,
    date: "2024-03-01",
    relevance: 0.87,
    tags: ["trading", "strategy", "backtesting", "quantitative", "alpha"],
    isFavorite: true
  },
  {
    id: "11",
    title: "Kronos-TrendFusion",
    description: "Unified forecasting model with multi-ensemble approach",
    category: "AI Models",
    status: "planned",
    price: 34999,
    date: "2024-03-05",
    relevance: 0.83,
    tags: ["forecasting", "ensemble", "fusion", "accuracy", "multi-asset"],
    isFavorite: false
  },
  {
    id: "12",
    title: "Kronos Global",
    description: "Global market coverage with 24/7 analysis capabilities",
    category: "AI Models",
    status: "planned",
    price: 49999,
    date: "2024-03-10",
    relevance: 0.89,
    tags: ["global", "multi-asset", "24-7", "cross-border", "institutional"],
    isFavorite: false
  },
  // Additional sample data for better testing
  {
    id: "13",
    title: "Real-Time Market Data API",
    description: "High-frequency market data streaming for all major exchanges",
    category: "API Services",
    status: "active",
    price: 9999,
    date: "2024-01-10",
    relevance: 0.93,
    tags: ["api", "real-time", "market-data", "streaming", "high-frequency"],
    isFavorite: false
  },
  {
    id: "14",
    title: "Historical Data Provider",
    description: "Comprehensive historical market data with minute-level granularity",
    category: "API Services",
    status: "active",
    price: 7999,
    date: "2024-01-12",
    relevance: 0.86,
    tags: ["historical", "data", "minute-level", "backtesting", "research"],
    isFavorite: true
  },
  {
    id: "15",
    title: "Portfolio Optimization Engine",
    description: "AI-driven portfolio optimization with risk-adjusted returns",
    category: "Analytics",
    status: "development",
    price: 21999,
    date: "2024-02-18",
    relevance: 0.84,
    tags: ["portfolio", "optimization", "risk-adjusted", "AI", "returns"],
    isFavorite: false
  }
];

// Sample filters for the advanced search demo
const sampleFilters: SearchFilter[] = [
  {
    id: "targetUsers",
    name: "Target Users",
    type: "multiselect",
    options: ["Retail Investors", "Institutional Traders", "Hedge Funds", "Portfolio Managers", "Quantitative Analysts", "Research Analysts"]
  },
  {
    id: "complexity",
    name: "Complexity Level",
    type: "select",
    options: ["Basic", "Intermediate", "Advanced", "Expert"]
  },
  {
    id: "dataSources",
    name: "Data Sources",
    type: "checkbox",
    options: ["Real-time Market Data", "Historical Data", "News Feeds", "Social Media", "Fundamental Data", "Alternative Data"]
  },
  {
    id: "deployment",
    name: "Deployment Type",
    type: "select",
    options: ["Cloud", "On-premise", "Hybrid"]
  }
];

export default function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredResults = selectedCategory === "all" 
    ? sampleSearchResults 
    : sampleSearchResults.filter(item => item.category === selectedCategory);

  const categories = Array.from(new Set(sampleSearchResults.map(item => item.category)));

  const handleSearch = (results: SearchResult[], filters: any) => {
    console.log("Search results:", results);
    console.log("Active filters:", filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Advanced Search & Filtering</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience powerful search capabilities with advanced filtering, sorting, 
            and personalized features for the FinSmartAI ecosystem
          </p>
        </div>

        {/* Category Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Category Filter</CardTitle>
            <CardDescription>
              Filter results by category to narrow down your search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                All Categories ({sampleSearchResults.length})
              </Button>
              {categories.map(category => {
                const count = sampleSearchResults.filter(item => item.category === category).length;
                const categoryIcon = category === "AI Models" ? Brain : 
                                 category === "API Services" ? TrendingUp : 
                                 category === "Analytics" ? BarChart3 : Target;
                
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    <categoryIcon className="w-4 h-4" />
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Search Component */}
        <AdvancedSearch
          data={filteredResults}
          filters={sampleFilters}
          onSearch={handleSearch}
          className="mb-8"
        />

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Search Features Overview</CardTitle>
            <CardDescription>
              Discover the powerful capabilities of our advanced search system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Smart Search</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Search across titles, descriptions, and tags with intelligent relevance scoring
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Text Search</Badge>
                  <Badge variant="outline">Tag Matching</Badge>
                  <Badge variant="outline">Relevance Scoring</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Advanced Filters</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Multiple filter types including categories, date ranges, price ranges, and custom filters
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Categories</Badge>
                  <Badge variant="outline">Date Range</Badge>
                  <Badge variant="outline">Price Range</Badge>
                  <Badge variant="outline">Status</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Search History</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Keep track of your recent searches with quick access and management options
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Recent Searches</Badge>
                  <Badge variant="outline">Quick Access</Badge>
                  <Badge variant="outline">Local Storage</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Favorites</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Save your favorite items for quick access and personalized recommendations
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Save Items</Badge>
                  <Badge variant="outline">Quick Access</Badge>
                  <Badge variant="outline">Persistent Storage</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold">Sorting Options</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Sort results by relevance, title, date, or price in ascending or descending order
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Relevance</Badge>
                  <Badge variant="outline">Date</Badge>
                  <Badge variant="outline">Price</Badge>
                  <Badge variant="outline">Title</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold">View Modes</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Switch between grid and list views with pagination for optimal browsing experience
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Grid View</Badge>
                  <Badge variant="outline">List View</Badge>
                  <Badge variant="outline">Pagination</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {sampleSearchResults.length}
              </div>
              <div className="text-sm text-gray-600">Searchable Items</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Available Categories</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {sampleSearchResults.filter(item => item.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Currently Active</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filter Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {sampleFilters.length + 4}
              </div>
              <div className="text-sm text-gray-600">Available Filters</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}