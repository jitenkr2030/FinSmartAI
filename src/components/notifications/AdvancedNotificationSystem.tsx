'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Settings, 
  Filter, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'market_alert' | 'system_update';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'market' | 'system' | 'account' | 'security' | 'billing';
  actionUrl?: string;
  actionText?: string;
  delivered: boolean;
  deliveryMethod: 'in_app' | 'email' | 'push' | 'sms';
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  categories: {
    market: boolean;
    system: boolean;
    account: boolean;
    security: boolean;
    billing: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  enabled: boolean;
}

export function AdvancedNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    desktopNotifications: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    categories: {
      market: true,
      system: true,
      account: true,
      security: true,
      billing: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true
    }
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Market Alert',
      type: 'email',
      subject: 'Market Alert: {{symbol}}',
      content: 'Dear {{name}},\n\nA market alert has been triggered for {{symbol}}.\n\nAlert Details:\n- Type: {{alertType}}\n- Condition: {{condition}}\n- Triggered at: {{timestamp}}\n\nPlease log in to your account for more details.',
      variables: ['name', 'symbol', 'alertType', 'condition', 'timestamp'],
      enabled: true
    },
    {
      id: '2',
      name: 'System Update',
      type: 'push',
      content: 'System update available: {{updateTitle}}. Scheduled for {{scheduledTime}}.',
      variables: ['updateTitle', 'scheduledTime'],
      enabled: true
    }
  ]);

  const [activeTab, setActiveTab] = useState('inbox');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'market' | 'system' | 'account' | 'security' | 'billing'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
    name: '',
    type: 'email',
    content: '',
    variables: [],
    enabled: true
  });
  const { toast } = useToast();

  // Initialize notifications
  useEffect(() => {
    loadNotifications();
    setupNotificationListeners();
  }, []);

  const loadNotifications = useCallback(async () => {
    // Simulate loading notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'market_alert',
        title: 'NIFTY 50 Price Alert',
        message: 'NIFTY 50 has crossed 19,500 level',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        category: 'market',
        actionUrl: '/market/NIFTY%2050',
        actionText: 'View Chart',
        delivered: true,
        deliveryMethod: 'in_app'
      },
      {
        id: '2',
        type: 'system_update',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight at 2:00 AM IST',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'medium',
        category: 'system',
        delivered: true,
        deliveryMethod: 'email'
      },
      {
        id: '3',
        type: 'success',
        title: 'Payment Successful',
        message: 'Your subscription has been renewed successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'low',
        category: 'billing',
        delivered: true,
        deliveryMethod: 'email'
      },
      {
        id: '4',
        type: 'error',
        title: 'Login Attempt Failed',
        message: 'Failed login attempt detected from unknown device',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        priority: 'critical',
        category: 'security',
        actionUrl: '/account/security',
        actionText: 'Review Activity',
        delivered: true,
        deliveryMethod: 'push'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const setupNotificationListeners = useCallback(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as any,
          title: 'New Market Update',
          message: `Market update for ${['NIFTY 50', 'BANKNIFTY', 'RELIANCE'][Math.floor(Math.random() * 3)]}`,
          timestamp: new Date(),
          read: false,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          category: 'market',
          delivered: true,
          deliveryMethod: 'in_app'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.type === 'error' ? 'destructive' : 'default',
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: 'Notification Deleted',
      description: 'Notification has been removed',
    });
  }, [toast]);

  const updateSettings = useCallback((key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateCategorySetting = useCallback((category: keyof NotificationSettings['categories'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }));
  }, []);

  const updatePrioritySetting = useCallback((priority: keyof NotificationSettings['priorities'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: enabled
      }
    }));
  }, []);

  const createTemplate = useCallback(() => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const template: NotificationTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name!,
      type: newTemplate.type!,
      subject: newTemplate.subject,
      content: newTemplate.content!,
      variables: newTemplate.variables || [],
      enabled: newTemplate.enabled ?? true
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      type: 'email',
      content: '',
      variables: [],
      enabled: true
    });
    setIsCreatingTemplate(false);
    
    toast({
      title: 'Template Created',
      description: 'Notification template has been created successfully',
    });
  }, [newTemplate, toast]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read) ||
                         (filter === notification.category);
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'market_alert':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Bell className="w-4 h-4" />
            <span>{unreadCount} unread</span>
          </Badge>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <XCircle className="w-4 h-4" />
              <span>{criticalCount} critical</span>
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-2">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-semibold ${!notification.read ? 'text-blue-600' : ''}`}>
                              {notification.title}
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{notification.timestamp.toLocaleString()}</span>
                            <span className="flex items-center space-x-1">
                              {notification.deliveryMethod === 'email' && <Mail className="w-3 h-3" />}
                              {notification.deliveryMethod === 'push' && <Smartphone className="w-3 h-3" />}
                              {notification.deliveryMethod === 'sms' && <Smartphone className="w-3 h-3" />}
                              <span>{notification.deliveryMethod.replace('_', ' ')}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.actionUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Navigate to action URL
                              toast({
                                title: 'Action Clicked',
                                description: `Navigating to: ${notification.actionText}`,
                              });
                            }}
                          >
                            {notification.actionText}
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Methods</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Notifications</span>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSettings('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Push Notifications</span>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSettings('pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>SMS Notifications</span>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => updateSettings('smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>Sound</span>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => updateSettings('soundEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Desktop Notifications</span>
                  </div>
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) => updateSettings('desktopNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>Disable notifications during specific hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable Quiet Hours</span>
                  <Switch
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) => 
                      updateSettings('quietHours', { ...settings.quietHours, enabled: checked })
                    }
                  />
                </div>
                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <Input
                        type="time"
                        value={settings.quietHours.startTime}
                        onChange={(e) => 
                          updateSettings('quietHours', { ...settings.quietHours, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={settings.quietHours.endTime}
                        onChange={(e) => 
                          updateSettings('quietHours', { ...settings.quietHours, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Categories</CardTitle>
                <CardDescription>Choose which categories to receive notifications for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateCategorySetting(category as keyof typeof settings.categories, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Priorities */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Priorities</CardTitle>
                <CardDescription>Choose which priority levels to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.priorities).map(([priority, enabled]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority as Notification['priority'])}`} />
                      <span className="capitalize">{priority}</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updatePrioritySetting(priority as keyof typeof settings.priorities, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Notification Templates</h2>
            <Button onClick={() => setIsCreatingTemplate(true)}>
              Create Template
            </Button>
          </div>

          {isCreatingTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newTemplate.type === 'email' && (
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={newTemplate.subject || ''}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newTemplate.content || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter template content (use {{variable}} for dynamic content)"
                    rows={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newTemplate.enabled ?? true}
                    onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, enabled: checked }))}
                  />
                  <span>Enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={createTemplate}>Create Template</Button>
                  <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.type}</Badge>
                      <Switch checked={template.enabled} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <div className="mb-2">
                      <label className="text-sm font-medium">Subject:</label>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Content:</label>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.content}</p>
                  </div>
                  {template.variables.length > 0 && (
                    <div className="mt-2">
                      <label className="text-sm font-medium">Variables:</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>View all notifications and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-500">{notification.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={notification.delivered ? "default" : "secondary"}>
                          {notification.delivered ? "Delivered" : "Failed"}
                        </Badge>
                        <Badge variant="outline">{notification.deliveryMethod}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}