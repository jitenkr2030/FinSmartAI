import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/options/price - Price options using AI models
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      underlying, 
      strike, 
      expiry, 
      optionType, 
      currentPrice, 
      volatility, 
      riskFreeRate = 0.05,
      dividendYield = 0,
      pricingModel = 'black-scholes',
      userId 
    } = body;
    
    // Validate required parameters
    if (!underlying || !strike || !expiry || !optionType || !currentPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: underlying, strike, expiry, optionType, currentPrice' },
        { status: 400 }
      );
    }
    
    // Validate option type
    if (!['call', 'put'].includes(optionType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Option type must be either "call" or "put"' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // Initialize ZAI SDK
    const zai = await ZAI.create();
    
    // Prepare option data for pricing
    const optionData = {
      underlying,
      strike: parseFloat(strike),
      expiry: new Date(expiry),
      optionType: optionType.toLowerCase(),
      currentPrice: parseFloat(currentPrice),
      volatility: volatility ? parseFloat(volatility) : null,
      riskFreeRate: parseFloat(riskFreeRate),
      dividendYield: parseFloat(dividendYield),
      pricingModel
    };
    
    // Calculate time to expiry in years
    const timeToExpiry = Math.max(0, (optionData.expiry.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (timeToExpiry <= 0) {
      return NextResponse.json(
        { success: false, error: 'Option expiry date must be in the future' },
        { status: 400 }
      );
    }
    
    // Perform option pricing using ZAI
    let pricingResult;
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are Kronos-OptionsAI, an advanced options pricing AI. Calculate the fair value of the provided option using sophisticated pricing models. Provide comprehensive pricing analysis including:

1. Fair value price
2. Implied volatility (if not provided)
3. Option Greeks (Delta, Gamma, Theta, Vega, Rho)
4. Probability of being in-the-money at expiry
5. Break-even price
6. Pricing model confidence score
7. Market conditions assessment
8. Trading recommendations

Respond in JSON format with these fields. Use the Black-Scholes model as default, but consider other models like Binomial or Monte Carlo for complex scenarios.`
          },
          {
            role: 'user',
            content: `Please price this option: ${JSON.stringify({
              ...optionData,
              timeToExpiry,
              spotPrice: optionData.currentPrice
            })}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });
      
      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Parse the AI response to extract structured pricing data
      pricingResult = parseOptionsPricingResponse(aiResponse, optionData);
      
      // Calculate fallback Black-Scholes price if AI parsing fails
      if (!pricingResult.fairValue || pricingResult.fairValue <= 0) {
        pricingResult.fairValue = calculateBlackScholesPrice(optionData, timeToExpiry);
      }
      
      // Ensure we have valid Greeks
      if (!pricingResult.greeks) {
        pricingResult.greeks = calculateOptionGreeks(optionData, timeToExpiry, pricingResult.fairValue);
      }
      
      // Calculate additional metrics
      pricingResult.probabilityITM = calculateProbabilityITM(optionData, timeToExpiry);
      pricingResult.breakEven = calculateBreakEven(optionData, pricingResult.fairValue);
      
    } catch (aiError) {
      console.error('Options pricing error:', aiError);
      
      // Fallback to mathematical calculation
      pricingResult = {
        fairValue: calculateBlackScholesPrice(optionData, timeToExpiry),
        greeks: calculateOptionGreeks(optionData, timeToExpiry, null),
        impliedVolatility: optionData.volatility || calculateImpliedVolatility(optionData, timeToExpiry),
        probabilityITM: calculateProbabilityITM(optionData, timeToExpiry),
        breakEven: calculateBreakEven(optionData, null),
        confidence: 0.7,
        modelUsed: 'black-scholes-fallback',
        marketConditions: 'neutral',
        recommendations: generateOptionsRecommendations(optionData, null),
        aiAnalysis: 'Fallback pricing due to AI service unavailability'
      };
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Save option pricing to database
    const savedPricing = await db.optionChain.create({
      data: {
        underlying: optionData.underlying,
        expiry: optionData.expiry,
        strike: optionData.strike,
        optionType: optionData.optionType,
        lastPrice: pricingResult.fairValue,
        bid: pricingResult.fairValue * 0.98, // Mock bid (2% below fair value)
        ask: pricingResult.fairValue * 1.02, // Mock ask (2% above fair value)
        volume: Math.floor(Math.random() * 1000) + 100, // Mock volume
        openInterest: Math.floor(Math.random() * 5000) + 500 // Mock open interest
      }
    });
    
    // Track API usage
    if (userId) {
      await db.apiUsage.create({
        data: {
          userId,
          modelName: 'Kronos-OptionsAI',
          endpoint: '/api/options/price',
          requestData: JSON.stringify(body),
          responseData: JSON.stringify(pricingResult),
          processingTimeMs,
          cost: 0.15 // Moderate cost for options pricing
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        optionData: {
          underlying: optionData.underlying,
          strike: optionData.strike,
          expiry: optionData.expiry.toISOString(),
          optionType: optionData.optionType,
          currentPrice: optionData.currentPrice
        },
        pricing: pricingResult,
        pricingId: savedPricing.id,
        processingTimeMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Options pricing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to price option' },
      { status: 500 }
    );
  }
}

// Helper functions
function parseOptionsPricingResponse(aiResponse: string, optionData: any) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        fairValue: parseFloat(parsed.fair_value || parsed.price || parsed.fairValue || 0),
        greeks: parsed.greeks || {
          delta: parseFloat(parsed.delta || 0),
          gamma: parseFloat(parsed.gamma || 0),
          theta: parseFloat(parsed.theta || 0),
          vega: parseFloat(parsed.vega || 0),
          rho: parseFloat(parsed.rho || 0)
        },
        impliedVolatility: parseFloat(parsed.implied_volatility || parsed.impliedVolatility || optionData.volatility || 0.2),
        confidence: parseFloat(parsed.confidence || 0.8),
        modelUsed: parsed.model_used || parsed.modelUsed || 'ai-enhanced',
        marketConditions: parsed.market_conditions || parsed.marketConditions || 'normal',
        recommendations: parsed.recommendations || [],
        aiAnalysis: aiResponse
      };
    }
    
    // Fallback: basic parsing
    return {
      fairValue: 0,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      impliedVolatility: optionData.volatility || 0.2,
      confidence: 0.5,
      modelUsed: 'basic-parsing',
      marketConditions: 'unknown',
      recommendations: [],
      aiAnalysis: aiResponse
    };
  } catch (error) {
    console.error('Error parsing options pricing response:', error);
    return {
      fairValue: 0,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      impliedVolatility: optionData.volatility || 0.2,
      confidence: 0.3,
      modelUsed: 'error-fallback',
      marketConditions: 'error',
      recommendations: [],
      aiAnalysis: aiResponse
    };
  }
}

