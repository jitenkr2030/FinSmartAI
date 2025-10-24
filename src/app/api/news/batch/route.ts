import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/news/batch - Batch process multiple news articles with advanced analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      articles,
      analysisType = 'comprehensive', // basic, comprehensive, deep
      timeframe = 'current',
      includeMarketImpact = true,
      includeTrendAnalysis = true,
      generateReport = false
    } = body;

    // Validate required fields
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Articles array is required' },
        { status: 400 }
      );
    }

    if (articles.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 articles per batch' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Process articles in batches to avoid overwhelming the AI
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchResults = await processBatch(batch, zai, analysisType, includeMarketImpact, includeTrendAnalysis);
      results.push(...batchResults);
    }

    // Perform aggregate analysis
    const aggregateAnalysis = await performAggregateAnalysis(results, analysisType, timeframe);

    // Generate report if requested
    let report = null;
    if (generateReport) {
      report = await generateAnalysisReport(results, aggregateAnalysis, timeframe);
    }

    // Store processed articles in database
    const storedArticles = await storeArticlesInDatabase(results);

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system',
        modelName: 'Kronos-NewsInsight',
        endpoint: '/api/news/batch',
        requestData: JSON.stringify({ 
          articleCount: articles.length, 
          analysisType, 
          timeframe,
          includeMarketImpact,
          includeTrendAnalysis 
        }),
        responseData: JSON.stringify({ 
          processedCount: results.length,
          analysisDepth: analysisType 
        }),
        processingTimeMs: 0,
        cost: calculateProcessingCost(articles.length, analysisType)
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        processedArticles: results,
        aggregateAnalysis,
        storedArticles: storedArticles.map(article => ({ id: article.id, title: article.title })),
        report,
        metadata: {
          totalArticles: articles.length,
          processedCount: results.length,
          failedCount: articles.length - results.length,
          analysisType,
          timeframe,
          processingTime: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in news batch processing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process news batch' },
      { status: 500 }
    );
  }
}

async function processBatch(articles, zai, analysisType, includeMarketImpact, includeTrendAnalysis) {
  const batchResults = await Promise.all(
    articles.map(async (article) => {
      try {
        const { title, content, url, source, publishedAt, category } = article;

        if (!content) {
          return {
            originalArticle: article,
            error: 'Content is required'
          };
        }

        // Create analysis prompt based on analysis type
        const prompt = createAnalysisPrompt(title, content, source, analysisType, includeMarketImpact, includeTrendAnalysis);

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert financial news analyst. Provide ${analysisType} analysis of financial news articles.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: analysisType === 'deep' ? 1000 : analysisType === 'comprehensive' ? 600 : 300
        });

        const responseText = completion.choices[0]?.message?.content || '';
        let analysisData;

        try {
          analysisData = JSON.parse(responseText);
        } catch (parseError) {
          analysisData = {
            summary: responseText,
            sentiment: { label: 'neutral', confidence: 0.5, explanation: 'Unable to parse sentiment' },
            topics: [],
            entities: [],
            marketImpact: includeMarketImpact ? { level: 'low', explanation: 'Analysis incomplete' } : null,
            trendAnalysis: includeTrendAnalysis ? { trend: 'stable', confidence: 0.5 } : null
          };
        }

        return {
          originalArticle: article,
          analysis: analysisData,
          processedAt: new Date().toISOString(),
          analysisDepth: analysisType
        };

      } catch (error) {
        console.error('Error processing article:', error);
        return {
          originalArticle: article,
          error: 'Failed to process article'
        };
      }
    })
  );

  return batchResults.filter(result => !result.error);
}

