import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Error factory functions
export const createError = {
  validation: (message: string, details?: any) => 
    new CustomError(message, 400, ErrorTypes.VALIDATION_ERROR),
  
  authentication: (message: string = 'Authentication required') => 
    new CustomError(message, 401, ErrorTypes.AUTHENTICATION_ERROR),
  
  authorization: (message: string = 'Insufficient permissions') => 
    new CustomError(message, 403, ErrorTypes.AUTHORIZATION_ERROR),
  
  notFound: (resource: string = 'Resource') => 
    new CustomError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND),
  
  conflict: (message: string) => 
    new CustomError(message, 409, ErrorTypes.CONFLICT),
  
  rateLimit: (message: string = 'Too many requests') => 
    new CustomError(message, 429, ErrorTypes.RATE_LIMIT_EXCEEDED),
  
  database: (message: string = 'Database error') => 
    new CustomError(message, 500, ErrorTypes.DATABASE_ERROR),
  
  external: (service: string, message?: string) => 
    new CustomError(message || `External service error: ${service}`, 502, ErrorTypes.EXTERNAL_SERVICE_ERROR),
  
  internal: (message: string = 'Internal server error') => 
    new CustomError(message, 500, ErrorTypes.INTERNAL_ERROR),
};

// Error response formatter
function formatErrorResponse(error: AppError, req: Request) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: any = {
    error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500,
    }
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.error.requestId = req.headers['x-request-id'];
  }

  return response;
}

// Main error handling middleware
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  const logLevel = error.statusCode && error.statusCode < 500 ? 'warn' : 'error';
  
  logger[logLevel]('Request error', {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
  });

  // Handle specific error types
  if (error instanceof ZodError) {
    const formattedError = createError.validation('Validation failed', error.errors);
    return res.status(400).json(formatErrorResponse(formattedError, req));
  }

  // Handle rate limiting errors
  if (error.message.includes('Too many requests')) {
    const formattedError = createError.rateLimit(error.message);
    return res.status(429).json(formatErrorResponse(formattedError, req));
  }

  // Handle database errors
  if (error.message.includes('database') || error.message.includes('connection')) {
    const formattedError = createError.database('Database operation failed');
    return res.status(500).json(formatErrorResponse(formattedError, req));
  }

  // Handle JWT errors
  if (error.message.includes('jwt') || error.message.includes('token')) {
    const formattedError = createError.authentication('Invalid or expired token');
    return res.status(401).json(formatErrorResponse(formattedError, req));
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const response = formatErrorResponse(error, req);
  
  res.status(statusCode).json(response);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = createError.notFound(`Route ${req.method} ${req.path}`);
  next(error);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}