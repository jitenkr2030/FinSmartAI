import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { withValidation, schemas } from '@/lib/middleware/validationMiddleware';

// POST /api/sentiment/analyze - Analyze sentiment of text content
export const POST = withValidation(
  async (request: NextRequest, context: any) => {
    try {
      const { content, type = 'news', source, userId } = context.validatedData.body;
      
      const startTime = Date.now();
      
      // Initialize ZAI SDK
      const zai = await ZAI.create();
      
      // Perform sentiment analysis using ZAI
      let sentimentResult;
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are Kronos-SentimentAI, an advanced financial sentiment analysis AI. Analyze the provided text content and determine the sentiment towards financial markets, companies, or economic conditions. Provide a detailed sentiment analysis with the following:
            
1. Overall sentiment score (-1 to 1, where -1 is extremely negative, 0 is neutral, and 1 is extremely positive)
2. Confidence level (0 to 1)
3. Key sentiment drivers (phrases or concepts that influenced the sentiment)
4. Market impact assessment (bullish, bearish, or neutral)
5. Relevance score (0 to 1, how relevant this content is to financial markets)
6. Key entities mentioned (companies, stocks, sectors, etc.)

Respond in JSON format with these fields.`
            },
            {
              role: 'user',
              content: `Please analyze the sentiment of this ${type} content: "${content}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        });
        
        const aiResponse = completion.choices[0]?.message?.content || '';
        
        // Parse the AI response to extract structured data
        sentimentResult = parseSentimentResponse(aiResponse);
        
        // Ensure we have valid sentiment scores
        if (sentimentResult.sentiment_score === undefined) {
          sentimentResult.sentiment_score = 0;
        }
        if (sentimentResult.confidence === undefined) {
          sentimentResult.confidence = 0.5;
        }
        if (sentimentResult.relevance === undefined) {
          sentimentResult.relevance = 0.5;
        }
        
      } catch (aiError) {
        console.error('Sentiment analysis error:', aiError);
        return NextResponse.json(
          { success: false, error: 'Failed to perform sentiment analysis' },
          { status: 500 }
        );
      }
      
      const processingTimeMs = Date.now() - startTime;
      
      // Save sentiment analysis to database
      let savedRecord;
      if (type === 'news') {
        savedRecord = await db.newsArticle.create({
          data: {
            title: content.substring(0, 100) + '...',
            content: content,
            source: source || 'Unknown',
            sentiment: sentimentResult.sentiment_score,
            relevance: sentimentResult.relevance,
            publishedAt: new Date()
          }
        });
      } else if (type === 'social') {
        savedRecord = await db.socialMediaPost.create({
          data: {
            platform: source || 'Unknown',
            content: content,
            sentiment: sentimentResult.sentiment_score,
            relevance: sentimentResult.relevance,
            postedAt: new Date()
          }
        });
      }
      
      // Track API usage
      if (userId) {
        await db.apiUsage.create({
          data: {
            userId,
            modelName: 'Kronos-SentimentAI',
            endpoint: '/api/sentiment/analyze',
            requestData: JSON.stringify({ content, type, source }),
            responseData: JSON.stringify(sentimentResult),
            processingTimeMs,
            cost: 0.05 // Lower cost for sentiment analysis
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          sentimentResult,
          recordId: savedRecord?.id,
          processingTimeMs,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to analyze sentiment' },
        { status: 500 }
      );
    }
  },
  {
    bodySchema: schemas.news.analyzeSentiment
  }
);

// Helper function to parse AI sentiment response
function parseSentimentResponse(aiResponse: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment_score: parseFloat(parsed.sentiment_score || parsed.score || 0),
        confidence: parseFloat(parsed.confidence || 0.5),
        market_impact: parsed.market_impact || 'neutral',
        key_drivers: parsed.key_drivers || parsed.key_sentiment_drivers || [],
        relevance: parseFloat(parsed.relevance || 0.5),
        entities: parsed.entities || parsed.key_entities || [],
        raw_analysis: aiResponse
      };
    }
    
    // Fallback: simple sentiment analysis based on keywords
    const positiveWords = ['bullish', 'positive', 'growth', 'profit', 'gain', 'rise', 'increase', 'strong', 'excellent'];
    const negativeWords = ['bearish', 'negative', 'loss', 'decline', 'fall', 'decrease', 'weak', 'poor', 'risk'];
    
    const lowerText = aiResponse.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    const sentimentScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
    
    return {
      sentiment_score: Math.max(-1, Math.min(1, sentimentScore)),
      confidence: 0.7,
      market_impact: sentimentScore > 0.1 ? 'bullish' : sentimentScore < -0.1 ? 'bearish' : 'neutral',
      key_drivers: positiveCount > negativeCount ? positiveWords.slice(0, 3) : negativeWords.slice(0, 3),
      relevance: 0.6,
      entities: [],
      raw_analysis: aiResponse
    };
  } catch (error) {
    console.error('Error parsing sentiment response:', error);
    return {
      sentiment_score: 0,
      confidence: 0.5,
      market_impact: 'neutral',
      key_drivers: [],
      relevance: 0.5,
      entities: [],
      raw_analysis: aiResponse
    };
  }
}