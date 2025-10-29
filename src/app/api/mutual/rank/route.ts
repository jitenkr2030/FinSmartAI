import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
<<<<<<< HEAD
import AI from 'z-ai-web-dev-sdk';
=======
import ZAI from 'z-ai-web-dev-sdk';
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3

// POST /api/mutual/rank - Rank mutual funds using AI analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      funds,
      rankingCriteria = 'comprehensive', // performance, risk, value, comprehensive
      timeframe = '3Y', // 1Y, 3Y, 5Y
      riskTolerance = 'moderate', // conservative, moderate, aggressive
      investmentGoal = 'growth', // growth, income, balanced
      includeAnalysis = true,
      benchmark = null
    } = body;

    // Validate required fields
    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Funds array is required' },
        { status: 400 }
      );
    }

    if (funds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 funds per ranking request' },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Initialize AI SDK
    const ai = await AI.create();
=======
    // Initialize ZAI SDK
    const zai = await ZAI.create();
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3

    // Process each fund for ranking
    const rankedFunds = await Promise.all(
      funds.map(async (fund) => {
        try {
          const ranking = await rankSingleFund(fund, zai, rankingCriteria, timeframe, riskTolerance, investmentGoal, benchmark);
          return {
            originalFund: fund,
            ranking,
            processedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error ranking fund:', error);
          return {
            originalFund: fund,
            error: 'Failed to rank fund'
          };
        }
      })
    );

    // Filter out failed rankings
    const successfulRankings = rankedFunds.filter(r => !r.error);
    const failedRankings = rankedFunds.filter(r => r.error);

    // Sort by overall score
    successfulRankings.sort((a, b) => b.ranking.overallScore - a.ranking.overallScore);

    // Generate ranking analysis
    const rankingAnalysis = await generateRankingAnalysis(successfulRankings, rankingCriteria, timeframe);

    // Create ranking categories
    const rankingCategories = categorizeFunds(successfulRankings);

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos-MutualAI',
        endpoint: '/api/mutual/rank',
        requestData: JSON.stringify({ 
          fundCount: funds.length, 
          rankingCriteria, 
          timeframe,
          riskTolerance,
          investmentGoal 
        }),
        responseData: JSON.stringify({ 
          rankedCount: successfulRankings.length,
          analysisDepth: includeAnalysis ? 'detailed' : 'basic'
        }),
        processingTimeMs: 0,
        cost: 0.02 * funds.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        rankedFunds: successfulRankings,
        failedRankings,
        rankingAnalysis,
        rankingCategories,
        metadata: {
          totalFunds: funds.length,
          rankedCount: successfulRankings.length,
          failedCount: failedRankings.length,
          rankingCriteria,
          timeframe,
          riskTolerance,
          investmentGoal,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in mutual fund ranking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to rank mutual funds' },
      { status: 500 }
    );
  }
}

