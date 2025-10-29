import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import AI from 'z-ai-web-dev-sdk';

// POST /api/fundflow/analyze - Analyze institutional fund flows
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      startDate, 
      endDate, 
      segment = 'all', 
      includeFII = true, 
      includeDII = true,
      analysisType = 'comprehensive',
      userId 
    } = body;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // Initialize AI SDK
    const ai = await AI.create();
    
    // Get historical flow data for the specified period
    const historicalFlows = await getHistoricalFlows(startDate, endDate, segment, includeFII, includeDII);
    
    // Prepare flow analysis data
    const flowData = {
      period: { startDate, endDate },
      segment,
      includeFII,
      includeDII,
      analysisType,
      historicalFlows,
      summary: calculateFlowSummary(historicalFlows),
      trends: calculateFlowTrends(historicalFlows)
    };
    
    // Perform flow analysis using AI
    let analysisResult;
    try {
      const completion = await ai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are Kronos-FundFlowAI, an advanced institutional fund flow analysis AI. Analyze the provided institutional flow data and provide comprehensive insights including:

1. Flow pattern analysis and trends
2. Market sentiment assessment based on flows
3. Sector-wise flow distribution
4. FII vs DII behavior analysis
5. Market impact assessment
6. Contrarian indicators identification
7. Predictive signals for market direction
8. Risk assessment based on flow patterns
9. Trading recommendations based on flow analysis
10. Correlation with market performance

Provide detailed analysis with specific metrics, patterns, and actionable recommendations. Consider both short-term and long-term implications of the flow data.`
          },
          {
            role: 'user',
            content: `Please analyze this institutional fund flow data: ${JSON.stringify(flowData)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      });
      
      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Parse the AI response to extract structured analysis data
      analysisResult = parseFlowAnalysisResponse(aiResponse, flowData);
      
      // Calculate additional metrics
      analysisResult = calculateFlowMetrics(analysisResult, flowData);
      
    } catch (aiError) {
      console.error('Fund flow analysis error:', aiError);
      
      // Fallback analysis
      analysisResult = generateFallbackAnalysis(flowData);
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Save flow analysis to database
    const savedAnalysis = await db.fundFlowAnalysis.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        segment,
        fiiNetFlow: flowData.summary.fiiNet,
        diiNetFlow: flowData.summary.diiNet,
        totalNetFlow: flowData.summary.totalNet,
        sentiment: analysisResult.marketSentiment,
        confidence: analysisResult.confidence,
        predictions: JSON.stringify(analysisResult.predictions || []),
        recommendations: JSON.stringify(analysisResult.recommendations || []),
        createdAt: new Date()
      }
    });
    
    // Track API usage
    if (userId) {
      await db.apiUsage.create({
        data: {
          userId,
          modelName: 'Kronos-FundFlowAI',
          endpoint: '/api/fundflow/analyze',
          requestData: JSON.stringify(body),
          responseData: JSON.stringify(analysisResult),
          processingTimeMs,
          cost: 0.20 // Moderate cost for flow analysis
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        period: flowData.period,
        segment: flowData.segment,
        summary: flowData.summary,
        analysis: analysisResult,
        analysisId: savedAnalysis.id,
        processingTimeMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fund flow analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze fund flows' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getHistoricalFlows(startDate: string, endDate: string, segment: string, includeFII: boolean, includeDII: boolean) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Build query conditions
  const whereCondition: any = {
    date: {
      gte: start,
      lte: end
    }
  };
  
  if (segment !== 'all') {
    whereCondition.segment = segment;
  }
  
  // Fetch historical flows from database
  const flows = await db.institutionalFlow.findMany({
    where: whereCondition,
    orderBy: { date: 'asc' }
  });
  
  // If no historical data exists, generate mock data for demonstration
  if (flows.length === 0) {
    return generateMockFlows(start, end, includeFII, includeDII);
  }
  
  return flows;
}

function generateMockFlows(startDate: Date, endDate: Date, includeFII: boolean, includeDII: boolean) {
  const flows = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
    const flow: any = {
      date: currentDate,
      segment: 'cash'
    };
    
    if (includeFII) {
      flow.fiiBuy = Math.random() * 2000 + 500;
      flow.fiiSell = Math.random() * 1500 + 300;
      flow.fiiNet = flow.fiiBuy - flow.fiiSell;
    }
    
    if (includeDII) {
      flow.diiBuy = Math.random() * 1500 + 300;
      flow.diiSell = Math.random() * 1000 + 200;
      flow.diiNet = flow.diiBuy - flow.diiSell;
    }
    
    flows.push(flow);
  }
  
  return flows;
}

function calculateFlowSummary(flows: any[]) {
  const summary = {
    totalDays: flows.length,
    fiiTotalBuy: 0,
    fiiTotalSell: 0,
    fiiNet: 0,
    diiTotalBuy: 0,
    diiTotalSell: 0,
    diiNet: 0,
    totalNet: 0,
    avgDailyFii: 0,
    avgDailyDii: 0,
    positiveFiiDays: 0,
    negativeFiiDays: 0,
    positiveDiiDays: 0,
    negativeDiiDays: 0
  };
  
  flows.forEach(flow => {
    if (flow.fiiBuy !== undefined) {
      summary.fiiTotalBuy += flow.fiiBuy;
      summary.fiiTotalSell += flow.fiiSell;
      summary.fiiNet += flow.fiiNet;
      if (flow.fiiNet > 0) summary.positiveFiiDays++;
      else if (flow.fiiNet < 0) summary.negativeFiiDays++;
    }
    
    if (flow.diiBuy !== undefined) {
      summary.diiTotalBuy += flow.diiBuy;
      summary.diiTotalSell += flow.diiSell;
      summary.diiNet += flow.diiNet;
      if (flow.diiNet > 0) summary.positiveDiiDays++;
      else if (flow.diiNet < 0) summary.negativeDiiDays++;
    }
  });
  
  summary.totalNet = summary.fiiNet + summary.diiNet;
  summary.avgDailyFii = summary.totalDays > 0 ? summary.fiiNet / summary.totalDays : 0;
  summary.avgDailyDii = summary.totalDays > 0 ? summary.diiNet / summary.totalDays : 0;
  
  return summary;
}

function calculateFlowTrends(flows: any[]) {
  if (flows.length < 2) return { trend: 'insufficient_data', strength: 0 };
  
  // Calculate 5-day moving averages
  const windowSize = Math.min(5, Math.floor(flows.length / 2));
  const fiiTrend = calculateTrend(flows.map(f => f.fiiNet || 0), windowSize);
  const diiTrend = calculateTrend(flows.map(f => f.diiNet || 0), windowSize);
  
  return {
    fiiTrend: fiiTrend.direction,
    fiiStrength: fiiTrend.strength,
    diiTrend: diiTrend.direction,
    diiStrength: diiTrend.strength,
    correlation: calculateCorrelation(
      flows.map(f => f.fiiNet || 0),
      flows.map(f => f.diiNet || 0)
    )
  };
}

function calculateTrend(data: number[], windowSize: number) {
  if (data.length < windowSize * 2) {
    return { direction: 'insufficient_data', strength: 0 };
  }
  
  const firstHalf = data.slice(0, windowSize);
  const secondHalf = data.slice(-windowSize);
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / windowSize;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / windowSize;
  
  const change = secondAvg - firstAvg;
  const strength = Math.abs(change) / (Math.abs(firstAvg) + 1);
  
  let direction = 'neutral';
  if (change > 0) direction = 'positive';
  else if (change < 0) direction = 'negative';
  
  return { direction, strength };
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0);
  const sumX2 = x.reduce((sum, val) => sum + (val * val), 0);
  const sumY2 = y.reduce((sum, val) => sum + (val * val), 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function parseFlowAnalysisResponse(aiResponse: string, flowData: any) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        marketSentiment: parsed.market_sentiment || parsed.marketSentiment || 'neutral',
        confidence: parseFloat(parsed.confidence || 0.7),
        flowPatterns: parsed.flow_patterns || parsed.flowPatterns || [],
        keyInsights: parsed.key_insights || parsed.keyInsights || [],
        predictions: parsed.predictions || [],
        riskAssessment: parsed.risk_assessment || parsed.riskAssessment || 'moderate',
        recommendations: parsed.recommendations || [],
        correlationWithMarket: parseFloat(parsed.correlation_with_market || parsed.correlationWithMarket || 0),
        aiAnalysis: aiResponse
      };
    }
    
    // Fallback: basic analysis
    return {
      marketSentiment: 'neutral',
      confidence: 0.5,
      flowPatterns: [],
      keyInsights: [],
      predictions: [],
      riskAssessment: 'moderate',
      recommendations: [],
      correlationWithMarket: 0,
      aiAnalysis: aiResponse
    };
  } catch (error) {
    console.error('Error parsing flow analysis response:', error);
    return {
      marketSentiment: 'unknown',
      confidence: 0.3,
      flowPatterns: [],
      keyInsights: [],
      predictions: [],
      riskAssessment: 'unknown',
      recommendations: [],
      correlationWithMarket: 0,
      aiAnalysis: aiResponse
    };
  }
}

