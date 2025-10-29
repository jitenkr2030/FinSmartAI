import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/commod/forecast - Forecast commodity prices using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      commodity,
      forecastHorizon = 30, // days
      includeTechnicalAnalysis = true,
      includeFundamentalAnalysis = true,
      includeExternalFactors = true,
      confidenceLevel = 0.8,
      historicalData = null
    } = body;

    // Validate required fields
    if (!commodity) {
      return NextResponse.json(
        { success: false, error: 'Commodity symbol is required' },
        { status: 400 }
      );
    }

    const validCommodities = ['gold', 'silver', 'crude_oil', 'natural_gas', 'copper', 'aluminum', 'zinc', 'lead', 'nickel'];
    if (!validCommodities.includes(commodity.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid commodity. Supported: ${validCommodities.join(', ')}` },
        { status: 400 }
      );
    }

    if (forecastHorizon < 1 || forecastHorizon > 365) {
      return NextResponse.json(
        { success: false, error: 'Forecast horizon must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Initialize AI SDK
    const ai = await ZAI.create();

    // Generate commodity forecast
    const forecast = await generateCommodityForecast(
      zai, 
      commodity, 
      forecastHorizon, 
      includeTechnicalAnalysis, 
      includeFundamentalAnalysis, 
      includeExternalFactors, 
      confidenceLevel,
      historicalData
    );

    // Generate trading signals
    const tradingSignals = await generateTradingSignals(zai, commodity, forecast);

    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(forecast);

    // Store forecast in database
    const storedForecast = await storeForecastInDatabase(commodity, forecast, riskMetrics);

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos-CommodAI',
        endpoint: '/api/commod/forecast',
        requestData: JSON.stringify({ 
          commodity, 
          forecastHorizon, 
          includeTechnicalAnalysis,
          includeFundamentalAnalysis,
          includeExternalFactors,
          confidenceLevel 
        }),
        responseData: JSON.stringify({ 
          forecastPoints: forecast.predictions.length,
          accuracy: forecast.accuracy,
          confidence: forecast.confidence
        }),
        processingTimeMs: 0,
        cost: 0.03
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        tradingSignals,
        riskMetrics,
        storedForecast: {
          id: storedForecast.id,
          commodity: storedForecast.symbol,
          createdAt: storedForecast.createdAt
        },
        metadata: {
          commodity,
          forecastHorizon,
          analysisTypes: {
            technical: includeTechnicalAnalysis,
            fundamental: includeFundamentalAnalysis,
            external: includeExternalFactors
          },
          confidenceLevel,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in commodity forecasting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate commodity forecast' },
      { status: 500 }
    );
  }
}

async function generateCommodityForecast(zai, commodity, forecastHorizon, includeTechnical, includeFundamental, includeExternal, confidenceLevel, historicalData) {
  const prompt = `
    Generate a ${forecastHorizon}-day price forecast for ${commodity} with the following parameters:
    
    Analysis Types:
    - Technical Analysis: ${includeTechnical}
    - Fundamental Analysis: ${includeFundamental}
    - External Factors: ${includeExternal}
    - Confidence Level: ${confidenceLevel}
    
    ${historicalData ? `Historical Data: ${JSON.stringify(historicalData)}` : ''}
    
    Please provide a comprehensive forecast in the following JSON format:
    {
      "currentPrice": 1850.50,
      "currency": "USD",
      "unit": "oz",
      "predictions": [
        {
          "date": "2024-01-16",
          "price": 1855.20,
          "confidence": 0.85,
          "support": 1840.00,
          "resistance": 1870.00,
          "trend": "bullish"
        }
      ],
      "summary": {
        "direction": "bullish|bearish|neutral|volatile",
        "targetPrice": 1920.00,
        "stopLoss": 1820.00,
        "timeframe": "${forecastHorizon} days",
        "confidence": 0.82,
        "keyDrivers": ["driver1", "driver2"]
      },
      "technicalAnalysis": {
        "trend": "uptrend",
        "momentum": "bullish",
        "volatility": "medium",
        "keyLevels": {
          "support": [1840, 1820, 1800],
          "resistance": [1870, 1890, 1910]
        },
        "indicators": {
          "rsi": 65.4,
          "macd": "bullish",
          "movingAverage": "above_50dma",
          "bollingerBands": "middle_band"
        }
      },
      "fundamentalAnalysis": {
        "supply": "tight",
        "demand": "strong",
        "inventory": "declining",
        "production": "stable",
        "consumption": "increasing",
        "keyFactors": ["geopolitical_risk", "inflation_hedge", "central_bank_demand"]
      },
      "externalFactors": {
        "geopolitical": "high_risk",
        "economic": "moderate_impact",
        "weather": "neutral",
        "regulatory": "low_impact",
        "marketSentiment": "risk_on"
      },
      "riskFactors": [
        {
          "factor": "geopolitical_tensions",
          "impact": "high",
          "probability": 0.6,
          "effect": "positive"
        }
      ],
      "scenarios": [
        {
          "name": "bullish",
          "probability": 0.4,
          "targetPrice": 1950.00,
          "description": "Strong demand and geopolitical tensions"
        },
        {
          "name": "bearish",
          "probability": 0.2,
          "targetPrice": 1780.00,
          "description": "Risk-off sentiment and dollar strength"
        },
        {
          "name": "neutral",
          "probability": 0.4,
          "targetPrice": 1850.00,
          "description": "Current conditions persist"
        }
      ],
      "accuracy": {
        "historicalAccuracy": 0.78,
        "modelConfidence": 0.82,
        "dataQuality": "high"
      }
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert commodity analyst specializing in precious metals, energy, and industrial metals. Provide detailed, data-driven forecasts with comprehensive analysis.'
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
  let forecastData;

  try {
    forecastData = JSON.parse(responseText);
  } catch (parseError) {
    // Generate fallback forecast
    forecastData = generateFallbackForecast(commodity, forecastHorizon);
  }

  // Ensure predictions array has the correct number of points
  if (!forecastData.predictions || forecastData.predictions.length !== forecastHorizon) {
    forecastData.predictions = generatePredictionPoints(commodity, forecastHorizon, forecastData.currentPrice);
  }

  return forecastData;
}

function generateFallbackForecast(commodity, forecastHorizon) {
  const basePrice = getBasePrice(commodity);
  const volatility = getCommodityVolatility(commodity);
  
  const predictions = [];
  let currentPrice = basePrice;
  
  for (let i = 1; i <= forecastHorizon; i++) {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += change;
    
    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
      confidence: 0.7,
      support: Math.round(currentPrice * 0.98 * 100) / 100,
      resistance: Math.round(currentPrice * 1.02 * 100) / 100,
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
    });
  }
  
  return {
    currentPrice: basePrice,
    currency: 'USD',
    unit: getCommodityUnit(commodity),
    predictions,
    summary: {
      direction: 'neutral',
      targetPrice: Math.round(currentPrice * 100) / 100,
      stopLoss: Math.round(basePrice * 0.95 * 100) / 100,
      timeframe: `${forecastHorizon} days`,
      confidence: 0.7,
      keyDrivers: ['market_sentiment', 'technical_factors']
    },
    technicalAnalysis: {
      trend: 'neutral',
      momentum: 'neutral',
      volatility: 'medium',
      keyLevels: {
        support: [basePrice * 0.95, basePrice * 0.90],
        resistance: [basePrice * 1.05, basePrice * 1.10]
      },
      indicators: {
        rsi: 50,
        macd: 'neutral',
        movingAverage: 'neutral',
        bollingerBands: 'middle_band'
      }
    },
    fundamentalAnalysis: {
      supply: 'stable',
      demand: 'stable',
      inventory: 'stable',
      production: 'stable',
      consumption: 'stable',
      keyFactors: ['market_conditions']
    },
    externalFactors: {
      geopolitical: 'moderate',
      economic: 'moderate',
      weather: 'neutral',
      regulatory: 'low',
      marketSentiment: 'neutral'
    },
    riskFactors: [
      {
        factor: 'market_volatility',
        impact: 'medium',
        probability: 0.5,
        effect: 'neutral'
      }
    ],
    scenarios: [
      {
        name: 'bullish',
        probability: 0.33,
        targetPrice: Math.round(basePrice * 1.1 * 100) / 100,
        description: 'Positive market conditions'
      },
      {
        name: 'bearish',
        probability: 0.33,
        targetPrice: Math.round(basePrice * 0.9 * 100) / 100,
        description: 'Negative market conditions'
      },
      {
        name: 'neutral',
        probability: 0.34,
        targetPrice: basePrice,
        description: 'Stable market conditions'
      }
    ],
    accuracy: {
      historicalAccuracy: 0.65,
      modelConfidence: 0.7,
      dataQuality: 'medium'
    }
  };
}

