#!/usr/bin/env node

import { apiDocumentationService } from '../src/lib/services/apiDocumentationService';

async function generateDocumentation() {
  try {
    console.log('Generating API documentation...');
    
    // Add predefined endpoints
    apiDocumentationService.addPredefinedEndpoints();
    
    // Generate and save documentation
    await apiDocumentationService.saveDocumentation();
    
    console.log('✅ API documentation generated successfully!');
    console.log('📄 Documentation saved to: openapi.json');
    console.log('🌐 Access interactive docs at: http://localhost:3000/docs');
    
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error);
    process.exit(1);
  }
}

// Run the script
generateDocumentation();