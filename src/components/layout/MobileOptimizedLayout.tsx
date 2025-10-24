'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Menu, 
  X, 
  Bell, 
  Settings, 
  User, 
  Home, 
  TrendingUp, 
  BarChart3, 
  Wallet,
  ChevronDown,
  ChevronRight,
  Search,
  Plus
} from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  bottomNavigation?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  onClick: () => void;
}

export function MobileOptimizedLayout({
  children,
  title,
  showBackButton = false,
  onBack,
  actions,
  bottomNavigation = true
}: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      onClick: () => setActiveNav('dashboard')
    },
    {
      id: 'market',
      label: 'Market',
      icon: TrendingUp,
      onClick: () => setActiveNav('market')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => setActiveNav('analytics')
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Wallet,
      onClick: () => setActiveNav('portfolio')
    }
  ];

  const sidebarItems = [
    {
      title: 'Main',
      items: [
        { icon: Home, label: 'Dashboard', href: '/' },
        { icon: TrendingUp, label: 'Market Data', href: '/market' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: Wallet, label: 'Portfolio', href: '/portfolio' }
      ]
    },
    {
      title: 'Tools',
      items: [
        { icon: Search, label: 'AI Models', href: '/models' },
        { icon: Plus, label: 'Predictions', href: '/predict' },
        { icon: BarChart3, label: 'Reports', href: '/reports' }
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: '/profile' },
        { icon: Settings, label: 'Settings', href: '/settings' },
        { icon: Bell, label: 'Notifications', href: '/notifications', badge: 3 }
      ]
    }
  ];

  const Header = () => (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <span>FinSmartAI</span>
                  </SheetTitle>
                  <SheetDescription>
                    Complete Financial AI Ecosystem
                  </SheetDescription>
                </SheetHeader>
                
                <div className="p-4 space-y-6">
                  {sidebarItems.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <button
                            key={itemIndex}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              // Handle navigation
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                              <Badge variant="destructive" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {actions}
          
          <Button variant="ghost" size="sm">
            <Search className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );

  const BottomNavigation = () => {
    if (!isMobile || !bottomNavigation) return null;

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                activeNav === item.id
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${
                activeNav === item.id ? 'text-blue-600 dark:text-blue-400' : ''
              }`} />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs p-0">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <main className={`pb-${bottomNavigation && isMobile ? '20' : '0'}`}>
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
}

// Mobile-optimized card component
export function MobileCard({ 
  children, 
  className = "", 
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 ${className} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Mobile-optimized list component
export function MobileList({ 
  items, 
  emptyMessage = "No items found",
  loading = false 
}: {
  items: React.ReactNode[];
  emptyMessage?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items}
    </div>
  );
}

// Mobile-optimized stats grid
export function MobileStatsGrid({ 
  stats 
}: { 
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ComponentType<{ className?: string }>;
  }> 
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <MobileCard key={index}>
          <div className="flex items-center justify-between mb-2">
            {stat.icon && <stat.icon className="w-4 h-4 text-gray-500" />}
            <span className="text-xs text-gray-500">{stat.label}</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stat.value}
          </div>
          {stat.change && (
            <div className={`text-xs mt-1 ${
              stat.changeType === 'positive' ? 'text-green-600' :
              stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {stat.change}
            </div>
          )}
        </MobileCard>
      ))}
    </div>
  );
}

// Mobile-optimized action button
export function MobileActionButton({
  children,
  icon: Icon,
  variant = 'default',
  onClick,
  fullWidth = false,
  className = ""
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'ghost';
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
}) {
  const baseClasses = "flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700",
    ghost: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </button>
  );
}

// Mobile-optimized search bar
export function MobileSearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onClear
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}