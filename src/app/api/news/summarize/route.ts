import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

import AI from 'z-ai-web-dev-sdk';




// POST /api/news/summarize - Summarize news articles using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Initialize AI SDK    const ai = await AI.create();\
    const {
      articles,
      language = 'english',
      maxLength = 200,
      style = 'professional',
      includeKeyPoints = true,
      includeSentiment = true
    } = body;

    // Validate required fields
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Articles array is required' },
        { status: 400 }
      );
    }


    // Initialize AI SDK

    // Initialize AI SDK


    // Process each article
    const summaries = await Promise.all(
      articles.map(async (article) => {
        const { title, content, url, source, publishedAt } = article;

        if (!content) {
          return {
            originalArticle: article,
            error: 'Content is required for summarization'
          };
        }

        try {
          // Create summarization prompt
          const prompt = `
            Summarize the following news article in ${maxLength} words or less.
            Style: ${style}
            Language: ${language}
            
            Title: ${title}
            Source: ${source}
            Content: ${content}
            
            ${includeKeyPoints ? 'Also extract 3-5 key points from the article.' : ''}
            ${includeSentiment ? 'Also analyze the sentiment (positive, negative, neutral) and provide a confidence score.' : ''}
            
            Please provide the summary in the following JSON format:
            {
              "summary": "concise summary here",
              "keyPoints": ["point1", "point2", "point3"],
              "sentiment": {
                "label": "positive|negative|neutral",
                "confidence": 0.95,
                "explanation": "brief explanation"
              },
              "topics": ["topic1", "topic2"],
              "wordCount": 150
            }
          `;


          const completion = await ai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are an expert financial news summarizer. Provide concise, accurate summaries with key insights and sentiment analysis.'
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
          let summaryData;

          try {
            summaryData = JSON.parse(responseText);
          } catch (parseError) {
            // Fallback if JSON parsing fails
            summaryData = {
              summary: responseText,
              keyPoints: [],
              sentiment: { label: 'neutral', confidence: 0.5, explanation: 'Unable to parse sentiment' },
              topics: [],
              wordCount: responseText.split(' ').length
            };
          }

          // Store in database
          const newsArticle = await db.newsArticle.create({
            data: {
              title: title || 'Untitled',
              content: content,
              source: source || 'Unknown',
              url: url || null,
              publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
              sentiment: summaryData.sentiment?.confidence || 0,
              relevance: 0.9 // Default relevance
            }
          });

          return {
            originalArticle: article,
            summary: summaryData.summary,
            keyPoints: summaryData.keyPoints || [],
            sentiment: summaryData.sentiment,
            topics: summaryData.topics || [],
            wordCount: summaryData.wordCount || 0,
            articleId: newsArticle.id,
            processedAt: new Date().toISOString()
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

    // Calculate overall statistics
    const successfulSummaries = summaries.filter(s => !s.error);
    const overallSentiment = calculateOverallSentiment(successfulSummaries);
    const topTopics = getTopTopics(successfulSummaries);

    // Log API usage
    await db.apiUsage.create({
      data: {
        userId: 'system', // Would be actual user ID in production
        modelName: 'Kronos-NewsInsight',
        endpoint: '/api/news/summarize',
        requestData: JSON.stringify({ articleCount: articles.length, language, maxLength }),
        responseData: JSON.stringify({ summaryCount: successfulSummaries.length }),
        processingTimeMs: 0, // Would calculate actual time
        cost: 0.01 // Estimated cost
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summaries,
        statistics: {
          totalArticles: articles.length,
          successfulSummaries: successfulSummaries.length,
          failedSummaries: summaries.length - successfulSummaries.length,
          overallSentiment,
          topTopics,
          averageWordCount: successfulSummaries.reduce((acc, s) => acc + (s.wordCount || 0), 0) / successfulSummaries.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in news summarization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to summarize news articles' },
      { status: 500 }
    );
  }
}

function calculateOverallSentiment(summaries) {
  if (summaries.length === 0) return { label: 'neutral', confidence: 0 };

  const sentiments = summaries.map(s => s.sentiment);
  const avgConfidence = sentiments.reduce((acc, s) => acc + (s.confidence || 0), 0) / sentiments.length;
  
  const sentimentCounts = sentiments.reduce((acc, s) => {
    acc[s.label] = (acc[s.label] || 0) + 1;
    return acc;
  }, {});

  const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) => 
    sentimentCounts[a[0]] > sentimentCounts[b[0]] ? a : b
  )[0];

  return {
    label: dominantSentiment,
    confidence: avgConfidence,
    distribution: sentimentCounts
  };
}

function getTopTopics(summaries) {
  const topicCounts = {};
  
  summaries.forEach(summary => {
    summary.topics?.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  return Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
}