function calculateFlowMetrics(analysisResult: any, flowData: any) {
  const summary = flowData.summary;
  const trends = flowData.trends;
  
  // Determine market sentiment based on flows
  if (!analysisResult.marketSentiment || analysisResult.marketSentiment === 'neutral') {
    analysisResult.marketSentiment = determineMarketSentiment(summary, trends);
  }
  
  // Generate flow patterns if not provided
  if (!analysisResult.flowPatterns || analysisResult.flowPatterns.length === 0) {
    analysisResult.flowPatterns = generateFlowPatterns(summary, trends);
  }
  
  // Generate key insights if not provided
  if (!analysisResult.keyInsights || analysisResult.keyInsights.length === 0) {
    analysisResult.keyInsights = generateKeyInsights(summary, trends);
  }
  
  // Generate predictions if not provided
  if (!analysisResult.predictions || analysisResult.predictions.length === 0) {
    analysisResult.predictions = generateFlowPredictions(summary, trends);
  }
  
  // Generate recommendations if not provided
  if (!analysisResult.recommendations || analysisResult.recommendations.length === 0) {
    analysisResult.recommendations = generateFlowRecommendations(summary, trends, analysisResult);
  }
  
  return analysisResult;
}

function determineMarketSentiment(summary: any, trends: any) {
  const totalNetFlow = summary.totalNet;
  const fiiDiiCorrelation = trends.correlation;
  
  if (totalNetFlow > 1000) return 'bullish';
  if (totalNetFlow < -1000) return 'bearish';
  
  if (fiiDiiCorrelation < -0.5) return 'contrarian';
  if (fiiDiiCorrelation > 0.5) return 'aligned';
  
  return 'neutral';
}

