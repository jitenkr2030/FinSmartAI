import { db } from '@/lib/db';

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  icon: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  sections: ReportSection[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'text' | 'metrics' | 'custom';
  config: Record<string, any>;
  order: number;
}

export interface ExportJob {
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

export interface ScheduledExport {
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

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    icon: 'file-spreadsheet'
  },
  {
    id: 'excel',
    name: 'Excel',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: 'file-spreadsheet'
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: 'pdf',
    mimeType: 'application/pdf',
    icon: 'file-text'
  },
  {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    icon: 'file-code'
  },
  {
    id: 'xml',
    name: 'XML',
    extension: 'xml',
    mimeType: 'application/xml',
    icon: 'file-code'
  }
];

export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'portfolio-summary',
    name: 'Portfolio Summary',
    description: 'Comprehensive portfolio performance summary',
    format: 'pdf',
    sections: [
      {
        id: 'overview',
        title: 'Portfolio Overview',
        type: 'metrics',
        config: { metrics: ['totalValue', 'totalReturn', 'sharpeRatio', 'maxDrawdown'] },
        order: 1
      },
      {
        id: 'performance',
        title: 'Performance Chart',
        type: 'chart',
        config: { chartType: 'line', dataKey: 'returns' },
        order: 2
      },
      {
        id: 'allocation',
        title: 'Asset Allocation',
        type: 'chart',
        config: { chartType: 'pie', dataKey: 'allocation' },
        order: 3
      },
      {
        id: 'holdings',
        title: 'Top Holdings',
        type: 'table',
        config: { columns: ['symbol', 'name', 'value', 'return', 'weight'] },
        order: 4
      }
    ],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'model-performance',
    name: 'AI Model Performance',
    description: 'Detailed performance metrics for all AI models',
    format: 'excel',
    sections: [
      {
        id: 'summary',
        title: 'Model Summary',
        type: 'table',
        config: { columns: ['modelName', 'accuracy', 'precision', 'recall', 'f1Score'] },
        order: 1
      },
      {
        id: 'predictions',
        title: 'Prediction History',
        type: 'table',
        config: { columns: ['date', 'model', 'prediction', 'actual', 'accuracy'] },
        order: 2
      },
      {
        id: 'metrics',
        title: 'Performance Metrics',
        type: 'chart',
        config: { chartType: 'bar', dataKey: 'metrics' },
        order: 3
      }
    ],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'risk-analysis',
    name: 'Risk Analysis Report',
    description: 'Comprehensive risk assessment and analysis',
    format: 'pdf',
    sections: [
      {
        id: 'risk-metrics',
        title: 'Risk Metrics',
        type: 'metrics',
        config: { metrics: ['var', 'cvar', 'beta', 'volatility'] },
        order: 1
      },
      {
        id: 'stress-test',
        title: 'Stress Test Results',
        type: 'table',
        config: { columns: ['scenario', 'impact', 'probability'] },
        order: 2
      },
      {
        id: 'correlation',
        title: 'Correlation Matrix',
        type: 'chart',
        config: { chartType: 'heatmap', dataKey: 'correlation' },
        order: 3
      }
    ],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

