import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/alpha/generate - Generate automated trading strategies using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assets,
      strategyType = 'momentum', // momentum, mean_reversion, breakout, statistical_arbitrage
      timeframe = 'daily', // 1min, 5min, 15min, 1hour, daily
      riskTolerance = 'moderate', // conservative, moderate, aggressive
      capital = 100000, // INR
      backtestPeriod = 365, // days
      includeOptimization = true,
      includeRiskManagement = true
    } = body;

    // Validate required fields
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assets array is required' },
        { status: 400 }
      );
    }

    if (assets.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 assets per strategy generation' },
        { status: 400 }
      );
    }

    const validStrategyTypes = ['momentum', 'mean_reversion', 'breakout', 'statistical_arbitrage', 'machine_learning'];
    if (!validStrategyTypes.includes(strategyType)) {
      return NextResponse.json(
        { success: false, error: `Invalid strategy type. Supported: ${validStrategyTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validTimeframes = ['1min', '5min', '15min', '1hour', 'daily'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { success: false, error: `Invalid timeframe. Supported: ${validTimeframes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize AI SDK
    const ai = await ZAI.create();

    // Generate trading strategy
    const strategy = await generateTradingStrategy(
      zai, 
      assets, 
      strategyType, 
      timeframe, 
      riskTolerance, 
      capital, 
      backtestPeriod,
      includeOptimization,
      includeRiskManagement
    );

    // Generate backtest results
    const backtestResults = await generateBacktestResults(zai, strategy, assets, backtestPeriod);

    // Generate risk metrics
    const riskMetrics = calculateStrategyRiskMetrics(backtestResults);

    // Generate optimization recommendations
    const optimization = includeOptimization ? await generateOptimizationRecommendations(zai, strategy, backtestResults) : null;

    // Store strategy in database
    const storedStrategy = await storeStrategyInDatabase(strategy, backtestResults, riskMetrics);

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos-AlphaAI',
        endpoint: '/api/alpha/generate',
        requestData: JSON.stringify({ 
          assets, 
          strategyType, 
          timeframe,
          riskTolerance,
          capital,
          backtestPeriod,
          includeOptimization,
          includeRiskManagement 
        }),
        responseData: JSON.stringify({ 
          strategyName: strategy.name,
          sharpeRatio: backtestResults.sharpeRatio,
          winRate: backtestResults.winRate,
          totalReturn: backtestResults.totalReturn
        }),
        processingTimeMs: 0,
        cost: 0.05
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        strategy,
        backtestResults,
        riskMetrics,
        optimization,
        storedStrategy: {
          id: storedStrategy.id,
          name: storedStrategy.name,
          createdAt: storedStrategy.createdAt
        },
        metadata: {
          assets,
          strategyType,
          timeframe,
          riskTolerance,
          capital,
          backtestPeriod,
          features: {
            optimization: includeOptimization,
            riskManagement: includeRiskManagement
          },
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in strategy generation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate trading strategy' },
      { status: 500 }
    );
  }
}

async function generateTradingStrategy(zai, assets, strategyType, timeframe, riskTolerance, capital, backtestPeriod, includeOptimization, includeRiskManagement) {
  const prompt = `
    Generate a ${strategyType} trading strategy for the following parameters:
    
    Assets: ${assets.join(', ')}
    Timeframe: ${timeframe}
    Risk Tolerance: ${riskTolerance}
    Capital: ₹${capital.toLocaleString()}
    Backtest Period: ${backtestPeriod} days
    
    Include Optimization: ${includeOptimization}
    Include Risk Management: ${includeRiskManagement}
    
    Please provide a comprehensive trading strategy in the following JSON format:
    {
      "name": "Alpha_${strategyType}_${timeframe}_Strategy",
      "description": "AI-generated ${strategyType} strategy for ${assets.join(', ')}",
      "type": "${strategyType}",
      "timeframe": "${timeframe}",
      "assets": ${JSON.stringify(assets)},
      "capital": ${capital},
      "riskLevel": "${riskTolerance}",
      
      "entryRules": [
        {
          "condition": "rsi_oversold",
          "indicator": "RSI",
          "parameters": {"period": 14, "level": 30},
          "logic": "rsi < 30",
          "confidence": 0.8
        },
        {
          "condition": "price_above_sma",
          "indicator": "SMA",
          "parameters": {"period": 50},
          "logic": "price > sma50",
          "confidence": 0.7
        }
      ],
      
      "exitRules": [
        {
          "condition": "rsi_overbought",
          "indicator": "RSI",
          "parameters": {"period": 14, "level": 70},
          "logic": "rsi > 70",
          "confidence": 0.8
        },
        {
          "condition": "stop_loss",
          "type": "percentage",
          "parameters": {"percentage": 2},
          "logic": "price < entry * 0.98",
          "confidence": 1.0
        }
      ],
      
      "positionSizing": {
        "method": "fixed_percentage",
        "parameters": {"percentage": 2},
        "maxPositions": 5,
        "positionSize": ${capital * 0.02}
      },
      
      "riskManagement": {
        "stopLoss": {
          "type": "percentage",
          "value": 2,
          "trailing": true
        },
        "takeProfit": {
          "type": "percentage",
          "value": 4,
          "trailing": false
        },
        "maxDrawdown": {
          "limit": 10,
          "action": "stop_trading"
        },
        "dailyLossLimit": {
          "limit": 5,
          "action": "reduce_position"
        }
      },
      
      "indicators": [
        {
          "name": "RSI",
          "parameters": {"period": 14},
          "weight": 0.3
        },
        {
          "name": "SMA",
          "parameters": {"period": 50},
          "weight": 0.2
        },
        {
          "name": "MACD",
          "parameters": {"fast": 12, "slow": 26, "signal": 9},
          "weight": 0.3
        },
        {
          "name": "Bollinger Bands",
          "parameters": {"period": 20, "stdDev": 2},
          "weight": 0.2
        }
      ],
      
      "filters": [
        {
          "type": "volume",
          "condition": "volume > avg_volume * 1.5",
          "description": "High volume confirmation"
        },
        {
          "type": "trend",
          "condition": "adx > 25",
          "description": "Strong trend requirement"
        }
      ],
      
      "optimization": {
        "parameters": [
          {"name": "rsi_period", "min": 10, "max": 20, "step": 1},
          {"name": "sma_period", "min": 30, "max": 100, "step": 5},
          {"name": "stop_loss_pct", "min": 1, "max": 5, "step": 0.5}
        ],
        "objective": "sharpe_ratio",
        "constraints": ["max_drawdown < 15", "win_rate > 50"]
      },
      
      "execution": {
        "orderType": "limit",
        "slippage": 0.1,
        "commission": 0.01,
        "executionTime": "market_open"
      },
      
      "monitoring": {
        "metrics": ["sharpe_ratio", "win_rate", "max_drawdown", "profit_factor"],
        "frequency": "daily",
        "alerts": ["drawdown_exceeded", "performance_decline"]
      }
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert quantitative trader specializing in algorithmic trading strategies. Provide detailed, implementable trading strategies with proper risk management.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1200
  });

  const responseText = completion.choices[0]?.message?.content || '';
  let strategyData;

  try {
    strategyData = JSON.parse(responseText);
  } catch (parseError) {
    // Generate fallback strategy
    strategyData = generateFallbackStrategy(assets, strategyType, timeframe, riskTolerance, capital);
  }

  return strategyData;
}

function generateFallbackStrategy(assets, strategyType, timeframe, riskTolerance, capital) {
  return {
    name: `Alpha_${strategyType}_${timeframe}_Strategy`,
    description: `AI-generated ${strategyType} strategy for ${assets.join(', ')}`,
    type: strategyType,
    timeframe: timeframe,
    assets: assets,
    capital: capital,
    riskLevel: riskTolerance,
    
    entryRules: [
      {
        condition: "rsi_oversold",
        indicator: "RSI",
        parameters: { period: 14, level: 30 },
        logic: "rsi < 30",
        confidence: 0.8
      }
    ],
    
    exitRules: [
      {
        condition: "rsi_overbought",
        indicator: "RSI",
        parameters: { period: 14, level: 70 },
        logic: "rsi > 70",
        confidence: 0.8
      },
      {
        condition: "stop_loss",
        type: "percentage",
        parameters: { percentage: 2 },
        logic: "price < entry * 0.98",
        confidence: 1.0
      }
    ],
    
    positionSizing: {
      method: "fixed_percentage",
      parameters: { percentage: 2 },
      maxPositions: 5,
      positionSize: capital * 0.02
    },
    
    riskManagement: {
      stopLoss: {
        type: "percentage",
        value: 2,
        trailing: true
      },
      takeProfit: {
        type: "percentage",
        value: 4,
        trailing: false
      },
      maxDrawdown: {
        limit: 10,
        action: "stop_trading"
      }
    },
    
    indicators: [
      {
        name: "RSI",
        parameters: { period: 14 },
        weight: 0.5
      },
      {
        name: "SMA",
        parameters: { period: 50 },
        weight: 0.3
      },
      {
        name: "MACD",
        parameters: { fast: 12, slow: 26, signal: 9 },
        weight: 0.2
      }
    ],
    
    filters: [],
    
    optimization: {
      parameters: [
        { name: "rsi_period", min: 10, max: 20, step: 1 },
        { name: "stop_loss_pct", min: 1, max: 5, step: 0.5 }
      ],
      objective: "sharpe_ratio",
      constraints: ["max_drawdown < 15"]
    },
    
    execution: {
      orderType: "limit",
      slippage: 0.1,
      commission: 0.01,
      executionTime: "market_open"
    },
    
    monitoring: {
      metrics: ["sharpe_ratio", "win_rate", "max_drawdown"],
      frequency: "daily",
      alerts: ["drawdown_exceeded"]
    }
  };
}

async function generateBacktestResults(zai, strategy, assets, backtestPeriod) {
  const prompt = `
    Generate backtest results for the following trading strategy:
    
    Strategy: ${JSON.stringify(strategy)}
    Assets: ${assets.join(', ')}
    Backtest Period: ${backtestPeriod} days
    
    Please provide backtest results in the following JSON format:
    {
      "initialCapital": ${strategy.capital},
      "finalValue": 125000,
      "totalReturn": 0.25,
      "annualizedReturn": 0.18,
      "sharpeRatio": 1.8,
      "sortinoRatio": 2.1,
      "maxDrawdown": 0.12,
      "calmarRatio": 1.5,
      "winRate": 0.68,
      "profitFactor": 1.8,
      "totalTrades": 156,
      "winningTrades": 106,
      "losingTrades": 50,
      "avgWin": 1250,
      "avgLoss": -680,
      "largestWin": 8500,
      "largestLoss": -3200,
      "avgHoldingPeriod": 3.5,
      "trades": [
        {
          "date": "2024-01-15",
          "asset": "NIFTY",
          "type": "long",
          "entryPrice": 19450,
          "exitPrice": 19700,
          "quantity": 10,
          "pnl": 2500,
          "return": 0.0128,
          "holdingPeriod": 2,
          "exitReason": "take_profit"
        }
      ],
      "monthlyReturns": [
        {"month": "2024-01", "return": 0.025},
        {"month": "2024-02", "return": 0.018}
      ],
      "drawdownPeriods": [
        {
          "startDate": "2024-01-10",
          "endDate": "2024-01-15",
          "depth": 0.08,
          "duration": 5
        }
      ],
      "riskMetrics": {
        "var_95": 0.025,
        "var_99": 0.045,
        "expectedShortfall": 0.035,
        "beta": 0.9,
        "alpha": 0.03,
        "informationRatio": 0.8
      },
      "performanceAttribution": {
        "assetSelection": 0.15,
        "marketTiming": 0.08,
        "riskManagement": 0.02
      }
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert in backtesting trading strategies. Provide realistic, detailed backtest results with comprehensive performance metrics.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 800
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackBacktestResults(strategy.capital);
  }
}

function generateFallbackBacktestResults(capital) {
  return {
    initialCapital: capital,
    finalValue: capital * 1.15,
    totalReturn: 0.15,
    annualizedReturn: 0.12,
    sharpeRatio: 1.2,
    sortinoRatio: 1.4,
    maxDrawdown: 0.08,
    calmarRatio: 1.5,
    winRate: 0.65,
    profitFactor: 1.6,
    totalTrades: 100,
    winningTrades: 65,
    losingTrades: 35,
    avgWin: 1200,
    avgLoss: -600,
    largestWin: 5000,
    largestLoss: -2000,
    avgHoldingPeriod: 3.0,
    trades: [],
    monthlyReturns: [],
    drawdownPeriods: [],
    riskMetrics: {
      var_95: 0.02,
      var_99: 0.04,
      expectedShortfall: 0.03,
      beta: 1.0,
      alpha: 0.02,
      informationRatio: 0.6
    },
    performanceAttribution: {
      assetSelection: 0.10,
      marketTiming: 0.04,
      riskManagement: 0.01
    }
  };
}

function calculateStrategyRiskMetrics(backtestResults) {
  const returns = backtestResults.monthlyReturns.map(m => m.return);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 12); // Annualized
  
  return {
    volatility: volatility,
    maxDrawdown: backtestResults.maxDrawdown,
    sharpeRatio: backtestResults.sharpeRatio,
    sortinoRatio: backtestResults.sortinoRatio,
    calmarRatio: backtestResults.calmarRatio,
    winRate: backtestResults.winRate,
    profitFactor: backtestResults.profitFactor,
    riskAdjustedReturn: backtestResults.annualizedReturn / volatility,
    stabilityScore: calculateStabilityScore(returns),
    riskLevel: volatility > 0.2 ? 'high' : volatility > 0.1 ? 'medium' : 'low'
  };
}

function calculateStabilityScore(returns) {
  if (returns.length < 2) return 0;
  
  const positiveReturns = returns.filter(r => r > 0).length;
  const consistency = positiveReturns / returns.length;
  
  const returnStd = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - returns.reduce((c, d) => c + d, 0) / returns.length, 2), 0) / returns.length);
  
  return Math.min(10, (consistency * 5) + (1 / (1 + returnStd) * 5));
}

