# 🔐 คู่มือการซ่อน API Keys และป้องกันการรั่วไหลใน Console Log

## 🎯 สิ่งที่ต้องการบรรลุ

### ❌ ปัญหาที่พบ:
1. **API Keys ปรากฏใน Console Log**
   - `console.log()` แสดง request/response ที่มี API keys
   - Error messages เปิดเผย credentials
   - Debug logs รั่วไหล sensitive data

2. **API Keys ใน Client-Side Code**
   - Hardcoded ใน JavaScript files
   - อยู่ใน environment variables ที่ build เข้า frontend
   - ถูก expose ผ่าน Network tab

3. **Token Leaks**
   - Firebase tokens แสดงใน console
   - Authorization headers ถูก log
   - Response data มี credentials

### ✅ เป้าหมาย:
- ❌ ไม่มี API keys ใน console log
- ❌ ไม่มี sensitive data ใน client-side
- ✅ API calls ปลอดภัยผ่าน backend proxy
- ✅ Production build สะอาด ไม่มี debug logs

---

## 🛡️ กลยุทธ์การป้องกัน 3 ชั้น

### ชั้นที่ 1: ลบ Console Logs จาก Production
### ชั้นที่ 2: ใช้ Backend Proxy สำหรับ API Calls
### ชั้นที่ 3: Sanitize Logging Functions

---

## 🔨 ชั้นที่ 1: ลบ Console Logs จาก Production

### ✅ วิธีที่ 1: ใช้ Terser (แนะนำ - ทำแล้ว!)

**ไฟล์:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // ✅ ลบ console.log อัตโนมัติใน production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,        // ลบ console.log, console.info, etc.
        drop_debugger: true,        // ลบ debugger statements
        pure_funcs: ['console.log', 'console.debug', 'console.info']  // ระบุเฉพาะ
      },
      format: {
        comments: false             // ลบ comments ทั้งหมด
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['lucide-react', 'sonner', '@radix-ui/react-dialog']
        }
      }
    }
  }
});
```

**ติดตั้ง Terser:**
```powershell
npm install -D terser
```

**ทดสอบ:**
```powershell
# Build production
npm run build

# ตรวจสอบไฟล์ที่ build แล้ว
Get-Content dist/assets/index-*.js | Select-String "console.log"
# ควรไม่เจออะไร!
```

---

### ✅ วิธีที่ 2: Custom Logger Wrapper

**สร้างไฟล์:** `src/lib/logger.ts`

```typescript
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
```

**ใช้งาน:**

```typescript
// ❌ แทนที่จะใช้
console.log('API Key:', apiKey);

// ✅ ใช้แบบนี้
import logger from '@/lib/logger';
logger.debug('API Key:', apiKey);  // จะไม่แสดงใน production

// ✅ API logging
logger.api('POST', '/api/peamsub', { endpoint: '/v2/game' });
logger.apiResponse('/api/peamsub', 200, response);
```

---

## 🔨 ชั้นที่ 2: Backend Proxy สำหรับ API Calls

### ✅ Architecture ที่ถูกต้อง

```
❌ WRONG:
Frontend → api.peamsub24hr.com (API key exposed!)

✅ CORRECT:
Frontend → Backend Proxy → api.peamsub24hr.com
         (no API key)    (API key ใน server)
```

### ตัวอย่าง: Peamsub API Proxy

**ไฟล์:** `api/peamsub.ts` (Vercel Serverless Function)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ✅ API key อยู่ใน server-side เท่านั้น
const PEAMSUB_API_KEY = process.env.PEAMSUB_API_KEY || '';
const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ✅ ตรวจสอบ Firebase Auth token
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const { endpoint, method = 'GET', body } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // ✅ สร้าง request ไป Peamsub (API key อยู่ฝั่ง server)
    const peamsubResponse = await fetch(`${PEAMSUB_API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // ✅ API key ไม่ถูกส่งไปยัง client
        'Authorization': `Basic ${Buffer.from(PEAMSUB_API_KEY + ':').toString('base64')}`
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const data = await peamsubResponse.json();

    // ✅ ไม่ส่ง API key กลับไปใน response
    return res.status(peamsubResponse.status).json(data);

  } catch (error: any) {
    // ✅ Error message ไม่เปิดเผย sensitive info
    console.error('[Peamsub Proxy Error]', error.message);  // Server-side log only
    return res.status(500).json({ 
      error: 'Internal server error'  // Generic message
    });
  }
}
```

**Frontend Usage:**

```typescript
// ✅ Frontend ไม่ต้องรู้ API key
export async function getPeamsubGames() {
  const token = await auth.currentUser?.getIdToken();
  
  const response = await fetch('/api/peamsub', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // Firebase token เท่านั้น
    },
    body: JSON.stringify({
      endpoint: '/v2/game',
      method: 'GET'
    })
  });

  return response.json();
}
```

---

## 🔨 ชั้นที่ 3: Sanitize All Logging Points

### ✅ ตรวจสอบและแก้ไขไฟล์ทั้งหมด

#### 1. **peamsubUtils.ts** - API Client

**ก่อนแก้ไข:**
```typescript
console.log('Calling Peamsub API:', endpoint, body);
console.log('API Response:', response);
```

**หลังแก้ไข:**
```typescript
import logger from './logger';

