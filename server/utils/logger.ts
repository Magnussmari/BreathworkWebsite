const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    if (isProduction) {
      // In production, only log ERROR and WARN
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    return false;
  }

  private formatLog(level: LogLevel, message: string, data?: any, context?: { userId?: string; requestId?: string }): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      userId: context?.userId,
      requestId: context?.requestId
    };
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private log(level: LogLevel, message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    if (!this.shouldLog(level)) return;
    
    const logEntry = this.formatLog(level, message, data, context);
    
    if (isDevelopment) {
      // Pretty print in development
      console[level](`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, data ? logEntry.data : '');
    } else {
      // JSON format in production
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  warn(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  info(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  debug(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }
}

export const logger = new Logger();