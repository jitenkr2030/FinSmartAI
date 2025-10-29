import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

import AI from 'z-ai-web-dev-sdk';

// GET /api/models - List all AI models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, inactive, all
    
    const where = status && status !== 'all' ? { isActive: status === 'active' } : {};
    
    const models = await db.aIModel.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// POST /api/models - Create new AI model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      version,
      modelType,
      architecture,
      trainingDataInfo,
      performanceMetrics
    } = body;
    
    // Validate required fields
    if (!name || !version || !modelType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if model with same name already exists
    const existingModel = await db.aIModel.findUnique({
      where: { name }
    });
    
    if (existingModel) {
      return NextResponse.json(
        { success: false, error: 'Model with this name already exists' },
        { status: 400 }
      );
    }
    
    const model = await db.aIModel.create({
      data: {
        name,
        description: description || null,
        version,
        modelType,
        architecture: JSON.stringify(architecture || {}),
        trainingDataInfo: JSON.stringify(trainingDataInfo || {}),
        performanceMetrics: JSON.stringify(performanceMetrics || {})
      }
    });
    
    return NextResponse.json({
      success: true,
      data: model
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create model' },
      { status: 500 }
    );
  }
}