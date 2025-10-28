'use client';

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Menu, 
  Bell, 
  Settings, 
  Search, 
  User,
  LogOut,
  HelpCircle,
  Home,
  BarChart3,
  FileText,
  Database,
  DollarSign,
  Activity,
  Target
} from "lucide-react";

interface AppHeaderProps {
  session?: {
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export function AppHeader({ session }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleNavigation = (url: string) => {
    console.log('Navigating to:', url);
    window.location.href = url;
  };

  const handleNotificationClick = () => {
    console.log("Notifications clicked");
    setNotificationCount(0);
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
    alert('Settings panel coming soon!');
  };

  const handleProfileClick = () => {
    console.log("Profile clicked");
    alert('User profile coming soon!');
  };

  const handleLogout = async () => {
    console.log("Logout clicked");
    if (confirm('Are you sure you want to logout?')) {
      await signOut({ callbackUrl: "/" });
    }
  };

  const mainNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "AI Models", url: "/demos", icon: Brain },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Real-time", url: "/dashboard", icon: Activity },
    { title: "Search", url: "/search", icon: Search },
    { title: "Documentation", url: "/docs", icon: FileText },
    { title: "Export", url: "/export", icon: Database },
    { title: "Billing", url: "/billing", icon: DollarSign },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">FinSmartAI</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Beta
            </Badge>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 mx-6">
          {mainNavItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="h-9 px-3 text-sm font-medium"
              onClick={() => handleNavigation(item.url)}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.title}
            </Button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNotificationClick}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSettingsClick}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          {/* User Profile */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleProfileClick}
          >
            <User className="h-4 w-4" />
            <span className="sr-only">Profile</span>
          </Button>

          {/* Logout */}
          {session && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-2">
            {mainNavItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start h-10 px-3"
                onClick={() => {
                  handleNavigation(item.url);
                  setIsMenuOpen(false);
                }}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </Button>
            ))}
            {session && (
              <Button
                variant="ghost"
                className="w-full justify-start h-10 px-3 text-red-600 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}