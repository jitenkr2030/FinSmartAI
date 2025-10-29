import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  id: z.string().cuid(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+?[\d\s-]+$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/, 'Invalid datetime format'),
  boolean: z.boolean(),
  number: z.number(),
  positiveNumber: z.number().positive('Number must be positive'),
  nonNegativeNumber: z.number().nonnegative('Number must be non-negative'),
  percentage: z.number().min(0).max(1, 'Percentage must be between 0 and 1'),
  string: z.string().min(1, 'String cannot be empty'),
  optionalString: z.string().optional(),
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }),
};

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: commonSchemas.phone.optional(),
  }),
  update: z.object({
    email: commonSchemas.email.optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: commonSchemas.phone.optional(),
    isActive: commonSchemas.boolean.optional(),
  }),
  login: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: commonSchemas.phone.optional(),
  }),
  changePassword: z.object({
    currentPassword: commonSchemas.password,
    newPassword: commonSchemas.password,
  }),
};

// Subscription validation schemas
export const subscriptionSchemas = {
  createPlan: z.object({
    name: z.string().min(2, 'Plan name must be at least 2 characters'),
    description: commonSchemas.optionalString,
    price: commonSchemas.positiveNumber,
    durationDays: commonSchemas.positiveNumber,
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    isActive: commonSchemas.boolean.default(true),
  }),
  updatePlan: z.object({
    name: z.string().min(2, 'Plan name must be at least 2 characters').optional(),
    description: commonSchemas.optionalString,
    price: commonSchemas.positiveNumber.optional(),
    durationDays: commonSchemas.positiveNumber.optional(),
    features: z.array(z.string()).min(1, 'At least one feature is required').optional(),
    isActive: commonSchemas.boolean.optional(),
  }),
  createSubscription: z.object({
    planId: commonSchemas.id,
    paymentMethodId: commonSchemas.string.optional(),
    trialPeriodDays: commonSchemas.positiveNumber.optional(),
  }),
  updateSubscription: z.object({
    status: z.enum(['active', 'cancelled', 'expired']).optional(),
    paymentMethodId: commonSchemas.string.optional(),
  }),
};

// AI Model validation schemas
export const aiModelSchemas = {
  create: z.object({
    name: z.string().min(2, 'Model name must be at least 2 characters'),
    description: commonSchemas.optionalString,
    version: z.string().min(1, 'Version is required'),
    modelType: z.string().min(1, 'Model type is required'),
    architecture: z.record(z.any()).optional(),
    trainingDataInfo: z.record(z.any()).optional(),
    performanceMetrics: z.record(z.any()).optional(),
    isActive: commonSchemas.boolean.default(true),
  }),
  update: z.object({
    name: z.string().min(2, 'Model name must be at least 2 characters').optional(),
    description: commonSchemas.optionalString,
    version: z.string().min(1, 'Version is required').optional(),
    modelType: z.string().min(1, 'Model type is required').optional(),
    architecture: z.record(z.any()).optional(),
    trainingDataInfo: z.record(z.any()).optional(),
    performanceMetrics: z.record(z.any()).optional(),
    isActive: commonSchemas.boolean.optional(),
  }),
  prediction: z.object({
    modelId: commonSchemas.id,
    inputData: z.record(z.any()),
    options: z.object({
      confidenceThreshold: commonSchemas.percentage.optional(),
      includeMetadata: commonSchemas.boolean.default(false),
    }).optional(),
  }),
};