function createAnalysisPrompt(title, content, source, analysisType, includeMarketImpact, includeTrendAnalysis) {
  let prompt = `
    Analyze the following financial news article:
    
    Title: ${title}
    Source: ${source}
    Content: ${content}
    
    Please provide analysis in the following JSON format:
    {
      "summary": "concise summary",
      "sentiment": {
        "label": "positive|negative|neutral",
        "confidence": 0.95,
        "explanation": "explanation"
      },
      "topics": ["topic1", "topic2"],
      "entities": [
        {
          "type": "company|person|sector",
          "name": "entity name",
          "relevance": 0.8
        }
      ],
      "keyInsights": ["insight1", "insight2"],
      "importanceScore": 0.8
  `;

  if (includeMarketImpact) {
    prompt += `,
      "marketImpact": {
        "level": "high|medium|low",
        "affectedMarkets": ["market1", "market2"],
        "explanation": "impact explanation",
        "timeframe": "immediate|short-term|long-term"
      }
    `;
  }

  if (includeTrendAnalysis) {
    prompt += `,
      "trendAnalysis": {
        "trend": "bullish|bearish|neutral|volatile",
        "confidence": 0.8,
        "indicators": ["indicator1", "indicator2"],
        "expectedDuration": "short|medium|long"
      }
    `;
  }

  if (analysisType === 'comprehensive' || analysisType === 'deep') {
    prompt += `,
      "riskFactors": ["risk1", "risk2"],
      "opportunities": ["opportunity1", "opportunity2"],
      "recommendations": ["recommendation1", "recommendation2"]
    `;
  }

  if (analysisType === 'deep') {
    prompt += `,
      "technicalIndicators": {
        "signal": "buy|sell|hold",
        "strength": 0.8,
        "indicators": ["RSI", "MACD", "Moving Average"]
      },
      "correlationAnalysis": {
        "correlatedAssets": ["asset1", "asset2"],
        "correlationStrength": 0.7
      }
    `;
  }

  prompt += `
    }
  `;

  return prompt;
}

async function performAggregateAnalysis(results, analysisType, timeframe) {
  const allSentiments = results.map(r => r.analysis.sentiment);
  const allTopics = results.flatMap(r => r.analysis.topics);
  const allEntities = results.flatMap(r => r.analysis.entities);
  const marketImpacts = results.filter(r => r.analysis.marketImpact).map(r => r.analysis.marketImpact);
  const trendAnalyses = results.filter(r => r.analysis.trendAnalysis).map(r => r.analysis.trendAnalysis);

  // Calculate aggregate sentiment
  const sentimentDistribution = allSentiments.reduce((acc, s) => {
    acc[s.label] = (acc[s.label] || 0) + 1;
    return acc;
  }, {});

  const dominantSentiment = Object.entries(sentimentDistribution).reduce((a, b) => 
    sentimentDistribution[a[0]] > sentimentDistribution[b[0]] ? a : b
  )[0];

  // Get top topics
  const topicFrequency = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});

  const topTopics = Object.entries(topicFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  // Get top entities
  const entityFrequency = allEntities.reduce((acc, entity) => {
    acc[entity.name] = (acc[entity.name] || 0) + entity.relevance;
    return acc;
  }, {});

  const topEntities = Object.entries(entityFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, relevance]) => ({ name, relevance }));

  // Aggregate market impact
  const marketImpactDistribution = marketImpacts.reduce((acc, impact) => {
    acc[impact.level] = (acc[impact.level] || 0) + 1;
    return acc;
  }, {});

  // Aggregate trend analysis
  const trendDistribution = trendAnalyses.reduce((acc, trend) => {
    acc[trend.trend] = (acc[trend.trend] || 0) + 1;
    return acc;
  }, {});

  return {
    sentiment: {
      dominant: dominantSentiment,
      distribution: sentimentDistribution,
      averageConfidence: allSentiments.reduce((acc, s) => acc + s.confidence, 0) / allSentiments.length
    },
    topics: topTopics,
    entities: topEntities,
    marketImpact: {
      distribution: marketImpactDistribution,
      overallLevel: getOverallImpactLevel(marketImpactDistribution)
    },
    trends: {
      distribution: trendDistribution,
      dominantTrend: getDominantTrend(trendDistribution)
    },
    timeframe,
    analysisDepth: analysisType,
    articleCount: results.length
  };
}

