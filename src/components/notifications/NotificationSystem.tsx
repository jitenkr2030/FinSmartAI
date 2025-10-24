'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone, 
  Desktop, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Filter,
  Search
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'price_alert' | 'technical_signal' | 'news_alert' | 'system' | 'risk_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  symbol?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  priceAlerts: boolean;
  technicalSignals: boolean;
  newsAlerts: boolean;
  riskAlerts: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

interface NotificationSystemProps {
  maxNotifications?: number;
  showSettings?: boolean;
}

export function NotificationSystem({ 
  maxNotifications = 50, 
  showSettings = true 
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    desktop: true,
    priceAlerts: true,
    technicalSignals: true,
    newsAlerts: true,
    riskAlerts: true,
    systemAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'immediate'
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'price_alert' | 'technical_signal' | 'news_alert' | 'system' | 'risk_alert'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      setIsLoading(true);
      
      try {
        // Load sample notifications for demo
        const sampleNotifications: Notification[] = [
          {
            id: '1',
            type: 'price_alert',
            title: 'Price Alert: RELIANCE',
            message: 'RELIANCE crossed ₹2500 resistance level',
            severity: 'medium',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            read: false,
            symbol: 'RELIANCE',
            metadata: { price: 2505.50, change: '+2.5%' }
          },
          {
            id: '2',
            type: 'technical_signal',
            title: 'Buy Signal: NIFTY 50',
            message: 'RSI indicates oversold conditions - potential buying opportunity',
            severity: 'high',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            read: false,
            symbol: 'NIFTY 50',
            metadata: { rsi: 28.5, signal: 'buy' }
          },
          {
            id: '3',
            type: 'news_alert',
            title: 'Market News: RBI Policy',
            message: 'RBI maintains status quo on interest rates, market reacts positively',
            severity: 'medium',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: true,
            metadata: { source: 'Economic Times', impact: 'positive' }
          },
          {
            id: '4',
            type: 'risk_alert',
            title: 'Risk Alert: Portfolio Volatility',
            message: 'Your portfolio volatility has increased by 15% in the last week',
            severity: 'high',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            read: false,
            metadata: { volatility: 18.5, threshold: 15 }
          },
          {
            id: '5',
            type: 'system',
            title: 'System Update',
            message: 'New AI model Kronos-AlphaAI is now available for testing',
            severity: 'low',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            read: true,
            actionUrl: '/models'
          }
        ];
        
        setNotifications(sampleNotifications.slice(0, maxNotifications));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initializeNotifications();

    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of new notification
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['price_alert', 'technical_signal', 'news_alert'][Math.floor(Math.random() * 3)] as any,
          title: `New ${['Price', 'Technical', 'News'][Math.floor(Math.random() * 3)]} Alert`,
          message: 'Sample notification message',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          timestamp: new Date(),
          read: false,
          symbol: ['NIFTY 50', 'BANKNIFTY', 'RELIANCE'][Math.floor(Math.random() * 3)]
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, maxNotifications));
        
        toast({
          title: 'New Notification',
          description: newNotification.title,
          variant: newNotification.severity === 'high' ? 'destructive' : 'default',
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [maxNotifications, toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  }, [toast]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast({
      title: 'Success',
      description: 'Notification deleted',
    });
  }, [toast]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    toast({
      title: 'Success',
      description: 'All notifications cleared',
    });
  }, [toast]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast({
      title: 'Success',
      description: 'Notification settings updated',
    });
  }, [toast]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.symbol && notification.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'price_alert':
        return <TrendingUp className="w-4 h-4" />;
      case 'technical_signal':
        return <TrendingDown className="w-4 h-4" />;
      case 'news_alert':
        return <Info className="w-4 h-4" />;
      case 'risk_alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              {criticalCount} critical
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {showSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="price_alert">Price Alerts</SelectItem>
                  <SelectItem value="technical_signal">Technical Signals</SelectItem>
                  <SelectItem value="news_alert">News Alerts</SelectItem>
                  <SelectItem value="risk_alert">Risk Alerts</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-1">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={getSeverityColor(notification.severity)} 
                                  className="text-xs"
                                >
                                  {notification.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            {notification.symbol && (
                              <Badge variant="outline" className="text-xs">
                                {notification.symbol}
                              </Badge>
                            )}
                            {notification.metadata && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {Object.entries(notification.metadata).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || filter !== 'all' 
                          ? 'No notifications match your search criteria' 
                          : 'No notifications'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {showSettings && (
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Channels</span>
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <Label htmlFor="email">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email"
                      checked={settings.email}
                      onCheckedChange={(checked) => updateSettings({ email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4" />
                      <Label htmlFor="push">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push"
                      checked={settings.push}
                      onCheckedChange={(checked) => updateSettings({ push: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Desktop className="w-4 h-4" />
                      <Label htmlFor="desktop">Desktop Notifications</Label>
                    </div>
                    <Switch
                      id="desktop"
                      checked={settings.desktop}
                      onCheckedChange={(checked) => updateSettings({ desktop: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="w-5 h-5" />
                    <span>Notification Types</span>
                  </CardTitle>
                  <CardDescription>
                    Select which types of notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priceAlerts">Price Alerts</Label>
                    <Switch
                      id="priceAlerts"
                      checked={settings.priceAlerts}
                      onCheckedChange={(checked) => updateSettings({ priceAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="technicalSignals">Technical Signals</Label>
                    <Switch
                      id="technicalSignals"
                      checked={settings.technicalSignals}
                      onCheckedChange={(checked) => updateSettings({ technicalSignals: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newsAlerts">News Alerts</Label>
                    <Switch
                      id="newsAlerts"
                      checked={settings.newsAlerts}
                      onCheckedChange={(checked) => updateSettings({ newsAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="riskAlerts">Risk Alerts</Label>
                    <Switch
                      id="riskAlerts"
                      checked={settings.riskAlerts}
                      onCheckedChange={(checked) => updateSettings({ riskAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <Switch
                      id="systemAlerts"
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) => updateSettings({ systemAlerts: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Delivery Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure when and how often you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select 
                      value={settings.frequency} 
                      onValueChange={(value: any) => updateSettings({ frequency: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quietHours">Quiet Hours</Label>
                      <Switch
                        id="quietHours"
                        checked={settings.quietHours.enabled}
                        onCheckedChange={(checked) => 
                          updateSettings({ 
                            quietHours: { ...settings.quietHours, enabled: checked } 
                          })
                        }
                      />
                    </div>
                    {settings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="quietStart">Start Time</Label>
                          <Input
                            id="quietStart"
                            type="time"
                            value={settings.quietHours.start}
                            onChange={(e) => 
                              updateSettings({ 
                                quietHours: { ...settings.quietHours, start: e.target.value } 
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="quietEnd">End Time</Label>
                          <Input
                            id="quietEnd"
                            type="time"
                            value={settings.quietHours.end}
                            onChange={(e) => 
                              updateSettings({ 
                                quietHours: { ...settings.quietHours, end: e.target.value } 
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Notifications</CardTitle>
                  <CardDescription>
                    Send a test notification to verify your settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => {
                      toast({
                        title: 'Test Notification',
                        description: 'This is a test notification',
                      });
                    }}
                    className="w-full"
                  >
                    Send Test Notification
                  </Button>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Make sure you have enabled browser notifications for desktop alerts.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}