// Financial instrument validation schemas
export const instrumentSchemas = {
  create: z.object({
    symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['stock', 'bond', 'commodity', 'forex', 'index', 'option', 'future']),
    exchange: z.string().min(1, 'Exchange is required'),
    currency: z.string().min(3, 'Currency code must be 3 characters').max(3, 'Currency code too long'),
    isActive: commonSchemas.boolean.default(true),
  }),
  update: z.object({
    symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    type: z.enum(['stock', 'bond', 'commodity', 'forex', 'index', 'option', 'future']).optional(),
    exchange: z.string().min(1, 'Exchange is required').optional(),
    currency: z.string().min(3, 'Currency code must be 3 characters').max(3, 'Currency code too long').optional(),
    isActive: commonSchemas.boolean.optional(),
  }),
  marketData: z.object({
    instrumentId: commonSchemas.id,
    timestamp: commonSchemas.datetime,
    open: commonSchemas.nonNegativeNumber.optional(),
    high: commonSchemas.nonNegativeNumber.optional(),
    low: commonSchemas.nonNegativeNumber.optional(),
    close: commonSchemas.nonNegativeNumber.optional(),
    volume: commonSchemas.nonNegativeNumber.optional(),
    dataSource: z.string().min(1, 'Data source is required'),
  }),
};

// Portfolio validation schemas
export const portfolioSchemas = {
  create: z.object({
    name: z.string().min(2, 'Portfolio name must be at least 2 characters'),
    description: commonSchemas.optionalString,
    isActive: commonSchemas.boolean.default(true),
  }),
  update: z.object({
    name: z.string().min(2, 'Portfolio name must be at least 2 characters').optional(),
    description: commonSchemas.optionalString,
    isActive: commonSchemas.boolean.optional(),
  }),
  addHolding: z.object({
    instrumentId: commonSchemas.id,
    quantity: commonSchemas.positiveNumber,
    avgPrice: commonSchemas.positiveNumber,
  }),
  updateHolding: z.object({
    quantity: commonSchemas.positiveNumber.optional(),
    avgPrice: commonSchemas.positiveNumber.optional(),
  }),
  riskMetric: z.object({
    metricType: z.enum(['var', 'cvar', 'beta', 'sharpe', 'volatility', 'max_drawdown']),
    value: commonSchemas.number,
  }),
};

// News and sentiment validation schemas
export const newsSchemas = {
  create: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    source: z.string().min(1, 'Source is required'),
    url: commonSchemas.url.optional(),
    publishedAt: commonSchemas.datetime,
    sentiment: z.number().min(-1).max(1).optional(),
    relevance: commonSchemas.percentage.optional(),
  }),
  analyzeSentiment: z.object({
    content: z.string().min(10, 'Content must be at least 10 characters'),
    type: z.enum(['news', 'social']).default('news'),
    source: z.string().optional(),
    userId: commonSchemas.id.optional(),
  }),
  batchAnalyze: z.object({
    articles: z.array(z.object({
      title: z.string().min(5, 'Title must be at least 5 characters'),
      content: z.string().min(10, 'Content must be at least 10 characters'),
      source: z.string().min(1, 'Source is required'),
    })).min(1, 'At least one article is required'),
    userId: commonSchemas.id.optional(),
  }),
  summarize: z.object({
    content: z.string().min(50, 'Content must be at least 50 characters'),
    maxLength: commonSchemas.positiveNumber.optional(),
    style: z.enum(['formal', 'casual', 'technical']).default('formal'),
  }),
};

// Trading strategy validation schemas
export const strategySchemas = {
  create: z.object({
    name: z.string().min(2, 'Strategy name must be at least 2 characters'),
    description: commonSchemas.optionalString,
    modelConfig: z.record(z.any()),
    parameters: z.record(z.any()),
    isActive: commonSchemas.boolean.default(true),
  }),
  update: z.object({
    name: z.string().min(2, 'Strategy name must be at least 2 characters').optional(),
    description: commonSchemas.optionalString,
    modelConfig: z.record(z.any()).optional(),
    parameters: z.record(z.any()).optional(),
    isActive: commonSchemas.boolean.optional(),
  }),
  backtest: z.object({
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    initialCapital: commonSchemas.positiveNumber,
    config: z.record(z.any()),
  }),
  generate: z.object({
    marketConditions: z.string().min(10, 'Market conditions description is required'),
    riskTolerance: z.enum(['low', 'medium', 'high']),
    timeHorizon: z.enum(['short', 'medium', 'long']),
    preferredAssets: z.array(z.string()).optional(),
  }),
};

