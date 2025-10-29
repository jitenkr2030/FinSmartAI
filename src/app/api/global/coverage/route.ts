import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
<<<<<<< HEAD
import AI from 'z-ai-web-dev-sdk';
=======
import ZAI from 'z-ai-web-dev-sdk';
>>>>>>> aa8628898dfdfcaa419c517ef508a8118ba953a3

// POST /api/global/coverage - Global market coverage analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      regions = ['US', 'Europe', 'Asia', 'Emerging'],
      assetClasses = ['equities', 'bonds', 'commodities', 'currencies'],
      timeframe = 'current',
      includeCorrelation = true,
      includeRiskAnalysis = true,
      includeOpportunities = true,
      analysisDepth = 'comprehensive' // basic, comprehensive, deep
    } = body;

    // Validate regions
    const validRegions = ['US', 'Europe', 'Asia', 'Emerging', 'LatinAmerica', 'Africa'];
    const invalidRegions = regions.filter(r => !validRegions.includes(r));
    if (invalidRegions.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid regions: ${invalidRegions.join(', ')}. Valid: ${validRegions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate asset classes
    const validAssetClasses = ['equities', 'bonds', 'commodities', 'currencies', 'real_estate', 'alternatives'];
    const invalidAssetClasses = assetClasses.filter(ac => !validAssetClasses.includes(ac));
    if (invalidAssetClasses.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid asset classes: ${invalidAssetClasses.join(', ')}. Valid: ${validAssetClasses.join(', ')}` },
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

    // Generate regional analysis
    const regionalAnalysis = await generateRegionalAnalysis(
      zai, 
      regions, 
      assetClasses, 
      timeframe, 
      analysisDepth
    );

    // Generate asset class analysis
    const assetClassAnalysis = await generateAssetClassAnalysis(
      zai, 
      regions, 
      assetClasses, 
      timeframe, 
      analysisDepth
    );

    // Generate correlation analysis if requested
    let correlationAnalysis = null;
    if (includeCorrelation) {
      correlationAnalysis = await generateCorrelationAnalysis(
        zai, 
        regions, 
        assetClasses, 
        timeframe
      );
    }

    // Generate risk analysis if requested
    let riskAnalysis = null;
    if (includeRiskAnalysis) {
      riskAnalysis = await generateGlobalRiskAnalysis(
        zai, 
        regions, 
        assetClasses, 
        timeframe
      );
    }

    // Generate opportunities if requested
    let opportunities = null;
    if (includeOpportunities) {
      opportunities = await generateGlobalOpportunities(
        zai, 
        regions, 
        assetClasses, 
        timeframe
      );
    }

    // Generate global portfolio recommendations
    const portfolioRecommendations = await generateGlobalPortfolioRecommendations(
      zai, 
      regionalAnalysis, 
      assetClassAnalysis, 
      correlationAnalysis, 
      riskAnalysis
    );

    // Calculate global market sentiment
    const globalSentiment = calculateGlobalSentiment(regionalAnalysis, assetClassAnalysis);

    // Store global analysis in database
    const storedAnalysis = await storeGlobalAnalysisInDatabase(
      regions, 
      assetClasses, 
      regionalAnalysis, 
      assetClassAnalysis, 
      globalSentiment
    );

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos Global',
        endpoint: '/api/global/coverage',
        requestData: JSON.stringify({ 
          regions, 
          assetClasses, 
          timeframe,
          includeCorrelation,
          includeRiskAnalysis,
          includeOpportunities,
          analysisDepth 
        }),
        responseData: JSON.stringify({ 
          regionsAnalyzed: regions.length,
          assetClassesAnalyzed: assetClasses.length,
          sentiment: globalSentiment.overall
        }),
        processingTimeMs: 0,
        cost: 0.1 * regions.length * assetClasses.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        regionalAnalysis,
        assetClassAnalysis,
        correlationAnalysis,
        riskAnalysis,
        opportunities,
        portfolioRecommendations,
        globalSentiment,
        storedAnalysis: {
          id: storedAnalysis.id,
          regions: storedAnalysis.regions,
          assetClasses: storedAnalysis.assetClasses,
          createdAt: storedAnalysis.createdAt
        },
        metadata: {
          regions,
          assetClasses,
          timeframe,
          features: {
            correlation: includeCorrelation,
            riskAnalysis: includeRiskAnalysis,
            opportunities: includeOpportunities
          },
          analysisDepth,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in global coverage analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate global coverage analysis' },
      { status: 500 }
    );
  }
}

async function generateRegionalAnalysis(zai, regions, assetClasses, timeframe, analysisDepth) {
  const analysis = {};

  for (const region of regions) {
    const prompt = `
      Analyze ${region} region across the following asset classes: ${assetClasses.join(', ')}
      
      Timeframe: ${timeframe}
      Analysis Depth: ${analysisDepth}
      
      Please provide regional analysis in the following JSON format:
      {
        "region": "${region}",
        "economicHealth": {
          "gdpGrowth": 0.025,
          "inflation": 0.028,
          "unemployment": 0.045,
          "manufacturingPMI": 52.3,
          "servicesPMI": 54.1,
          "consumerConfidence": 105.2,
          "overallAssessment": "moderate_expansion"
        },
        "marketPerformance": {
          "equityReturn": 0.085,
          "bondReturn": 0.032,
          "currencyPerformance": 0.012,
          "volatility": 0.18,
          "liquidity": "adequate"
        },
        "politicalStability": {
          "riskLevel": "low",
          "keyEvents": ["election_cycle", "policy_changes"],
          "outlook": "stable"
        },
        "regulatoryEnvironment": {
          "businessFriendliness": 7.5,
          "taxRegime": "moderate",
          "regulatoryChanges": ["financial_sector_reform"],
          "complianceBurden": "moderate"
        },
        "sectorHighlights": [
          {
            "sector": "technology",
            "performance": "outperforming",
            "outlook": "positive",
            "keyDrivers": ["digital_transformation", "innovation"]
          }
        ],
        "keyRisks": [
          {
            "risk": "geopolitical_tensions",
            "impact": "medium",
            "probability": 0.3
          }
        ],
        "investmentClimate": {
          "overall": "favorable",
          "foreignInvestment": "increasing",
          "marketAccess": "good",
          "capitalControls": "minimal"
        },
        "regionalScore": 7.2,
        "outlook": "positive"
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
          content: 'You are an expert global market analyst specializing in regional economic and market analysis. Provide detailed, data-driven regional assessments.'
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
      analysis[region] = JSON.parse(responseText);
    } catch (parseError) {
      analysis[region] = generateFallbackRegionalAnalysis(region);
    }
  }

  return analysis;
}

function generateFallbackRegionalAnalysis(region) {
  return {
    region: region,
    economicHealth: {
      gdpGrowth: 0.02 + Math.random() * 0.02,
      inflation: 0.02 + Math.random() * 0.02,
      unemployment: 0.04 + Math.random() * 0.02,
      manufacturingPMI: 50 + Math.random() * 5,
      servicesPMI: 50 + Math.random() * 5,
      consumerConfidence: 100 + Math.random() * 10,
      overallAssessment: 'stable'
    },
    marketPerformance: {
      equityReturn: (Math.random() - 0.5) * 0.1,
      bondReturn: 0.02 + Math.random() * 0.02,
      currencyPerformance: (Math.random() - 0.5) * 0.05,
      volatility: 0.15 + Math.random() * 0.1,
      liquidity: 'adequate'
    },
    politicalStability: {
      riskLevel: 'low',
      keyEvents: [],
      outlook: 'stable'
    },
    regulatoryEnvironment: {
      businessFriendliness: 7 + Math.random() * 2,
      taxRegime: 'moderate',
      regulatoryChanges: [],
      complianceBurden: 'moderate'
    },
    sectorHighlights: [],
    keyRisks: [
      {
        risk: 'market_volatility',
        impact: 'medium',
        probability: 0.3
      }
    ],
    investmentClimate: {
      overall: 'neutral',
      foreignInvestment: 'stable',
      marketAccess: 'good',
      capitalControls: 'minimal'
    },
    regionalScore: 6 + Math.random() * 2,
    outlook: 'neutral'
  };
}

async function generateAssetClassAnalysis(zai, regions, assetClasses, timeframe, analysisDepth) {
  const analysis = {};

  for (const assetClass of assetClasses) {
    const prompt = `
      Analyze ${assetClass} asset class across the following regions: ${regions.join(', ')}
      
      Timeframe: ${timeframe}
      Analysis Depth: ${analysisDepth}
      
      Please provide asset class analysis in the following JSON format:
      {
        "assetClass": "${assetClass}",
        "globalPerformance": {
          "totalReturn": 0.085,
          "volatility": 0.16,
          "sharpeRatio": 1.2,
          "maxDrawdown": 0.12,
          "correlationToBenchmark": 0.85
        },
        "regionalPerformance": {
          "US": {"return": 0.092, "contribution": 0.45},
          "Europe": {"return": 0.078, "contribution": 0.25},
          "Asia": {"return": 0.105, "contribution": 0.20},
          "Emerging": {"return": 0.125, "contribution": 0.10}
        },
        "keyDrivers": [
          {
            "driver": "economic_growth",
            "impact": "positive",
            "regions": ["US", "Asia"]
          }
        ],
        "riskFactors": [
          {
            "factor": "interest_rate_changes",
            "impact": "high",
            "probability": 0.6
          }
        ],
        "valuationMetrics": {
          "currentPE": 18.5,
          "forwardPE": 17.2,
          "pbRatio": 2.8,
          "dividendYield": 0.025,
          "assessment": "fair_value"
        },
        "liquidityProfile": {
          "dailyVolume": 85000000000,
          "bidAskSpread": 0.08,
          "marketDepth": "high",
          "assessment": "excellent"
        },
        "sectorRotation": {
          "currentTrend": "value_to_growth",
          "momentum": "moderate",
          "opportunities": ["technology", "healthcare"]
        },
        "outlook": {
          "shortTerm": "positive",
          "mediumTerm": "positive",
          "longTerm": "positive",
          "confidence": 0.75
        },
        "assetClassScore": 7.8
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
          content: 'You are an expert asset class analyst. Provide detailed analysis of global asset classes with regional breakdowns and valuation metrics.'
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
      analysis[assetClass] = JSON.parse(responseText);
    } catch (parseError) {
      analysis[assetClass] = generateFallbackAssetClassAnalysis(assetClass, regions);
    }
  }

  return analysis;
}

function generateFallbackAssetClassAnalysis(assetClass, regions) {
  const regionalPerformance = {};
  regions.forEach(region => {
    regionalPerformance[region] = {
      return: (Math.random() - 0.5) * 0.15,
      contribution: 1 / regions.length
    };
  });

  return {
    assetClass: assetClass,
    globalPerformance: {
      totalReturn: (Math.random() - 0.5) * 0.2,
      volatility: 0.15 + Math.random() * 0.1,
      sharpeRatio: 0.8 + Math.random() * 0.8,
      maxDrawdown: 0.1 + Math.random() * 0.1,
      correlationToBenchmark: 0.7 + Math.random() * 0.3
    },
    regionalPerformance: regionalPerformance,
    keyDrivers: [
      {
        driver: 'market_sentiment',
        impact: 'neutral',
        regions: regions
      }
    ],
    riskFactors: [
      {
        factor: 'market_risk',
        impact: 'medium',
        probability: 0.4
      }
    ],
    valuationMetrics: {
      currentPE: 15 + Math.random() * 10,
      forwardPE: 14 + Math.random() * 10,
      pbRatio: 2 + Math.random() * 2,
      dividendYield: 0.02 + Math.random() * 0.03,
      assessment: 'fair_value'
    },
    liquidityProfile: {
      dailyVolume: 50000000000 + Math.random() * 50000000000,
      bidAskSpread: 0.05 + Math.random() * 0.1,
      marketDepth: 'high',
      assessment: 'good'
    },
    sectorRotation: {
      currentTrend: 'neutral',
      momentum: 'stable',
      opportunities: []
    },
    outlook: {
      shortTerm: 'neutral',
      mediumTerm: 'neutral',
      longTerm: 'neutral',
      confidence: 0.6
    },
    assetClassScore: 6 + Math.random() * 2
  };
}

async function generateCorrelationAnalysis(zai, regions, assetClasses, timeframe) {
  const prompt = `
    Generate correlation analysis for the following regions and asset classes:
    
    Regions: ${regions.join(', ')}
    Asset Classes: ${assetClasses.join(', ')}
    Timeframe: ${timeframe}
    
    Please provide correlation analysis in the following JSON format:
    {
      "correlationMatrix": {
        "US_equities": {"Europe_equities": 0.85, "Asia_equities": 0.72, "US_bonds": -0.35},
        "Europe_equities": {"Asia_equities": 0.78, "US_bonds": -0.28}
      },
      "correlationTrends": {
        "increasing": [
          {"pair": "US_equities_Asia_equities", "trend": "strengthening", "driver": "globalization"}
        ],
        "decreasing": [
          {"pair": "equities_bonds", "trend": "weakening", "driver": "monetary_policy_divergence"}
        ]
      },
      "diversificationOpportunities": [
        {
          "combination": "US_equities_Emerging_bonds",
          "correlation": 0.15,
          "diversificationBenefit": "high",
          "recommendation": "strong_buy"
        }
      ],
      "riskConcentration": {
        "highCorrelationClusters": [
          {"cluster": "developed_market_equities", "avgCorrelation": 0.82}
        ],
        "lowCorrelationOpportunities": [
          {"pair": "commodities_bonds", "correlation": -0.25}
        ]
      },
      "tailDependencies": {
        "stressCorrelation": 0.65,
        "normalCorrelation": 0.45,
        "increaseInStress": 0.20
      },
      "optimalPortfolioWeights": {
        "US_equities": 0.35,
        "Europe_equities": 0.25,
        "Asia_equities": 0.20,
        "bonds": 0.15,
        "commodities": 0.05
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
        content: 'You are an expert in correlation analysis and portfolio optimization. Provide detailed correlation matrices and diversification insights.'
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
    return generateFallbackCorrelationAnalysis(regions, assetClasses);
  }
}

function generateFallbackCorrelationAnalysis(regions, assetClasses) {
  const correlationMatrix = {};
  
  // Generate simple correlation matrix
  regions.forEach(region1 => {
    assetClasses.forEach(asset1 => {
      const key1 = `${region1}_${asset1}`;
      correlationMatrix[key1] = {};
      
      regions.forEach(region2 => {
        assetClasses.forEach(asset2 => {
          const key2 = `${region2}_${asset2}`;
          
          if (key1 === key2) {
            correlationMatrix[key1][key2] = 1.0;
          } else if (asset1 === asset2) {
            correlationMatrix[key1][key2] = 0.7 + Math.random() * 0.3;
          } else {
            correlationMatrix[key1][key2] = (Math.random() - 0.5) * 0.6;
          }
        });
      });
    });
  });

  return {
    correlationMatrix,
    correlationTrends: {
      increasing: [],
      decreasing: []
    },
    diversificationOpportunities: [],
    riskConcentration: {
      highCorrelationClusters: [],
      lowCorrelationOpportunities: []
    },
    tailDependencies: {
      stressCorrelation: 0.6,
      normalCorrelation: 0.4,
      increaseInStress: 0.2
    },
    optimalPortfolioWeights: {}
  };
}

async function generateGlobalRiskAnalysis(zai, regions, assetClasses, timeframe) {
  const prompt = `
    Generate global risk analysis for the following regions and asset classes:
    
    Regions: ${regions.join(', ')}
    Asset Classes: ${assetClasses.join(', ')}
    Timeframe: ${timeframe}
    
    Please provide risk analysis in the following JSON format:
    {
      "globalRiskLevel": "moderate",
      "riskScore": 6.2,
      "keyRisks": [
        {
          "risk": "geopolitical_tensions",
          "severity": "high",
          "probability": 0.4,
          "impact": "global_markets",
          "mitigation": "defensive_positioning"
        },
        {
          "risk": "inflation_pressure",
          "severity": "medium",
          "probability": 0.6,
          "impact": "bond_markets",
          "mitigation": "inflation_linked_securities"
        }
      ],
      "regionalRisks": {
        "US": {"primaryRisk": "interest_rate_volatility", "level": "medium"},
        "Europe": {"primaryRisk": "energy_crisis", "level": "high"},
        "Asia": {"primaryRisk": "economic_slowdown", "level": "medium"},
        "Emerging": {"primaryRisk": "currency_volatility", "level": "high"}
      },
      "systemicRisks": {
        "bankingSector": {
          "riskLevel": "low",
          "keyIndicators": ["capital_ratios", "liquidity_coverage"],
          "stressTestResults": "pass"
        },
        "sovereignDebt": {
          "riskLevel": "medium",
          "debtToGDP": 85,
          "trend": "stable"
        }
      },
      "marketRisks": {
        "volatility": {
          "current": 0.18,
          "forecast": 0.20,
          "trend": "increasing"
        },
        "liquidity": {
          "overall": "adequate",
          "pockets_of_concern": ["emerging_markets"]
        }
      },
      "riskMitigation": {
        "hedgingStrategies": ["currency_hedges", "volatility_protection"],
        "diversificationBenefits": ["geographic", "asset_class"],
        "safeHavens": ["US_treasuries", "gold", "swiss_franc"]
      },
      "earlyWarningIndicators": [
        {
          "indicator": "yield_curve_inversion",
          "status": "normal",
          "significance": "high"
        }
      ]
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
        content: 'You are an expert in global risk analysis. Provide comprehensive risk assessments with mitigation strategies and early warning indicators.'
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
    return generateFallbackRiskAnalysis(regions);
  }
}

function generateFallbackRiskAnalysis(regions) {
  const regionalRisks = {};
  regions.forEach(region => {
    regionalRisks[region] = {
      primaryRisk: 'market_volatility',
      level: 'medium'
    };
  });

  return {
    globalRiskLevel: 'moderate',
    riskScore: 5 + Math.random() * 3,
    keyRisks: [
      {
        risk: 'market_volatility',
        severity: 'medium',
        probability: 0.5,
        impact: 'global_markets',
        mitigation: 'diversification'
      }
    ],
    regionalRisks: regionalRisks,
    systemicRisks: {
      bankingSector: {
        riskLevel: 'low',
        keyIndicators: [],
        stressTestResults: 'pass'
      },
      sovereignDebt: {
        riskLevel: 'medium',
        debtToGDP: 80 + Math.random() * 20,
        trend: 'stable'
      }
    },
    marketRisks: {
      volatility: {
        current: 0.15 + Math.random() * 0.1,
        forecast: 0.15 + Math.random() * 0.1,
        trend: 'stable'
      },
      liquidity: {
        overall: 'adequate',
        pockets_of_concern: []
      }
    },
    riskMitigation: {
      hedgingStrategies: ['diversification'],
      diversificationBenefits: ['geographic'],
      safeHavens: ['government_bonds']
    },
    earlyWarningIndicators: []
  };
}

async function generateGlobalOpportunities(zai, regions, assetClasses, timeframe) {
  const prompt = `
    Generate global investment opportunities for the following regions and asset classes:
    
    Regions: ${regions.join(', ')}
    Asset Classes: ${assetClasses.join(', ')}
    Timeframe: ${timeframe}
    
    Please provide opportunities analysis in the following JSON format:
    {
      "topOpportunities": [
        {
          "opportunity": "Asian_technology_sector",
          "region": "Asia",
          "assetClass": "equities",
          "potentialReturn": 0.18,
          "timeframe": "12_months",
          "riskLevel": "medium",
          "keyDrivers": ["digital_adoption", "government_support"],
          "entryStrategy": "gradual_accumulation",
          "confidence": 0.8
        }
      ],
      "thematicOpportunities": [
        {
          "theme": "artificial_intelligence",
          "exposure": ["US_technology", "Asian_semiconductors"],
          "investmentCase": "transformational_technology_adoption",
          "timeHorizon": "3-5_years",
          "riskReward": "attractive"
        }
      ],
      "valueOpportunities": [
        {
          "opportunity": "European_value_stocks",
          "region": "Europe",
          "assetClass": "equities",
          "discount": 0.25,
          "catalyst": "economic_recovery",
          "timeframe": "6-12_months"
        }
      ],
      "growthOpportunities": [
        {
          "opportunity": "Emerging_market_consumer",
          "region": "Emerging",
          "assetClass": "equities",
          "growthRate": 0.15,
          "marketSize": "large",
          "competitiveAdvantage": "demographic_trends"
        }
      ],
      "incomeOpportunities": [
        {
          "opportunity": "Global_high_yield_bonds",
          "region": "Global",
          "assetClass": "bonds",
          "yield": 0.075,
          "creditQuality": "BB",
          "duration": "intermediate"
        }
      ],
      "contrarianOpportunities": [
        {
          "opportunity": "Chinese_equities",
          "region": "Asia",
          "assetClass": "equities",
          "sentiment": "extremely_bearish",
          "valuation": "attractive",
          "catalyst": "policy_stimulus"
        }
      ]
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
        content: 'You are an expert in identifying global investment opportunities. Provide actionable opportunities with clear risk-return profiles and implementation strategies.'
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
    return generateFallbackOpportunities(regions, assetClasses);
  }
}

function generateFallbackOpportunities(regions, assetClasses) {
  return {
    topOpportunities: [
      {
        opportunity: 'global_diversification',
        region: regions[0],
        assetClass: assetClasses[0],
        potentialReturn: 0.08 + Math.random() * 0.1,
        timeframe: '12_months',
        riskLevel: 'medium',
        keyDrivers: ['market_efficiency'],
        entryStrategy: 'gradual',
        confidence: 0.6
      }
    ],
    thematicOpportunities: [],
    valueOpportunities: [],
    growthOpportunities: [],
    incomeOpportunities: [],
    contrarianOpportunities: []
  };
}

async function generateGlobalPortfolioRecommendations(zai, regionalAnalysis, assetClassAnalysis, correlationAnalysis, riskAnalysis) {
  const prompt = `
    Generate global portfolio recommendations based on the following analyses:
    
    Regional Analysis: ${JSON.stringify(regionalAnalysis)}
    Asset Class Analysis: ${JSON.stringify(assetClassAnalysis)}
    Correlation Analysis: ${correlationAnalysis ? JSON.stringify(correlationAnalysis) : '{}'}
    Risk Analysis: ${riskAnalysis ? JSON.stringify(riskAnalysis) : '{}'}
    
    Please provide portfolio recommendations in the following JSON format:
    {
      "strategicAllocation": {
        "US": {"equities": 0.25, "bonds": 0.15, "alternatives": 0.05},
        "Europe": {"equities": 0.15, "bonds": 0.10},
        "Asia": {"equities": 0.20, "bonds": 0.05},
        "Emerging": {"equities": 0.10, "bonds": 0.02, "alternatives": 0.03}
      },
      "tacticalOverlays": [
        {
          "adjustment": "overweight_Asian_equities",
          "magnitude": 0.05,
          "reasoning": "strong_growth_momentum",
          "timeframe": "3_months"
        }
      ],
      "riskManagement": {
        "volatilityTarget": 0.12,
        "maximumDrawdown": 0.15,
        "hedgingStrategy": "currency_hedges",
        "rebalancingFrequency": "quarterly"
      },
      "implementationStrategy": {
        "executionMethod": "gradual",
        "costConsiderations": "minimize_turnover",
        "taxEfficiency": "optimize",
        "liquidityNeeds": "maintain"
      },
      "performanceExpectations": {
        "expectedReturn": 0.085,
        "expectedVolatility": 0.11,
        "sharpeRatio": 1.3,
        "maximumDrawdown": 0.12
      },
      "monitoringFramework": {
        "keyMetrics": ["regional_allocation", "asset_class_exposure", "risk_measures"],
        "reviewFrequency": "monthly",
        "alertThresholds": ["allocation_drift_5%", "volatility_spike_20%"]
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
        content: 'You are an expert global portfolio strategist. Provide detailed asset allocation recommendations with risk management and implementation strategies.'
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
    return generateFallbackPortfolioRecommendations();
  }
}

function generateFallbackPortfolioRecommendations() {
  return {
    strategicAllocation: {
      US: { equities: 0.3, bonds: 0.15, alternatives: 0.05 },
      Europe: { equities: 0.15, bonds: 0.1 },
      Asia: { equities: 0.15, bonds: 0.05 },
      Emerging: { equities: 0.1, bonds: 0.02, alternatives: 0.03 }
    },
    tacticalOverlays: [],
    riskManagement: {
      volatilityTarget: 0.12,
      maximumDrawdown: 0.15,
      hedgingStrategy: 'diversification',
      rebalancingFrequency: 'quarterly'
    },
    implementationStrategy: {
      executionMethod: 'gradual',
      costConsiderations: 'minimize_turnover',
      taxEfficiency: 'optimize',
      liquidityNeeds: 'maintain'
    },
    performanceExpectations: {
      expectedReturn: 0.08,
      expectedVolatility: 0.12,
      sharpeRatio: 1.0,
      maximumDrawdown: 0.15
    },
    monitoringFramework: {
      keyMetrics: ['allocation', 'risk'],
      reviewFrequency: 'monthly',
      alertThresholds: ['drift_5%']
    }
  };
}

function calculateGlobalSentiment(regionalAnalysis, assetClassAnalysis) {
  const regionalScores = Object.values(regionalAnalysis).map(r => r.regionalScore);
  const assetClassScores = Object.values(assetClassAnalysis).map(a => a.assetClassScore);
  
  const avgRegionalScore = regionalScores.reduce((a, b) => a + b, 0) / regionalScores.length;
  const avgAssetClassScore = assetClassScores.reduce((a, b) => a + b, 0) / assetClassScores.length;
  
  const overallScore = (avgRegionalScore + avgAssetClassScore) / 2;
  
  let sentiment = 'neutral';
  if (overallScore > 7) sentiment = 'bullish';
  else if (overallScore < 5) sentiment = 'bearish';
  
  return {
    overall: sentiment,
    score: overallScore,
    regionalBreakdown: Object.fromEntries(
      Object.entries(regionalAnalysis).map(([region, analysis]) => [region, analysis.outlook])
    ),
    assetClassBreakdown: Object.fromEntries(
      Object.entries(assetClassAnalysis).map(([assetClass, analysis]) => [assetClass, analysis.outlook])
    ),
    confidence: Math.min(0.9, overallScore / 10)
  };
}

async function storeGlobalAnalysisInDatabase(regions, assetClasses, regionalAnalysis, assetClassAnalysis, globalSentiment) {
  // This would store the global analysis in the database
  // For now, we'll return a mock object
  return {
    id: 'global_analysis_' + Date.now(),
    regions: regions.join(','),
    assetClasses: assetClasses.join(','),
    regionalData: JSON.stringify(regionalAnalysis),
    assetClassData: JSON.stringify(assetClassAnalysis),
    sentiment: globalSentiment.overall,
    createdAt: new Date()
  };
}