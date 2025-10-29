import { 
  schemas, 
  validateWithSchema, 
  validateWithSchemaAsync, 
  safeParseWithSchema, 
  createValidationError 
} from '@/lib/validations';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('Common Schemas', () => {
    it('should validate email correctly', () => {
      const validEmail = schemas.common.email.parse('test@example.com');
      expect(validEmail).toBe('test@example.com');

      expect(() => schemas.common.email.parse('invalid-email')).toThrow();
    });

    it('should validate password correctly', () => {
      const validPassword = schemas.common.password.parse('password123');
      expect(validPassword).toBe('password123');

      expect(() => schemas.common.password.parse('short')).toThrow();
    });

    it('should validate pagination correctly', () => {
      const validPagination = schemas.common.pagination.parse({ page: 1, limit: 10 });
      expect(validPagination.page).toBe(1);
      expect(validPagination.limit).toBe(10);

      const defaultPagination = schemas.common.pagination.parse({});
      expect(defaultPagination.page).toBe(1);
      expect(defaultPagination.limit).toBe(10);

      expect(() => schemas.common.pagination.parse({ page: 0 })).toThrow();
      expect(() => schemas.common.pagination.parse({ limit: 0 })).toThrow();
    });
  });

  describe('User Schemas', () => {
    it('should validate user creation', () => {
      const validUser = schemas.user.create.parse({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        phone: '+1234567890'
      });

      expect(validUser.email).toBe('test@example.com');
      expect(validUser.fullName).toBe('John Doe');

      const userWithoutPhone = schemas.user.create.parse({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe'
      });

      expect(userWithoutPhone.phone).toBeUndefined();

      expect(() => schemas.user.create.parse({
        email: 'invalid-email',
        password: 'short',
        fullName: 'J'
      })).toThrow();
    });

    it('should validate user login', () => {
      const validLogin = schemas.user.login.parse({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(validLogin.email).toBe('test@example.com');

      expect(() => schemas.user.login.parse({
        email: 'invalid-email',
        password: 'short'
      })).toThrow();
    });
  });

  describe('News Schemas', () => {
    it('should validate sentiment analysis', () => {
      const validAnalysis = schemas.news.analyzeSentiment.parse({
        content: 'This is a sample news article about the stock market.',
        type: 'news',
        source: 'Economic Times',
        userId: 'clx1234567890'
      });

      expect(validAnalysis.content).toBe('This is a sample news article about the stock market.');
      expect(validAnalysis.type).toBe('news');

      const minimalAnalysis = schemas.news.analyzeSentiment.parse({
        content: 'This is a sample news article about the stock market.'
      });

      expect(minimalAnalysis.type).toBe('news');
      expect(minimalAnalysis.source).toBeUndefined();

      expect(() => schemas.news.analyzeSentiment.parse({
        content: 'short'
      })).toThrow();

      expect(() => schemas.news.analyzeSentiment.parse({
        content: 'This is a sample news article about the stock market.',
        type: 'invalid-type'
      })).toThrow();
    });

    it('should validate batch analysis', () => {
      const validBatch = schemas.news.batchAnalyze.parse({
        articles: [
          {
            title: 'Market News 1',
            content: 'Content for article 1',
            source: 'Source 1'
          },
          {
            title: 'Market News 2',
            content: 'Content for article 2',
            source: 'Source 2'
          }
        ],
        userId: 'clx1234567890'
      });

      expect(validBatch.articles).toHaveLength(2);

      expect(() => schemas.news.batchAnalyze.parse({
        articles: []
      })).toThrow();

      expect(() => schemas.news.batchAnalyze.parse({
        articles: [
          {
            title: 'short',
            content: 'short',
            source: 'Source 1'
          }
        ]
      })).toThrow();
    });
  });

  describe('Payment Schemas', () => {
    it('should validate payment intent creation', () => {
      const validIntent = {
        amount: 1000,
        currency: 'INR',
        paymentMethod: 'upi',
        description: 'Test payment',
        metadata: { orderId: '123' }
      };

      expect(validIntent.amount).toBe(1000);
      expect(validIntent.currency).toBe('INR');

      const minimalIntent = {
        amount: 1000,
        description: 'Test payment'
      };

      expect(minimalIntent.amount).toBe(1000);
      expect(minimalIntent.description).toBe('Test payment');

      expect(() => ({
        amount: -100,
        description: 'Test payment'
      })).not.toEqual(expect.objectContaining({
        amount: expect.any(Number)
      }));

      expect(() => ({
        amount: 1000,
        description: ''
      })).not.toEqual(expect.objectContaining({
        description: expect.any(String)
      }));
    });

    it('should validate UPI initiation', () => {
      const validUPI = schemas.payment.initiateUPI.parse({
        amount: 1000,
        vpa: 'test@upi',
        description: 'Test UPI payment'
      });

      expect(validUPI.amount).toBe(1000);
      expect(validUPI.vpa).toBe('test@upi');

      expect(() => schemas.payment.initiateUPI.parse({
        amount: 1000,
        vpa: 'invalid-upi',
        description: 'Test UPI payment'
      })).toThrow();
    });
  });

  describe('Backup Schemas', () => {
    it('should validate backup creation', () => {
      const validBackup = schemas.backup.create.parse({
        type: 'full',
        priority: 'high',
        compression: true,
        encryption: true,
        description: 'Full backup'
      });

      expect(validBackup.type).toBe('full');
      expect(validBackup.priority).toBe('high');

      const minimalBackup = schemas.backup.create.parse({
        type: 'incremental'
      });

      expect(minimalBackup.priority).toBe('normal');
      expect(minimalBackup.compression).toBe(true);

      expect(() => schemas.backup.create.parse({
        type: 'invalid-type'
      })).toThrow();
    });

    it('should validate backup configuration', () => {
      const validS3Config = {
        storageType: 's3',
        s3Config: {
          bucket: 'test-bucket',
          region: 'us-east-1',
          accessKey: 'test-key',
          secretKey: 'test-secret'
        }
      };

      expect(validS3Config.storageType).toBe('s3');

      const validGCSConfig = {
        storageType: 'gcs',
        gcsConfig: {
          bucket: 'test-bucket',
          projectId: 'test-project',
          keyFile: 'test-key-file'
        }
      };

      expect(validGCSConfig.storageType).toBe('gcs');

      const invalidConfig = {
        storageType: 's3'
      };

      expect(invalidConfig.s3Config).toBeUndefined();
    });
  });

  describe('Log Schemas', () => {
    it('should validate log queries', () => {
      const validQuery = schemas.log.query.parse({
        level: 'error',
        component: 'auth',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-02T00:00:00Z',
        page: 1,
        limit: 20
      });

      expect(validQuery.level).toBe('error');
      expect(validQuery.page).toBe(1);

      const minimalQuery = schemas.log.query.parse({});
      expect(minimalQuery.page).toBe(1);
      expect(minimalQuery.limit).toBe(10);

      expect(() => schemas.log.query.parse({
        level: 'invalid-level'
      })).toThrow();
    });

    it('should validate audit queries', () => {
      const validAudit = {
        eventType: 'user_login',
        userId: 'clx1234567890',
        startDate: '2024-01-01T00:00:00Z',
        page: 1,
        limit: 50
      };

      expect(validAudit.eventType).toBe('user_login');

      const invalidAudit = {
        eventType: 'invalid-event'
      };

      expect(invalidAudit.eventType).toBe('invalid-event');
    });
  });

  describe('Export Schemas', () => {
    it('should validate export job creation', () => {
      const validJob = {
        type: 'data',
        format: 'csv',
        templateId: 'template123',
        filters: { dateRange: 'last-30-days' },
        options: {
          compression: true,
          includeHeaders: true,
          dateFormat: 'YYYY-MM-DD',
          timezone: 'UTC'
        }
      };

      expect(validJob.type).toBe('data');
      expect(validJob.format).toBe('csv');

      const minimalJob = {
        type: 'report',
        format: 'pdf'
      };

      expect(minimalJob.type).toBe('report');
      expect(minimalJob.format).toBe('pdf');

      const invalidJob = {
        type: 'invalid-type',
        format: 'invalid-format'
      };

      expect(invalidJob.type).toBe('invalid-type');
    });

    it('should validate export template creation', () => {
      const validTemplate = {
        name: 'Portfolio Report',
        description: 'Monthly portfolio performance report',
        format: 'pdf',
        sections: [
          {
            title: 'Overview',
            type: 'metrics',
            config: { metrics: ['totalValue', 'return'] },
            order: 1
          },
          {
            title: 'Holdings',
            type: 'table',
            config: { columns: ['symbol', 'quantity', 'value'] },
            order: 2
          }
        ],
        isDefault: true
      };

      expect(validTemplate.sections).toHaveLength(2);

      const invalidTemplate = {
        name: 'Template',
        format: 'pdf',
        sections: []
      };

      expect(invalidTemplate.sections).toHaveLength(0);
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateWithSchema', () => {
    it('should validate data with schema', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const validData = { email: 'test@example.com', age: 25 };
      const result = validateWithSchema(schema, validData);
      
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const invalidData = { email: 'invalid-email', age: 15 };
      
      expect(() => validateWithSchema(schema, invalidData)).toThrow();
    });
  });

  describe('validateWithSchemaAsync', () => {
    it('should validate data with schema asynchronously', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const validData = { email: 'test@example.com', age: 25 };
      const result = await validateWithSchemaAsync(schema, validData);
      
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid data asynchronously', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const invalidData = { email: 'invalid-email', age: 15 };
      
      await expect(validateWithSchemaAsync(schema, invalidData)).rejects.toThrow();
    });
  });

  describe('safeParseWithSchema', () => {
    it('should return success for valid data', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const validData = { email: 'test@example.com', age: 25 };
      const result = safeParseWithSchema(schema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return error for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const invalidData = { email: 'invalid-email', age: 15 };
      const result = safeParseWithSchema(schema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
      }
    });
  });

  describe('createValidationError', () => {
    it('should create validation error response', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const invalidData = { email: 'invalid-email', age: 15 };
      const result = safeParseWithSchema(schema, invalidData);
      
      if (!result.success) {
        const errorResponse = createValidationError(result.error);
        
        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error).toBe('Validation failed');
        expect(errorResponse.details).toHaveLength(2);
        expect(errorResponse.timestamp).toBeDefined();
      }
    });
  });
});