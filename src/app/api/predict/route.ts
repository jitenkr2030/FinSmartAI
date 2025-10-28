import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/predict - Make prediction using specified model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelName, inputData, userId } = body;
    
    // Validate required fields
    if (!modelName || !inputData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: modelName, inputData' },
        { status: 400 }
      );
    }
    
    // Get model from database
    const model = await db.aIModel.findUnique({
      where: { name: modelName }
    });
    
    if (!model || !model.isActive) {
      return NextResponse.json(
        { success: false, error: 'Model not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check user access (simplified - in production, implement proper authentication)
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }
    
    const startTime = Date.now();
    
    // Initialize ZAI SDK
    const zai = await ZAI.create();
    
    // Make prediction using ZAI
    let predictionResult;
    try {
      // For now, we'll use a generic chat completion for demonstration
      // In production, you would use specific model endpoints
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are ${model.name}, an AI model for ${model.description}. Analyze the provided financial data and provide predictions.`
          },
          {
            role: 'user',
            content: `Please analyze this financial data and provide predictions: ${JSON.stringify(inputData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      predictionResult = {
        prediction: completion.choices[0]?.message?.content || 'No prediction available',
        confidence: Math.random() * 0.3 + 0.7, // Mock confidence score
        timestamp: new Date().toISOString()
      };
    } catch (aiError) {
      console.error('AI prediction error:', aiError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate prediction' },
        { status: 500 }
      );
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Save prediction to database
    const prediction = await db.prediction.create({
      data: {
        userId: userId || 'anonymous',
        modelId: model.id,
        modelName: model.name,
        modelVersion: model.version,
        inputData: JSON.stringify(inputData),
        outputData: JSON.stringify(predictionResult),
        confidenceScore: predictionResult.confidence,
        processingTimeMs
      }
    });
    
    // Track API usage
    if (userId) {
      await db.apiUsage.create({
        data: {
          userId,
          modelName: model.name,
          endpoint: '/api/predict',
          requestData: JSON.stringify(inputData),
          responseData: JSON.stringify(predictionResult),
          processingTimeMs,
          cost: 0.10 // Mock cost per prediction
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        prediction: predictionResult,
        predictionId: prediction.id,
        processingTimeMs,
        modelInfo: {
          name: model.name,
          version: model.version,
          type: model.modelType
        }
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to make prediction' },
      { status: 500 }
    );
  }
}