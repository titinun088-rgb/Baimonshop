/**
 * Safe Logger - ป้องกัน sensitive data ใน production
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// ❌ Keywords ที่ห้าม log
const SENSITIVE_KEYWORDS = [
  'apikey',
  'api_key',
  'authorization',
  'bearer',
  'token',
  'password',
  'secret',
  'credential',
  'firebase',
  'peamsub',
  'slip2go'
];

/**
 * ตรวจสอบว่ามี sensitive data หรือไม่
 */
function containsSensitiveData(data: any): boolean {
  const str = JSON.stringify(data).toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => str.includes(keyword));
}

/**
 * Sanitize object - ซ่อน sensitive fields
 */
function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // ซ่อน sensitive fields
    if (SENSITIVE_KEYWORDS.some(keyword => lowerKey.includes(keyword))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Safe Console Logger
 */
export const logger = {
  /**
   * Development only - ไม่ทำงานใน production
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args.map(sanitize));
    }
  },

  /**
   * Info log - sanitize ใน production
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    } else {
      // Production: log เฉพาะที่ไม่มี sensitive data
      const safe = args.every(arg => !containsSensitiveData(arg));
      if (safe) {
        console.info('[INFO]', ...args.map(sanitize));
      }
    }
  },

  /**
   * Warning - แสดงเสมอแต่ sanitize
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args.map(sanitize));
  },

  /**
   * Error - แสดงเสมอแต่ sanitize
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args.map(sanitize));
  },

  /**
   * API Request log - Development only
   */
  api: (method: string, url: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${method} ${url}`, data ? sanitize(data) : '');
    }
  },

  /**
   * API Response log - Development only
   */
  apiResponse: (url: string, status: number, data?: any) => {
    if (isDevelopment) {
      console.log(`[API RESPONSE] ${url} - ${status}`, data ? sanitize(data) : '');
    }
  },

  /**
   * Performance tracking - Development only
   */
  perf: (label: string, duration?: number) => {
    if (isDevelopment) {
      console.log(`[PERF] ${label}`, duration ? `${duration}ms` : '');
    }
  }
};

/**
 * Override global console (optional - aggressive approach)
 */
export function disableConsoleInProduction() {
  if (isProduction) {
    // เก็บ original functions
    const originalLog = console.log;
    const originalDebug = console.debug;
    const originalInfo = console.info;

    // Override ให้เป็น no-op
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};

    // เก็บ error และ warn ไว้ (สำหรับ debugging production issues)
    console.error = (...args) => console.error(...args.map(sanitize));
    console.warn = (...args) => console.warn(...args.map(sanitize));

    // Expose original ผ่าน window (สำหรับ emergency debugging)
    (window as any).__console = {
      log: originalLog,
      debug: originalDebug,
      info: originalInfo
    };
  }
}

export default logger;
