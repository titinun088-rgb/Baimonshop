# Environment Variables Fix Guide

## ปัญหาที่พบ

```
slip2goUtils.ts:208 Uncaught ReferenceError: process is not defined
```

## สาเหตุ

ปัญหาเกิดจากการใช้ `process.env` ใน browser environment ซึ่งไม่สามารถเข้าถึงได้ใน Vite

## การแก้ไข

### 1. เปลี่ยนจาก process.env เป็น import.meta.env

**ก่อนแก้ไข:**
```typescript
const SLIP2GO_CONFIG: Slip2GoConfig = {
  apiUrl: process.env.REACT_APP_SLIP2GO_API_URL || 'https://api.slip2go.com',
  secretKey: process.env.REACT_APP_SLIP2GO_SECRET_KEY || '48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4='
};
```

**หลังแก้ไข:**
```typescript
const SLIP2GO_CONFIG: Slip2GoConfig = {
  apiUrl: import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com',
  secretKey: import.meta.env.VITE_SLIP2GO_SECRET_KEY || '48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4='
};
```

### 2. อัปเดต Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:

```env
# Slip2Go API Configuration
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
```

### 3. อัปเดต .env.example (ถ้ามี)

```env
# Environment Variables Example
# Copy this file to .env.local and update the values

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Slip2Go API Configuration
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=

# Application Configuration
VITE_APP_NAME=Game Nexus Dashboard
VITE_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

## ความแตกต่างระหว่าง React และ Vite

### React (Create React App)
```typescript
// ใช้ process.env
const apiUrl = process.env.REACT_APP_API_URL;
```

### Vite
```typescript
// ใช้ import.meta.env
const apiUrl = import.meta.env.VITE_API_URL;
```

## Environment Variables Naming Convention

### React
- ต้องขึ้นต้นด้วย `REACT_APP_`
- ตัวอย่าง: `REACT_APP_API_URL`

### Vite
- ต้องขึ้นต้นด้วย `VITE_`
- ตัวอย่าง: `VITE_API_URL`

## การตรวจสอบ Environment Variables

### ใน Development Mode
```typescript
console.log('API URL:', import.meta.env.VITE_SLIP2GO_API_URL);
console.log('Secret Key:', import.meta.env.VITE_SLIP2GO_SECRET_KEY ? 'Set' : 'Not Set');
```

### ใน Production Mode
```typescript
// Environment variables จะถูก build เข้าไปใน bundle
// ไม่สามารถเข้าถึงได้ใน runtime
```

## การแก้ไขปัญหาเพิ่มเติม

### 1. TypeScript Support

สร้างไฟล์ `vite-env.d.ts` (ถ้ายังไม่มี):

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SLIP2GO_API_URL: string
  readonly VITE_SLIP2GO_SECRET_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 2. การใช้ Environment Variables ใน Components

```typescript
// ✅ ถูกต้อง
const apiUrl = import.meta.env.VITE_SLIP2GO_API_URL;

// ❌ ผิด
const apiUrl = process.env.REACT_APP_SLIP2GO_API_URL;
```

### 3. การใช้ Environment Variables ใน Utility Functions

```typescript
// ✅ ถูกต้อง
export const getApiUrl = () => {
  return import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com';
};

// ❌ ผิด
export const getApiUrl = () => {
  return process.env.REACT_APP_SLIP2GO_API_URL || 'https://connect.slip2go.com';
};
```

## การทดสอบ

### 1. ตรวจสอบ Environment Variables

```typescript
// เพิ่มในไฟล์ slip2goUtils.ts
console.log('Environment Variables:');
console.log('API URL:', import.meta.env.VITE_SLIP2GO_API_URL);
console.log('Secret Key:', import.meta.env.VITE_SLIP2GO_SECRET_KEY ? 'Set' : 'Not Set');
```

### 2. ทดสอบการเชื่อมต่อ API

```typescript
// ทดสอบในหน้า Slip Verification
const testAPI = async () => {
  try {
    const result = await checkSlip2GoAPIStatus();
    console.log('API Status:', result ? 'Healthy' : 'Unhealthy');
  } catch (error) {
    console.error('API Test Error:', error);
  }
};
```

## การ Deploy

### 1. Vercel
- เพิ่ม Environment Variables ใน Vercel Dashboard
- ใช้ชื่อ `VITE_SLIP2GO_API_URL` และ `VITE_SLIP2GO_SECRET_KEY`

### 2. Netlify
- เพิ่ม Environment Variables ใน Netlify Dashboard
- ใช้ชื่อ `VITE_SLIP2GO_API_URL` และ `VITE_SLIP2GO_SECRET_KEY`

### 3. Docker
```dockerfile
# Dockerfile
ENV VITE_SLIP2GO_API_URL=https://connect.slip2go.com
ENV VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
```

## การแก้ไขปัญหาเพิ่มเติม

### 1. Environment Variables ไม่ทำงาน
- ตรวจสอบชื่อตัวแปรต้องขึ้นต้นด้วย `VITE_`
- ตรวจสอบไฟล์ `.env.local` อยู่ในโฟลเดอร์ root
- Restart development server

### 2. TypeScript Error
- เพิ่ม type definitions ใน `vite-env.d.ts`
- ตรวจสอบ `tsconfig.json` มีการ include ไฟล์ `vite-env.d.ts`

### 3. Build Error
- ตรวจสอบ Environment Variables ใน production
- ใช้ fallback values สำหรับ production

## สรุป

การแก้ไขปัญหา `process is not defined` ต้อง:

1. **เปลี่ยนจาก `process.env` เป็น `import.meta.env`**
2. **เปลี่ยนชื่อ Environment Variables จาก `REACT_APP_` เป็น `VITE_`**
3. **อัปเดตไฟล์ `.env.local`**
4. **เพิ่ม TypeScript support**
5. **Restart development server**

หลังจากแก้ไขแล้ว ระบบ Slip2Go API จะทำงานได้ปกติครับ!