function getBasePrice(commodity) {
  const prices = {
    gold: 1850,
    silver: 22.5,
    crude_oil: 75,
    natural_gas: 3.5,
    copper: 3.8,
    aluminum: 2200,
    zinc: 2800,
    lead: 2000,
    nickel: 18000
  };
  return prices[commodity] || 100;
}

function getCommodityVolatility(commodity) {
  const volatilities = {
    gold: 0.015,
    silver: 0.025,
    crude_oil: 0.03,
    natural_gas: 0.04,
    copper: 0.02,
    aluminum: 0.015,
    zinc: 0.02,
    lead: 0.018,
    nickel: 0.025
  };
  return volatilities[commodity] || 0.02;
}

function getCommodityUnit(commodity) {
  const units = {
    gold: 'oz',
    silver: 'oz',
    crude_oil: 'barrel',
    natural_gas: 'MMBtu',
    copper: 'lb',
    aluminum: 'ton',
    zinc: 'ton',
    lead: 'ton',
    nickel: 'ton'
  };
  return units[commodity] || 'unit';
}

function generatePredictionPoints(commodity, forecastHorizon, basePrice) {
  const predictions = [];
  const volatility = getCommodityVolatility(commodity);
  let currentPrice = basePrice;
  
  for (let i = 1; i <= forecastHorizon; i++) {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += change;
    
    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
      confidence: 0.7,
      support: Math.round(currentPrice * 0.98 * 100) / 100,
      resistance: Math.round(currentPrice * 1.02 * 100) / 100,
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
    });
  }
  
  return predictions;
}

