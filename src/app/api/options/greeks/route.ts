import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
<<<<<<< HEAD
import AI from 'z-ai-web-dev-sdk';
=======
import ZAI from 'z-ai-web-dev-sdk';
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3

// POST /api/options/greeks - Calculate option Greeks and sensitivity analysis
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
      calculations = ['delta', 'gamma', 'theta', 'vega', 'rho'],
      includeSensitivity = true,
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
    
<<<<<<< HEAD
    // Initialize AI SDK
    const ai = await AI.create();
=======
    // Initialize ZAI SDK
    const zai = await ZAI.create();
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3
    
    // Prepare option data for Greeks calculation
    const optionData = {
      underlying,
      strike: parseFloat(strike),
      expiry: new Date(expiry),
      optionType: optionType.toLowerCase(),
      currentPrice: parseFloat(currentPrice),
      volatility: volatility ? parseFloat(volatility) : null,
      riskFreeRate: parseFloat(riskFreeRate),
      dividendYield: parseFloat(dividendYield),
      calculations
    };
    
    // Calculate time to expiry in years
    const timeToExpiry = Math.max(0, (optionData.expiry.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (timeToExpiry <= 0) {
      return NextResponse.json(
        { success: false, error: 'Option expiry date must be in the future' },
        { status: 400 }
      );
    }
    
<<<<<<< HEAD
    // Perform Greeks calculation using AI
    let greeksResult;
    try {
      const completion = await ai.chat.completions.create({
=======
    // Perform Greeks calculation using ZAI
    let greeksResult;
    try {
      const completion = await zai.chat.completions.create({
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3
        messages: [
          {
            role: 'system',
            content: `You are Kronos-OptionsAI, an advanced options Greeks calculation AI. Calculate comprehensive option Greeks and sensitivity analysis for the provided option. Provide detailed analysis including:

1. All requested Greeks (Delta, Gamma, Theta, Vega, Rho)
2. Greeks interpretation and practical implications
3. Sensitivity analysis to underlying price changes
4. Sensitivity analysis to volatility changes
5. Sensitivity analysis to time decay
6. Greeks convergence analysis as expiry approaches
7. Risk assessment based on Greeks values
8. Trading recommendations based on Greeks analysis
9. Optimal hedge ratios if applicable
10. Greeks-based position management strategies

Provide precise calculations with detailed explanations of what each Greek means for the position.`
          },
          {
            role: 'user',
            content: `Please calculate Greeks and sensitivity analysis for this option: ${JSON.stringify({
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
      
      // Parse the AI response to extract structured Greeks data
      greeksResult = parseGreeksResponse(aiResponse, optionData);
      
      // Calculate precise Greeks using mathematical models
      greeksResult.greeks = calculatePreciseGreeks(optionData, timeToExpiry);
      
      // Calculate sensitivity analysis if requested
      if (includeSensitivity) {
        greeksResult.sensitivityAnalysis = calculateSensitivityAnalysis(optionData, timeToExpiry, greeksResult.greeks);
      }
      
      // Generate Greeks-based recommendations
      greeksResult.recommendations = generateGreeksRecommendations(optionData, greeksResult.greeks);
      
    } catch (aiError) {
      console.error('Options Greeks calculation error:', aiError);
      
      // Fallback to mathematical calculation
      greeksResult = {
        greeks: calculatePreciseGreeks(optionData, timeToExpiry),
        sensitivityAnalysis: includeSensitivity ? calculateSensitivityAnalysis(optionData, timeToExpiry, null) : null,
        interpretation: 'Mathematical calculation (AI service unavailable)',
        riskAssessment: 'moderate',
        hedgeRatio: calculateHedgeRatio(optionData, timeToExpiry),
        recommendations: generateGreeksRecommendations(optionData, calculatePreciseGreeks(optionData, timeToExpiry)),
        aiAnalysis: 'Fallback Greeks calculation due to AI service unavailability'
      };
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Save Greeks calculation to database
    const savedGreeks = await db.optionGreeks.create({
      data: {
        underlying: optionData.underlying,
        strike: optionData.strike,
        expiry: optionData.expiry,
        optionType: optionData.optionType,
        delta: greeksResult.greeks.delta,
        gamma: greeksResult.greeks.gamma,
        theta: greeksResult.greeks.theta,
        vega: greeksResult.greeks.vega,
        rho: greeksResult.greeks.rho,
        impliedVol: optionData.volatility || 0.2,
        spotPrice: optionData.currentPrice,
        calculatedAt: new Date()
      }
    });
    
    // Track API usage
    if (userId) {
      await db.apiUsage.create({
        data: {
          userId,
          modelName: 'Kronos-OptionsAI',
          endpoint: '/api/options/greeks',
          requestData: JSON.stringify(body),
          responseData: JSON.stringify(greeksResult),
          processingTimeMs,
          cost: 0.10 // Lower cost for Greeks calculation
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
        greeks: greeksResult,
        greeksId: savedGreeks.id,
        processingTimeMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Options Greeks calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate option Greeks' },
      { status: 500 }
    );
  }
}

// Helper functions
function parseGreeksResponse(aiResponse: string, optionData: any) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        greeks: {
          delta: parseFloat(parsed.delta || 0),
          gamma: parseFloat(parsed.gamma || 0),
          theta: parseFloat(parsed.theta || 0),
          vega: parseFloat(parsed.vega || 0),
          rho: parseFloat(parsed.rho || 0)
        },
        interpretation: parsed.interpretation || 'AI-generated analysis',
        riskAssessment: parsed.risk_assessment || parsed.riskAssessment || 'moderate',
        hedgeRatio: parseFloat(parsed.hedge_ratio || parsed.hedgeRatio || 0),
        sensitivityAnalysis: parsed.sensitivity_analysis || parsed.sensitivityAnalysis || null,
        recommendations: parsed.recommendations || [],
        aiAnalysis: aiResponse
      };
    }
    
    // Fallback: basic parsing
    return {
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      interpretation: 'Basic analysis',
      riskAssessment: 'moderate',
      hedgeRatio: 0,
      sensitivityAnalysis: null,
      recommendations: [],
      aiAnalysis: aiResponse
    };
  } catch (error) {
    console.error('Error parsing Greeks response:', error);
    return {
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      interpretation: 'Error in parsing',
      riskAssessment: 'unknown',
      hedgeRatio: 0,
      sensitivityAnalysis: null,
      recommendations: [],
      aiAnalysis: aiResponse
    };
  }
}

function calculatePreciseGreeks(optionData: any, timeToExpiry: number) {
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
  const N_d1 = normalCDF(d1);
  const N_d2 = normalCDF(d2);
  const N_minus_d1 = normalCDF(-d1);
  const N_minus_d2 = normalCDF(-d2);
  
  let delta, gamma, theta, vega, rho;
  
  if (optionData.optionType === 'call') {
    delta = Math.exp(-q * T) * N_d1;
    gamma = Math.exp(-q * T) * phi_d1 / (S * sigma * Math.sqrt(T));
    theta = -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) 
              - r * K * Math.exp(-r * T) * N_d2 
              + q * S * Math.exp(-q * T) * N_d1;
    vega = S * Math.exp(-q * T) * phi_d1 * Math.sqrt(T) / 100; // Divided by 100 for 1% vol change
    rho = K * T * Math.exp(-r * T) * N_d2 / 100; // Divided by 100 for 1% rate change
  } else {
    delta = -Math.exp(-q * T) * N_minus_d1;
    gamma = Math.exp(-q * T) * phi_d1 / (S * sigma * Math.sqrt(T));
    theta = -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) 
              + r * K * Math.exp(-r * T) * N_minus_d2 
              - q * S * Math.exp(-q * T) * N_minus_d1;
    vega = S * Math.exp(-q * T) * phi_d1 * Math.sqrt(T) / 100;
    rho = -K * T * Math.exp(-r * T) * N_minus_d2 / 100;
  }
  
  return {
    delta: Math.round(delta * 10000) / 10000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 10000) / 10000,
    vega: Math.round(vega * 10000) / 10000,
    rho: Math.round(rho * 10000) / 10000
  };
}

function calculateSensitivityAnalysis(optionData: any, timeToExpiry: number, baseGreeks: any) {
  const S = optionData.currentPrice;
  const sigma = optionData.volatility || 0.2;
  const T = timeToExpiry;
  
  const priceChanges = [-0.1, -0.05, -0.02, 0, 0.02, 0.05, 0.1]; // ±10% price changes
  const volChanges = [-0.3, -0.1, 0, 0.1, 0.3]; // ±30% vol changes
  const timeChanges = [1, 7, 30, 90]; // Days to expiry
  
  const sensitivity = {
    priceSensitivity: [],
    volatilitySensitivity: [],
    timeSensitivity: []
  };
  
  // Price sensitivity
  priceChanges.forEach(change => {
    const newPrice = S * (1 + change);
    const newOptionData = { ...optionData, currentPrice: newPrice };
    const newGreeks = calculatePreciseGreeks(newOptionData, timeToExpiry);
    
    sensitivity.priceSensitivity.push({
      priceChange: `${(change * 100).toFixed(1)}%`,
      newPrice: newPrice,
      delta: newGreeks.delta,
      gamma: newGreeks.gamma,
      theta: newGreeks.theta,
      vega: newGreeks.vega,
      rho: newGreeks.rho
    });
  });
  
  // Volatility sensitivity
  volChanges.forEach(change => {
    const newVol = Math.max(0.01, sigma * (1 + change));
    const newOptionData = { ...optionData, volatility: newVol };
    const newGreeks = calculatePreciseGreeks(newOptionData, timeToExpiry);
    
    sensitivity.volatilitySensitivity.push({
      volChange: `${(change * 100).toFixed(1)}%`,
      newVolatility: newVol,
      delta: newGreeks.delta,
      gamma: newGreeks.gamma,
      theta: newGreeks.theta,
      vega: newGreeks.vega,
      rho: newGreeks.rho
    });
  });
  
  // Time sensitivity
  timeChanges.forEach(days => {
    const newTimeToExpiry = Math.max(0.001, T - days / 365.25);
    const newGreeks = calculatePreciseGreeks(optionData, newTimeToExpiry);
    
    sensitivity.timeSensitivity.push({
      daysToExpiry: days,
      timeToExpiry: newTimeToExpiry,
      delta: newGreeks.delta,
      gamma: newGreeks.gamma,
      theta: newGreeks.theta,
      vega: newGreeks.vega,
      rho: newGreeks.rho
    });
  });
  
  return sensitivity;
}

function generateGreeksRecommendations(optionData: any, greeks: any) {
  const recommendations = [];
  const { delta, gamma, theta, vega, rho } = greeks;
  
  // Delta-based recommendations
  if (Math.abs(delta) > 0.7) {
    recommendations.push({
      type: 'delta',
      priority: 'medium',
      action: 'high_delta_exposure',
      message: `High delta exposure (${delta.toFixed(2)}) - position behaves like underlying stock`,
      impact: 'Consider hedging or reducing position size'
    });
  } else if (Math.abs(delta) < 0.3) {
    recommendations.push({
      type: 'delta',
      priority: 'low',
      action: 'low_delta_exposure',
      message: `Low delta exposure (${delta.toFixed(2)}) - option has low sensitivity to price changes`,
      impact: 'Position may require larger price moves for profitability'
    });
  }
  
  // Gamma-based recommendations
  if (Math.abs(gamma) > 0.1) {
    recommendations.push({
      type: 'gamma',
      priority: 'high',
      action: 'high_gamma_risk',
      message: `High gamma (${gamma.toFixed(4)}) - delta changes rapidly with price movements`,
      impact: 'Monitor position closely and be prepared for rapid changes'
    });
  }
  
  // Theta-based recommendations
  const daysToExpiry = (new Date(optionData.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (theta < -0.05 && daysToExpiry < 30) {
    recommendations.push({
      type: 'theta',
      priority: 'high',
      action: 'time_decay_alert',
      message: `High time decay (${theta.toFixed(4)}) near expiry - value erodes quickly`,
      impact: 'Consider closing position or rolling to further expiry'
    });
  } else if (theta < -0.02) {
    recommendations.push({
      type: 'theta',
      priority: 'medium',
      action: 'moderate_time_decay',
      message: `Moderate time decay (${theta.toFixed(4)}) - position loses value over time`,
      impact: 'Monitor time decay and plan exit strategy'
    });
  }
  
  // Vega-based recommendations
  if (Math.abs(vega) > 0.2) {
    recommendations.push({
      type: 'vega',
      priority: 'medium',
      action: 'volatility_sensitivity',
      message: `High volatility sensitivity (${vega.toFixed(4)}) - position sensitive to vol changes`,
      impact: 'Consider volatility trading strategies or hedging vol exposure'
    });
  }
  
  // Rho-based recommendations
  if (Math.abs(rho) > 0.1) {
    recommendations.push({
      type: 'rho',
      priority: 'low',
      action: 'interest_rate_sensitivity',
      message: `Interest rate sensitivity (${rho.toFixed(4)}) - position affected by rate changes`,
      impact: 'Monitor interest rate environment and central bank policies'
    });
  }
  
  // General recommendations
  recommendations.push({
    type: 'general',
    priority: 'medium',
    action: 'regular_monitoring',
    message: 'Greeks change dynamically - monitor regularly and adjust strategy',
    impact: 'Optimize position management and risk control'
  });
  
  return recommendations;
}

function calculateHedgeRatio(optionData: any, timeToExpiry: number): number {
  const greeks = calculatePreciseGreeks(optionData, timeToExpiry);
  return Math.abs(greeks.delta); // Simple delta hedge ratio
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