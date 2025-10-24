'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { exportService, EXPORT_FORMATS, DEFAULT_REPORT_TEMPLATES } from '@/lib/services/exportService';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Settings, 
  Plus,
  Mail,
  Users,
  BarChart3,
  Database,
  Filter,
  Search
} from 'lucide-react';

interface ExportJob {
  id: string;
  userId: string;
  type: 'data' | 'report';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName?: string;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface ScheduledExport {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  format: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: Date;
  isActive: boolean;
  recipients: string[];
  createdAt: Date;
  lastRun?: Date;
}

interface DataExportConfig {
  dataType: 'portfolio' | 'models' | 'analytics' | 'transactions' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, any>;
  format: string;
}

interface ReportConfig {
  templateId: string;
  format: string;
  data: any;
  customSections?: Array<{
    title: string;
    type: string;
    content: string;
  }>;
}

export function DataExportSystem() {
  const [activeTab, setActiveTab] = useState('export');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Data export state
  const [exportConfig, setExportConfig] = useState<DataExportConfig>({
    dataType: 'portfolio',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {},
    format: 'csv'
  });

  // Report generation state
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    templateId: 'portfolio-summary',
    format: 'pdf',
    data: {}
  });

  // Scheduled export state
  const [newScheduledExport, setNewScheduledExport] = useState({
    name: '',
    templateId: 'portfolio-summary',
    format: 'pdf',
    schedule: 'daily' as const,
    recipients: [] as string[],
    isActive: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobs, scheduled] = await Promise.all([
        exportService.getExportJobs('current-user'), // In real app, get actual user ID
        exportService.getScheduledExports('current-user')
      ]);
      
      setExportJobs(jobs);
      setScheduledExports(scheduled);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load export data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDataExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate data fetch based on config
      const mockData = generateMockData(exportConfig.dataType);
      
      const job = await exportService.createExportJob(
        'current-user',
        'data',
        exportConfig.format,
        mockData
      );

      setExportJobs(prev => [job, ...prev]);
      
      toast({
        title: 'Export Started',
        description: 'Your data export is being processed',
      });

      // Poll for job completion
      const pollInterval = setInterval(async () => {
        const updatedJob = await exportService.getExportJob(job.id, 'current-user');
        if (updatedJob) {
          setExportJobs(prev => prev.map(j => j.id === job.id ? updatedJob : j));
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(pollInterval);
            setIsExporting(false);
            
            if (updatedJob.status === 'completed') {
              toast({
                title: 'Export Completed',
                description: 'Your data export is ready for download',
              });
            } else {
              toast({
                title: 'Export Failed',
                description: updatedJob.errorMessage || 'Failed to export data',
                variant: 'destructive',
              });
            }
          }
        }
      }, 2000);

    } catch (error) {
      setIsExporting(false);
      toast({
        title: 'Error',
        description: 'Failed to start data export',
        variant: 'destructive',
      });
    }
  }, [exportConfig, toast]);

  const handleReportGeneration = useCallback(async () => {
    setIsExporting(true);
    try {
      const template = DEFAULT_REPORT_TEMPLATES.find(t => t.id === reportConfig.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Simulate data fetch for report
      const mockData = generateMockReportData(reportConfig.templateId);
      
      const job = await exportService.createExportJob(
        'current-user',
        'report',
        reportConfig.format,
        mockData,
        template
      );

      setExportJobs(prev => [job, ...prev]);
      
      toast({
        title: 'Report Generation Started',
        description: 'Your report is being generated',
      });

      // Poll for job completion
      const pollInterval = setInterval(async () => {
        const updatedJob = await exportService.getExportJob(job.id, 'current-user');
        if (updatedJob) {
          setExportJobs(prev => prev.map(j => j.id === job.id ? updatedJob : j));
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(pollInterval);
            setIsExporting(false);
            
            if (updatedJob.status === 'completed') {
              toast({
                title: 'Report Generated',
                description: 'Your report is ready for download',
              });
            } else {
              toast({
                title: 'Report Generation Failed',
                description: updatedJob.errorMessage || 'Failed to generate report',
                variant: 'destructive',
              });
            }
          }
        }
      }, 2000);

    } catch (error) {
      setIsExporting(false);
      toast({
        title: 'Error',
        description: 'Failed to start report generation',
        variant: 'destructive',
      });
    }
  }, [reportConfig, toast]);

  const handleDownload = useCallback(async (job: ExportJob) => {
    if (!job.downloadUrl) return;

    try {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.fileName || `export-${job.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download Started',
        description: 'Your file is being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    try {
      await exportService.deleteExportJob(jobId, 'current-user');
      setExportJobs(prev => prev.filter(j => j.id !== jobId));
      
      toast({
        title: 'Job Deleted',
        description: 'Export job has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCreateScheduledExport = useCallback(async () => {
    try {
      const scheduled = await exportService.createScheduledExport(
        'current-user',
        newScheduledExport.name,
        newScheduledExport.templateId,
        newScheduledExport.format,
        newScheduledExport.schedule,
        newScheduledExport.recipients
      );

      setScheduledExports(prev => [scheduled, ...prev]);
      setNewScheduledExport({
        name: '',
        templateId: 'portfolio-summary',
        format: 'pdf',
        schedule: 'daily',
        recipients: [],
        isActive: true
      });
      
      toast({
        title: 'Scheduled Export Created',
        description: 'Your scheduled export has been set up successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create scheduled export',
        variant: 'destructive',
      });
    }
  }, [newScheduledExport, toast]);

  const handleToggleScheduledExport = useCallback(async (id: string, isActive: boolean) => {
    try {
      await exportService.updateScheduledExport(id, 'current-user', { isActive });
      setScheduledExports(prev => 
        prev.map(exp => exp.id === id ? { ...exp, isActive } : exp)
      );
      
      toast({
        title: 'Schedule Updated',
        description: `Scheduled export ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update scheduled export',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDeleteScheduledExport = useCallback(async (id: string) => {
    try {
      await exportService.deleteScheduledExport(id, 'current-user');
      setScheduledExports(prev => prev.filter(exp => exp.id !== id));
      
      toast({
        title: 'Scheduled Export Deleted',
        description: 'Scheduled export has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete scheduled export',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const filteredJobs = exportJobs.filter(job => {
    const matchesSearch = job.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const generateMockData = (dataType: string) => {
    switch (dataType) {
      case 'portfolio':
        return [
          { symbol: 'NIFTY50', name: 'Nifty 50', value: 19500.50, return: 2.5, weight: 25 },
          { symbol: 'BANKNIFTY', name: 'Bank Nifty', value: 43200.75, return: -1.2, weight: 20 },
          { symbol: 'RELIANCE', name: 'Reliance Industries', value: 2845.60, return: 3.8, weight: 15 },
          { symbol: 'TCS', name: 'Tata Consultancy Services', value: 3750.40, return: 1.9, weight: 12 },
          { symbol: 'INFY', name: 'Infosys', value: 1520.80, return: -0.8, weight: 10 }
        ];
      case 'models':
        return [
          { modelName: 'SentimentAI', accuracy: 0.85, precision: 0.82, recall: 0.88, f1Score: 0.85 },
          { modelName: 'OptionsAI', accuracy: 0.78, precision: 0.75, recall: 0.81, f1Score: 0.78 },
          { modelName: 'RiskAI', accuracy: 0.92, precision: 0.90, recall: 0.94, f1Score: 0.92 }
        ];
      default:
        return [{ id: 1, name: 'Sample Data', value: 100 }];
    }
  };

  const generateMockReportData = (templateId: string) => {
    switch (templateId) {
      case 'portfolio-summary':
        return {
          totalValue: 1250000,
          totalReturn: 0.125,
          sharpeRatio: 1.85,
          maxDrawdown: -0.085,
          returnsHistory: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            portfolioReturn: Math.random() * 0.02 - 0.01
          })),
          assetAllocation: [
            { assetClass: 'Equity', percentage: 65 },
            { assetClass: 'Bonds', percentage: 20 },
            { assetClass: 'Cash', percentage: 10 },
            { assetClass: 'Commodities', percentage: 5 }
          ],
          topHoldings: generateMockData('portfolio')
        };
      default:
        return {};
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Export & Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export your data and generate comprehensive reports
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Database className="w-4 h-4" />
          <span>{exportJobs.length} exports</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Exports</TabsTrigger>
        </TabsList>

        {/* Export Data Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Export your data in various formats for analysis or backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Type Selection */}
              <div>
                <Label>Data Type</Label>
                <Select 
                  value={exportConfig.dataType} 
                  onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, dataType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio">Portfolio Data</SelectItem>
                    <SelectItem value="models">AI Model Performance</SelectItem>
                    <SelectItem value="analytics">Analytics Data</SelectItem>
                    <SelectItem value="transactions">Transaction History</SelectItem>
                    <SelectItem value="custom">Custom Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exportConfig.dateRange.start}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={exportConfig.dateRange.end}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <Label>Export Format</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  {EXPORT_FORMATS.map(format => (
                    <Button
                      key={format.id}
                      variant={exportConfig.format === format.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportConfig(prev => ({ ...prev, format: format.id }))}
                      className="flex flex-col items-center space-y-1 h-auto py-3"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-xs">{format.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <Button 
                onClick={handleDataExport} 
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Create comprehensive reports using predefined templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div>
                <Label>Report Template</Label>
                <Select 
                  value={reportConfig.templateId} 
                  onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_REPORT_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reportConfig.templateId && (
                  <p className="text-sm text-gray-600 mt-1">
                    {DEFAULT_REPORT_TEMPLATES.find(t => t.id === reportConfig.templateId)?.description}
                  </p>
                )}
              </div>

              {/* Format Selection */}
              <div>
                <Label>Report Format</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {EXPORT_FORMATS.filter(f => ['pdf', 'excel'].includes(f.id)).map(format => (
                    <Button
                      key={format.id}
                      variant={reportConfig.format === format.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReportConfig(prev => ({ ...prev, format: format.id }))}
                      className="flex flex-col items-center space-y-1 h-auto py-3"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-xs">{format.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleReportGeneration} 
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search exports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Jobs List */}
          <div className="space-y-3">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-medium">{job.fileName || `${job.type} Export`}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{job.type}</span>
                            <span>{job.format.toUpperCase()}</span>
                            <span>{job.createdAt.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        
                        {job.status === 'processing' && (
                          <div className="w-24">
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}
                        
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(job)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {job.errorMessage && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{job.errorMessage}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exports found</h3>
                  <p className="text-gray-500">Start by exporting your data or generating a report.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Scheduled Exports Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          {/* Create Scheduled Export */}
          <Card>
            <CardHeader>
              <CardTitle>Create Scheduled Export</CardTitle>
              <CardDescription>
                Set up automatic exports on a regular schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newScheduledExport.name}
                    onChange={(e) => setNewScheduledExport(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Weekly Portfolio Report"
                  />
                </div>
                <div>
                  <Label>Template</Label>
                  <Select 
                    value={newScheduledExport.templateId} 
                    onValueChange={(value: any) => setNewScheduledExport(prev => ({ ...prev, templateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_REPORT_TEMPLATES.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format</Label>
                  <Select 
                    value={newScheduledExport.format} 
                    onValueChange={(value: any) => setNewScheduledExport(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Schedule</Label>
                  <Select 
                    value={newScheduledExport.schedule} 
                    onValueChange={(value: any) => setNewScheduledExport(prev => ({ ...prev, schedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Email Recipients</Label>
                <Input
                  value={newScheduledExport.recipients.join(', ')}
                  onChange={(e) => setNewScheduledExport(prev => ({ 
                    ...prev, 
                    recipients: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  }))}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newScheduledExport.isActive}
                  onCheckedChange={(checked) => setNewScheduledExport(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
              
              <Button 
                onClick={handleCreateScheduledExport}
                disabled={!newScheduledExport.name}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Scheduled Export
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled Exports List */}
          <div className="space-y-3">
            {scheduledExports.length > 0 ? (
              scheduledExports.map(scheduled => (
                <Card key={scheduled.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{scheduled.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{scheduled.schedule}</span>
                            <span>{scheduled.format.toUpperCase()}</span>
                            <span>Next: {scheduled.nextRun.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={scheduled.isActive}
                          onCheckedChange={(checked) => handleToggleScheduledExport(scheduled.id, checked)}
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteScheduledExport(scheduled.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {scheduled.recipients.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span>{scheduled.recipients.join(', ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled exports</h3>
                  <p className="text-gray-500">Create a scheduled export to automate your reporting.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}