import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/options/analyze - Analyze options strategies and positions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      strategy, 
      underlying, 
      options = [], 
      marketConditions,
      riskTolerance = 'moderate',
      investmentHorizon = 'medium',
      userId 
    } = body;
    
    // Validate required parameters
    if (!strategy || !underlying) {
      return NextResponse.json(
        { success: false, error: 'Strategy and underlying symbol are required' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // Initialize AI SDK
    const ai = await ZAI.create();
    
    // Prepare strategy analysis data
    const strategyData = {
      strategy,
      underlying,
      options,
      marketConditions: marketConditions || 'neutral',
      riskTolerance,
      investmentHorizon,
      analysisTimestamp: new Date().toISOString()
    };
    
    // Perform strategy analysis using ZAI
    let analysisResult;
    try {
      const completion = await ai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are Kronos-OptionsAI, an advanced options strategy analysis AI. Analyze the provided options strategy and provide comprehensive insights including:

1. Strategy suitability assessment
2. Risk-reward analysis
3. Break-even analysis
4. Maximum profit/loss calculations
5. Probability of success
6. Market conditions impact
7. Alternative strategy recommendations
8. Optimal entry/exit timing
9. Position sizing recommendations
10. Hedge effectiveness

Provide detailed analysis with specific metrics and actionable recommendations. Consider the user's risk tolerance and investment horizon.`
          },
          {
            role: 'user',
            content: `Please analyze this options strategy: ${JSON.stringify(strategyData)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      });
      
      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Parse the AI response to extract structured analysis data
      analysisResult = parseStrategyAnalysisResponse(aiResponse, strategyData);
      
      // Calculate additional metrics
      analysisResult = calculateStrategyMetrics(analysisResult, strategyData);
      
    } catch (aiError) {
      console.error('Options strategy analysis error:', aiError);
      
      // Fallback analysis
      analysisResult = generateFallbackAnalysis(strategyData);
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Save strategy analysis to database
    const savedAnalysis = await db.optionsStrategy.create({
      data: {
        name: strategy,
        underlying,
        strategyType: strategy.toLowerCase().replace(/\s+/g, '_'),
        status: 'analyzed',
        riskLevel: analysisResult.riskLevel || 'moderate',
        maxProfit: analysisResult.maxProfit || 0,
        maxLoss: analysisResult.maxLoss || 0,
        breakEvenPoints: JSON.stringify(analysisResult.breakEvenPoints || []),
        probability: analysisResult.probabilityOfSuccess || 0.5,
        createdAt: new Date()
      }
    });
    
    // Track API usage
    if (userId) {
      await db.apiUsage.create({
        data: {
          userId,
          modelName: 'Kronos-OptionsAI',
          endpoint: '/api/options/analyze',
          requestData: JSON.stringify(body),
          responseData: JSON.stringify(analysisResult),
          processingTimeMs,
          cost: 0.25 // Higher cost for strategy analysis
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        strategy: strategyData.strategy,
        underlying: strategyData.underlying,
        analysis: analysisResult,
        analysisId: savedAnalysis.id,
        processingTimeMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Options strategy analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze options strategy' },
      { status: 500 }
    );
  }
}

// Helper functions
function parseStrategyAnalysisResponse(aiResponse: string, strategyData: any) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suitability: parsed.suitability || 'neutral',
        riskRewardRatio: parseFloat(parsed.risk_reward_ratio || parsed.riskRewardRatio || 1),
        maxProfit: parseFloat(parsed.max_profit || parsed.maxProfit || 0),
        maxLoss: parseFloat(parsed.max_loss || parsed.maxLoss || 0),
        breakEvenPoints: parsed.break_even_points || parsed.breakEvenPoints || [],
        probabilityOfSuccess: parseFloat(parsed.probability_of_success || parsed.probabilityOfSuccess || 0.5),
        marketImpact: parsed.market_impact || parsed.marketImpact || 'moderate',
        alternatives: parsed.alternatives || [],
        timing: parsed.timing || {},
        positionSizing: parsed.position_sizing || parsed.positionSizing || {},
        hedgeEffectiveness: parseFloat(parsed.hedge_effectiveness || parsed.hedgeEffectiveness || 0),
        recommendations: parsed.recommendations || [],
        riskLevel: parsed.risk_level || parsed.riskLevel || 'moderate',
        aiAnalysis: aiResponse
      };
    }
    
    // Fallback: basic analysis
    return {
      suitability: 'neutral',
      riskRewardRatio: 1,
      maxProfit: 0,
      maxLoss: 0,
      breakEvenPoints: [],
      probabilityOfSuccess: 0.5,
      marketImpact: 'moderate',
      alternatives: [],
      timing: {},
      positionSizing: {},
      hedgeEffectiveness: 0,
      recommendations: [],
      riskLevel: 'moderate',
      aiAnalysis: aiResponse
    };
  } catch (error) {
    console.error('Error parsing strategy analysis response:', error);
    return {
      suitability: 'unknown',
      riskRewardRatio: 1,
      maxProfit: 0,
      maxLoss: 0,
      breakEvenPoints: [],
      probabilityOfSuccess: 0.5,
      marketImpact: 'unknown',
      alternatives: [],
      timing: {},
      positionSizing: {},
      hedgeEffectiveness: 0,
      recommendations: [],
      riskLevel: 'moderate',
      aiAnalysis: aiResponse
    };
  }
}

function calculateStrategyMetrics(analysisResult: any, strategyData: any) {
  const strategy = strategyData.strategy.toLowerCase();
  const options = strategyData.options || [];
  
  // Calculate break-even points based on strategy type
  if (!analysisResult.breakEvenPoints || analysisResult.breakEvenPoints.length === 0) {
    analysisResult.breakEvenPoints = calculateBreakEvenPoints(strategy, options);
  }
  
  // Calculate risk-reward ratio if not provided
  if (analysisResult.riskRewardRatio <= 0 && analysisResult.maxProfit > 0 && analysisResult.maxLoss > 0) {
    analysisResult.riskRewardRatio = analysisResult.maxProfit / Math.abs(analysisResult.maxLoss);
  }
  
  // Assess risk level based on strategy and metrics
  if (!analysisResult.riskLevel || analysisResult.riskLevel === 'moderate') {
    analysisResult.riskLevel = assessRiskLevel(strategy, analysisResult);
  }
  
  // Generate strategy-specific recommendations
  if (!analysisResult.recommendations || analysisResult.recommendations.length === 0) {
    analysisResult.recommendations = generateStrategyRecommendations(strategy, analysisResult, strategyData);
  }
  
  return analysisResult;
}

function calculateBreakEvenPoints(strategy: string, options: any[]): number[] {
  // Simplified break-even calculations for common strategies
  const breakEvens: number[] = [];
  
  switch (strategy) {
    case 'long call':
    case 'call':
      if (options.length > 0) {
        const callOption = options[0];
        breakEvens.push(callOption.strike + (callOption.premium || 0));
      }
      break;
      
    case 'long put':
    case 'put':
      if (options.length > 0) {
        const putOption = options[0];
        breakEvens.push(putOption.strike - (putOption.premium || 0));
      }
      break;
      
    case 'straddle':
    case 'strangle':
      if (options.length >= 2) {
        const totalPremium = options.reduce((sum, opt) => sum + (opt.premium || 0), 0);
        if (strategy === 'straddle' && options[0].strike === options[1].strike) {
          breakEvens.push(options[0].strike + totalPremium, options[0].strike - totalPremium);
        } else {
          // Strangle
          const strikes = options.map(opt => opt.strike).sort((a, b) => a - b);
          breakEvens.push(strikes[0] - totalPremium, strikes[1] + totalPremium);
        }
      }
      break;
      
    case 'covered call':
      if (options.length >= 2) {
        const stockPrice = options[0].price || 100; // Assuming first element is stock
        const callStrike = options[1].strike;
        const premium = options[1].premium || 0;
        breakEvens.push(stockPrice - premium);
      }
      break;
      
    default:
      // Default to simple break-even for unknown strategies
      if (options.length > 0) {
        const avgStrike = options.reduce((sum, opt) => sum + opt.strike, 0) / options.length;
        const avgPremium = options.reduce((sum, opt) => sum + (opt.premium || 0), 0) / options.length;
        breakEvens.push(avgStrike + avgPremium);
      }
  }
  
  return breakEvens;
}

function assessRiskLevel(strategy: string, analysis: any): string {
  // Assess risk based on strategy type and metrics
  const riskFactors = {
    'high': ['naked', 'uncovered', 'ratio', 'diagonal'],
    'medium': ['straddle', 'strangle', 'butterfly', 'condor'],
    'low': ['covered', 'married', 'collar', 'protective']
  };
  
  // Check strategy name for risk indicators
  const strategyLower = strategy.toLowerCase();
  for (const [level, indicators] of Object.entries(riskFactors)) {
    if (indicators.some(indicator => strategyLower.includes(indicator))) {
      return level;
    }
  }
  
  // Assess based on risk-reward ratio
  if (analysis.riskRewardRatio < 0.5) return 'high';
  if (analysis.riskRewardRatio < 1.5) return 'medium';
  return 'low';
}

function generateStrategyRecommendations(strategy: string, analysis: any, strategyData: any): any[] {
  const recommendations = [];
  const riskTolerance = strategyData.riskTolerance || 'moderate';
  
  // Risk management recommendations
  if (analysis.riskLevel === 'high' && riskTolerance === 'low') {
    recommendations.push({
      type: 'risk_management',
      priority: 'high',
      action: 'consider_hedging',
      message: 'Strategy carries high risk - consider implementing protective hedges',
      impact: 'Reduce potential losses by 40-60%'
    });
  }
  
  // Market timing recommendations
  if (strategyData.marketConditions === 'volatile') {
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      action: 'wait_for_stability',
      message: 'High volatility detected - consider waiting for more stable conditions',
      impact: 'Improve entry timing and reduce slippage'
    });
  }
  
  // Position sizing recommendations
  if (analysis.maxLoss > 0) {
    const recommendedSize = Math.min(100000, analysis.maxLoss * 10); // Max 10x max loss
    recommendations.push({
      type: 'position_sizing',
      priority: 'medium',
      action: 'limit_position_size',
      message: `Recommended maximum position size: ₹${recommendedSize.toLocaleString()}`,
      impact: 'Limit portfolio exposure to acceptable levels'
    });
  }
  
  // Exit strategy recommendations
  recommendations.push({
    type: 'exit_strategy',
    priority: 'medium',
    action: 'set_profit_targets',
    message: 'Set clear profit targets and stop-loss levels before entry',
    impact: 'Improve discipline and emotional decision-making'
  });
  
  // Monitoring recommendations
  recommendations.push({
    type: 'monitoring',
    priority: 'low',
    action: 'regular_review',
    message: 'Review position daily and adjust based on market conditions',
    impact: 'Optimize strategy performance and risk management'
  });
  
  return recommendations;
}

function generateFallbackAnalysis(strategyData: any) {
  const strategy = strategyData.strategy.toLowerCase();
  
  // Basic fallback analysis based on strategy type
  const fallbackAnalysis = {
    suitability: 'neutral',
    riskRewardRatio: 1.0,
    maxProfit: 0,
    maxLoss: 0,
    breakEvenPoints: [],
    probabilityOfSuccess: 0.5,
    marketImpact: 'moderate',
    alternatives: [],
    timing: {
      entry: 'immediate',
      exit: '30_days'
    },
    positionSizing: {
      recommended: '5%_of_portfolio',
      maximum: '10%_of_portfolio'
    },
    hedgeEffectiveness: 0.5,
    riskLevel: 'moderate',
    recommendations: [
      {
        type: 'general',
        priority: 'medium',
        action: 'further_analysis',
        message: 'Conduct thorough analysis before implementing this strategy',
        impact: 'Improve decision quality and risk management'
      }
    ],
    aiAnalysis: 'Fallback analysis due to AI service unavailability'
  };
  
  // Strategy-specific fallback values
  switch (strategy) {
    case 'long call':
    case 'call':
      fallbackAnalysis.maxProfit = 'unlimited';
      fallbackAnalysis.maxLoss = 'limited_to_premium';
      fallbackAnalysis.probabilityOfSuccess = 0.3;
      break;
      
    case 'long put':
    case 'put':
      fallbackAnalysis.maxProfit = 'limited';
      fallbackAnalysis.maxLoss = 'limited_to_premium';
      fallbackAnalysis.probabilityOfSuccess = 0.3;
      break;
      
    case 'covered call':
      fallbackAnalysis.maxProfit = 'limited';
      fallbackAnalysis.maxLoss = 'limited';
      fallbackAnalysis.probabilityOfSuccess = 0.6;
      fallbackAnalysis.riskLevel = 'low';
      break;
      
    case 'straddle':
      fallbackAnalysis.maxProfit = 'unlimited';
      fallbackAnalysis.maxLoss = 'limited_to_premiums';
      fallbackAnalysis.probabilityOfSuccess = 0.4;
      fallbackAnalysis.riskLevel = 'medium';
      break;
  }
  
  return fallbackAnalysis;
}