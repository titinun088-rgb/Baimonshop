# 🚀 การตั้งค่า BaimonShop บน Vercel

## 📋 Environment Variables ที่ต้องตั้งค่าบน Vercel

### 🔥 Firebase Configuration
```
VITE_FIREBASE_API_KEY=AIzaSyBw7XNHrcIUr_PQT0XezTFVzHoCR5Zx_FU
VITE_FIREBASE_AUTH_DOMAIN=baimonshop-e68e9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=baimonshop-e68e9
VITE_FIREBASE_STORAGE_BUCKET=baimonshop-e68e9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=934820009576
VITE_FIREBASE_APP_ID=1:934820009576:web:3b3bd4d3e3e1a51e794ddd
VITE_FIREBASE_MEASUREMENT_ID=G-QBCFDC42S0
```

## 🛠️ วิธีการตั้งค่าบน Vercel

### Method 1: ผ่าน Vercel Dashboard
1. เข้าไปที่ https://vercel.com/dashboard
2. เลือกโปรเจกต์ BaimonShop
3. ไปที่ **Settings** > **Environment Variables**
4. เพิ่ม Environment Variables ตามรายการข้างบน
5. สำหรับแต่ละตัวแปร:
   - **Name**: ชื่อตัวแปร (เช่น `VITE_FIREBASE_API_KEY`)
   - **Value**: ค่าที่ต้องการ (เช่น `AIzaSyBw7XNHrcIUr_PQT0XezTFVzHoCR5Zx_FU`)
   - **Environments**: เลือก **Production**, **Preview**, และ **Development**

### Method 2: ผ่าน Vercel CLI
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# ลิงก์โปรเจกต์
vercel link

# เพิ่ม Environment Variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID

# Deploy
vercel --prod
```

### Method 3: ผ่าน .env ไฟล์ (สำหรับการพัฒนา)
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env.local

# แก้ไขค่าใน .env.local
# ใส่ค่าจริงของ Firebase
```

## 🔒 ข้อควรระวัง

### สำคัญมาก ⚠️
- **ห้าม commit ไฟล์ `.env.local`** ที่มีข้อมูลจริงขึ้น Git
- ไฟล์ `.env.local` ได้ถูกเพิ่มใน `.gitignore` แล้ว
- ใช้ไฟล์ `.env.example` เป็นตัวอย่างเท่านั้น

### API Key Security
- Firebase API Key นี้ปลอดภัยสำหรับการใช้งานใน Frontend
- Firebase จะใช้ Security Rules เป็นตัวควบคุมการเข้าถึงข้อมูล
- ตรวจสอบ Firebase Security Rules อย่างสม่ำเสมอ

## 🧪 การทดสอบ

### ตรวจสอบการตั้งค่า
```bash
# รันโปรเจกต์ใน Local
npm run dev

# ตรวจสอบ Console ว่าไม่มี Error เกี่ยวกับ Firebase
```

### ตรวจสอบ Environment Variables
```javascript
// ใน Browser Console
console.log('Firebase Config Check:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
});
```

## 🌐 การ Deploy

### Automatic Deployment
- Vercel จะ deploy อัตโนมัติเมื่อมีการ push ไปยัง `main` branch
- Environment Variables จะถูกใช้ใน production build

### Manual Deployment
```bash
# Deploy ไปยัง production
vercel --prod

# Deploy เพื่อทดสอบ (preview)
vercel
```

## 📞 การแก้ไขปัญหา

### หาก Firebase ไม่ทำงาน
1. ตรวจสอบ Environment Variables ใน Vercel Dashboard
2. ตรวจสอบ Firebase Console ว่าโปรเจกต์ยังใช้งานได้
3. ตรวจสอบ Firebase Security Rules
4. ตรวจสอบ Browser Console เพื่อดู Error messages

### หาก Analytics ไม่ทำงาน
1. ตรวจสอบว่า `VITE_FIREBASE_MEASUREMENT_ID` ถูกตั้งค่าแล้ว
2. Analytics จะทำงานใน production เท่านั้น (ไม่ทำงานใน localhost)
3. ตรวจสอบ Firebase Analytics ใน Firebase Console

## 📚 เอกสารเพิ่มเติม
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)