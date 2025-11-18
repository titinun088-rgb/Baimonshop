# Environment Variables Setup Guide

## 📋 Required Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค และเพิ่มตัวแปรเหล่านี้:

```env
# Peamsub API Configuration
VITE_PEAMSUB_API_KEY=qgwvsh5rwvtevey8zdh4bj13

# Slip2go API Configuration
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=your_slip2go_secret_key_here

# Firebase Configuration (ดูค่าจาก Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
```

## 🚀 การตั้งค่าใน Vercel

1. เข้าไปที่ Vercel Dashboard
2. เลือกโปรเจคของคุณ
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่มตัวแปรเหล่านี้:

### Peamsub API

| Name | Value |
|------|-------|
| `VITE_PEAMSUB_API_KEY` | `qgwvsh5rwvtevey8zdh4bj13` |

### Slip2go API

| Name | Value |
|------|-------|
| `VITE_SLIP2GO_API_URL` | `https://connect.slip2go.com` |
| `VITE_SLIP2GO_SECRET_KEY` | `48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=` |

### Firebase Configuration

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase Measurement ID |

5. กด **Save**
6. **Redeploy** โปรเจคของคุณ

## 📝 หมายเหตุ

- ไฟล์ `.env.local` จะไม่ถูก commit ขึ้น Git (มีใน .gitignore แล้ว)
- Environment Variables ใน Vercel จะถูกใช้เฉพาะตอน deploy
- สำหรับ development ให้ใช้ `.env.local`
- อย่าเผยแพร่ API Key ของคุณในที่สาธารณะ

## 🔐 ความปลอดภัย

⚠️ **คำเตือนสำคัญ:** 

### ปัญหาของการใช้ `VITE_*` Environment Variables:
- ❌ API Key จะถูก **expose** ใน JavaScript bundle
- ❌ ใครก็ตามสามารถเปิด **DevTools** → **Sources** เห็น API Key ได้
- ❌ สามารถนำ API Key ไปใช้ในทางที่ผิดได้

### ✅ วิธีที่ปลอดภัยกว่า:
**แนะนำให้ใช้ Vercel Serverless Functions แทน** (ดูไฟล์ `SECURITY_GUIDE.md`)

1. สร้าง API Proxy ที่ server-side (`api/peamsub.ts`)
2. เก็บ API Key ที่ server-side เท่านั้น
3. Client เรียกผ่าน Proxy แทนการเรียก API ตรง

**ข้อดี:**
- ✅ API Key ไม่ถูก expose
- ✅ ควบคุมการใช้งานได้
- ✅ ป้องกัน abuse
- ✅ เพิ่ม authentication ได้

**อ่านเพิ่มเติม:** `SECURITY_GUIDE.md`

---

### Basic Security (ถ้ายังไม่ได้ทำ Proxy):
- อย่า commit ไฟล์ `.env.local` ขึ้น Git
- อย่าแชร์ API Key ของคุณให้ใครเห็น
- ควรเปลี่ยน API Key เป็นระยะๆ เพื่อความปลอดภัย

