"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Settings, Activity, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
  version: string;
  modelType: string;
  architecture: string;
  trainingDataInfo: string;
  performanceMetrics: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModelRegistryProps {
  onInitialize?: () => void;
}

export default function ModelRegistry({ onInitialize }: ModelRegistryProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeModels = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/models/initialize', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setModels(data.data.models);
        if (onInitialize) {
          onInitialize();
        }
      }
    } catch (error) {
      console.error('Error initializing models:', error);
    } finally {
      setInitializing(false);
    }
  };

  const getModelIcon = (modelType: string) => {
    switch (modelType) {
      case 'sentiment_analysis':
        return <Brain className="w-5 h-5" />;
      case 'risk_analysis':
        return <Activity className="w-5 h-5" />;
      case 'options_pricing':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getModelStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const parseJSON = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Model Registry</h2>
          <p className="text-gray-600">Manage and monitor all AI models in the ecosystem</p>
        </div>
        <Button 
          onClick={initializeModels}
          disabled={initializing}
          className="flex items-center gap-2"
        >
          {initializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Initializing...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Initialize Models
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{models.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {models.filter(m => m.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Model Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(models.map(m => m.modelType)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${models.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{models.length > 0 ? 'Operational' : 'Not Initialized'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Model List</TabsTrigger>
          <TabsTrigger value="details">Model Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => {
              const performanceMetrics = parseJSON(model.performanceMetrics);
              const accuracy = performanceMetrics.accuracy || performanceMetrics.directional_accuracy || 0;
              
              return (
                <Card 
                  key={model.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedModel(model)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getModelIcon(model.modelType)}
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={model.isActive ? "default" : "secondary"}>
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{model.version}</Badge>
                      </div>
                    </div>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{model.modelType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="font-medium">{(accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Performance</span>
                          <span>{(accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={accuracy * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedModel ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getModelIcon(selectedModel.modelType)}
                    <CardTitle className="text-xl">{selectedModel.name}</CardTitle>
                  </div>
                  <Badge variant={selectedModel.isActive ? "default" : "secondary"}>
                    {selectedModel.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{selectedModel.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Model Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version:</span>
                          <span>{selectedModel.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span>{selectedModel.modelType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{new Date(selectedModel.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span>{new Date(selectedModel.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Architecture</h4>
                      <div className="text-sm">
                        {Object.entries(parseJSON(selectedModel.architecture)).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Performance Metrics</h4>
                      <div className="text-sm">
                        {Object.entries(parseJSON(selectedModel.performanceMetrics)).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Training Data</h4>
                      <div className="text-sm">
                        {Object.entries(parseJSON(selectedModel.trainingDataInfo)).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a model to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}