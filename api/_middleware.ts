import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (will reset on cold start, but good enough for basic protection)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

/**
 * Get client IP address
 */
export function getClientIP(req: VercelRequest): string {
  // Vercel provides x-real-ip or x-forwarded-for
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Check if request is rate limited
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(ip);
  }

  const current = rateLimitStore.get(ip);

  if (!current) {
    // First request from this IP
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  current.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - current.count };
}

/**
 * Verify Firebase Auth Token (Optional - for authenticated endpoints)
 */
export async function verifyAuthToken(token: string | undefined): Promise<{ valid: boolean; uid?: string }> {
  if (!token) {
    return { valid: false };
  }

  try {
    // For now, just check if token exists and is non-empty
    // In production, you should verify against Firebase Admin SDK
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // return { valid: true, uid: decodedToken.uid };
    
    if (token.length > 20) {
      return { valid: true };
    }
    
    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Apply rate limiting middleware
 */
export function withRateLimit(handler: (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const ip = getClientIP(req);
    const { allowed, remaining } = checkRateLimit(ip);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      });
    }

    return handler(req, res);
  };
}

/**
 * Validate request origin (CSRF protection)
 */
export function validateOrigin(req: VercelRequest): boolean {
  // In development, allow all requests
  const isDev = process.env.NODE_ENV === 'development' || 
                process.env.VERCEL_ENV === 'development';
  
  if (isDev) {
    return true; // ✅ Development mode - allow all
  }

  const origin = req.headers.origin || req.headers.referer;
  
  // Allow requests from your domain only
  const allowedOrigins = [
    'https://baimonshop.com',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  if (!origin) {
    // No origin header - might be a direct API call
    // In production, this is suspicious
    return false;
  }

  return allowedOrigins.some(allowed => 
    origin.startsWith(allowed)
  );
}

/**
 * Request body size validation
 */
export function validateRequestSize(req: VercelRequest, maxSizeKB: number = 100): boolean {
  const contentLength = req.headers['content-length'];
  
  if (!contentLength) {
    return true; // No content-length header
  }

  const sizeKB = parseInt(contentLength) / 1024;
  return sizeKB <= maxSizeKB;
}

/**
 * Sanitize and validate numeric amount
 */
export function validateAmount(amount: any): { valid: boolean; value?: number; error?: string } {
  if (amount === undefined || amount === null) {
    return { valid: false, error: 'Amount is required' };
  }

  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Amount must be a number' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit (1,000,000)' };
  }

  return { valid: true, value: numAmount };
}
