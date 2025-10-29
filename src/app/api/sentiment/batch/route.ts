import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sentiment/batch - Get sentiment summary and batch data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // news, social, all
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d, all
    
    let newsData = [];
    let socialData = [];
    
    // Calculate time filter
    const timeFilter = getTimeFilter(timeRange);
    
    if (type === 'news' || type === 'all') {
      newsData = await db.newsArticle.findMany({
        where: timeFilter,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    }
    
    if (type === 'social' || type === 'all') {
      socialData = await db.socialMediaPost.findMany({
        where: timeFilter,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    }
    
    // Calculate sentiment summary
    const allSentiments = [
      ...newsData.map(n => n.sentiment).filter(s => s !== null),
      ...socialData.map(s => s.sentiment).filter(s => s !== null)
    ];
    
    const sentimentSummary = {
      totalItems: allSentiments.length,
      averageSentiment: allSentiments.length > 0 ? allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length : 0,
      positiveCount: allSentiments.filter(s => s > 0.1).length,
      negativeCount: allSentiments.filter(s => s < -0.1).length,
      neutralCount: allSentiments.filter(s => s >= -0.1 && s <= 0.1).length,
      newsCount: newsData.length,
      socialCount: socialData.length
    };
    
    // Calculate sentiment trends (for the last 24 hours by hour)
    const sentimentTrends = await calculateSentimentTrends();
    
    // Get top entities mentioned
    const topEntities = await getTopEntities();
    
    return NextResponse.json({
      success: true,
      data: {
        sentimentSummary,
        sentimentTrends,
        topEntities,
        newsData,
        socialData,
        pagination: {
          limit,
          offset,
          total: sentimentSummary.totalItems
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sentiment batch data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment batch data' },
      { status: 500 }
    );
  }
}

// POST /api/sentiment/batch - Analyze multiple contents at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, type = 'news', userId } = body;
    
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Contents array is required' },
        { status: 400 }
      );
    }
    
    if (contents.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 contents per batch analysis' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    const results = [];
    
    // Process each content
    for (const content of contents) {
      try {
        const response = await fetch('/api/sentiment/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.text || content,
            type,
            source: content.source || 'Unknown',
            userId
          })
        });
        
        const result = await response.json();
        results.push({
          content: content.text || content,
          source: content.source || 'Unknown',
          success: result.success,
          data: result.data,
          error: result.error
        });
      } catch (error) {
        results.push({
          content: content.text || content,
          source: content.source || 'Unknown',
          success: false,
          error: 'Failed to analyze content'
        });
      }
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Calculate batch summary
    const successfulAnalyses = results.filter(r => r.success);
    const sentiments = successfulAnalyses.map(r => r.data.sentimentResult.sentiment_score);
    
    const batchSummary = {
      totalProcessed: contents.length,
      successful: successfulAnalyses.length,
      failed: contents.length - successfulAnalyses.length,
      averageSentiment: sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0,
      positiveCount: sentiments.filter(s => s > 0.1).length,
      negativeCount: sentiments.filter(s => s < -0.1).length,
      neutralCount: sentiments.filter(s => s >= -0.1 && s <= 0.1).length,
      processingTimeMs
    };
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        batchSummary
      }
    });
  } catch (error) {
    console.error('Batch sentiment analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform batch sentiment analysis' },
      { status: 500 }
    );
  }
}

// Helper functions
function getTimeFilter(timeRange: string) {
  const now = new Date();
  let startTime;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {}; // No time filter
  }
  
  return {
    createdAt: {
      gte: startTime
    }
  };
}

async function calculateSentimentTrends() {
  // For demo purposes, generate mock trend data
  // In production, this would query actual aggregated data
  const trends = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    trends.push({
      hour: hour.getHours(),
      sentiment: (Math.random() - 0.5) * 0.6, // -0.3 to 0.3
      volume: Math.floor(Math.random() * 100) + 20,
      positive: Math.floor(Math.random() * 40) + 10,
      negative: Math.floor(Math.random() * 40) + 10,
      neutral: Math.floor(Math.random() * 20) + 5
    });
  }
  
  return trends;
}

async function getTopEntities() {
  // For demo purposes, return mock entity data
  // In production, this would extract and count entities from actual content
  return [
    { name: 'NIFTY', mentions: 45, sentiment: 0.3 },
    { name: 'RELIANCE', mentions: 32, sentiment: 0.2 },
    { name: 'TCS', mentions: 28, sentiment: 0.1 },
    { name: 'INFOSYS', mentions: 25, sentiment: -0.1 },
    { name: 'HDFC', mentions: 22, sentiment: 0.4 },
    { name: 'SBIN', mentions: 20, sentiment: -0.2 },
    { name: 'AXISBANK', mentions: 18, sentiment: 0.0 },
    { name: 'ICICIBANK', mentions: 16, sentiment: 0.2 }
  ];
}