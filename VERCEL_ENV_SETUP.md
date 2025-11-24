# 🔥 Step-by-Step: เพิ่ม Environment Variables ใน Vercel

## ⚠️ สำคัญ: Vercel ไม่ได้สร้าง Environment Variables อัตโนมัติ!

### 📋 คัดลอกค่าเหล่านี้ไปใส่ใน Vercel ทีละตัว:

## 1. VITE_FIREBASE_API_KEY
```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyBw7XNHrcIUr_PQT0XezTFVzHoCR5Zx_FU
Environment: Production, Preview, Development
```

## 2. VITE_FIREBASE_AUTH_DOMAIN
```
Name: VITE_FIREBASE_AUTH_DOMAIN
Value: baimonshop-e68e9.firebaseapp.com
Environment: Production, Preview, Development
```

## 3. VITE_FIREBASE_PROJECT_ID
```
Name: VITE_FIREBASE_PROJECT_ID
Value: baimonshop-e68e9
Environment: Production, Preview, Development
```

## 4. VITE_FIREBASE_STORAGE_BUCKET
```
Name: VITE_FIREBASE_STORAGE_BUCKET
Value: baimonshop-e68e9.firebasestorage.app
Environment: Production, Preview, Development
```

## 5. VITE_FIREBASE_MESSAGING_SENDER_ID
```
Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 934820009576
Environment: Production, Preview, Development
```

## 6. VITE_FIREBASE_APP_ID
```
Name: VITE_FIREBASE_APP_ID
Value: 1:934820009576:web:3b3bd4d3e3e1a51e794ddd
Environment: Production, Preview, Development
```

## 7. VITE_FIREBASE_MEASUREMENT_ID
```
Name: VITE_FIREBASE_MEASUREMENT_ID
Value: G-QBCFDC42S0
Environment: Production, Preview, Development
```

## 8. VITE_PEAMSUB_API_KEY
```
Name: VITE_PEAMSUB_API_KEY
Value: qgwvsh5rwvtevey8zdh4bj13
Environment: Production, Preview, Development
```

## 9. VITE_SLIP2GO_API_URL
```
Name: VITE_SLIP2GO_API_URL
Value: https://connect.slip2go.com
Environment: Production, Preview, Development
```

## 10. VITE_SLIP2GO_SECRET_KEY
```
Name: VITE_SLIP2GO_SECRET_KEY
Value: 48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
Environment: Production, Preview, Development
```

---

## 🛠️ วิธีการเพิ่มใน Vercel:

1. **เข้าไปที่ Vercel Dashboard**: https://vercel.com/dashboard
2. **เลือกโปรเจกต์**: Baimonshop
3. **ไปที่ Settings**: คลิกแท็บ "Settings"
4. **เลือก Environment Variables**: จากเมนูด้านซ้าย
5. **คลิก "Add New"** สำหรับแต่ละตัวแปร
6. **ใส่ข้อมูล**:
   - **Name**: ชื่อตัวแปร (เช่น `VITE_FIREBASE_API_KEY`)
   - **Value**: ค่าที่ต้องการ (เช่น `AIzaSyBw7XNHrcIUr_PQT0XezTFVzHoCR5Zx_FU`)
   - **Environment**: เลือกทั้ง 3 ช่อง (Production, Preview, Development)
7. **คลิก "Save"**
7. **ทำซ้ำ** สำหรับทั้ง 10 ตัวแปร

## ✅ หลังจากเพิ่มครบแล้ว:
- คลิก **"Redeploy"** เพื่อ deploy ใหม่
- ตรวจสอบว่าเว็บไซต์ทำงานปกติ
- ไม่ควรมี Error เกี่ยวกับ Firebase ใน Console