function calculateBlackScholesPrice(optionData: any, timeToExpiry: number): number {
  const S = optionData.currentPrice;
  const K = optionData.strike;
  const T = timeToExpiry;
  const r = optionData.riskFreeRate;
  const q = optionData.dividendYield;
  const sigma = optionData.volatility || 0.2; // Default volatility
  
  if (T <= 0) {
    return optionData.optionType === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  if (optionData.optionType === 'call') {
    return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  } else {
    return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
  }
}

function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

function calculateOptionGreeks(optionData: any, timeToExpiry: number, price: number | null) {
  const S = optionData.currentPrice;
  const K = optionData.strike;
  const T = timeToExpiry;
  const r = optionData.riskFreeRate;
  const q = optionData.dividendYield;
  const sigma = optionData.volatility || 0.2;
  
  if (T <= 0) {
    return {
      delta: optionData.optionType === 'call' ? (S > K ? 1 : 0) : (S > K ? 0 : -1),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }
  
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  const phi_d1 = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
  
  if (optionData.optionType === 'call') {
    const delta = Math.exp(-q * T) * normalCDF(d1);
    const gamma = Math.exp(-q * T) * phi_d1 / (S * sigma * Math.sqrt(T));
    const theta = -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) 
                  - r * K * Math.exp(-r * T) * normalCDF(d2) 
                  + q * S * Math.exp(-q * T) * normalCDF(d1);
    const vega = S * Math.exp(-q * T) * phi_d1 * Math.sqrt(T);
    const rho = K * T * Math.exp(-r * T) * normalCDF(d2);
    
    return { delta, gamma, theta, vega, rho };
  } else {
    const delta = -Math.exp(-q * T) * normalCDF(-d1);
    const gamma = Math.exp(-q * T) * phi_d1 / (S * sigma * Math.sqrt(T));
    const theta = -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) 
                  + r * K * Math.exp(-r * T) * normalCDF(-d2) 
                  - q * S * Math.exp(-q * T) * normalCDF(-d1);
    const vega = S * Math.exp(-q * T) * phi_d1 * Math.sqrt(T);
    const rho = -K * T * Math.exp(-r * T) * normalCDF(-d2);
    
    return { delta, gamma, theta, vega, rho };
  }
}

