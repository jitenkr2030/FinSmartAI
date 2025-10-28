"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, TrendingUp, TrendingDown, Minus, MessageSquare, Newspaper, Twitter, BarChart3, Clock, Target, Users } from "lucide-react";

interface SentimentResult {
  sentiment_score: number;
  confidence: number;
  market_impact: string;
  key_drivers: string[];
  relevance: number;
  entities: string[];
  raw_analysis: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  sentiment: number;
  relevance: number;
  publishedAt: string;
  createdAt: string;
}

interface SocialMediaPost {
  id: string;
  platform: string;
  content: string;
  sentiment: number;
  relevance: number;
  postedAt: string;
  createdAt: string;
}

interface SentimentSummary {
  totalItems: number;
  averageSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  newsCount: number;
  socialCount: number;
}

interface SentimentTrend {
  hour: number;
  sentiment: number;
  volume: number;
  positive: number;
  negative: number;
  neutral: number;
}

interface Entity {
  name: string;
  mentions: number;
  sentiment: number;
}

interface SentimentAIDashboardProps {
  userId?: string;
}

export default function SentimentAIDashboard({ userId }: SentimentAIDashboardProps) {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('news');
  const [source, setSource] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [sentimentSummary, setSentimentSummary] = useState<SentimentSummary | null>(null);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [topEntities, setTopEntities] = useState<Entity[]>([]);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [recentSocial, setRecentSocial] = useState<SocialMediaPost[]>([]);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    try {
      const response = await fetch('/api/sentiment/batch');
      const data = await response.json();
      if (data.success) {
        setSentimentSummary(data.data.sentimentSummary);
        setSentimentTrends(data.data.sentimentTrends);
        setTopEntities(data.data.topEntities);
        setRecentNews(data.data.newsData);
        setRecentSocial(data.data.socialData);
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    }
  };

  const analyzeSentiment = async () => {
    if (!content.trim()) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          type: contentType,
          source: source || (contentType === 'news' ? 'Manual Input' : 'Social Media'),
          userId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSentimentResult(data.data.sentimentResult);
        // Refresh sentiment data
        await fetchSentimentData();
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="w-4 h-4" />;
    if (score < -0.1) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Very Positive';
    if (score > 0.1) return 'Positive';
    if (score > -0.1) return 'Neutral';
    if (score > -0.3) return 'Negative';
    return 'Very Negative';
  };

  const getMarketImpactColor = (impact: string) => {
    switch (impact) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SentimentAI Dashboard</h2>
          <p className="text-gray-600">Advanced news and social media sentiment analysis</p>
        </div>
        <Button 
          onClick={fetchSentimentData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Sentiment Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Analyze Sentiment
          </CardTitle>
          <CardDescription>
            Enter news articles, social media posts, or any text content for sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News Article</SelectItem>
                    <SelectItem value="social">Social Media Post</SelectItem>
                    <SelectItem value="report">Financial Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Input
                  placeholder={contentType === 'news' ? 'e.g., Economic Times' : 'e.g., Twitter'}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Enter the text content you want to analyze for sentiment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              onClick={analyzeSentiment}
              disabled={!content.trim() || analyzing}
              className="flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Analyze Sentiment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Summary Cards */}
      {sentimentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentimentSummary.totalItems}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {getSentimentIcon(sentimentSummary.averageSentiment)}
                Avg Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(sentimentSummary.averageSentiment)}`}>
                {sentimentSummary.averageSentiment.toFixed(3)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                News Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentimentSummary.newsCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Twitter className="w-5 h-5" />
                Social Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentimentSummary.socialCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList>
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="trends">Sentiment Trends</TabsTrigger>
          <TabsTrigger value="entities">Top Entities</TabsTrigger>
          <TabsTrigger value="recent">Recent Content</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {sentimentResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis Results</CardTitle>
                  <CardDescription>Detailed sentiment breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getSentimentIcon(sentimentResult.sentiment_score)}
                        Sentiment Score
                      </span>
                      <div className="text-right">
                        <div className={`font-medium ${getSentimentColor(sentimentResult.sentiment_score)}`}>
                          {sentimentResult.sentiment_score.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getSentimentLabel(sentimentResult.sentiment_score)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Confidence</span>
                      <div className="text-right">
                        <div className="font-medium">{formatConfidence(sentimentResult.confidence)}</div>
                        <div className="text-sm text-gray-600">
                          {sentimentResult.confidence > 0.8 ? 'High' : sentimentResult.confidence > 0.6 ? 'Medium' : 'Low'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Market Impact</span>
                      <div className="text-right">
                        <div className={`font-medium ${getMarketImpactColor(sentimentResult.market_impact)}`}>
                          {sentimentResult.market_impact.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Relevance</span>
                      <div className="text-right">
                        <div className="font-medium">{formatConfidence(sentimentResult.relevance)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span>{formatConfidence(sentimentResult.confidence)}</span>
                      </div>
                      <Progress value={sentimentResult.confidence * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>Detailed sentiment analysis by Kronos-SentimentAI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sentimentResult.key_drivers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Sentiment Drivers</h4>
                        <div className="flex flex-wrap gap-2">
                          {sentimentResult.key_drivers.map((driver, index) => (
                            <Badge key={index} variant="outline">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {sentimentResult.entities.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Entities Mentioned</h4>
                        <div className="flex flex-wrap gap-2">
                          {sentimentResult.entities.map((entity, index) => (
                            <Badge key={index} variant="secondary">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium mb-2">Detailed Analysis</h4>
                      <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                        {sentimentResult.raw_analysis}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Enter content and click "Analyze Sentiment" to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {sentimentTrends.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trends (Last 24 Hours)</CardTitle>
                <CardDescription>Hourly sentiment analysis and volume trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentimentTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{trend.hour}:00</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(trend.sentiment)}
                          <span className={`text-sm ${getSentimentColor(trend.sentiment)}`}>
                            {trend.sentiment.toFixed(3)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Vol: {trend.volume}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">+{trend.positive}</span>
                          <span className="text-red-600">-{trend.negative}</span>
                          <span className="text-gray-600">={trend.neutral}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sentiment trend data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          {topEntities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Top Mentioned Entities</CardTitle>
                <CardDescription>Most frequently mentioned entities and their sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topEntities.map((entity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-sm text-gray-600">{entity.mentions} mentions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(entity.sentiment)}
                        <span className={`text-sm ${getSentimentColor(entity.sentiment)}`}>
                          {entity.sentiment.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No entity data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  Recent News Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentNews.length > 0 ? recentNews.map((article) => (
                    <div key={article.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{article.source}</span>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(article.sentiment)}
                          <span className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                            {article.sentiment.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{article.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(article.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-8">No recent news articles</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="w-5 h-5" />
                  Recent Social Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentSocial.length > 0 ? recentSocial.map((post) => (
                    <div key={post.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{post.platform}</span>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(post.sentiment)}
                          <span className={`text-xs ${getSentimentColor(post.sentiment)}`}>
                            {post.sentiment.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-8">No recent social posts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}