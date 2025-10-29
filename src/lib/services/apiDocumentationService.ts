import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters?: any[];
  requestBody?: any;
  responses: any;
  tags: string[];
  security?: any[];
}

interface ApiDocumentation {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: any;
    license?: any;
  };
  servers: any[];
  paths: Record<string, any>;
  components: {
    securitySchemes: any;
    schemas: any;
  };
  tags: any[];
}

export class ApiDocumentationService {
  private static instance: ApiDocumentationService;
  private documentation: ApiDocumentation;

  private constructor() {
    this.documentation = {
      openapi: '3.0.3',
      info: {
        title: 'FinSmartAI Financial AI Platform API',
        description: 'Comprehensive API documentation for FinSmartAI - an advanced financial AI platform providing market analysis, predictions, risk assessment, and trading insights.',
        version: '1.0.0',
        contact: {
          name: 'FinSmartAI API Team',
          email: 'api@finsmartai.com',
          url: 'https://finsmartai.com/docs'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://api.finsmartai.com/v1',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.finsmartai.com/v1',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from authentication endpoint'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for programmatic access'
          }
        },
        schemas: {
          ApiResponse: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Whether the request was successful'
              },
              message: {
                type: 'string',
                description: 'Response message'
              },
              data: {
                type: 'object',
                description: 'Response data payload'
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Response timestamp'
              }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false
              },
              error: {
                type: 'string',
                description: 'Error message'
              },
              code: {
                type: 'string',
                description: 'Error code'
              },
              details: {
                type: 'object',
                description: 'Additional error details'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      },
      tags: [
        {
          name: 'System',
          description: 'System endpoints'
        },
        {
          name: 'Predictions',
          description: 'AI prediction endpoints'
        },
        {
          name: 'Sentiment',
          description: 'Sentiment analysis endpoints'
        },
        {
          name: 'Risk',
          description: 'Risk analysis endpoints'
        },
        {
          name: 'Options',
          description: 'Options analysis endpoints'
        },
        {
          name: 'Fund Flow',
          description: 'Fund flow analysis endpoints'
        },
        {
          name: 'Portfolio',
          description: 'Portfolio management endpoints'
        },
        {
          name: 'News',
          description: 'News and information endpoints'
        },
        {
          name: 'Payment',
          description: 'Payment processing endpoints'
        },
        {
          name: 'Models',
          description: 'AI model management endpoints'
        }
      ]
    };
  }

  public static getInstance(): ApiDocumentationService {
    if (!ApiDocumentationService.instance) {
      ApiDocumentationService.instance = new ApiDocumentationService();
    }
    return ApiDocumentationService.instance;
  }

  public async generateDocumentation(): Promise<ApiDocumentation> {
    // Scan API routes and generate documentation
    const apiRoutes = await this.scanApiRoutes();
    
    for (const route of apiRoutes) {
      this.addEndpointToDocumentation(route);
    }

    return this.documentation;
  }

  private async scanApiRoutes(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
    
    // Find all route.ts files
    const routeFiles = await glob('**/route.ts', { cwd: apiDir });
    
    for (const routeFile of routeFiles) {
      const routePath = this.convertFilePathToRoutePath(routeFile);
      const fullPath = path.join(apiDir, routeFile);
      
      try {
        const endpoint = await this.analyzeRouteFile(fullPath, routePath);
        if (endpoint) {
          endpoints.push(endpoint);
        }
      } catch (error) {
        console.warn(`Failed to analyze route file ${routeFile}:`, error);
      }
    }

    return endpoints;
  }

  private convertFilePathToRoutePath(filePath: string): string {
    // Convert file path to API route path
    const pathWithoutExtension = filePath.replace(/\/route\.ts$/, '');
    const routePath = pathWithoutExtension
      .replace(/\[([^\]]+)\]/g, ':$1') // Convert [param] to :param
      .replace(/\/+/g, '/'); // Remove double slashes
    
    return routePath.startsWith('/') ? routePath : `/${routePath}`;
  }

  private async analyzeRouteFile(filePath: string, routePath: string): Promise<ApiEndpoint | null> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Extract JSDoc comments and function signatures
      const endpoint = this.extractEndpointInfo(fileContent, routePath);
      return endpoint;
    } catch (error) {
      console.warn(`Failed to read route file ${filePath}:`, error);
      return null;
    }
  }

  private extractEndpointInfo(fileContent: string, routePath: string): ApiEndpoint | null {
    // Simple extraction based on common patterns
    // In a real implementation, you'd use AST parsing
    
    const lines = fileContent.split('\n');
    let currentEndpoint: ApiEndpoint | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for export functions (GET, POST, etc.)
      const methodMatch = line.match(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/);
      if (methodMatch) {
        const method = methodMatch[1].toLowerCase();
        
        // Extract JSDoc comments above the function
        const jsdoc = this.extractJSDoc(lines, i - 1);
        
        currentEndpoint = {
          path: routePath,
          method,
          summary: this.extractJSDocTag(jsdoc, 'summary') || `${method.toUpperCase()} ${routePath}`,
          description: this.extractJSDocTag(jsdoc, 'description') || `${method.toUpperCase()} endpoint for ${routePath}`,
          parameters: this.extractParameters(jsdoc),
          requestBody: this.extractRequestBody(jsdoc),
          responses: this.extractResponses(jsdoc),
          tags: this.extractTags(jsdoc, routePath),
          security: this.extractSecurity(jsdoc)
        };
        
        break;
      }
    }
    
    return currentEndpoint;
  }

  private extractJSDoc(lines: string[], startIndex: number): string {
    const jsdocLines: string[] = [];
    let i = startIndex;
    
    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('/**')) {
        jsdocLines.unshift(line);
        break;
      } else if (line.startsWith('*') || line.startsWith('*/')) {
        jsdocLines.unshift(line);
      } else {
        break;
      }
      i--;
    }
    
    return jsdocLines.join('\n');
  }

  private extractJSDocTag(jsdoc: string, tagName: string): string | undefined {
    const tagMatch = jsdoc.match(new RegExp(`@${tagName}\\s+(.+)`, 'm'));
    return tagMatch ? tagMatch[1].trim() : undefined;
  }

  private extractParameters(jsdoc: string): any[] | undefined {
    const paramMatches = jsdoc.match(/@param\s+{([^}]+)}\s+(\w+)\s+-\s+(.+)/g);
    if (!paramMatches) return undefined;
    
    return paramMatches.map(match => {
      const [, type, name, description] = match.match(/@param\s+{([^}]+)}\s+(\w+)\s+-\s+(.+)/) || [];
      return {
        name,
        in: 'query', // Default to query parameter
        schema: { type: this.mapTypeToSchema(type) },
        description,
        required: !description.toLowerCase().includes('optional')
      };
    });
  }

  private extractRequestBody(jsdoc: string): any {
    const bodyMatch = jsdoc.match(/@body\s+{([^}]+)}\s+(.+)/);
    if (!bodyMatch) return undefined;
    
    const [, type, description] = bodyMatch;
    return {
      description,
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: this.extractBodyProperties(jsdoc)
          }
        }
      }
    };
  }

  private extractBodyProperties(jsdoc: string): any {
    const propMatches = jsdoc.match(/@property\s+{([^}]+)}\s+(\w+)\s+-\s+(.+)/g);
    if (!propMatches) return {};
    
    const properties: any = {};
    propMatches.forEach(match => {
      const [, type, name, description] = match.match(/@property\s+{([^}]+)}\s+(\w+)\s+-\s+(.+)/) || [];
      properties[name] = {
        type: this.mapTypeToSchema(type),
        description
      };
    });
    
    return properties;
  }

  private extractResponses(jsdoc: string): any {
    const responses: any = {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { '$ref': '#/components/schemas/ApiResponse' },
                {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      description: 'Response data'
                    }
                  }
                }
              ]
            }
          }
        }
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ErrorResponse' }
          }
        }
      }
    };
    
    return responses;
  }

  private extractTags(jsdoc: string, routePath: string): string[] {
    // Extract tags from JSDoc or infer from route path
    const tagMatch = jsdoc.match(/@tags?\s+(.+)/);
    if (tagMatch) {
      return tagMatch[1].split(',').map(tag => tag.trim());
    }
    
    // Infer tags from route path
    const pathParts = routePath.split('/').filter(part => part && !part.startsWith(':'));
    if (pathParts.length > 0) {
      const mainTag = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
      return [mainTag];
    }
    
    return ['Default'];
  }

  private extractSecurity(jsdoc: string): any[] | undefined {
    const securityMatch = jsdoc.match(/@security\s+(.+)/);
    if (securityMatch) {
      const securityType = securityMatch[1].trim();
      return [{ [securityType]: [] }];
    }
    
    // Default security for most endpoints
    return [{ BearerAuth: [] }];
  }

  private mapTypeToSchema(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'integer': 'integer',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object',
      'Date': 'string',
      'DateTime': 'string',
      'ObjectId': 'string'
    };
    
    return typeMap[type] || 'string';
  }

  private addEndpointToDocumentation(endpoint: ApiEndpoint): void {
    const path = endpoint.path;
    
    if (!this.documentation.paths[path]) {
      this.documentation.paths[path] = {};
    }
    
    this.documentation.paths[path][endpoint.method] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      security: endpoint.security,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses
    };
  }

  public async saveDocumentation(outputPath: string = './openapi.json'): Promise<void> {
    const documentation = await this.generateDocumentation();
    const jsonContent = JSON.stringify(documentation, null, 2);
    
    // Use absolute path
    const absolutePath = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(absolutePath, jsonContent, 'utf-8');
    console.log(`API documentation saved to ${absolutePath}`);
  }

  public getDocumentation(): ApiDocumentation {
    return this.documentation;
  }

  // Predefined endpoint templates for common FinSmartAI endpoints
  public addPredefinedEndpoints(): void {
    // Health check endpoint
    this.documentation.paths['/health'] = {
      get: {
        summary: 'Health Check',
        description: 'Check the health status of the API and its services',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'degraded', 'unhealthy']
                    },
                    checks: {
                      type: 'object',
                      description: 'Health check results'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    },
                    uptime: {
                      type: 'number',
                      description: 'System uptime in seconds'
                    }
                  }
                }
              }
            }
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    };

    // Prediction endpoint
    this.documentation.paths['/predict'] = {
      post: {
        summary: 'Get AI Prediction',
        description: 'Get AI-powered prediction for a stock symbol',
        tags: ['Predictions'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol'],
                properties: {
                  symbol: {
                    type: 'string',
                    description: 'Stock symbol',
                    example: 'RELIANCE.NS'
                  },
                  model: {
                    type: 'string',
                    description: 'AI model to use',
                    enum: ['SentimentAI', 'OptionsAI', 'RiskAI', 'FundFlowAI'],
                    default: 'SentimentAI'
                  },
                  timeframe: {
                    type: 'string',
                    description: 'Prediction timeframe',
                    example: '1W',
                    default: '1W'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Prediction result',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { '$ref': '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            symbol: { type: 'string' },
                            model: { type: 'string' },
                            prediction: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
                            confidence: { type: 'number', format: 'decimal' },
                            targetPrice: { type: 'number', format: 'decimal' },
                            timeframe: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    };
  }
}

// Export singleton instance
export const apiDocumentationService = ApiDocumentationService.getInstance();