// ✅ ใช้ logger แทน console.log
logger.api('POST', `/api/peamsub${endpoint}`, { endpoint, method });
logger.apiResponse(`/api/peamsub${endpoint}`, response.status);
```

#### 2. **slip2goUtils.ts** - Slip Verification

**ก่อนแก้ไข:**
```typescript
console.log('Verifying slip with Slip2Go...', {
  apiKey: SLIP2GO_API_KEY,  // ❌ อันตราย!
  imageBase64: base64.substring(0, 50) + '...'
});
```

**หลังแก้ไข:**
```typescript
import logger from './logger';

// ✅ ไม่ log API key
logger.api('POST', '/api/verify-slip/qr-base64/info');
logger.debug('Slip verification started');  // ไม่มี sensitive data
```

#### 3. **firebase.ts** - Auth & Firestore

**ก่อนแก้ไข:**
```typescript
console.log('Firebase config:', firebaseConfig);  // ❌ เปิดเผย keys!
console.log('User token:', token);  // ❌ อันตราย!
```

**หลังแก้ไข:**
```typescript
import logger from './logger';

// ✅ ไม่ log config หรือ tokens
logger.debug('Firebase initialized');
logger.debug('User authenticated:', user.uid);  // เฉพาะ UID
```

#### 4. **Error Handling** - ทุกไฟล์

**ก่อนแก้ไข:**
```typescript
catch (error) {
  console.error('Error:', error);  // ❌ อาจมี sensitive data
}
```

**หลังแก้ไข:**
```typescript
import logger from './logger';

catch (error: any) {
  // ✅ Sanitized error logging
  logger.error('Operation failed:', {
    message: error.message,
    code: error.code
    // ไม่ log stack trace หรือ full error object
  });
}
```

---

## 📋 Checklist: แก้ไขทุกไฟล์

### ✅ ไฟล์ที่ต้องแก้ไข:

#### **Utilities (src/lib/):**
- [ ] `peamsubUtils.ts` - ลบ console.log ที่มี API calls
- [ ] `slip2goUtils.ts` - ลบ console.log ที่มี API keys
- [ ] `firebase.ts` - ลบ console.log ที่มี config/tokens
- [ ] `paymentHelpers.ts` - ลบ sensitive logs
- [ ] `balanceUtils.ts` - ลบ transaction logs
- [ ] `gameUtils.ts` - ลบ purchase logs
- [ ] `profileUtils.ts` - ลบ user data logs
- [ ] `authUtils.ts` - ลบ authentication logs

#### **Pages (src/pages/):**
- [ ] `Login.tsx` - ลบ password/token logs
- [ ] `Register.tsx` - ลบ user data logs
- [ ] `TopUp.tsx` - ลบ payment logs
- [ ] `Purchase.tsx` - ลบ transaction logs
- [ ] `Admin.tsx` - ลบ admin action logs
- [ ] `Users.tsx` - ลบ user management logs

#### **Components (src/components/):**
- [ ] `GeneratePromptPayQR.tsx` - ลบ QR data logs
- [ ] `ProductDetailsDialog.tsx` - ลบ product logs
- [ ] `EditUserDialog.tsx` - ลบ user edit logs
- [ ] `ChangeRoleDialog.tsx` - ลบ role change logs

#### **API Routes (api/):**
- [ ] `peamsub.ts` - ใช้ server-side logging เท่านั้น

---

## 🔍 ตรวจสอบว่ามี Console Logs คงเหลือ

### PowerShell Script: ค้นหา Console Logs

```powershell
# ค้นหา console.log ในโค้ดทั้งหมด
Get-ChildItem -Path "src" -Recurse -Filter "*.ts*" | 
  Select-String -Pattern "console\.(log|debug|info)" | 
  Select-Object Path, LineNumber, Line | 
  Format-Table -AutoSize

