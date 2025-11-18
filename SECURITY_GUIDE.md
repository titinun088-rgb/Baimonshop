# 🔒 คู่มือความปลอดภัย API Key

## ⚠️ ปัญหาของการใช้ Environment Variables ใน Client-Side

เมื่อใช้ `VITE_*` environment variables:
```typescript
const API_KEY = import.meta.env.VITE_PEAMSUB_API_KEY; // ❌ ไม่ปลอดภัย!
```

**ปัญหา:**
- ✗ API key จะถูก bundle เข้าไปใน JavaScript
- ✗ ใครก็ตามสามารถเปิด DevTools → Sources → ดู source code เจอ API key
- ✗ ใช้ API key ไปเรียก API ได้โดยตรง
- ✗ อาจถูกนำไปใช้ในทางที่ผิด (abuse)

---

## ✅ วิธีที่ปลอดภัย - API Proxy Pattern

### **วิธีที่ 1: Vercel Serverless Functions** ⭐ (แนะนำ)

#### ขั้นตอนการใช้งาน:

**1. สร้าง Serverless Function**
- ✅ ไฟล์ `api/peamsub.ts` ถูกสร้างแล้ว

**2. ตั้งค่า Environment Variable ใน Vercel (Server-side)**
```
PEAMSUB_API_KEY=qgwvsh5rwvtevey8zdh4bj13
```
⚠️ **สำคัญ:** ไม่ต้องใส่ prefix `VITE_` เพราะเป็น server-side variable

**3. ปรับโค้ด Frontend ให้เรียกผ่าน Proxy**

แทนที่จะเรียก:
```typescript
// ❌ เดิม - เรียกตรง (ไม่ปลอดภัย)
fetch('https://api.peamsub24hr.com/v2/game', {
  headers: { 'Authorization': `Basic ${btoa(API_KEY)}` }
})
```

เปลี่ยนเป็น:
```typescript
// ✅ ใหม่ - เรียกผ่าน Proxy (ปลอดภัย)
fetch('/api/peamsub', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: '/v2/game',
    method: 'GET'
  })
})
```

**4. ข้อดี:**
- ✅ API key อยู่ที่ server-side เท่านั้น
- ✅ ไม่ถูก expose ใน client
- ✅ ควบคุม rate limiting ได้
- ✅ สามารถเพิ่ม authentication/authorization ได้
- ✅ Log การใช้งาน API ได้

---

### **วิธีที่ 2: Firebase Cloud Functions**

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const peamsubProxy = functions.https.onCall(async (data, context) => {
  // ตรวจสอบ authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { endpoint, method, body } = data;
  const API_KEY = functions.config().peamsub.apikey;
  
  const response = await fetch(`https://api.peamsub24hr.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return await response.json();
});
```

**ตั้งค่า:**
```bash
firebase functions:config:set peamsub.apikey="qgwvsh5rwvtevey8zdh4bj13"
firebase deploy --only functions
```

---

### **วิธีที่ 3: Cloudflare Workers**

```typescript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const API_KEY = PEAMSUB_API_KEY; // จาก Environment Variables

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { endpoint, method, body } = await request.json()
  
  const response = await fetch(`https://api.peamsub24hr.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${btoa(API_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return new Response(await response.text(), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

---

## 📊 เปรียบเทียบวิธีต่างๆ

| วิธี | ความปลอดภัย | ความยาก | ราคา | แนะนำ |
|------|-------------|---------|------|-------|
| **Client-side (VITE_*)** | ❌ ต่ำ | ✅ ง่าย | ✅ ฟรี | ❌ ไม่แนะนำ |
| **Vercel Functions** | ✅ สูง | ⭐ ปานกลาง | ✅ ฟรี (มี limit) | ✅ แนะนำ |
| **Firebase Functions** | ✅ สูง | ⭐⭐ ปานกลาง | 💰 มีค่าใช้จ่าย | ✅ แนะนำ |
| **Cloudflare Workers** | ✅ สูงมาก | ⭐⭐ ปานกลาง | ✅ ฟรี (100k req/day) | ✅ แนะนำ |

---

## 🎯 คำแนะนำสำหรับโปรเจคนี้

### **แนะนำ: Vercel Serverless Functions** ⭐

**เหตุผล:**
1. ✅ ใช้ Vercel deploy อยู่แล้ว (ไม่ต้องตั้ง service เพิ่ม)
2. ✅ Setup ง่าย (เพิ่มไฟล์ในโฟลเดอร์ `api/` เท่านั้น)
3. ✅ ฟรี 100GB bandwidth/เดือน
4. ✅ Auto-scaling
5. ✅ Global CDN

**ขั้นตอนที่ต้องทำ:**
1. ✅ มีไฟล์ `api/peamsub.ts` แล้ว
2. ⏳ ตั้งค่า environment variable `PEAMSUB_API_KEY` ใน Vercel (ไม่มี prefix `VITE_`)
3. ⏳ แก้ไข `src/lib/peamsubUtils.ts` ให้เรียกผ่าน `/api/peamsub`
4. ⏳ Deploy

---

## 🔐 Best Practices

### **1. ใช้ Authentication**
```typescript
// ตรวจสอบว่า user login แล้ว
if (!context.auth) {
  throw new Error('Unauthorized');
}
```

### **2. Rate Limiting**
```typescript
// จำกัดจำนวน request
const userRequests = await redis.incr(`rate:${userId}`);
if (userRequests > 100) {
  throw new Error('Rate limit exceeded');
}
```

### **3. Logging**
```typescript
// บันทึก log
console.log({
  userId: context.auth?.uid,
  endpoint,
  timestamp: new Date().toISOString()
});
```

### **4. Error Handling**
```typescript
try {
  // API call
} catch (error) {
  console.error('API Error:', error);
  // ไม่ส่ง error message จริงไปยัง client
  throw new Error('Service temporarily unavailable');
}
```

---

## 📝 สรุป

**สำหรับโปรเจคนี้แนะนำ:**
1. ✅ ใช้ **Vercel Serverless Functions**
2. ✅ ย้าย API key ไปเป็น **server-side environment variable**
3. ✅ เรียก API ผ่าน **Proxy endpoint** (`/api/peamsub`)
4. ✅ เพิ่ม **authentication & rate limiting**

**ความปลอดภัยที่ได้:**
- 🔒 API key ไม่ถูก expose
- 🔒 ควบคุมการใช้งานได้
- 🔒 ป้องกัน abuse
- 🔒 Log ทุก request

---

## 💡 หมายเหตุ

ถ้าต้องการความปลอดภัยสูงสุด แนะนำให้:
1. Rotate API key เป็นประจำ
2. ใช้ IP whitelist (ถ้า Peamsub รองรับ)
3. เพิ่ม request signature/HMAC
4. ใช้ rate limiting per user
5. Monitor suspicious activities

