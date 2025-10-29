"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Globe, 
  DollarSign, 
  Target, 
  Clock, 
  Star, 
  ArrowRight,
  Settings,
  CreditCard,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  Download
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    badge: null,
  },
  {
    title: "AI Models",
    icon: Brain,
    href: "/models",
    children: [
      { title: "SentimentAI", href: "/models/sentiment", badge: "Active" },
      { title: "NewsInsightAI", href: "/models/news", badge: "Active" },
      { title: "OptionsAI", href: "/models/options", badge: "Active" },
      { title: "RiskAI", href: "/models/risk", badge: "Active" },
      { title: "FundFlowAI", href: "/models/fundflow", badge: "Active" },
      { title: "MutualAI", href: "/models/mutual", badge: "Active" },
      { title: "CommodAI", href: "/models/commod", badge: "Active" },
      { title: "FXAI", href: "/models/fx", badge: "Active" },
      { title: "TaxAI", href: "/models/tax", badge: "Active" },
      { title: "AlphaAI", href: "/models/alpha", badge: "Active" },
      { title: "TrendFusion", href: "/models/trend", badge: "Active" },
      { title: "Kronos Global", href: "/models/global", badge: "Active" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    badge: null,
  },
  {
    title: "Export & Reports",
    icon: Download,
    href: "/export",
    badge: "New",
  },
  {
    title: "Portfolio",
    icon: TrendingUp,
    href: "/portfolio",
    badge: null,
  },
  {
    title: "API Access",
    icon: Settings,
    href: "/api",
    badge: "New",
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
    badge: null,
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    href: "/support",
    badge: null,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["AI Models"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">FinSmartAI</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.title}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between h-10 px-3 py-2 text-sm font-medium rounded-lg",
                    "hover:bg-gray-100 dark:hover:bg-slate-700",
                    "text-gray-700 dark:text-gray-200"
                  )}
                  onClick={() => item.children && toggleExpanded(item.title)}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.children && (
                      expandedItems.includes(item.title) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </div>
                </Button>

                {/* Submenu */}
                {item.children && expandedItems.includes(item.title) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        className="w-full justify-start h-8 px-3 py-1 text-xs rounded-md"
                      >
                        <span className="flex-1 text-left">{child.title}</span>
                        {child.badge && (
                          <Badge variant="outline" className="text-xs">
                            {child.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>© 2024 FinSmartAI</p>
              <p className="mt-1">Version 2.0.1</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}