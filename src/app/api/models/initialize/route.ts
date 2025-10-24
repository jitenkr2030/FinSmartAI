import { NextRequest, NextResponse } from 'next/server';
import { ModelRegistryService } from '@/lib/services/modelRegistry';

// POST /api/models/initialize - Initialize default AI models
export async function POST(request: NextRequest) {
  try {
    // Initialize all default models
    await ModelRegistryService.initializeDefaultModels();
    
    // Get all active models to confirm initialization
    const activeModels = await ModelRegistryService.getActiveModels();
    
    return NextResponse.json({
      success: true,
      message: 'Default AI models initialized successfully',
      data: {
        totalModels: activeModels.length,
        models: activeModels.map(model => ({
          id: model.id,
          name: model.name,
          description: model.description,
          version: model.version,
          modelType: model.modelType,
          isActive: model.isActive,
          createdAt: model.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error initializing models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize models' },
      { status: 500 }
    );
  }
}