// Options validation schemas
export const optionsSchemas = {
  price: z.object({
    underlying: z.string().min(1, 'Underlying symbol is required'),
    strike: commonSchemas.positiveNumber,
    expiry: commonSchemas.date,
    optionType: z.enum(['call', 'put']),
    spotPrice: commonSchemas.positiveNumber,
    volatility: commonSchemas.percentage,
    riskFreeRate: commonSchemas.percentage.optional(),
    dividendYield: commonSchemas.percentage.optional(),
  }),
  greeks: z.object({
    underlying: z.string().min(1, 'Underlying symbol is required'),
    strike: commonSchemas.positiveNumber,
    expiry: commonSchemas.date,
    optionType: z.enum(['call', 'put']),
    spotPrice: commonSchemas.positiveNumber,
    volatility: commonSchemas.percentage,
  }),
  analyze: z.object({
    underlying: z.string().min(1, 'Underlying symbol is required'),
    strategyType: z.enum(['long_call', 'long_put', 'covered_call', 'protective_put', 'straddle', 'strangle']),
    strikes: z.array(commonSchemas.positiveNumber).min(1, 'At least one strike is required'),
    expiries: z.array(commonSchemas.date).min(1, 'At least one expiry is required'),
    riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  chain: z.object({
    underlying: z.string().min(1, 'Underlying symbol is required'),
    expiry: commonSchemas.date,
  }),
};

// Risk analysis validation schemas
export const riskSchemas = {
  analyze: z.object({
    portfolioId: commonSchemas.id,
    confidenceLevel: commonSchemas.percentage.default(0.95),
    timeHorizon: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
    includeStressTest: commonSchemas.boolean.default(true),
    scenarios: z.array(z.object({
      name: z.string().min(1, 'Scenario name is required'),
      description: z.string().min(10, 'Scenario description is required'),
      impact: commonSchemas.percentage,
      probability: commonSchemas.percentage,
    })).optional(),
  }),
  var: z.object({
    portfolioId: commonSchemas.id,
    confidenceLevel: commonSchemas.percentage.default(0.95),
    timeHorizon: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
  }),
  optimization: z.object({
    portfolioId: commonSchemas.id,
    targetReturn: commonSchemas.percentage.optional(),
    maxRisk: commonSchemas.percentage.optional(),
    constraints: z.record(z.any()).optional(),
  }),
};

// Fund flow validation schemas
export const fundFlowSchemas = {
  predict: z.object({
    daysAhead: commonSchemas.positiveNumber.max(30, 'Maximum 30 days ahead'),
    segment: z.enum(['cash', 'derivatives', 'debt', 'all']).default('all'),
    includeHistorical: commonSchemas.boolean.default(true),
    confidenceThreshold: commonSchemas.percentage.optional(),
  }),
  analyze: z.object({
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    segment: z.enum(['cash', 'derivatives', 'debt', 'all']).default('all'),
    includeCorrelation: commonSchemas.boolean.default(true),
  }),
  historical: z.object({
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    segment: z.enum(['cash', 'derivatives', 'debt', 'all']).default('all'),
  }),
};

// Tax optimization validation schemas
export const taxSchemas = {
  optimize: z.object({
    incomeType: z.enum(['salary', 'business', 'capital_gains', 'rental', 'other']),
    incomeAmount: commonSchemas.positiveNumber,
    financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid financial year format (YYYY-YY)'),
    deductions: z.record(commonSchemas.nonNegativeNumber).optional(),
    investments: z.record(commonSchemas.nonNegativeNumber).optional(),
    regime: z.enum(['old', 'new']).default('new'),
  }),
  calculate: z.object({
    incomeType: z.enum(['salary', 'business', 'capital_gains', 'rental', 'other']),
    incomeAmount: commonSchemas.positiveNumber,
    financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid financial year format (YYYY-YY)'),
    deductions: z.record(commonSchemas.nonNegativeNumber).optional(),
  }),
};

// Payment validation schemas
export const paymentSchemas = {
  createIntent: z.object({
    amount: commonSchemas.positiveNumber,
    currency: z.string().default('INR'),
    paymentMethod: z.enum(['card', 'upi', 'wallet', 'net_banking']).default('upi'),
    description: z.string().min(1, 'Description is required'),
    metadata: z.record(z.any()).optional(),
  }),
  confirmIntent: z.object({
    paymentIntentId: commonSchemas.string,
    paymentMethodId: commonSchemas.string.optional(),
    return_url: commonSchemas.url.optional(),
  }),
  createMethod: z.object({
    type: z.enum(['card', 'upi', 'wallet', 'net_banking']),
    card: z.object({
      number: z.string().regex(/^\d{16}$/, 'Invalid card number'),
      expMonth: commonSchemas.positiveNumber.max(12),
      expYear: commonSchemas.positiveNumber,
      cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
    }).optional(),
    upi: z.object({
      vpa: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/, 'Invalid UPI VPA'),
    }).optional(),
  }),
  initiateUPI: z.object({
    amount: commonSchemas.positiveNumber,
    vpa: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/, 'Invalid UPI VPA'),
    description: z.string().min(1, 'Description is required'),
  }),
  initiateWallet: z.object({
    amount: commonSchemas.positiveNumber,
    provider: z.enum(['paytm', 'phonepe', 'gpay', 'amazonpay']),
    mobile: z.string().regex(/^\d{10}$/, 'Invalid mobile number'),
    description: z.string().min(1, 'Description is required'),
  }),
};

