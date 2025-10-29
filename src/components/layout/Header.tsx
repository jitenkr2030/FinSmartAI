'use client';

import { useState } from "react";
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
  HelpCircle
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleGetStarted = () => {
    // Navigate to billing page
    console.log("Get Started clicked");
    window.location.href = "/billing";
  };

  const handleLiveDemo = () => {
    // Navigate to demos page
    console.log("Live Demo clicked");
    window.location.href = "/demos";
  };

  const handleNotificationClick = () => {
    console.log("Notifications clicked");
    setNotificationCount(0);
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
    alert('Settings panel coming soon!');
  };

  const handleSearchClick = () => {
    console.log("Search clicked");
    window.location.href = "/search";
  };

  const handleProfileClick = () => {
    console.log("Profile clicked");
    alert('User profile coming soon!');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">FinSmartAI</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Beta
            </Badge>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 mx-6">
          <a 
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </a>
          <a 
            href="/demos"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            AI Models
          </a>
          <a 
            href="/analytics"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Analytics
          </a>
          <a 
            href="/docs"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Documentation
          </a>
          <a 
            href="/billing"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Billing
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Search Button */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSearchClick}
            className="hidden sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

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

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-2 ml-4">
            <Button 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
            <Button 
              variant="outline"
              onClick={handleLiveDemo}
            >
              Live Demo
            </Button>
          </div>

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
            <a 
              href="/dashboard"
              className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Dashboard
            </a>
            <a 
              href="/demos"
              className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              AI Models
            </a>
            <a 
              href="/analytics"
              className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Analytics
            </a>
            <a 
              href="/docs"
              className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Documentation
            </a>
            <a 
              href="/billing"
              className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Billing
            </a>
            <div className="flex flex-col space-y-2 pt-2 border-t">
              <Button 
                onClick={handleGetStarted}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
              <Button 
                variant="outline"
                onClick={handleLiveDemo}
                className="w-full"
              >
                Live Demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}