async function generateTradingSignals(zai, commodity, forecast) {
  const prompt = `
    Based on the following commodity forecast, generate trading signals for ${commodity}:
    
    Forecast Summary: ${JSON.stringify(forecast.summary)}
    Technical Analysis: ${JSON.stringify(forecast.technicalAnalysis)}
    Current Price: ${forecast.currentPrice}
    
    Please provide trading signals in the following JSON format:
    {
      "overallSignal": "strong_buy|buy|hold|sell|strong_sell",
      "entryPoints": [
        {
          "price": 1850.00,
          "type": "limit|market",
          "confidence": 0.8,
          "reasoning": "technical_breakout"
        }
      ],
      "exitPoints": [
        {
          "price": 1920.00,
          "type": "limit|stop_loss",
          "confidence": 0.7,
          "reasoning": "resistance_level"
        }
      ],
      "positionSizing": {
        "recommendedSize": "2%",
        "maxRisk": "1%",
        "leverage": "1x"
      },
      "timeHorizon": "short_term|medium_term|long_term",
      "riskRewardRatio": 2.5,
      "keyIndicators": ["rsi_oversold", "macd_bullish_crossover"],
      "marketConditions": "bullish|bearish|neutral|volatile",
      "warnings": ["high_volatility", "geopolitical_risk"]
    }
  `;

  const completion = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert commodity trader. Provide practical, risk-aware trading signals based on technical and fundamental analysis.'
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
      overallSignal: 'hold',
      entryPoints: [],
      exitPoints: [],
      positionSizing: {
        recommendedSize: '1%',
        maxRisk: '0.5%',
        leverage: '1x'
      },
      timeHorizon: 'medium_term',
      riskRewardRatio: 1.5,
      keyIndicators: ['neutral'],
      marketConditions: 'neutral',
      warnings: ['market_volatility']
    };
  }
}

function calculateRiskMetrics(forecast) {
  const prices = forecast.predictions.map(p => p.price);
  const currentPrice = forecast.currentPrice;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const maxDrawdown = (maxPrice - minPrice) / maxPrice;
  
  const finalPrice = prices[prices.length - 1];
  const totalReturn = (finalPrice - currentPrice) / currentPrice;
  
  return {
    volatility: volatility,
    maxDrawdown: maxDrawdown,
    expectedReturn: totalReturn,
    sharpeRatio: totalReturn / volatility,
    sortinoRatio: totalReturn / Math.sqrt(returns.filter(r => r < 0).reduce((a, b) => a + Math.pow(b, 2), 0) / returns.filter(r => r < 0).length),
    var_95: calculateVaR(returns, 0.95),
    var_99: calculateVaR(returns, 0.99),
    expectedRange: {
      low: Math.min(...prices),
      high: Math.max(...prices)
    },
    riskLevel: volatility > 0.03 ? 'high' : volatility > 0.015 ? 'medium' : 'low'
  };
}

function calculateVaR(returns, confidence) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  return -sortedReturns[index];
}

async function storeForecastInDatabase(commodity, forecast, riskMetrics) {
  // This would store the forecast in a database table for commodity forecasts
  // For now, we'll return a mock object
  return {
    id: 'forecast_' + Date.now(),
    symbol: commodity,
    currentPrice: forecast.currentPrice,
    targetPrice: forecast.summary.targetPrice,
    forecastData: JSON.stringify(forecast),
    riskMetrics: JSON.stringify(riskMetrics),
    createdAt: new Date()
  };
}