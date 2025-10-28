'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Brain,
  TrendingUp,
  Activity,
  Search,
  Settings,
  Bell,
  BarChart3,
  Database,
  Server,
  Users,
  DollarSign,
  Shield,
  Zap,
  Globe,
  Target,
  Clock,
  Star,
  PieChart,
  HelpCircle,
  LogOut,
  Home,
  FileText,
  MessageSquare,
  Calendar,
  CreditCard
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "AI Models",
    url: "#models",
    icon: Brain,
  },
  {
    title: "Real-time Data",
    url: "#realtime",
    icon: Activity,
  },
  {
    title: "Technology",
    url: "#technology",
    icon: Server,
  },
  {
    title: "Pricing",
    url: "#pricing",
    icon: DollarSign,
  },
];

const analyticsItems = [
  {
    title: "Market Analysis",
    url: "#models",
    icon: TrendingUp,
  },
  {
    title: "Portfolio",
    url: "#pricing",
    icon: PieChart,
  },
  {
    title: "Reports",
    url: "#technology",
    icon: FileText,
  },
];

const settingsItems = [
  {
    title: "Search",
    url: "#search",
    icon: Search,
  },
  {
    title: "Notifications",
    url: "#notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "#help",
    icon: HelpCircle,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const handleNavigation = (url: string) => {
    if (url.startsWith('#')) {
      const sectionId = url.substring(1);
      const element = document.getElementById(sectionId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        console.log(`Navigated to section: ${sectionId}`);
      } else {
        // Handle special actions for non-existent sections
        switch(sectionId) {
          case 'search':
            console.log('Search functionality');
            alert('Search feature coming soon!');
            break;
          case 'notifications':
            console.log('Notifications panel');
            alert('You have 3 new notifications!');
            break;
          case 'settings':
            console.log('Settings panel');
            alert('Settings panel coming soon!');
            break;
          case 'help':
            console.log('Help & Support');
            alert('Help & Support: contact@finsmartai.com');
            break;
          default:
            console.log(`Section not found: ${sectionId}`);
            alert('This section is coming soon!');
        }
      }
    } else {
      // Handle regular navigation
      console.log('Navigating to:', url);
      window.location.href = url;
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
                  <Brain className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">FinSmartAI</span>
                  <span className="">Financial AI</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a href="#billing" onClick={(e) => {
                e.preventDefault();
                console.log('Billing clicked');
                alert('Billing & Subscription management coming soon!');
              }}>
                <CreditCard />
                <span>Billing</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a href="#logout" onClick={(e) => {
                e.preventDefault();
                console.log('Logout clicked');
                if (confirm('Are you sure you want to logout?')) {
                  alert('Logout functionality coming soon!');
                }
              }}>
                <LogOut />
                <span>Log out</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}