class ExportService {
  async exportData(
    data: any[],
    format: string,
    filename?: string
  ): Promise<Blob> {
    const exportFormat = EXPORT_FORMATS.find(f => f.id === format);
    if (!exportFormat) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'excel':
        return this.exportToExcel(data);
      case 'json':
        return this.exportToJSON(data);
      case 'xml':
        return this.exportToXML(data);
      case 'pdf':
        return this.exportToPDF(data);
      default:
        throw new Error(`Export format not implemented: ${format}`);
    }
  }

  private async exportToCSV(data: any[]): Promise<Blob> {
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async exportToExcel(data: any[]): Promise<Blob> {
    // For Excel export, we'll create a simple CSV format that Excel can open
    // In a real implementation, you would use a library like xlsx or exceljs
    return this.exportToCSV(data);
  }

  private async exportToJSON(data: any[]): Promise<Blob> {
    const jsonContent = JSON.stringify(data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  private async exportToXML(data: any[]): Promise<Blob> {
    const xmlContent = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<data>',
      ...data.map(row => 
        '  <row>' +
        Object.entries(row).map(([key, value]) => 
          `    <${key}>${this.escapeXML(value)}</${key}>`
        ).join('\n') +
        '  </row>'
      ),
      '</data>'
    ].join('\n');

    return new Blob([xmlContent], { type: 'application/xml' });
  }

  private async exportToPDF(data: any[]): Promise<Blob> {
    // For PDF export, we'll create a simple HTML representation
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Data Export</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  }

  private escapeXML(value: any): string {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async generateReport(
    template: ReportTemplate,
    data: any,
    format: string
  ): Promise<Blob> {
    // Generate report based on template
    const reportContent = await this.buildReportContent(template, data);
    
    switch (format) {
      case 'pdf':
        return this.generatePDFReport(reportContent);
      case 'excel':
        return this.generateExcelReport(reportContent);
      default:
        return this.exportData([reportContent], format);
    }
  }

  private async buildReportContent(template: ReportTemplate, data: any): Promise<any> {
    const sections = await Promise.all(
      template.sections
        .sort((a, b) => a.order - b.order)
        .map(async section => {
          switch (section.type) {
            case 'metrics':
              return this.buildMetricsSection(section, data);
            case 'chart':
              return this.buildChartSection(section, data);
            case 'table':
              return this.buildTableSection(section, data);
            case 'text':
              return this.buildTextSection(section, data);
            default:
              return { title: section.title, content: 'Section not implemented' };
          }
        })
    );

    return {
      title: template.name,
      description: template.description,
      generatedAt: new Date().toISOString(),
      sections
    };
  }

  private async buildMetricsSection(section: ReportSection, data: any): Promise<any> {
    const metrics = section.config.metrics || [];
    const metricsData = metrics.map((metric: string) => ({
      name: metric,
      value: data[metric] || 'N/A',
      formatted: this.formatMetric(metric, data[metric])
    }));

    return {
      title: section.title,
      type: 'metrics',
      data: metricsData
    };
  }

  private async buildChartSection(section: ReportSection, data: any): Promise<any> {
    // In a real implementation, this would generate actual chart data
    return {
      title: section.title,
      type: 'chart',
      chartType: section.config.chartType,
      data: data[section.config.dataKey] || []
    };
  }

  private async buildTableSection(section: ReportSection, data: any): Promise<any> {
    const columns = section.config.columns || [];
    const tableData = Array.isArray(data) ? data : [data];
    
    return {
      title: section.title,
      type: 'table',
      columns,
      data: tableData
    };
  }

  private async buildTextSection(section: ReportSection, data: any): Promise<any> {
    return {
      title: section.title,
      type: 'text',
      content: section.config.content || 'No content provided'
    };
  }

  private formatMetric(metric: string, value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    switch (metric) {
      case 'totalValue':
        return `₹${Number(value).toLocaleString('en-IN')}`;
      case 'totalReturn':
      case 'sharpeRatio':
      case 'maxDrawdown':
      case 'var':
      case 'cvar':
      case 'beta':
      case 'volatility':
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      default:
        return String(value);
    }
  }

  private async generatePDFReport(content: any): Promise<Blob> {
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${content.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .metric-name { font-weight: bold; color: #666; }
          .metric-value { font-size: 24px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${content.title}</h1>
          <p>${content.description}</p>
          <p>Generated on ${new Date(content.generatedAt).toLocaleString()}</p>
        </div>
        
        ${content.sections.map((section: any) => `
          <div class="section">
            <h2 class="section-title">${section.title}</h2>
            ${this.renderSectionContent(section)}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  }

  private renderSectionContent(section: any): string {
    switch (section.type) {
      case 'metrics':
        return `
          <div class="metrics-grid">
            ${section.data.map((metric: any) => `
              <div class="metric">
                <div class="metric-name">${metric.name}</div>
                <div class="metric-value">${metric.formatted}</div>
              </div>
            `).join('')}
          </div>
        `;
      case 'table':
        return `
          <table>
            <thead>
              <tr>
                ${section.columns.map((col: string) => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${section.data.map((row: any) => `
                <tr>
                  ${section.columns.map((col: string) => `<td>${row[col] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      case 'text':
        return `<p>${section.content}</p>`;
      default:
        return '<p>Section content not available</p>';
    }
  }

  private async generateExcelReport(content: any): Promise<Blob> {
    // For Excel reports, we'll create a CSV with multiple sheets
    // In a real implementation, you would use a proper Excel library
    const csvData = [
      ['Report Title', content.title],
      ['Description', content.description],
      ['Generated At', content.generatedAt],
      [''],
      ...content.sections.flatMap((section: any) => [
        [section.title],
        ...(section.columns || []),
        ...(section.data || []).map((row: any) => 
          (section.columns || []).map((col: string) => row[col] || '')
        ),
        ['']
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => 
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    ).join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  async createExportJob(
    userId: string,
    type: 'data' | 'report',
    format: string,
    data?: any,
    template?: ReportTemplate
  ): Promise<ExportJob> {
    const job: ExportJob = {
      id: Date.now().toString(),
      userId,
      type,
      format,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    // Save job to database
    await db.exportJob.create({
      data: {
        id: job.id,
        userId: job.userId,
        type: job.type,
        format: job.format,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt
      }
    });

    // Process export asynchronously
    this.processExportJob(job, data, template).catch(console.error);

    return job;
  }

  private async processExportJob(
    job: ExportJob,
    data?: any,
    template?: ReportTemplate
  ): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportJobStatus(job.id, 'processing', 10);

      let blob: Blob;
      let filename: string;

      if (job.type === 'data' && data) {
        blob = await this.exportData(data, job.format);
        filename = `data-export-${job.id}.${job.format}`;
      } else if (job.type === 'report' && template && data) {
        blob = await this.generateReport(template, data, job.format);
        filename = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${job.id}.${job.format}`;
      } else {
        throw new Error('Invalid export job configuration');
      }

      await this.updateExportJobStatus(job.id, 'processing', 90);

      // In a real implementation, you would upload the blob to cloud storage
      // and generate a download URL
      const downloadUrl = `data:${EXPORT_FORMATS.find(f => f.id === job.format)?.mimeType};base64,${await this.blobToBase64(blob)}`;

      await this.updateExportJobStatus(job.id, 'completed', 100, filename, downloadUrl);
    } catch (error) {
      await this.updateExportJobStatus(job.id, 'failed', 0, undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async updateExportJobStatus(
    jobId: string,
    status: ExportJob['status'],
    progress: number,
    fileName?: string,
    downloadUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    await db.exportJob.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        fileName,
        downloadUrl,
        errorMessage,
        ...(status === 'completed' && { completedAt: new Date() })
      }
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async getExportJobs(userId: string): Promise<ExportJob[]> {
    const jobs = await db.exportJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map(job => ({
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined
    }));
  }

  async getExportJob(jobId: string, userId: string): Promise<ExportJob | null> {
    const job = await db.exportJob.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return null;
    }

    return {
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined
    };
  }

  async deleteExportJob(jobId: string, userId: string): Promise<boolean> {
    const result = await db.exportJob.deleteMany({
      where: { id: jobId, userId }
    });

    return result.count > 0;
  }

  async createScheduledExport(
    userId: string,
    name: string,
    templateId: string,
    format: string,
    schedule: ScheduledExport['schedule'],
    recipients: string[]
  ): Promise<ScheduledExport> {
    const nextRun = this.calculateNextRun(schedule);

    const scheduledExport: ScheduledExport = {
      id: Date.now().toString(),
      userId,
      name,
      templateId,
      format,
      schedule,
      nextRun,
      isActive: true,
      recipients,
      createdAt: new Date()
    };

    await db.scheduledExport.create({
      data: {
        id: scheduledExport.id,
        userId: scheduledExport.userId,
        name: scheduledExport.name,
        templateId: scheduledExport.templateId,
        format: scheduledExport.format,
        schedule: scheduledExport.schedule,
        nextRun: scheduledExport.nextRun,
        isActive: scheduledExport.isActive,
        recipients: scheduledExport.recipients,
        createdAt: scheduledExport.createdAt
      }
    });

    return scheduledExport;
  }

  private calculateNextRun(schedule: ScheduledExport['schedule']): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextRun.setMonth(now.getMonth() + 3);
        break;
    }

    return nextRun;
  }

  async getScheduledExports(userId: string): Promise<ScheduledExport[]> {
    const exports = await db.scheduledExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return exports.map(exp => ({
      ...exp,
      nextRun: new Date(exp.nextRun),
      createdAt: new Date(exp.createdAt),
      lastRun: exp.lastRun ? new Date(exp.lastRun) : undefined
    }));
  }

  async updateScheduledExport(
    id: string,
    userId: string,
    updates: Partial<ScheduledExport>
  ): Promise<ScheduledExport | null> {
    const existing = await db.scheduledExport.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return null;
    }

    const updated = await db.scheduledExport.update({
      where: { id },
      data: updates
    });

    return {
      ...updated,
      nextRun: new Date(updated.nextRun),
      createdAt: new Date(updated.createdAt),
      lastRun: updated.lastRun ? new Date(updated.lastRun) : undefined
    };
  }

  async deleteScheduledExport(id: string, userId: string): Promise<boolean> {
    const result = await db.scheduledExport.deleteMany({
      where: { id, userId }
    });

    return result.count > 0;
  }
}

export const exportService = new ExportService();