async function rankSingleFund(fund, zai, rankingCriteria, timeframe, riskTolerance, investmentGoal, benchmark) {
  const { name, category, nav, returns, riskMetrics, expenseRatio, fundManager, aum } = fund;

  // Create ranking prompt
  const prompt = `
    Rank the following mutual fund based on the provided criteria:
    
    Fund Name: ${name}
    Category: ${category}
    Current NAV: ${nav}
    Returns: ${JSON.stringify(returns)}
    Risk Metrics: ${JSON.stringify(riskMetrics)}
    Expense Ratio: ${expenseRatio}%
    Fund Manager: ${fundManager}
    AUM: ${aum}
    
    Ranking Criteria: ${rankingCriteria}
    Timeframe: ${timeframe}
    Risk Tolerance: ${riskTolerance}
    Investment Goal: ${investmentGoal}
    Benchmark: ${benchmark || 'Category Average'}
    
    Please provide a comprehensive ranking analysis in the following JSON format:
    {
      "overallScore": 8.5,
      "performanceScore": 8.2,
      "riskScore": 7.8,
      "valueScore": 8.9,
      "consistencyScore": 8.1,
      "ranking": 1,
      "percentile": 95,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "recommendation": "Strong Buy|Buy|Hold|Sell|Strong Sell",
      "riskAdjustedReturn": 0.15,
      "sharpeRatio": 1.8,
      "sortinoRatio": 2.1,
      "informationRatio": 0.8,
      "alpha": 0.03,
      "beta": 0.9,
      "maxDrawdown": 0.12,
      "volatility": 0.18,
      "analysis": {
        "performanceAnalysis": "detailed performance analysis",
        "riskAnalysis": "detailed risk analysis",
        "valueAnalysis": "detailed value analysis",
        "outlook": "positive|neutral|negative",
        "suitability": "high|medium|low"
      },
      "comparison": {
        "vsCategory": "outperforms|matches|underperforms",
        "vsBenchmark": "outperforms|matches|underperforms",
        "categoryPercentile": 85,
        "benchmarkPercentile": 78
      }
    }
  `;

<<<<<<< HEAD
  const completion = await ai.chat.completions.create({
=======
  const completion = await zai.chat.completions.create({
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3
    messages: [
      {
        role: 'system',
        content: 'You are an expert mutual fund analyst with deep knowledge of Indian markets. Provide detailed, data-driven fund rankings with comprehensive analysis.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: 800
  });

  const responseText = completion.choices[0]?.message?.content || '';
  let rankingData;

  try {
    rankingData = JSON.parse(responseText);
  } catch (parseError) {
    // Fallback ranking calculation
    rankingData = calculateFallbackRanking(fund, rankingCriteria, timeframe);
  }

  return rankingData;
}

function calculateFallbackRanking(fund, rankingCriteria, timeframe) {
  const { returns, riskMetrics, expenseRatio } = fund;
  
  // Simple scoring algorithm
  let performanceScore = 0;
  let riskScore = 0;
  let valueScore = 0;
  
  // Performance scoring
  if (returns && returns[timeframe]) {
    const returnVal = returns[timeframe];
    performanceScore = Math.min(10, (returnVal / 0.15) * 10); // Normalize to 15% return = 10 points
  }
  
  // Risk scoring (lower risk = higher score for conservative, higher risk = higher score for aggressive)
  if (riskMetrics) {
    const volatility = riskMetrics.volatility || 0.2;
    riskScore = Math.max(0, 10 - (volatility * 25)); // Lower volatility = higher score
  }
  
  // Value scoring (lower expense ratio = higher score)
  valueScore = Math.max(0, 10 - (expenseRatio * 20)); // Lower expense ratio = higher score
  
  // Calculate overall score based on criteria
  let overallScore;
  switch (rankingCriteria) {
    case 'performance':
      overallScore = performanceScore * 0.7 + riskScore * 0.2 + valueScore * 0.1;
      break;
    case 'risk':
      overallScore = performanceScore * 0.2 + riskScore * 0.7 + valueScore * 0.1;
      break;
    case 'value':
      overallScore = performanceScore * 0.3 + riskScore * 0.2 + valueScore * 0.5;
      break;
    default:
      overallScore = performanceScore * 0.4 + riskScore * 0.3 + valueScore * 0.3;
  }
  
  return {
    overallScore: Math.round(overallScore * 10) / 10,
    performanceScore: Math.round(performanceScore * 10) / 10,
    riskScore: Math.round(riskScore * 10) / 10,
    valueScore: Math.round(valueScore * 10) / 10,
    consistencyScore: Math.round((performanceScore + riskScore) / 2 * 10) / 10,
    ranking: 0, // Will be set after sorting
    percentile: Math.round(overallScore * 10),
    strengths: ['Data available for analysis'],
    weaknesses: ['Limited analysis scope'],
    recommendation: overallScore > 7 ? 'Buy' : overallScore > 5 ? 'Hold' : 'Sell',
    riskAdjustedReturn: 0.1,
    sharpeRatio: 1.2,
    sortinoRatio: 1.4,
    informationRatio: 0.5,
    alpha: 0.02,
    beta: 1.0,
    maxDrawdown: 0.15,
    volatility: riskMetrics?.volatility || 0.2,
    analysis: {
      performanceAnalysis: 'Based on available return data',
      riskAnalysis: 'Based on available risk metrics',
      valueAnalysis: 'Based on expense ratio',
      outlook: 'neutral',
      suitability: 'medium'
    },
    comparison: {
      vsCategory: 'matches',
      vsBenchmark: 'matches',
      categoryPercentile: 50,
      benchmarkPercentile: 50
    }
  };
}

async function generateRankingAnalysis(rankedFunds, rankingCriteria, timeframe) {
  const totalFunds = rankedFunds.length;
  const averageScore = rankedFunds.reduce((acc, fund) => acc + fund.ranking.overallScore, 0) / totalFunds;
  
  const scoreDistribution = {
    excellent: rankedFunds.filter(f => f.ranking.overallScore >= 8).length,
    good: rankedFunds.filter(f => f.ranking.overallScore >= 6 && f.ranking.overallScore < 8).length,
    average: rankedFunds.filter(f => f.ranking.overallScore >= 4 && f.ranking.overallScore < 6).length,
    poor: rankedFunds.filter(f => f.ranking.overallScore < 4).length
  };
  
  const recommendationDistribution = rankedFunds.reduce((acc, fund) => {
    acc[fund.ranking.recommendation] = (acc[fund.ranking.recommendation] || 0) + 1;
    return acc;
  }, {});
  
  const topPerformers = rankedFunds.slice(0, 5);
  const bottomPerformers = rankedFunds.slice(-5);
  
  return {
    summary: {
      totalFunds,
      averageScore: Math.round(averageScore * 10) / 10,
      topScore: rankedFunds[0]?.ranking.overallScore || 0,
      bottomScore: rankedFunds[rankedFunds.length - 1]?.ranking.overallScore || 0,
      scoreRange: (rankedFunds[0]?.ranking.overallScore || 0) - (rankedFunds[rankedFunds.length - 1]?.ranking.overallScore || 0)
    },
    distribution: scoreDistribution,
    recommendations: recommendationDistribution,
    topPerformers: topPerformers.map(f => ({
      name: f.originalFund.name,
      score: f.ranking.overallScore,
      recommendation: f.ranking.recommendation
    })),
    bottomPerformers: bottomPerformers.map(f => ({
      name: f.originalFund.name,
      score: f.ranking.overallScore,
      recommendation: f.ranking.recommendation
    })),
    insights: generateRankingInsights(rankedFunds, rankingCriteria, timeframe)
  };
}

function generateRankingInsights(rankedFunds, rankingCriteria, timeframe) {
  const insights = [];
  
  // Performance insights
  const highPerformers = rankedFunds.filter(f => f.ranking.overallScore >= 8);
  if (highPerformers.length > 0) {
    insights.push(`${highPerformers.length} funds (${Math.round(highPerformers.length / rankedFunds.length * 100)}%) show excellent performance`);
  }
  
  // Risk insights
  const lowRiskFunds = rankedFunds.filter(f => f.ranking.riskScore >= 7);
  if (lowRiskFunds.length > 0) {
    insights.push(`${lowRiskFunds.length} funds offer strong risk-adjusted returns`);
  }
  
  // Value insights
  const highValueFunds = rankedFunds.filter(f => f.ranking.valueScore >= 8);
  if (highValueFunds.length > 0) {
    insights.push(`${highValueFunds.length} funds provide excellent value for money`);
  }
  
  // Consistency insights
  const consistentFunds = rankedFunds.filter(f => f.ranking.consistencyScore >= 7);
  if (consistentFunds.length > 0) {
    insights.push(`${consistentFunds.length} funds show consistent performance`);
  }
  
  // Category insights
  const categories = {};
  rankedFunds.forEach(fund => {
    const category = fund.originalFund.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(fund.ranking.overallScore);
  });
  
  const bestCategory = Object.entries(categories).reduce((a, b) => {
    const avgA = a[1].reduce((sum, score) => sum + score, 0) / a[1].length;
    const avgB = b[1].reduce((sum, score) => sum + score, 0) / b[1].length;
    return avgA > avgB ? a : b;
  });
  
  insights.push(`${bestCategory[0]} category shows the best average performance`);
  
  return insights;
}

function categorizeFunds(rankedFunds) {
  const categories = {
    topTier: rankedFunds.filter(f => f.ranking.overallScore >= 8),
    strongPerformers: rankedFunds.filter(f => f.ranking.overallScore >= 6 && f.ranking.overallScore < 8),
    averagePerformers: rankedFunds.filter(f => f.ranking.overallScore >= 4 && f.ranking.overallScore < 6),
    underperformers: rankedFunds.filter(f => f.ranking.overallScore < 4)
  };
  
  return {
    topTier: {
      count: categories.topTier.length,
      funds: categories.topTier.map(f => ({
        name: f.originalFund.name,
        score: f.ranking.overallScore,
        recommendation: f.ranking.recommendation
      }))
    },
    strongPerformers: {
      count: categories.strongPerformers.length,
      funds: categories.strongPerformers.map(f => ({
        name: f.originalFund.name,
        score: f.ranking.overallScore,
        recommendation: f.ranking.recommendation
      }))
    },
    averagePerformers: {
      count: categories.averagePerformers.length,
      funds: categories.averagePerformers.map(f => ({
        name: f.originalFund.name,
        score: f.ranking.overallScore,
        recommendation: f.ranking.recommendation
      }))
    },
    underperformers: {
      count: categories.underperformers.length,
      funds: categories.underperformers.map(f => ({
        name: f.originalFund.name,
        score: f.ranking.overallScore,
        recommendation: f.ranking.recommendation
      }))
    }
  };
}