// Database backup validation schemas
export const backupSchemas = {
  create: z.object({
    type: z.enum(['full', 'incremental', 'differential']),
    priority: z.enum(['high', 'normal', 'low']).default('normal'),
    compression: z.boolean().default(true),
    encryption: z.boolean().default(true),
    description: commonSchemas.optionalString,
  }),
  restore: z.object({
    backupId: commonSchemas.id,
    targetDatabase: z.string().min(1, 'Target database is required'),
    overwrite: z.boolean().default(false),
    verify: z.boolean().default(true),
  }),
  schedule: z.object({
    type: z.enum(['full', 'incremental', 'differential']),
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    retentionDays: commonSchemas.positiveNumber.default(30),
    priority: z.enum(['high', 'normal', 'low']).default('normal'),
  }),
  config: z.object({
    storageType: z.enum(['local', 's3', 'gcs', 'azure']),
    localPath: z.string().optional(),
    s3Config: z.object({
      bucket: z.string().min(1, 'S3 bucket is required'),
      region: z.string().min(1, 'S3 region is required'),
      accessKey: z.string().min(1, 'S3 access key is required'),
      secretKey: z.string().min(1, 'S3 secret key is required'),
    }).optional(),
    gcsConfig: z.object({
      bucket: z.string().min(1, 'GCS bucket is required'),
      projectId: z.string().min(1, 'GCS project ID is required'),
      keyFile: z.string().min(1, 'GCS key file is required'),
    }).optional(),
    azureConfig: z.object({
      container: z.string().min(1, 'Azure container is required'),
      connectionString: z.string().min(1, 'Azure connection string is required'),
    }).optional(),
  }),
};

