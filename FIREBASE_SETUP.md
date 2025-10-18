# Firebase Authentication Setup Guide

## 📋 สรุปการตั้งค่าที่เสร็จสิ้นแล้ว

ระบบ Firebase Authentication ได้ถูกตั้งค่าเรียบร้อยแล้ว! ✅

### ✅ สิ่งที่ติดตั้งและตั้งค่าแล้ว:

1. **Firebase SDK** - ติดตั้ง firebase package สำเร็จ
2. **Firebase Configuration** - `/src/lib/firebase.ts`
3. **AuthContext** - `/src/contexts/AuthContext.tsx`
4. **ProtectedRoute** - `/src/components/ProtectedRoute.tsx`
5. **Login Page** - `/src/pages/Login.tsx`
6. **App.tsx** - ตั้งค่า AuthProvider และ ProtectedRoute
7. **Layout.tsx** - แสดงข้อมูล user และปุ่ม logout

---

## 🚀 วิธีการใช้งาน

### 1. เริ่มต้นใช้งาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:8080`

### 2. การล็อกอิน/สมัครสมาชิก

เมื่อเข้าถึงหน้าใดๆ ที่ต้องการ authentication ระบบจะ redirect ไปที่หน้า `/login` อัตโนมัติ

**หน้า Login มีฟีเจอร์:**
- ✅ เข้าสู่ระบบด้วย Email/Password
- ✅ สมัครสมาชิกใหม่
- ✅ เข้าสู่ระบบด้วย Google
- ✅ Validation รหัสผ่าน (ต้องมีอย่างน้อย 6 ตัวอักษร)
- ✅ Toast notifications สำหรับแสดงสถานะ

### 3. หน้าที่มี Protection

หน้าเหล่านี้ต้องล็อกอินก่อนเข้าถึง:
- `/` - Dashboard
- `/games` - จัดการเกม
- `/sales` - ยอดขาย
- `/users` - จัดการผู้ใช้
- `/activity` - กิจกรรม
- `/notifications` - แจ้งเตือน

หน้าที่เปิดให้ทุกคนเข้าถึงได้:
- `/login` - หน้าล็อกอิน

---

## 🔥 Firebase Configuration

ไฟล์ `/src/lib/firebase.ts` มี Firebase configuration ที่เชื่อมต่อกับโปรเจกต์:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCCCz6vXR41ctpCa9bxGJgAv3shNhix-dY",
  authDomain: "game-shop-72ad1.firebaseapp.com",
  projectId: "game-shop-72ad1",
  storageBucket: "game-shop-72ad1.firebasestorage.app",
  messagingSenderId: "850025945135",
  appId: "1:850025945135:web:0969875670361669280eda",
  measurementId: "G-1RCMS01BRQ"
};
```

### Services ที่เตรียมไว้:
- `auth` - Firebase Authentication
- `db` - Firestore Database
- `storage` - Firebase Storage

---

## 📦 โครงสร้างไฟล์ที่เพิ่มเข้ามา

```
src/
├── lib/
│   └── firebase.ts              # Firebase initialization
├── contexts/
│   └── AuthContext.tsx          # Authentication context & hooks
├── components/
│   └── ProtectedRoute.tsx       # Route protection component
└── pages/
    └── Login.tsx                # Login & Signup page
```

---

## 🎯 การใช้งาน AuthContext ในคอมโพเนนต์

### Import useAuth hook:

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  return (
    <div>
      {user ? (
        <p>ยินดีต้อนรับ, {user.displayName || user.email}</p>
      ) : (
        <p>กรุณาล็อกอิน</p>
      )}
    </div>
  );
}
```

### ฟังก์ชันที่มีให้ใช้:

- `user` - ข้อมูลผู้ใช้ปัจจุบัน (User | null)
- `loading` - สถานะกำลังโหลด (boolean)
- `signIn(email, password)` - ล็อกอินด้วย Email/Password
- `signUp(email, password, displayName?)` - สมัครสมาชิก
- `signInWithGoogle()` - ล็อกอินด้วย Google
- `signOut()` - ออกจากระบบ

---

## 🔐 ตั้งค่า Firebase Console

### เปิดใช้งาน Authentication Providers:

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ `game-shop-72ad1`
3. ไปที่ **Authentication** > **Sign-in method**
4. เปิดใช้งาน:
   - ✅ **Email/Password**
   - ✅ **Google**

### ตั้งค่า Authorized Domains:

ใน Firebase Console > Authentication > Settings > Authorized domains
- เพิ่ม `localhost` (สำหรับการพัฒนา)
- เพิ่มโดเมนของคุณเมื่อ deploy (เช่น `yourapp.vercel.app`)

---

## 🎨 UI Components ที่ใช้

- Tabs (สลับระหว่างล็อกอิน/สมัครสมาชิก)
- Input (ช่องกรอกข้อมูล)
- Button (ปุ่มต่างๆ)
- Card (กรอบหลัก)
- Toast (แสดงแจ้งเตือน)
- Loader (แสดงขณะโหลด)

---

## 🐛 Troubleshooting

### ปัญหา: "Firebase: Error (auth/popup-blocked)"
**แก้ไข:** เปิดอนุญาต popup ในเบราว์เซอร์

### ปัญหา: "Firebase: Error (auth/unauthorized-domain)"
**แก้ไข:** เพิ่มโดเมนใน Firebase Console > Authentication > Authorized domains

### ปัญหา: redirect loop หรือ infinite loading
**แก้ไข:** ตรวจสอบว่า AuthProvider อยู่นอก BrowserRouter ใน App.tsx

---

## 📚 เอกสารเพิ่มเติม

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [React Context API](https://react.dev/reference/react/useContext)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/overview)

---

## 🎉 พร้อมใช้งาน!

ระบบ Authentication พร้อมใช้งานแล้ว ตอนนี้คุณสามารถ:

1. ✅ สมัครสมาชิกและล็อกอิน
2. ✅ ป้องกันหน้าที่ต้องการ authentication
3. ✅ เข้าถึงข้อมูล user จากทุกหน้า
4. ✅ Logout และจัดการ session

**ขั้นตอนถัดไป:**
- เชื่อมต่อกับ Firestore สำหรับจัดเก็บข้อมูล
- เพิ่มการจัดการ Profile
- เพิ่มระบบ Role-based access control

