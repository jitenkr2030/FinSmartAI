import { NextRequest, NextResponse } from 'next/server';
import { ValidationMiddleware, withValidation } from '@/lib/middleware/validationMiddleware';
import { z } from 'zod';

// Simple mock for NextRequest
const createMockRequest = (method: string = 'POST', body?: any, query?: any) => {
  const url = new URL('http://localhost:3000/api/test');
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  return {
    method,
    url: url.toString(),
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

const createMockContext = (params?: any) => ({
  params,
  validatedData: undefined,
});

describe('ValidationMiddleware', () => {
  describe('withSchema', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      age: z.number().min(18),
    });

    it('should validate body data successfully', async () => {
      const request = createMockRequest('POST', { name: 'John Doe', age: 25 });
      const context = createMockContext();

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'body',
      });

      const result = await middleware(request, context);

      expect(result).toBeNull(); // Should continue to next handler
      expect(context.validatedData).toEqual({
        name: 'John Doe',
        age: 25,
      });
    });

    it('should validate query data successfully', async () => {
      const request = createMockRequest('GET', undefined, { name: 'John', age: '25' });
      const context = createMockContext();

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'query',
      });

      const result = await middleware(request, context);

      expect(result).toBeNull();
      expect(context.validatedData).toEqual({
        name: 'John',
        age: 25,
      });
    });

    it('should validate params data successfully', async () => {
      const request = createMockRequest('GET');
      const context = createMockContext({ name: 'John', age: '25' });

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'params',
      });

      const result = await middleware(request, context);

      expect(result).toBeNull();
      expect(context.validatedData).toEqual({
        name: 'John',
        age: 25,
      });
    });

    it('should return validation error for invalid body data', async () => {
      const request = createMockRequest('POST', { name: 'J', age: 15 });
      const context = createMockContext();

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'body',
      });

      const result = await middleware(request, context);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should return error for body validation on GET request', async () => {
      const request = createMockRequest('GET');
      const context = createMockContext();

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'body',
      });

      const result = await middleware(request, context);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should use custom error handler', async () => {
      const request = createMockRequest('POST', { name: 'J', age: 15 });
      const context = createMockContext();

      const customErrorHandler = jest.fn().mockReturnValue(
        NextResponse.json({ custom: 'error' }, { status: 422 })
      );

      const middleware = ValidationMiddleware.withSchema({
        schema: testSchema,
        source: 'body',
        onError: customErrorHandler,
      });

      const result = await middleware(request, context);

      expect(customErrorHandler).toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe('validateRequest', () => {
    const bodySchema = z.object({
      email: z.string().email(),
    });

    const querySchema = z.object({
      page: z.coerce.number().min(1),
    });

    const paramsSchema = z.object({
      id: z.string().cuid(),
    });

    it('should validate body, query, and params together', async () => {
      const request = createMockRequest(
        'POST',
        { email: 'test@example.com' },
        { page: '1' }
      );
      const context = createMockContext({ id: 'clx1234567890' });

      const middleware = ValidationMiddleware.validateRequest(
        bodySchema,
        querySchema,
        paramsSchema
      );

      const result = await middleware(request, context);

      expect(result).toBeNull();
      expect(context.validatedData).toEqual({
        body: { email: 'test@example.com' },
        query: { page: 1 },
        params: { id: 'clx1234567890' },
      });
    });

    it('should validate only body and query', async () => {
      const request = createMockRequest(
        'POST',
        { email: 'test@example.com' },
        { page: '1' }
      );
      const context = createMockContext();

      const middleware = ValidationMiddleware.validateRequest(
        bodySchema,
        querySchema
      );

      const result = await middleware(request, context);

      expect(result).toBeNull();
      expect(context.validatedData).toEqual({
        body: { email: 'test@example.com' },
        query: { page: 1 },
      });
    });

    it('should skip body validation for GET requests', async () => {
      const request = createMockRequest('GET', undefined, { page: '1' });
      const context = createMockContext();

      const middleware = ValidationMiddleware.validateRequest(
        bodySchema,
        querySchema
      );

      const result = await middleware(request, context);

      expect(result).toBeNull();
      expect(context.validatedData).toEqual({
        query: { page: 1 },
      });
    });

    it('should return validation error for invalid data', async () => {
      const request = createMockRequest(
        'POST',
        { email: 'invalid-email' },
        { page: '0' }
      );
      const context = createMockContext();

      const middleware = ValidationMiddleware.validateRequest(
        bodySchema,
        querySchema
      );

      const result = await middleware(request, context);

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe('withValidation', () => {
    const testSchema = z.object({
      message: z.string().min(1),
    });

    it('should call handler with validated data', async () => {
      const request = createMockRequest('POST', { message: 'Hello World' });
      const context = createMockContext();

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const wrappedHandler = withValidation(mockHandler, {
        bodySchema: testSchema,
      });

      const result = await wrappedHandler(request, context);

      expect(mockHandler).toHaveBeenCalledWith(request, context);
      expect(context.validatedData).toEqual({
        body: { message: 'Hello World' },
      });
    });

    it('should return validation error without calling handler', async () => {
      const request = createMockRequest('POST', { message: '' });
      const context = createMockContext();

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const wrappedHandler = withValidation(mockHandler, {
        bodySchema: testSchema,
      });

      const result = await wrappedHandler(request, context);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle handler errors', async () => {
      const request = createMockRequest('POST', { message: 'Hello World' });
      const context = createMockContext();

      const mockHandler = jest.fn().mockRejectedValue(
        new Error('Handler error')
      );

      const wrappedHandler = withValidation(mockHandler, {
        bodySchema: testSchema,
      });

      await expect(wrappedHandler(request, context)).rejects.toThrow('Handler error');
    });
  });
});

describe('Integration Examples', () => {
  it('should work with complex nested schemas', async () => {
    const complexSchema = z.object({
      user: z.object({
        name: z.string().min(2),
        email: z.string().email(),
      }),
      preferences: z.object({
        theme: z.enum(['light', 'dark']),
        notifications: z.boolean(),
      }).optional(),
    });

    const request = createMockRequest('POST', {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    });

    const context = createMockContext();

    const middleware = ValidationMiddleware.withSchema({
      schema: complexSchema,
      source: 'body',
    });

    const result = await middleware(request, context);

    expect(result).toBeNull();
    expect(context.validatedData).toEqual({
      user: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    });
  });

  it('should work with array validation', async () => {
    const arraySchema = z.object({
      items: z.array(z.object({
        id: z.string(),
        quantity: z.number().positive(),
      })),
    });

    const request = createMockRequest('POST', {
      items: [
        { id: '1', quantity: 5 },
        { id: '2', quantity: 10 },
      ],
    });

    const context = createMockContext();

    const middleware = ValidationMiddleware.withSchema({
      schema: arraySchema,
      source: 'body',
    });

    const result = await middleware(request, context);

    expect(result).toBeNull();
    expect(context.validatedData).toEqual({
      items: [
        { id: '1', quantity: 5 },
        { id: '2', quantity: 10 },
      ],
    });
  });

  it('should work with enum validation', async () => {
    const enumSchema = z.object({
      status: z.enum(['active', 'inactive', 'pending']),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    });

    const request = createMockRequest('POST', {
      status: 'active',
      priority: 'high',
    });

    const context = createMockContext();

    const middleware = ValidationMiddleware.withSchema({
      schema: enumSchema,
      source: 'body',
    });

    const result = await middleware(request, context);

    expect(result).toBeNull();
    expect(context.validatedData).toEqual({
      status: 'active',
      priority: 'high',
    });
  });
});