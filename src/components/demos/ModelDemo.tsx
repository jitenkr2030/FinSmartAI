"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Target, 
  Globe, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from "lucide-react";

interface ModelDemoProps {
  modelName: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

const modelConfigs = {
  sentiment: {
    title: "SentimentAI Demo",
    description: "Analyze sentiment from news articles and social media posts",
    inputs: [
      { label: "Text Content", type: "textarea", placeholder: "Enter news article or social media content..." }
    ],
    outputs: ["sentiment_score", "confidence", "market_impact", "key_entities"]
  },
  options: {
    title: "OptionsAI Demo",
    description: "Calculate option Greeks and predict option prices",
    inputs: [
      { label: "Underlying Price", type: "number", placeholder: "Enter stock price" },
      { label: "Strike Price", type: "number", placeholder: "Enter strike price" },
      { label: "Time to Expiry (days)", type: "number", placeholder: "Enter days to expiry" },
      { label: "Volatility (%)", type: "number", placeholder: "Enter volatility" },
      { label: "Risk Free Rate (%)", type: "number", placeholder: "Enter risk-free rate" }
    ],
    outputs: ["delta", "gamma", "theta", "vega", "rho", "option_price"]
  },
  risk: {
    title: "RiskAI Demo",
    description: "Analyze portfolio risk and calculate risk metrics",
    inputs: [
      { label: "Portfolio Value", type: "number", placeholder: "Enter portfolio value" },
      { label: "Confidence Level (%)", type: "number", placeholder: "Enter confidence level" },
      { label: "Time Horizon (days)", type: "number", placeholder: "Enter time horizon" }
    ],
    outputs: ["var", "cvar", "sharpe_ratio", "beta", "max_drawdown"]
  }
};

export default function ModelDemo({ modelName, icon: Icon, description, color }: ModelDemoProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const modelKey = modelName.toLowerCase().replace('ai', '');
  const config = modelConfigs[modelKey as keyof typeof modelConfigs];

  const handleInputChange = (field: string, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const runDemo = async () => {
    setIsRunning(true);
    setResults(null);
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    // Simulate API call delay
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      
      // Generate mock results based on model type
      let mockResults: any = {};
      
      if (modelKey === 'sentiment') {
        mockResults = {
          sentiment_score: (Math.random() - 0.5) * 2,
          confidence: 0.7 + Math.random() * 0.3,
          market_impact: Math.random() > 0.5 ? "bullish" : "bearish",
          key_entities: ["RELIANCE", "TCS", "NIFTY"],
          processing_time: Math.floor(Math.random() * 1000) + 500
        };
      } else if (modelKey === 'options') {
        mockResults = {
          delta: 0.5 + Math.random() * 0.4,
          gamma: 0.1 + Math.random() * 0.1,
          theta: -(0.1 + Math.random() * 0.1),
          vega: 0.2 + Math.random() * 0.2,
          rho: 0.05 + Math.random() * 0.05,
          option_price: 50 + Math.random() * 100,
          processing_time: Math.floor(Math.random() * 800) + 300
        };
      } else if (modelKey === 'risk') {
        mockResults = {
          var: 50000 + Math.random() * 100000,
          cvar: 75000 + Math.random() * 150000,
          sharpe_ratio: 1.0 + Math.random() * 2.0,
          beta: 0.8 + Math.random() * 0.4,
          max_drawdown: 0.05 + Math.random() * 0.15,
          processing_time: Math.floor(Math.random() * 1200) + 800
        };
      }

      setResults(mockResults);
      setIsRunning(false);
      
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
    }, 2000);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Analysis Results
          </CardTitle>
          <CardDescription>
            Generated in {results.processing_time}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results).filter(([key]) => key !== 'processing_time').map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-lg font-semibold">
                  {typeof value === 'number' ? 
                    (key.includes('score') || key.includes('confidence') ? 
                      (value * 100).toFixed(1) + '%' : 
                      key.includes('rate') ? 
                      value.toFixed(2) + '%' :
                      key.includes('time') ? 
                      value.toFixed(0) + 'ms' :
                      typeof value === 'number' && value > 1000 ? 
                      '₹' + value.toLocaleString() :
                      value.toFixed(3)
                    ) : 
                    value
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={`w-8 h-8 text-${color}-600`} />
            <div>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live Demo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Input Fields */}
          {config.inputs.map((input, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`${modelName}-${input.label}`}>{input.label}</Label>
              {input.type === 'textarea' ? (
                <Textarea
                  id={`${modelName}-${input.label}`}
                  placeholder={input.placeholder}
                  value={inputValues[input.label] || ''}
                  onChange={(e) => handleInputChange(input.label, e.target.value)}
                  rows={3}
                />
              ) : (
                <Input
                  id={`${modelName}-${input.label}`}
                  type={input.type}
                  placeholder={input.placeholder}
                  value={inputValues[input.label] || ''}
                  onChange={(e) => handleInputChange(input.label, e.target.value)}
                />
              )}
            </div>
          ))}

          {/* Progress */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={runDemo} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Demo
              </>
            )}
          </Button>

          {/* Results */}
          {renderResults()}
        </div>
      </CardContent>
    </Card>
  );
}