function calculateProbabilityITM(optionData: any, timeToExpiry: number): number {
  const S = optionData.currentPrice;
  const K = optionData.strike;
  const T = timeToExpiry;
  const r = optionData.riskFreeRate;
  const q = optionData.dividendYield;
  const sigma = optionData.volatility || 0.2;
  
  if (T <= 0) {
    return optionData.optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? 1 : 0);
  }
  
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  if (optionData.optionType === 'call') {
    return normalCDF(d2);
  } else {
    return normalCDF(-d2);
  }
}

function calculateBreakEven(optionData: any, price: number | null): number {
  if (optionData.optionType === 'call') {
    return optionData.strike + (price || 0);
  } else {
    return optionData.strike - (price || 0);
  }
}

function calculateImpliedVolatility(optionData: any, timeToExpiry: number): number {
  // Simple approximation - in production, use Newton-Raphson method
  const moneyness = optionData.currentPrice / optionData.strike;
  const baseVol = 0.2; // 20% base volatility
  
  if (moneyness > 1.2 || moneyness < 0.8) {
    return baseVol + 0.1; // Higher vol for OTM options
  }
  
  return baseVol;
}

function generateOptionsRecommendations(optionData: any, pricingResult: any): any[] {
  const recommendations = [];
  
  // Valuation recommendation
  if (pricingResult && pricingResult.fairValue) {
    const currentPrice = optionData.currentPrice;
    const fairValue = pricingResult.fairValue;
    const deviation = Math.abs(currentPrice - fairValue) / fairValue;
    
    if (deviation > 0.1) {
      recommendations.push({
        type: 'valuation',
        priority: 'high',
        action: currentPrice > fairValue ? 'sell' : 'buy',
        message: `Option is ${currentPrice > fairValue ? 'overvalued' : 'undervalued'} by ${(deviation * 100).toFixed(1)}%`,
        impact: `Potential profit: ${(deviation * 100).toFixed(1)}%`
      });
    }
  }
  
  // Volatility recommendation
  const vol = optionData.volatility || 0.2;
  if (vol > 0.3) {
    recommendations.push({
      type: 'volatility',
      priority: 'medium',
      action: 'consider_strategies',
      message: 'High volatility environment - consider volatility strategies',
      impact: 'Straddle or strangle strategies may be profitable'
    });
  } else if (vol < 0.15) {
    recommendations.push({
      type: 'volatility',
      priority: 'low',
      action: 'selling_options',
      message: 'Low volatility environment - consider selling options',
      impact: 'Premium collection strategies may be effective'
    });
  }
  
  // Time decay recommendation
  const timeToExpiry = (new Date(optionData.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (timeToExpiry < 30) {
    recommendations.push({
      type: 'time_decay',
      priority: 'high',
      action: 'monitor_closely',
      message: 'Option expires in less than 30 days - monitor theta decay closely',
      impact: 'Rapid time decay may erode option value'
    });
  }
  
  return recommendations;
}