// Logging validation schemas
export const logSchemas = {
  query: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
    component: z.string().optional(),
    startDate: commonSchemas.datetime.optional(),
    endDate: commonSchemas.datetime.optional(),
    userId: commonSchemas.id.optional(),
    sessionId: z.string().optional(),
    search: z.string().optional(),
    ...commonSchemas.pagination.shape,
  }),
  audit: z.object({
    eventType: z.enum([
      'user_login', 'user_logout', 'user_create', 'user_update', 'user_delete',
      'subscription_create', 'subscription_update', 'subscription_cancel',
      'prediction_create', 'prediction_update', 'prediction_delete',
      'portfolio_create', 'portfolio_update', 'portfolio_delete',
      'payment_create', 'payment_update', 'payment_refund',
      'backup_create', 'backup_restore', 'backup_delete',
      'config_update', 'security_event', 'system_event'
    ]).optional(),
    userId: commonSchemas.id.optional(),
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    action: z.string().optional(),
    startDate: commonSchemas.datetime.optional(),
    endDate: commonSchemas.datetime.optional(),
    ...commonSchemas.pagination.shape,
  }),
  export: z.object({
    format: z.enum(['csv', 'json', 'xml']).default('csv'),
    level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
    component: z.string().optional(),
    startDate: commonSchemas.datetime.optional(),
    endDate: commonSchemas.datetime.optional(),
    compression: z.boolean().default(true),
  }),
  rules: z.object({
    eventType: z.enum([
      'user_login', 'user_logout', 'user_create', 'user_update', 'user_delete',
      'subscription_create', 'subscription_update', 'subscription_cancel',
      'prediction_create', 'prediction_update', 'prediction_delete',
      'portfolio_create', 'portfolio_update', 'portfolio_delete',
      'payment_create', 'payment_update', 'payment_refund',
      'backup_create', 'backup_restore', 'backup_delete',
      'config_update', 'security_event', 'system_event'
    ]),
    conditions: z.record(z.any()),
    actions: z.array(z.enum(['alert', 'block', 'log', 'notify'])),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    description: z.string().min(1, 'Description is required'),
  }),
};

// Export validation schemas
export const exportSchemas = {
  createJob: z.object({
    type: z.enum(['data', 'report']),
    format: z.enum(['csv', 'excel', 'pdf', 'json', 'xml']),
    templateId: commonSchemas.id.optional(),
    filters: z.record(z.any()).optional(),
    options: z.object({
      compression: z.boolean().default(true),
      includeHeaders: z.boolean().default(true),
      dateFormat: z.string().default('YYYY-MM-DD'),
      timezone: z.string().default('UTC'),
    }).optional(),
  }),
  createTemplate: z.object({
    name: z.string().min(2, 'Template name must be at least 2 characters'),
    description: commonSchemas.optionalString,
    format: z.enum(['csv', 'excel', 'pdf', 'json', 'xml']),
    sections: z.array(z.object({
      title: z.string().min(1, 'Section title is required'),
      type: z.enum(['chart', 'table', 'text', 'metrics', 'custom']),
      config: z.record(z.any()),
      order: commonSchemas.positiveNumber,
    })).min(1, 'At least one section is required'),
    isDefault: z.boolean().default(false),
  }),
  schedule: z.object({
    name: z.string().min(2, 'Schedule name must be at least 2 characters'),
    templateId: commonSchemas.id,
    format: z.enum(['csv', 'excel', 'pdf', 'json', 'xml']),
    schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    nextRun: commonSchemas.datetime,
    isActive: z.boolean().default(true),
    recipients: z.array(commonSchemas.email).min(1, 'At least one recipient is required'),
  }),
};

// Utility functions for validation
export const validateWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const validateWithSchemaAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  return await schema.parseAsync(data);
};

export const safeParseWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};

export const createValidationError = (error: z.ZodError) => {
  return {
    success: false,
    error: 'Validation failed',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
    timestamp: new Date().toISOString(),
  };
};

// Export all schemas
export const schemas = {
  common: commonSchemas,
  user: userSchemas,
  subscription: subscriptionSchemas,
  aiModel: aiModelSchemas,
  instrument: instrumentSchemas,
  portfolio: portfolioSchemas,
  news: newsSchemas,
  strategy: strategySchemas,
  options: optionsSchemas,
  risk: riskSchemas,
  fundFlow: fundFlowSchemas,
  tax: taxSchemas,
  payment: paymentSchemas,
  backup: backupSchemas,
  log: logSchemas,
  export: exportSchemas,
};