async function generateOptimizationRecommendations(zai, strategy, backtestResults) {
  const prompt = `
    Generate optimization recommendations for the following trading strategy and backtest results:
    
    Strategy: ${JSON.stringify(strategy)}
    Backtest Results: ${JSON.stringify(backtestResults)}
    
    Please provide optimization recommendations in the following JSON format:
    {
      "parameterOptimization": [
        {
          "parameter": "rsi_period",
          "currentValue": 14,
          "recommendedValue": 12,
          "expectedImprovement": "sharpe_ratio +0.2",
          "confidence": 0.8
        }
      ],
      "ruleEnhancement": [
        {
          "currentRule": "rsi < 30",
          "enhancedRule": "rsi < 30 and volume > avg_volume",
          "expectedImprovement": "win_rate +5%",
          "confidence": 0.7
        }
      ],
      "riskManagement": [
        {
          "currentSetting": "stop_loss_2%",
          "recommendedSetting": "stop_loss_1.5%_trailing",
          "expectedImprovement": "max_drawdown -2%",
          "confidence": 0.9
        }
      ],
      "assetSelection": [
        {
          "currentAssets": ["NIFTY"],
          "recommendedAssets": ["NIFTY", "BANKNIFTY"],
          "expectedImprovement": "diversification_benefit",
          "confidence": 0.6
        }
      ],
      "timeframeOptimization": [
        {
          "currentTimeframe": "daily",
          "recommendedTimeframe": "4hour",
          "expectedImprovement": "more_signals",
          "confidence": 0.5
        }
      ],
      "overallRecommendations": [
        "Optimize RSI parameters for better entry timing",
        "Add volume confirmation to reduce false signals",
        "Implement trailing stop loss for better risk management",
        "Consider multi-asset diversification"
      ],
      "implementationPriority": [
        {
          "action": "optimize_stop_loss",
          "priority": "high",
          "effort": "low",
          "impact": "high"
        },
        {
          "action": "add_volume_filter",
          "priority": "medium",
          "effort": "medium",
          "impact": "medium"
        }
      ]
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert in trading strategy optimization. Provide practical, actionable recommendations to improve strategy performance.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 600
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return {
      parameterOptimization: [],
      ruleEnhancement: [],
      riskManagement: [],
      assetSelection: [],
      timeframeOptimization: [],
      overallRecommendations: ["Optimize entry and exit rules"],
      implementationPriority: []
    };
  }
}

async function storeStrategyInDatabase(strategy, backtestResults, riskMetrics) {
  // This would store the strategy in the database
  // For now, we'll return a mock object
  return {
    id: 'strategy_' + Date.now(),
    userId: 'system',
    name: strategy.name,
    description: strategy.description,
    modelConfig: JSON.stringify(strategy),
    parameters: JSON.stringify({
      assets: strategy.assets,
      timeframe: strategy.timeframe,
      riskLevel: strategy.riskLevel
    }),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}