function getOverallImpactLevel(distribution) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (distribution.high / total > 0.3) return 'high';
  if (distribution.medium / total > 0.4) return 'medium';
  return 'low';
}

function getDominantTrend(distribution) {
  return Object.entries(distribution).reduce((a, b) => 
    distribution[a[0]] > distribution[b[0]] ? a : b
  )[0];
}

async function generateAnalysisReport(results, aggregateAnalysis, timeframe) {
  const report = {
    title: `Financial News Analysis Report - ${timeframe}`,
    generatedAt: new Date().toISOString(),
    executiveSummary: generateExecutiveSummary(aggregateAnalysis),
    keyFindings: generateKeyFindings(aggregateAnalysis),
    marketOutlook: generateMarketOutlook(aggregateAnalysis),
    recommendations: generateRecommendations(aggregateAnalysis),
    dataVisualization: {
      sentimentChart: aggregateAnalysis.sentiment.distribution,
      topicCloud: aggregateAnalysis.topics,
      impactMatrix: aggregateAnalysis.marketImpact.distribution
    },
    appendix: {
      methodology: 'AI-powered natural language processing and sentiment analysis',
      dataSources: 'Financial news articles processed in real-time',
      limitations: 'Analysis based on available news data, subject to AI interpretation'
    }
  };

  return report;
}

function generateExecutiveSummary(analysis) {
  return `Analysis of ${analysis.articleCount} news articles reveals ${analysis.sentiment.dominant} market sentiment with ${analysis.marketImpact.overallLevel} overall market impact. Key themes include ${analysis.topics.slice(0, 3).map(t => t.topic).join(', ')}.`;
}

function generateKeyFindings(analysis) {
  return [
    `Market sentiment is predominantly ${analysis.sentiment.dominant} with ${Math.round(analysis.sentiment.averageConfidence * 100)}% confidence`,
    `Top mentioned entities: ${analysis.entities.slice(0, 5).map(e => e.name).join(', ')}`,
    `Market impact level: ${analysis.marketImpact.overallLevel}`,
    `Dominant trend: ${analysis.trends.dominantTrend}`
  ];
}

function generateMarketOutlook(analysis) {
  const outlook = analysis.trends.dominantTrend === 'bullish' ? 'positive' : 
                  analysis.trends.dominantTrend === 'bearish' ? 'negative' : 'neutral';
  
  return {
    shortTerm: outlook,
    mediumTerm: outlook,
    confidence: Math.round(analysis.sentiment.averageConfidence * 100),
    keyFactors: analysis.topics.slice(0, 3).map(t => t.topic)
  };
}

function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.sentiment.dominant === 'bullish') {
    recommendations.push('Consider increasing exposure to positively mentioned sectors');
  } else if (analysis.sentiment.dominant === 'bearish') {
    recommendations.push('Consider defensive positioning and risk management');
  }
  
  if (analysis.marketImpact.overallLevel === 'high') {
    recommendations.push('Monitor market closely for high-impact events');
  }
  
  recommendations.push('Stay updated on key entities: ' + analysis.entities.slice(0, 3).map(e => e.name).join(', '));
  
  return recommendations;
}

async function storeArticlesInDatabase(results) {
  const storedArticles = [];

  for (const result of results) {
    try {
      const article = result.originalArticle;
      const analysis = result.analysis;

      const newsArticle = await db.newsArticle.create({
        data: {
          title: article.title || 'Untitled',
          content: article.content,
          source: article.source || 'Unknown',
          url: article.url || null,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
          sentiment: analysis.sentiment.confidence,
          relevance: analysis.importanceScore || 0.8
        }
      });

      storedArticles.push(newsArticle);
    } catch (error) {
      console.error('Error storing article:', error);
    }
  }

  return storedArticles;
}

function calculateProcessingCost(articleCount, analysisType) {
  const baseCost = 0.01;
  const analysisMultiplier = {
    basic: 1,
    comprehensive: 1.5,
    deep: 2
  };
  
  return baseCost * articleCount * analysisMultiplier[analysisType];
}