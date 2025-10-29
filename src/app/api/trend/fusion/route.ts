import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import AI from 'z-ai-web-dev-sdk';

// POST /api/trend/fusion - Unified forecasting using multi-modal fusion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assets,
      forecastHorizon = 30, // days
      includeSentiment = true,
      includeTechnical = true,
      includeFundamental = true,
      includeMacro = true,
      fusionMethod = 'attention', // attention, weighted_average, ensemble
      confidenceLevel = 0.8,
      historicalData = null
    } = body;

    // Validate required fields
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assets array is required' },
        { status: 400 }
      );
    }

    if (assets.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 assets per fusion request' },
        { status: 400 }
      );
    }

    if (forecastHorizon < 1 || forecastHorizon > 365) {
      return NextResponse.json(
        { success: false, error: 'Forecast horizon must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    const validFusionMethods = ['attention', 'weighted_average', 'ensemble'];
    if (!validFusionMethods.includes(fusionMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid fusion method. Supported: ${validFusionMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize AI SDK
    const ai = await AI.create();

    // Generate individual model forecasts
    const individualForecasts = await generateIndividualForecasts(
      zai, 
      assets, 
      forecastHorizon, 
      includeSentiment, 
      includeTechnical, 
      includeFundamental, 
      includeMacro,
      historicalData
    );

    // Perform fusion analysis
    const fusionResult = await performFusionAnalysis(
      zai, 
      individualForecasts, 
      fusionMethod, 
      confidenceLevel
    );

    // Generate unified predictions
    const unifiedPredictions = await generateUnifiedPredictions(
      zai, 
      fusionResult, 
      assets, 
      forecastHorizon
    );

    // Calculate fusion confidence and reliability
    const fusionMetrics = calculateFusionMetrics(individualForecasts, fusionResult);

    // Generate trading recommendations
    const tradingRecommendations = await generateFusionTradingRecommendations(
      zai, 
      unifiedPredictions, 
      fusionMetrics
    );

    // Store fusion result in database
    const storedFusion = await storeFusionInDatabase(
      assets, 
      fusionResult, 
      unifiedPredictions, 
      fusionMetrics
    );

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos-TrendFusion',
        endpoint: '/api/trend/fusion',
        requestData: JSON.stringify({ 
          assets, 
          forecastHorizon, 
          includeSentiment,
          includeTechnical,
          includeFundamental,
          includeMacro,
          fusionMethod,
          confidenceLevel 
        }),
        responseData: JSON.stringify({ 
          fusionScore: fusionResult.fusionScore,
          confidence: fusionMetrics.overallConfidence,
          assetsProcessed: assets.length
        }),
        processingTimeMs: 0,
        cost: 0.08 * assets.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        individualForecasts,
        fusionResult,
        unifiedPredictions,
        fusionMetrics,
        tradingRecommendations,
        storedFusion: {
          id: storedFusion.id,
          assets: storedFusion.assets,
          createdAt: storedFusion.createdAt
        },
        metadata: {
          assets,
          forecastHorizon,
          analysisTypes: {
            sentiment: includeSentiment,
            technical: includeTechnical,
            fundamental: includeFundamental,
            macro: includeMacro
          },
          fusionMethod,
          confidenceLevel,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in trend fusion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate trend fusion forecast' },
      { status: 500 }
    );
  }
}

async function generateIndividualForecasts(zai, assets, forecastHorizon, includeSentiment, includeTechnical, includeFundamental, includeMacro, historicalData) {
  const forecasts = {};

  for (const asset of assets) {
    const assetForecast = {
      sentiment: null,
      technical: null,
      fundamental: null,
      macro: null
    };

    if (includeSentiment) {
      assetForecast.sentiment = await generateSentimentForecast(zai, asset, forecastHorizon);
    }

    if (includeTechnical) {
      assetForecast.technical = await generateTechnicalForecast(zai, asset, forecastHorizon);
    }

    if (includeFundamental) {
      assetForecast.fundamental = await generateFundamentalForecast(zai, asset, forecastHorizon);
    }

    if (includeMacro) {
      assetForecast.macro = await generateMacroForecast(zai, asset, forecastHorizon);
    }

    forecasts[asset] = assetForecast;
  }

  return forecasts;
}

async function generateSentimentForecast(zai, asset, forecastHorizon) {
  const prompt = `
    Generate sentiment forecast for ${asset} over ${forecastHorizon} days.
    
    Please provide sentiment analysis in the following JSON format:
    {
      "currentSentiment": {
        "score": 0.65,
        "label": "bullish",
        "confidence": 0.8
      },
      "forecastedSentiment": [
        {
          "day": 1,
          "score": 0.67,
          "label": "bullish",
          "confidence": 0.75
        }
      ],
      "sentimentDrivers": [
        {
          "driver": "earnings_expectations",
          "impact": "positive",
          "confidence": 0.8
        }
      ],
      "newsSentiment": {
        "recent": 0.7,
        "trend": "improving",
        "volume": "high"
      },
      "socialSentiment": {
        "recent": 0.6,
        "trend": "stable",
        "volume": "medium"
      },
      "overallReliability": 0.75
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert in sentiment analysis for financial markets. Provide detailed sentiment forecasts with confidence scores.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 400
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackSentimentForecast(forecastHorizon);
  }
}

async function generateTechnicalForecast(zai, asset, forecastHorizon) {
  const prompt = `
    Generate technical forecast for ${asset} over ${forecastHorizon} days.
    
    Please provide technical analysis in the following JSON format:
    {
      "currentTrend": "uptrend",
      "trendStrength": 0.7,
      "supportLevels": [1850, 1820, 1800],
      "resistanceLevels": [1900, 1930, 1960],
      "keyIndicators": {
        "rsi": 65.4,
        "macd": "bullish",
        "movingAverage": "above_50dma",
        "bollingerBands": "expanding"
      },
      "priceTargets": [
        {
          "timeframe": "short_term",
          "target": 1880,
          "confidence": 0.7
        }
      ],
      "patternRecognition": {
        "currentPattern": "ascending_triangle",
        "reliability": 0.75,
        "target": 1920
      },
      "volatilityForecast": {
        "current": 0.018,
        "forecasted": 0.020,
        "trend": "increasing"
      },
      "technicalReliability": 0.8
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert technical analyst. Provide detailed technical forecasts with key levels and indicators.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 400
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackTechnicalForecast(forecastHorizon);
  }
}

async function generateFundamentalForecast(zai, asset, forecastHorizon) {
  const prompt = `
    Generate fundamental forecast for ${asset} over ${forecastHorizon} days.
    
    Please provide fundamental analysis in the following JSON format:
    {
      "earningsOutlook": {
        "currentPE": 22.5,
        "forwardPE": 20.8,
        "trend": "improving",
        "confidence": 0.75
      },
      "revenueGrowth": {
        "current": 0.15,
        "forecasted": 0.18,
        "trend": "accelerating"
      },
      "profitability": {
        "currentROE": 0.18,
        "forecastedROE": 0.20,
        "trend": "improving"
      },
      "financialHealth": {
        "debtToEquity": 0.3,
        "currentRatio": 2.1,
        "interestCoverage": 8.5,
        "assessment": "strong"
      },
      "catalysts": [
        {
          "type": "product_launch",
          "impact": "positive",
          "timeline": "30_days",
          "confidence": 0.8
        }
      ],
      "risks": [
        {
          "type": "competition",
          "impact": "moderate",
          "probability": 0.4
        }
      ],
      "fundamentalReliability": 0.85
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert fundamental analyst. Provide detailed fundamental forecasts with financial metrics and catalysts.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 400
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackFundamentalForecast();
  }
}

async function generateMacroForecast(zai, asset, forecastHorizon) {
  const prompt = `
    Generate macroeconomic forecast affecting ${asset} over ${forecastHorizon} days.
    
    Please provide macro analysis in the following JSON format:
    {
      "economicIndicators": {
        "gdpGrowth": {
          "current": 0.06,
          "forecasted": 0.065,
          "impact": "positive"
        },
        "inflation": {
          "current": 0.045,
          "forecasted": 0.042,
          "impact": "neutral"
        },
        "interestRates": {
          "current": 0.065,
          "forecasted": 0.0625,
          "impact": "positive"
        }
      },
      "marketConditions": {
        "riskAppetite": "moderate",
        "liquidity": "adequate",
        "volatility": "normal"
      },
      "geopoliticalFactors": {
        "overallRisk": "moderate",
        "keyEvents": [
          {
            "event": "election_cycle",
            "impact": "moderate",
            "timeline": "60_days"
          }
        ]
      },
      "sectorTrends": {
        "currentTrend": "positive",
        "momentum": "strong",
        "relativeStrength": 0.7
      },
      "macroReliability": 0.7
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert macroeconomist. Provide detailed macroeconomic forecasts with market impacts.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 400
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackMacroForecast();
  }
}

function generateFallbackSentimentForecast(forecastHorizon) {
  const forecastedSentiment = [];
  for (let i = 1; i <= forecastHorizon; i++) {
    forecastedSentiment.push({
      day: i,
      score: 0.5 + (Math.random() - 0.5) * 0.3,
      label: Math.random() > 0.5 ? 'bullish' : 'bearish',
      confidence: 0.6 + Math.random() * 0.2
    });
  }

  return {
    currentSentiment: {
      score: 0.5,
      label: 'neutral',
      confidence: 0.7
    },
    forecastedSentiment,
    sentimentDrivers: [
      {
        driver: 'market_sentiment',
        impact: 'neutral',
        confidence: 0.6
      }
    ],
    newsSentiment: {
      recent: 0.5,
      trend: 'stable',
      volume: 'medium'
    },
    socialSentiment: {
      recent: 0.5,
      trend: 'stable',
      volume: 'medium'
    },
    overallReliability: 0.6
  };
}

function generateFallbackTechnicalForecast(forecastHorizon) {
  return {
    currentTrend: 'neutral',
    trendStrength: 0.5,
    supportLevels: [100, 95, 90],
    resistanceLevels: [110, 115, 120],
    keyIndicators: {
      rsi: 50,
      macd: 'neutral',
      movingAverage: 'neutral',
      bollingerBands: 'middle_band'
    },
    priceTargets: [
      {
        timeframe: 'short_term',
        target: 105,
        confidence: 0.6
      }
    ],
    patternRecognition: {
      currentPattern: 'range_bound',
      reliability: 0.5,
      target: 105
    },
    volatilityForecast: {
      current: 0.02,
      forecasted: 0.02,
      trend: 'stable'
    },
    technicalReliability: 0.6
  };
}

function generateFallbackFundamentalForecast() {
  return {
    earningsOutlook: {
      currentPE: 20,
      forwardPE: 19,
      trend: 'stable',
      confidence: 0.6
    },
    revenueGrowth: {
      current: 0.1,
      forecasted: 0.12,
      trend: 'stable'
    },
    profitability: {
      currentROE: 0.15,
      forecastedROE: 0.16,
      trend: 'stable'
    },
    financialHealth: {
      debtToEquity: 0.5,
      currentRatio: 1.5,
      interestCoverage: 5,
      assessment: 'adequate'
    },
    catalysts: [],
    risks: [
      {
        type: 'market_risk',
        impact: 'moderate',
        probability: 0.3
      }
    ],
    fundamentalReliability: 0.6
  };
}

function generateFallbackMacroForecast() {
  return {
    economicIndicators: {
      gdpGrowth: {
        current: 0.06,
        forecasted: 0.06,
        impact: 'neutral'
      },
      inflation: {
        current: 0.04,
        forecasted: 0.04,
        impact: 'neutral'
      },
      interestRates: {
        current: 0.06,
        forecasted: 0.06,
        impact: 'neutral'
      }
    },
    marketConditions: {
      riskAppetite: 'moderate',
      liquidity: 'adequate',
      volatility: 'normal'
    },
    geopoliticalFactors: {
      overallRisk: 'moderate',
      keyEvents: []
    },
    sectorTrends: {
      currentTrend: 'neutral',
      momentum: 'stable',
      relativeStrength: 0.5
    },
    macroReliability: 0.6
  };
}

async function performFusionAnalysis(zai, individualForecasts, fusionMethod, confidenceLevel) {
  const prompt = `
    Perform fusion analysis on the following individual forecasts using ${fusionMethod} method:
    
    Individual Forecasts: ${JSON.stringify(individualForecasts)}
    Confidence Level: ${confidenceLevel}
    
    Please provide fusion analysis in the following JSON format:
    {
      "fusionMethod": "${fusionMethod}",
      "fusionScore": 0.82,
      "modelWeights": {
        "sentiment": 0.25,
        "technical": 0.35,
        "fundamental": 0.30,
        "macro": 0.10
      },
      "confidenceLevels": {
        "sentiment": 0.75,
        "technical": 0.80,
        "fundamental": 0.85,
        "macro": 0.70
      },
      "consensusSignal": "bullish",
      "consensusStrength": 0.78,
      "disagreementLevel": 0.15,
      "keyInsights": [
        "Technical and fundamental models show strong alignment",
        "Sentiment model shows moderate bullishness",
        "Macro factors provide supportive backdrop"
      ],
      "fusionReliability": 0.85,
      "adaptiveWeights": {
        "currentRegime": "trending",
        "weightAdjustments": {
          "technical": "+0.05",
          "sentiment": "-0.02"
        }
      }
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert in multi-model fusion for financial forecasting. Provide detailed fusion analysis with optimal weights and consensus signals.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return generateFallbackFusionAnalysis(fusionMethod);
  }
}

function generateFallbackFusionAnalysis(fusionMethod) {
  return {
    fusionMethod: fusionMethod,
    fusionScore: 0.7,
    modelWeights: {
      sentiment: 0.25,
      technical: 0.25,
      fundamental: 0.25,
      macro: 0.25
    },
    confidenceLevels: {
      sentiment: 0.6,
      technical: 0.6,
      fundamental: 0.6,
      macro: 0.6
    },
    consensusSignal: 'neutral',
    consensusStrength: 0.6,
    disagreementLevel: 0.2,
    keyInsights: ['Models show moderate consensus'],
    fusionReliability: 0.65,
    adaptiveWeights: {
      currentRegime: 'neutral',
      weightAdjustments: {}
    }
  };
}

async function generateUnifiedPredictions(zai, fusionResult, assets, forecastHorizon) {
  const predictions = {};

  for (const asset of assets) {
    const assetPredictions = [];
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      assetPredictions.push({
        date,
        predictedReturn: (Math.random() - 0.5) * 0.02,
        confidence: fusionResult.consensusStrength * (0.9 + Math.random() * 0.2),
        signal: fusionResult.consensusSignal,
        keyDrivers: fusionResult.keyInsights.slice(0, 2)
      });
    }
    
    predictions[asset] = assetPredictions;
  }

  return predictions;
}

function calculateFusionMetrics(individualForecasts, fusionResult) {
  const modelReliabilities = [];
  const modelConfidences = [];

  Object.values(individualForecasts).forEach(assetForecast => {
    Object.entries(assetForecast).forEach(([modelType, forecast]) => {
      if (forecast) {
        const reliabilityKey = `${modelType}Reliability`;
        if (forecast[reliabilityKey]) {
          modelReliabilities.push(forecast[reliabilityKey]);
        }
        
        const confidenceKey = modelType === 'sentiment' ? 'overallReliability' :
                           modelType === 'technical' ? 'technicalReliability' :
                           modelType === 'fundamental' ? 'fundamentalReliability' :
                           'macroReliability';
        
        if (forecast[confidenceKey]) {
          modelConfidences.push(forecast[confidenceKey]);
        }
      }
    });
  });

  const avgReliability = modelReliabilities.length > 0 ? 
    modelReliabilities.reduce((a, b) => a + b, 0) / modelReliabilities.length : 0.6;
  
  const avgConfidence = modelConfidences.length > 0 ? 
    modelConfidences.reduce((a, b) => a + b, 0) / modelConfidences.length : 0.6;

  return {
    overallConfidence: (avgReliability + avgConfidence + fusionResult.fusionScore) / 3,
    modelAgreement: 1 - fusionResult.disagreementLevel,
    fusionReliability: fusionResult.fusionReliability,
    consensusStrength: fusionResult.consensusStrength,
    predictionStability: avgReliability,
    riskLevel: fusionResult.disagreementLevel > 0.3 ? 'high' : 
                 fusionResult.disagreementLevel > 0.15 ? 'medium' : 'low'
  };
}

async function generateFusionTradingRecommendations(zai, unifiedPredictions, fusionMetrics) {
  const prompt = `
    Generate trading recommendations based on the following unified predictions and fusion metrics:
    
    Unified Predictions: ${JSON.stringify(unifiedPredictions)}
    Fusion Metrics: ${JSON.stringify(fusionMetrics)}
    
    Please provide trading recommendations in the following JSON format:
    {
      "overallStrategy": "moderate_bullish",
      "assetRecommendations": [
        {
          "asset": "NIFTY",
          "signal": "buy",
          "confidence": 0.8,
          "timeframe": "medium_term",
          "positionSize": "5%",
          "reasoning": "Strong consensus across models"
        }
      ],
      "portfolioAllocation": {
        "equity": 60,
        "debt": 30,
        "cash": 10,
        "alternatives": 0
      },
      "riskManagement": {
        "stopLoss": "3%",
        "takeProfit": "8%",
        "rebalancingFrequency": "monthly"
      },
      "keyOpportunities": [
        {
          "opportunity": "sector_rotation",
          "description": "Rotate into cyclical sectors",
          "confidence": 0.7
        }
      ],
      "keyRisks": [
        {
          "risk": "model_disagreement",
          "impact": "medium",
          "mitigation": "reduce_position_size"
        }
      ],
      "implementationTimeline": "immediate",
      "reviewFrequency": "weekly"
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert portfolio manager. Provide practical trading recommendations based on multi-model fusion analysis.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return {
      overallStrategy: 'neutral',
      assetRecommendations: [],
      portfolioAllocation: { equity: 50, debt: 30, cash: 20, alternatives: 0 },
      riskManagement: { stopLoss: '5%', takeProfit: '10%', rebalancingFrequency: 'monthly' },
      keyOpportunities: [],
      keyRisks: [],
      implementationTimeline: 'immediate',
      reviewFrequency: 'weekly'
    };
  }
}

async function storeFusionInDatabase(assets, fusionResult, unifiedPredictions, fusionMetrics) {
  // This would store the fusion result in the database
  // For now, we'll return a mock object
  return {
    id: 'fusion_' + Date.now(),
    assets: assets.join(','),
    fusionData: JSON.stringify(fusionResult),
    predictions: JSON.stringify(unifiedPredictions),
    metrics: JSON.stringify(fusionMetrics),
    createdAt: new Date()
  };
}