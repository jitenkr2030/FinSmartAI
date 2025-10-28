import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UserState {
  // User Data
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    emailVerified: boolean;
    isActive: boolean;
  } | null;
  
  // Authentication
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Subscription
  subscription: {
    id: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired';
    planName: string;
    features: string[];
    startedAt: Date;
    endsAt?: Date;
  } | null;
  
  // Usage Tracking
  usage: {
    apiCalls: number;
    predictions: number;
    dataExports: number;
    period: 'daily' | 'monthly';
    limits: {
      apiCalls: number;
      predictions: number;
      dataExports: number;
    };
  };
  
  // Actions
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  setSubscription: (subscription: UserState['subscription']) => void;
  clearSubscription: () => void;
  
  updateUsage: (type: keyof UserState['usage'], increment: number) => void;
  resetUsage: () => void;
  setUsageLimits: (limits: UserState['usage']['limits']) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      subscription: null,
      usage: {
        apiCalls: 0,
        predictions: 0,
        dataExports: 0,
        period: 'monthly',
        limits: {
          apiCalls: 10000,
          predictions: 5000,
          dataExports: 100,
        },
      },
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSubscription: (subscription) => set({ subscription }),
      clearSubscription: () => set({ subscription: null }),
      
      updateUsage: (type, increment) =>
        set((state) => ({
          usage: {
            ...state.usage,
            [type]: Math.max(0, state.usage[type] + increment),
          },
        })),
      
      resetUsage: () =>
        set((state) => ({
          usage: {
            ...state.usage,
            apiCalls: 0,
            predictions: 0,
            dataExports: 0,
          },
        })),
      
      setUsageLimits: (limits) =>
        set((state) => ({
          usage: {
            ...state.usage,
            limits: {
              ...state.usage.limits,
              ...limits,
            },
          },
        })),
    }),
    {
      name: 'user-store',
    }
  )
);