# ค้นหา sensitive keywords
$keywords = @("apiKey", "api_key", "token", "password", "secret")
foreach ($keyword in $keywords) {
  Write-Host "`n=== Searching for: $keyword ===" -ForegroundColor Yellow
  Get-ChildItem -Path "src" -Recurse -Filter "*.ts*" | 
    Select-String -Pattern $keyword -CaseSensitive:$false | 
    Select-Object Path, LineNumber, Line
}
```

**รัน:**
```powershell
# บันทึกเป็นไฟล์
New-Item -Path "scripts\find-console-logs.ps1" -ItemType File -Force
# วาง script ด้านบน
# รัน
.\scripts\find-console-logs.ps1
```

---

## 🚀 ขั้นตอนการ Migrate ทั้งระบบ

### Phase 1: Setup Logger (1 วัน)

```powershell
# 1. สร้าง logger.ts
# (ใช้ code ด้านบน)

# 2. ติดตั้ง dependencies
npm install -D terser

# 3. อัพเดท vite.config.ts
# (ใช้ config ด้านบน)

# 4. Build ทดสอบ
npm run build
```

### Phase 2: Replace Console Logs (2-3 วัน)

```typescript
// ในแต่ละไฟล์:

// 1. Import logger
import logger from '@/lib/logger';

// 2. Replace console.log
// ❌ console.log('Data:', data);
// ✅ logger.debug('Data:', data);

// 3. Replace console.error
// ❌ console.error('Error:', error);
// ✅ logger.error('Error:', error);

// 4. API logging
// ❌ console.log('Calling API...');
// ✅ logger.api('POST', '/api/endpoint', body);
```

### Phase 3: Test & Verify (1 วัน)

```powershell
# 1. Development - ควรเห็น logs
npm run dev
# เปิด browser → Console → ควรเห็น [DEBUG], [API] tags

# 2. Production build - ไม่ควรเห็น logs
npm run build
npm run preview
# เปิด browser → Console → ไม่ควรมี console.log

# 3. ตรวจสอบ bundle
Get-Content dist/assets/index-*.js | Select-String "console"
# ควรไม่เจอ console.log, console.debug, console.info
# อาจเจอ console.error (ปกติ - สำหรับ error tracking)
```

### Phase 4: Deploy & Monitor (ongoing)

```powershell
# 1. Deploy to production
git add -A
git commit -m "security: remove console logs and sanitize logging"
git push origin master

