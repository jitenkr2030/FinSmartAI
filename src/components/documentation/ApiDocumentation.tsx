'use client';

import React, { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Code, 
  Server, 
  Shield, 
  Zap, 
  Users, 
  Database,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';

interface ApiDocumentationProps {
  className?: string;
}

export function ApiDocumentation({ className }: ApiDocumentationProps) {
  const [selectedServer, setSelectedServer] = useState('development');
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const servers = [
    { 
      id: 'production', 
      url: 'https://api.finsmartai.com/v1', 
      description: 'Production Server',
      color: 'bg-red-500'
    },
    { 
      id: 'staging', 
      url: 'https://staging-api.finsmartai.com/v1', 
      description: 'Staging Server',
      color: 'bg-yellow-500'
    },
    { 
      id: 'development', 
      url: 'http://localhost:3000/api', 
      description: 'Development Server',
      color: 'bg-green-500'
    }
  ];

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setIsAuthenticated(true);
      localStorage.setItem('finsmartai_api_key', apiKey);
    }
  };

  const handleDownloadSpec = () => {
    const link = document.createElement('a');
    link.href = '/openapi.json';
    link.download = 'finsmartai-api-spec.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem('finsmartai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsAuthenticated(true);
    }
  }, []);

  const swaggerConfig = {
    url: '/openapi.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUI.presets.apis,
      SwaggerUI.StandalonePreset
    ],
    layout: "StandaloneLayout",
    defaultModelsExpandDepth: -1,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    onComplete: () => {
      // Add custom styling
      const style = document.createElement('style');
      style.textContent = `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 15px 0; }
        .swagger-ui .scheme-container { margin: 15px 0; }
        .swagger-ui .opblock { margin: 10px 0; }
        .swagger-ui .opblock .opblock-summary { 
          border-radius: 8px;
          padding: 12px 16px;
        }
        .swagger-ui .opblock .opblock-summary:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 4px;
          padding: 4px 8px;
          font-weight: 600;
        }
        .swagger-ui .opblock.get .opblock-summary-method {
          background-color: #61affe;
          color: white;
        }
        .swagger-ui .opblock.post .opblock-summary-method {
          background-color: #49cc90;
          color: white;
        }
        .swagger-ui .opblock.put .opblock-summary-method {
          background-color: #fca130;
          color: white;
        }
        .swagger-ui .opblock.delete .opblock-summary-method {
          background-color: #f93e3e;
          color: white;
        }
        .swagger-ui .opblock.patch .opblock-summary-method {
          background-color: #50e3c2;
          color: white;
        }
      `;
      document.head.appendChild(style);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            FinSmartAI API Documentation
          </CardTitle>
          <CardDescription>
            Comprehensive API documentation for the FinSmartAI Financial AI Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Real-time Data</h3>
                <p className="text-sm text-gray-600">Live market data and AI predictions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Secure</h3>
                <p className="text-sm text-gray-600">Enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Scalable</h3>
                <p className="text-sm text-gray-600">Built for high traffic</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              RESTful API
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              JSON Format
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              Multiple Servers
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              OpenAPI 3.0
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDownloadSpec} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Spec
            </Button>
            <Button 
              onClick={() => window.open('/openapi.json', '_blank')} 
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Raw JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>API Authentication</CardTitle>
            <CardDescription>
              Enter your API key to access the interactive documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleApiKeySubmit}>
                Authenticate
              </Button>
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                To get an API key, please contact our support team or visit your account dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Server Selection */}
      <Card>
        <CardHeader>
          <CardTitle>API Servers</CardTitle>
          <CardDescription>
            Select the API server you want to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedServer === server.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedServer(server.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${server.color}`} />
                  <h3 className="font-semibold">{server.description}</h3>
                </div>
                <p className="text-sm text-gray-600 font-mono">{server.url}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Documentation Tabs */}
      <Tabs defaultValue="interactive" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interactive">Interactive Docs</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoint Overview</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-4">
          {isAuthenticated ? (
            <Card>
              <CardContent className="p-0">
                <div id="swagger-ui" style={{ height: '800px' }} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">
                  Please authenticate to view the interactive API documentation
                </p>
                <Button onClick={() => setIsAuthenticated(true)}>
                  Authenticate with API Key
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Overview</CardTitle>
              <CardDescription>
                Quick overview of all available API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Core Endpoints</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-500">GET</Badge>
                        <span className="font-mono text-sm">/health</span>
                      </div>
                      <p className="text-sm text-gray-600">System health check</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/predict</span>
                      </div>
                      <p className="text-sm text-gray-600">AI predictions</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/sentiment/analyze</span>
                      </div>
                      <p className="text-sm text-gray-600">Sentiment analysis</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/risk/analyze</span>
                      </div>
                      <p className="text-sm text-gray-600">Risk analysis</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Trading & Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/options/analyze</span>
                      </div>
                      <p className="text-sm text-gray-600">Options analysis</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/fundflow/analyze</span>
                      </div>
                      <p className="text-sm text-gray-600">Fund flow analysis</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Portfolio & News</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-500">GET</Badge>
                        <span className="font-mono text-sm">/portfolio</span>
                      </div>
                      <p className="text-sm text-gray-600">Get portfolio</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500">POST</Badge>
                        <span className="font-mono text-sm">/news/summarize</span>
                      </div>
                      <p className="text-sm text-gray-600">News summary</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Sample code for integrating with the FinSmartAI API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">JavaScript/Node.js</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`const axios = require('axios');

const API_KEY = 'your-api-key';
const BASE_URL = 'http://localhost:3000/api';

// Get AI prediction
async function getPrediction(symbol, model = 'SentimentAI') {
  try {
    const response = await axios.post(\`\${BASE_URL}/predict\`, {
      symbol,
      model,
      timeframe: '1W'
    }, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting prediction:', error.response?.data || error.message);
  }
}

// Example usage
getPrediction('RELIANCE.NS')
  .then(data => console.log('Prediction:', data))
  .catch(error => console.error('Error:', error));`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Python</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`import requests
import json

API_KEY = 'your-api-key'
BASE_URL = 'http://localhost:3000/api'

def get_prediction(symbol, model='SentimentAI'):
    """Get AI prediction for a stock symbol"""
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'symbol': symbol,
        'model': model,
        'timeframe': '1W'
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/predict',
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error getting prediction: {e}')
        return None

# Example usage
prediction = get_prediction('RELIANCE.NS')
if prediction:
    print('Prediction:', json.dumps(prediction, indent=2))`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">cURL</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`# Get AI prediction
curl -X POST http://localhost:3000/api/predict \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "RELIANCE.NS",
    "model": "SentimentAI",
    "timeframe": "1W"
  }'

# Get sentiment analysis
curl -X POST http://localhost:3000/api/sentiment/analyze \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "TCS.NS",
    "sources": ["news", "social"]
  }'

# Get portfolio
curl -X GET http://localhost:3000/api/portfolio \\
  -H "Authorization: Bearer your-api-key"`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}