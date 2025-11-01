# 🚀 Quick Reference - ระบบ Auth

## 📍 Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/register` | สมัครสมาชิก | Public |
| `/login` | เข้าสู่ระบบ | Public |
| `/forgot-password` | ลืมรหัสผ่าน | Public |
| `/verify-email` | ยืนยันอีเมล | Logged in only |
| `/` (Dashboard) | หน้าหลัก | Logged in + Verified |
| `/games` | จัดการเกม | Logged in + Verified |
| `/sales` | ยอดขาย | Logged in + Verified |

---

## 🎯 useAuth Hook

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { 
    user,                    // Firebase User object
    userData,                // Firestore user data
    loading,                 // boolean
    signIn,                  // (email, password) => Promise<void>
    signUp,                  // (email, password, shopName) => Promise<void>
    signInWithGoogle,        // () => Promise<void>
    signOut,                 // () => Promise<void>
    sendVerificationEmail,   // () => Promise<void>
    resetPassword,           // (email) => Promise<void>
    refreshUser,             // () => Promise<void>
  } = useAuth();
}
```

---

## 🔥 Firebase Setup Checklist

### 1. Enable Authentication
- ✅ Email/Password
- ✅ Google OAuth

### 2. Add Authorized Domains
- ✅ localhost
- ✅ Your production domain

### 3. Firestore Rules
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## 💾 Firestore Schema

```typescript
users/{uid}: {
  uid: string;
  email: string;
  displayName: string;
  shopName: string;
  createdAt: Date;
  emailVerified: boolean;
  photoURL?: string;
}
```

---

## 🔒 Protection Levels

1. **Public** - ไม่ต้องล็อกอิน
2. **Semi-Protected** - ล็อกอินแล้วแต่ยังไม่ยืนยันอีเมล
3. **Fully Protected** - ล็อกอิน + ยืนยันอีเมลแล้ว

---

## 🎨 Error Messages (Thai)

| Firebase Error | Thai Message |
|----------------|--------------|
| `auth/email-already-in-use` | อีเมลนี้ถูกใช้งานแล้ว |
| `auth/invalid-email` | รูปแบบอีเมลไม่ถูกต้อง |
| `auth/weak-password` | รหัสผ่านไม่ปลอดภัยเพียงพอ |
| `auth/user-not-found` | ไม่พบผู้ใช้ที่มีอีเมลนี้ |
| `auth/wrong-password` | อีเมลหรือรหัสผ่านไม่ถูกต้อง |
| `auth/popup-blocked` | กรุณาอนุญาต popup ในเบราว์เซอร์ |
| `auth/too-many-requests` | ส่งคำขอบ่อยเกินไป กรุณารอสักครู่ |

---

## 🚦 User Flow

```
REGISTER → Verify Email → Dashboard
LOGIN (verified) → Dashboard
LOGIN (not verified) → Verify Email → Dashboard
GOOGLE LOGIN → Dashboard (auto-verified)
```

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Check for errors
npm run lint

# Build for production
npm run build
```

---

## 🐛 Common Issues

### ไม่ได้รับอีเมล?
→ Check Spam folder

### Popup blocked?
→ Allow popups for localhost

### Still redirect to verify-email after verifying?
→ Click "ตรวจสอบสถานะ" button

---

## 📱 Test Accounts

สร้าง test account:
1. Go to `/register`
2. Email: `test@example.com`
3. Password: `test123456`
4. Shop Name: `Test Shop`

---

## 🎉 All Done!

ระบบพร้อมใช้งาน 100% ✅