function generateFlowPatterns(summary: any, trends: any) {
  const patterns = [];
  
  // FII pattern
  if (summary.positiveFiiDays > summary.negativeFiiDays) {
    patterns.push({
      type: 'fii_accumulation',
      description: 'FII showing consistent buying interest',
      strength: summary.positiveFiiDays / summary.totalDays
    });
  } else {
    patterns.push({
      type: 'fii_distribution',
      description: 'FII showing selling pressure',
      strength: summary.negativeFiiDays / summary.totalDays
    });
  }
  
  // DII pattern
  if (summary.positiveDiiDays > summary.negativeDiiDays) {
    patterns.push({
      type: 'dii_accumulation',
      description: 'DII showing consistent buying interest',
      strength: summary.positiveDiiDays / summary.totalDays
    });
  } else {
    patterns.push({
      type: 'dii_distribution',
      description: 'DII showing selling pressure',
      strength: summary.negativeDiiDays / summary.totalDays
    });
  }
  
  // Correlation pattern
  if (Math.abs(trends.correlation) > 0.7) {
    patterns.push({
      type: trends.correlation > 0 ? 'aligned_movement' : 'contrarian_movement',
      description: trends.correlation > 0 ? 'FII and DII moving in same direction' : 'FII and DII moving in opposite directions',
      strength: Math.abs(trends.correlation)
    });
  }
  
  return patterns;
}