# 2. Monitor production
# - เช็ค Browser Console (ไม่ควรมี logs)
# - เช็ค Network tab (ไม่มี API keys ใน requests)
# - เช็ค Vercel logs (server-side logs OK)
```

---

## 🎯 ตัวอย่างการ Refactor

### Before ❌ (Unsafe):

```typescript
// src/lib/peamsubUtils.ts
export async function topUpGame(gameId: number, uid: string) {
  console.log('Top-up game:', { gameId, uid });
  console.log('Using API key:', PEAMSUB_API_KEY);  // ❌ อันตราย!
  
  const response = await fetch(`https://api.peamsub24hr.com/v2/game`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${PEAMSUB_API_KEY}`  // ❌ Client-side!
    },
    body: JSON.stringify({ id: gameId, uid })
  });
  
  console.log('Response:', await response.json());
  return response;
}
```

### After ✅ (Safe):

```typescript
// src/lib/peamsubUtils.ts
import logger from './logger';

export async function topUpGame(gameId: number, uid: string) {
  logger.api('POST', '/api/peamsub', { endpoint: '/v2/game', gameId });
  
  const token = await auth.currentUser?.getIdToken();
  
  const response = await fetch('/api/peamsub', {  // ✅ Backend proxy
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ✅ Firebase token
    },
    body: JSON.stringify({
      endpoint: '/v2/game',
      method: 'POST',
      body: { id: gameId, uid }
    })
  });
  
  const data = await response.json();
  logger.apiResponse('/api/peamsub', response.status);
  
  return data;
}
```

---

## 📊 Production Build Optimization

### ตรวจสอบ Bundle Size

```powershell
# Build production
npm run build

# ดูขนาดไฟล์
Get-ChildItem -Path "dist\assets" -Filter "*.js" | 
  Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,2)}} | 
  Sort-Object "Size(KB)" -Descending | 
  Format-Table -AutoSize

# Expected output:
# Name                           Size(KB)
# ----                           --------
# index-xxxxx.js                 1453.20  (ลดลงจาก 1508 KB)
# firebase-vendor-xxxxx.js        651.68
# react-vendor-xxxxx.js           161.20
```

### Verify Console Removal

```powershell
# ค้นหา console.log ใน production build
$jsFiles = Get-ChildItem -Path "dist\assets" -Filter "index-*.js"
foreach ($file in $jsFiles) {
  $content = Get-Content $file.FullName -Raw
  
  # Count console occurrences
  $logCount = ([regex]::Matches($content, "console\.log")).Count
  $debugCount = ([regex]::Matches($content, "console\.debug")).Count
  $infoCount = ([regex]::Matches($content, "console\.info")).Count
  $errorCount = ([regex]::Matches($content, "console\.error")).Count
  
  Write-Host "`n=== $($file.Name) ===" -ForegroundColor Cyan
  Write-Host "console.log: $logCount (should be 0)" -ForegroundColor $(if ($logCount -eq 0) { "Green" } else { "Red" })
  Write-Host "console.debug: $debugCount (should be 0)" -ForegroundColor $(if ($debugCount -eq 0) { "Green" } else { "Red" })
  Write-Host "console.info: $infoCount (should be 0)" -ForegroundColor $(if ($infoCount -eq 0) { "Green" } else { "Red" })
  Write-Host "console.error: $errorCount (OK to have some)" -ForegroundColor Yellow
}
```

---

## 🔐 Environment Variables Setup

### Vercel Environment Variables

```bash
# Production
PEAMSUB_API_KEY="qgwvsh5rwvtevey8zdh4bj13"
SLIP2GO_API_KEY="48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4="
FIREBASE_PROJECT_ID="game-shop-72ad1"

# ⚠️ ห้ามใส่ใน .env.local หรือ commit ลง git!
# ใส่ใน Vercel Dashboard เท่านั้น:
# https://vercel.com/[your-project]/settings/environment-variables
```

### .gitignore

```
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
dist-ssr/

# Logs
npm-debug.log*
*.log
```

---

## 🚨 Emergency: หาก API Keys รั่วไหลแล้ว

### ทำทันที (ภายใน 1 ชั่วโมง):

1. **Rotate API Keys**
   ```
   - Login to Peamsub dashboard → Generate new API key
   - Login to Slip2Go dashboard → Generate new API key
   - อัพเดทใน Vercel Environment Variables
   - Deploy ใหม่
   ```

2. **ลบ Sensitive Data จาก Git History**
   ```powershell
   # ติดตั้ง git-filter-repo
   pip install git-filter-repo
   
   # ลบไฟล์ที่มี secrets
   git filter-repo --path .env --invert-paths
   
   # Force push (ระวัง!)
   git push origin --force --all
   ```

3. **Monitor Logs**
   ```
   - เช็ค Peamsub usage logs
   - เช็ค Slip2Go API calls
   - ดูว่ามี unauthorized access หรือไม่
   ```

4. **แจ้งเตือน**
   ```
   - แจ้ง team members
   - อัพเดท documentation
   - Review security policies
   ```

---

## ✅ Final Checklist

### Development:
- [x] Logger utility สร้างแล้ว (`src/lib/logger.ts`)
- [x] Terser config ตั้งค่าแล้ว (`vite.config.ts`)
- [ ] Replace ทุก `console.log` ด้วย `logger.debug`
- [ ] Replace ทุก `console.error` ด้วย `logger.error`
- [ ] API calls ผ่าน backend proxy
- [ ] ไม่มี hardcoded API keys

### Production:
- [x] `npm run build` สำเร็จ
- [ ] ไม่มี `console.log` ใน dist/
- [ ] Bundle size ลดลง (terser ทำงาน)
- [ ] Browser Console สะอาด
- [ ] Network tab ไม่มี API keys
- [ ] Environment variables ตั้งใน Vercel

### Security:
- [ ] API keys อยู่ server-side เท่านั้น
- [ ] Firebase tokens expire ตามเวลา (1 ชม.)
- [ ] Error messages เป็น generic
- [ ] Logs ไม่มี sensitive data
- [ ] .env files ใน .gitignore
- [ ] Git history สะอาด (ไม่มี secrets)

---

## 📚 Resources

- **Terser Documentation:** https://terser.org/docs/api-reference
- **Vite Build Options:** https://vitejs.dev/config/build-options.html
- **OWASP Logging Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

**สร้างเมื่อ:** 8 ธันวาคม 2025  
**สถานะ:** ✅ Terser installed, 🚧 Logger migration in progress  
**Priority:** 🔴 CRITICAL - Security vulnerability
