/**
 * Simple HTML sanitization utility to prevent XSS in email templates
 * This is a basic implementation - for production, consider using a library like DOMPurify
 */

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    // Remove any remaining potentially dangerous characters
    .replace(/[<>]/g, '')
    // Limit length to prevent abuse
    .substring(0, 1000);
}

export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove any HTML-like content
    .replace(/<[^>]*>/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length
    .substring(0, 500);
}

export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = input.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized.substring(0, 254); // RFC 5321 limit
}

export function sanitizeNumeric(input: string | number): string {
  if (typeof input === 'number') return input.toString();
  if (typeof input !== 'string') return '0';
  
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? '0' : parsed.toString();
}