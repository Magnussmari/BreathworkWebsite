import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { sanitizeText, sanitizeHtml, sanitizeEmail, sanitizeNumeric } from '../utils/sanitizer';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format').transform(sanitizeEmail),
  phone: z.string().min(8).max(20).optional(),
  name: z.string().min(1).max(100).transform(sanitizeText),
  description: z.string().max(1000).transform(sanitizeHtml),
  price: z.number().positive().transform(sanitizeNumeric),
  date: z.string().datetime().or(z.date()),
  boolean: z.boolean(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().min(0),
};

// Generic validation middleware factory
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', { 
          errors: error.errors,
          body: req.body,
          path: req.path 
        });
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      logger.error('Validation middleware error', { error: error.message });
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Query validation error', { 
          errors: error.errors,
          query: req.query,
          path: req.path 
        });
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      logger.error('Query validation middleware error', { error: error.message });
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Params validation error', { 
          errors: error.errors,
          params: req.params,
          path: req.path 
        });
        return res.status(400).json({
          message: 'Invalid URL parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      logger.error('Params validation middleware error', { error: error.message });
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

// Specific validation schemas for common endpoints
export const validationSchemas = {
  // User registration
  register: z.object({
    email: commonSchemas.email,
    password: z.string().min(8).max(128),
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone,
  }),

  // User login
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1),
  }),

  // Class creation
  createClass: z.object({
    templateId: commonSchemas.id,
    scheduledDate: commonSchemas.date,
    location: commonSchemas.name,
    maxCapacity: commonSchemas.positiveInt,
    customPrice: commonSchemas.price.optional(),
    instructorNotes: commonSchemas.description.optional(),
  }),

  // Registration
  createRegistration: z.object({
    classId: commonSchemas.id,
    paymentAmount: commonSchemas.price,
    paymentMethod: z.enum(['bank_transfer', 'pay_on_arrival']).default('bank_transfer'),
    notes: commonSchemas.description.optional(),
  }),

  // Time slot creation
  createTimeSlot: z.object({
    instructorId: commonSchemas.id,
    serviceId: commonSchemas.id,
    startTime: commonSchemas.date,
    endTime: commonSchemas.date,
  }),

  // Pagination
  pagination: z.object({
    page: commonSchemas.nonNegativeInt.default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Date range
  dateRange: z.object({
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
  }),
};

// Sanitization middleware for all text inputs
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeText(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive fields
        if (['password', 'passwordHash', 'token', 'secret'].includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}