function generateKeyInsights(summary: any, trends: any) {
  const insights = [];
  
  // Net flow insight
  if (Math.abs(summary.totalNet) > 5000) {
    insights.push({
      type: 'significant_flow',
      message: `Significant ${summary.totalNet > 0 ? 'inflow' : 'outflow'} of ₹${Math.abs(summary.totalNet).toFixed(0)} crores observed`,
      impact: 'high'
    });
  }
  
  // FII-DII divergence insight
  if (Math.abs(trends.correlation) < 0.3) {
    insights.push({
      type: 'divergent_behavior',
      message: 'FII and DII showing divergent behavior - potential contrarian signals',
      impact: 'medium'
    });
  }
  
  // Trend insight
  if (trends.fiiTrend === 'positive' && trends.diiTrend === 'positive') {
    insights.push({
      type: 'broad_based_buying',
      message: 'Both FII and DII showing positive trends - broad-based buying interest',
      impact: 'high'
    });
  }
  
  return insights;
}

function generateFlowPredictions(summary: any, trends: any) {
  const predictions = [];
  
  // Short-term prediction (1 week)
  const shortTermTrend = extrapolateTrend(trends.fiiTrend, trends.diiTrend, 7);
  predictions.push({
    timeframe: '1_week',
    fiiPrediction: shortTermTrend.fii,
    diiPrediction: shortTermTrend.dii,
    confidence: 0.6
  });
  
  // Medium-term prediction (1 month)
  const mediumTermTrend = extrapolateTrend(trends.fiiTrend, trends.diiTrend, 30);
  predictions.push({
    timeframe: '1_month',
    fiiPrediction: mediumTermTrend.fii,
    diiPrediction: mediumTermTrend.dii,
    confidence: 0.4
  });
  
  return predictions;
}

function extrapolateTrend(fiiTrend: string, diiTrend: string, days: number) {
  const fiiMultiplier = fiiTrend === 'positive' ? 1.1 : fiiTrend === 'negative' ? 0.9 : 1;
  const diiMultiplier = diiTrend === 'positive' ? 1.05 : diiTrend === 'negative' ? 0.95 : 1;
  
  return {
    fii: fiiMultiplier,
    dii: diiMultiplier
  };
}

function generateFlowRecommendations(summary: any, trends: any, analysisResult: any) {
  const recommendations = [];
  
  // Trading recommendations based on sentiment
  if (analysisResult.marketSentiment === 'bullish') {
    recommendations.push({
      type: 'trading',
      priority: 'medium',
      action: 'consider_long_positions',
      message: 'Bullish sentiment from institutional flows - consider long positions',
      impact: 'Potential upside in line with institutional buying'
    });
  } else if (analysisResult.marketSentiment === 'bearish') {
    recommendations.push({
      type: 'trading',
      priority: 'medium',
      action: 'consider_hedging',
      message: 'Bearish sentiment from institutional flows - consider hedging strategies',
      impact: 'Protection against potential downside'
    });
  }
  
  // Contrarian recommendations
  if (analysisResult.marketSentiment === 'contrarian') {
    recommendations.push({
      type: 'contrarian',
      priority: 'high',
      action: 'monitor_opportunities',
      message: 'Contrarian signals detected - monitor for reversal opportunities',
      impact: 'Potential for significant market turns'
    });
  }
  
  // Risk management recommendations
  recommendations.push({
    type: 'risk_management',
    priority: 'medium',
    action: 'regular_monitoring',
    message: 'Monitor institutional flows regularly for trend changes',
    impact: 'Early detection of sentiment shifts'
  });
  
  return recommendations;
}

function generateFallbackAnalysis(flowData: any) {
  const summary = flowData.summary;
  const trends = flowData.trends;
  
  return {
    marketSentiment: determineMarketSentiment(summary, trends),
    confidence: 0.6,
    flowPatterns: generateFlowPatterns(summary, trends),
    keyInsights: generateKeyInsights(summary, trends),
    predictions: generateFlowPredictions(summary, trends),
    riskAssessment: 'moderate',
    recommendations: generateFlowRecommendations(summary, trends, { marketSentiment: determineMarketSentiment(summary, trends) }),
    correlationWithMarket: trends.correlation,
    aiAnalysis: 'Fallback analysis due to AI service unavailability'
  };
}