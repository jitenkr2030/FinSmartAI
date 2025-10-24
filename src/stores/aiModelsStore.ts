import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AIModel {
  id: string;
  name: string;
  description: string;
  version: string;
  modelType: string;
  isActive: boolean;
  performanceMetrics: Record<string, number>;
  lastUsed?: Date;
}

interface PredictionJob {
  id: string;
  modelName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

interface AIModelsState {
  // Models
  models: Record<string, AIModel>;
  activeModels: string[];
  
  // Predictions
  predictions: Record<string, PredictionJob>;
  runningJobs: string[];
  
  // Model Usage
  usage: Record<string, {
    calls: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    lastUsed: Date;
  }>;
  
  // Loading States
  loading: Record<string, boolean>;
  
  // Error States
  errors: Record<string, string>;
  
  // Actions
  setModels: (models: AIModel[]) => void;
  addModel: (model: AIModel) => void;
  updateModel: (id: string, updates: Partial<AIModel>) => void;
  removeModel: (id: string) => void;
  setActiveModels: (modelIds: string[]) => void;
  
  // Prediction Management
  addPredictionJob: (job: PredictionJob) => void;
  updatePredictionJob: (id: string, updates: Partial<PredictionJob>) => void;
  removePredictionJob: (id: string) => void;
  clearCompletedJobs: () => void;
  
  // Usage Tracking
  updateModelUsage: (modelName: string, processingTimeMs: number) => void;
  resetUsage: () => void;
  
  // Loading and Error States
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearErrors: () => void;
  
  // Getters
  getModel: (id: string) => AIModel | undefined;
  getModelsByType: (type: string) => AIModel[];
  getActiveModel: (type: string) => AIModel | undefined;
  getPredictionJob: (id: string) => PredictionJob | undefined;
  getRunningJobs: () => PredictionJob[];
  getModelUsage: (modelName: string) => AIModelsState['usage'][string] | undefined;
}

export const useAIModelsStore = create<AIModelsState>()(
  devtools(
    (set, get) => ({
      // Initial State
      models: {},
      activeModels: [],
      predictions: {},
      runningJobs: [],
      usage: {},
      loading: {},
      errors: {},
      
      // Actions
      setModels: (models) =>
        set((state) => {
          const modelsMap = models.reduce((acc, model) => {
            acc[model.id] = model;
            return acc;
          }, {} as Record<string, AIModel>);
          
          return {
            models: modelsMap,
            activeModels: models.filter((m) => m.isActive).map((m) => m.id),
          };
        }),
      
      addModel: (model) =>
        set((state) => ({
          models: {
            ...state.models,
            [model.id]: model,
          },
          activeModels: model.isActive
            ? [...state.activeModels, model.id]
            : state.activeModels,
        })),
      
      updateModel: (id, updates) =>
        set((state) => {
          const updatedModel = {
            ...state.models[id],
            ...updates,
          };
          
          const wasActive = state.models[id]?.isActive;
          const isActive = updatedModel.isActive;
          
          let activeModels = state.activeModels;
          if (wasActive !== isActive) {
            if (isActive) {
              activeModels = [...activeModels, id];
            } else {
              activeModels = activeModels.filter((modelId) => modelId !== id);
            }
          }
          
          return {
            models: {
              ...state.models,
              [id]: updatedModel,
            },
            activeModels,
          };
        }),
      
      removeModel: (id) =>
        set((state) => ({
          models: Object.fromEntries(
            Object.entries(state.models).filter(([key]) => key !== id)
          ),
          activeModels: state.activeModels.filter((modelId) => modelId !== id),
        })),
      
      setActiveModels: (modelIds) => set({ activeModels: modelIds }),
      
      // Prediction Management
      addPredictionJob: (job) =>
        set((state) => ({
          predictions: {
            ...state.predictions,
            [job.id]: job,
          },
          runningJobs: job.status === 'processing' 
            ? [...state.runningJobs, job.id] 
            : state.runningJobs,
        })),
      
      updatePredictionJob: (id, updates) =>
        set((state) => {
          const updatedJob = {
            ...state.predictions[id],
            ...updates,
          };
          
          const wasRunning = state.predictions[id]?.status === 'processing';
          const isRunning = updatedJob.status === 'processing';
          
          let runningJobs = state.runningJobs;
          if (wasRunning !== isRunning) {
            if (isRunning) {
              runningJobs = [...runningJobs, id];
            } else {
              runningJobs = runningJobs.filter((jobId) => jobId !== id);
            }
          }
          
          return {
            predictions: {
              ...state.predictions,
              [id]: updatedJob,
            },
            runningJobs,
          };
        }),
      
      removePredictionJob: (id) =>
        set((state) => ({
          predictions: Object.fromEntries(
            Object.entries(state.predictions).filter(([key]) => key !== id)
          ),
          runningJobs: state.runningJobs.filter((jobId) => jobId !== id),
        })),
      
      clearCompletedJobs: () =>
        set((state) => ({
          predictions: Object.fromEntries(
            Object.entries(state.predictions).filter(
              ([, job]) => job.status === 'pending' || job.status === 'processing'
            )
          ),
        })),
      
      // Usage Tracking
      updateModelUsage: (modelName, processingTimeMs) =>
        set((state) => {
          const currentUsage = state.usage[modelName] || {
            calls: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            lastUsed: new Date(),
          };
          
          const newCalls = currentUsage.calls + 1;
          const newTotalTime = currentUsage.totalProcessingTime + processingTimeMs;
          const newAverageTime = newTotalTime / newCalls;
          
          return {
            usage: {
              ...state.usage,
              [modelName]: {
                calls: newCalls,
                totalProcessingTime: newTotalTime,
                averageProcessingTime: newAverageTime,
                lastUsed: new Date(),
              },
            },
          };
        }),
      
      resetUsage: () => set({ usage: {} }),
      
      // Loading and Error States
      setLoading: (key, loading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: loading,
          },
        })),
      
      setError: (key, error) =>
        set((state) => ({
          errors: {
            ...state.errors,
            [key]: error || '',
          },
        })),
      
      clearErrors: () => set({ errors: {} }),
      
      // Getters
      getModel: (id) => get().models[id],
      
      getModelsByType: (type) =>
        Object.values(get().models).filter((model) => model.modelType === type),
      
      getActiveModel: (type) =>
        Object.values(get().models).find(
          (model) => model.modelType === type && model.isActive
        ),
      
      getPredictionJob: (id) => get().predictions[id],
      
      getRunningJobs: () =>
        Object.values(get().predictions).filter(
          (job) => job.status === 'processing'
        ),
      
      getModelUsage: (modelName) => get().usage[modelName],
    }),
    {
      name: 'ai-models-store',
    }
  )
);