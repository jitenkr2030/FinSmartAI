import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Loading States
  loading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Error States
  error: string | null;
  errors: Record<string, string>;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  
  // User Preferences
  userPreferences: {
    currency: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    dashboard: {
      layout: 'default' | 'compact' | 'detailed';
      widgets: string[];
    };
  };
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  setLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  
  setError: (error: string | null) => void;
  setErrorState: (key: string, error: string | null) => void;
  clearErrors: () => void;
  
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  updateUserPreferences: (preferences: Partial<AppState['userPreferences']>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial State
      sidebarOpen: false,
      mobileMenuOpen: false,
      theme: 'system',
      
      loading: false,
      loadingStates: {},
      
      error: null,
      errors: {},
      
      notifications: [],
      
      userPreferences: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        dashboard: {
          layout: 'default',
          widgets: ['portfolio', 'market-data', 'news', 'analytics'],
        },
      },
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setTheme: (theme) => set({ theme }),
      
      setLoading: (loading) => set({ loading }),
      setLoadingState: (key, loading) => 
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        })),
      
      setError: (error) => set({ error }),
      setErrorState: (key, error) => 
        set((state) => ({
          errors: {
            ...state.errors,
            [key]: error || '',
          },
        })),
      clearErrors: () => set({ error: null, errors: {} }),
      
      addNotification: (notification) => 
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date(),
            },
            ...state.notifications,
          ],
        })),
      
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      updateUserPreferences: (preferences) =>
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            ...preferences,
            notifications: {
              ...state.userPreferences.notifications,
              ...preferences.notifications,
            },
            dashboard: {
              ...state.userPreferences.dashboard,
              ...preferences.dashboard,
            },
          },
        })),
    }),
    {
      name: 'app-store',
    }
  )
);