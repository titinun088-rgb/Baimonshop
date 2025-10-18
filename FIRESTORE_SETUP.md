# 🔥 คู่มือตั้งค่า Firestore

## ⚠️ ปัญหา: "เกิดข้อผิดพลาดในการโหลดข้อมูล"

หากคุณเจอข้อความนี้ มีสาเหตุหลัก 3 ข้อ:

1. **ยังไม่มีข้อมูลในฐานข้อมูล** (ปกติ - เริ่มต้นใหม่)
2. **Firestore Rules ยังไม่ถูกต้อง** (ต้องตั้งค่า)
3. **Firestore Indexes ยังไม่พร้อม** (รอสร้างอัตโนมัติ)

---

## 🚀 วิธีแก้ไขทีละขั้นตอน

### **ขั้นตอนที่ 1: ตรวจสอบว่ามีข้อมูลหรือไม่**

1. เปิด Firebase Console: https://console.firebase.google.com
2. เลือกโปรเจค: **game-shop-72ad1**
3. ไปที่ **Firestore Database**
4. ดูว่ามี Collection **`games`** หรือไม่

**ถ้ายังไม่มี:**
- ✅ ปกติ! เพราะยังไม่ได้สร้างเกม
- ✅ ไปหน้า "เกม" แล้วคลิก "เพิ่มเกมใหม่"
- ✅ ระบบจะสร้าง Collection อัตโนมัติ

---

### **ขั้นตอนที่ 2: ตั้งค่า Firestore Rules**

1. ใน Firebase Console → **Firestore Database**
2. คลิกแท็บ **"Rules"**
3. คัดลอกโค้ดนี้แทนที่:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVerified() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verified == true;
    }
    
    function isOwner(ownerId) {
      return isSignedIn() && request.auth.uid == ownerId;
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }

    // Games Collection
    match /games/{gameId} {
      // อ่าน: ล็อกอิน + verified
      allow read: if isVerified();
      
      // สร้าง: ล็อกอิน + verified
      allow create: if isVerified() && 
                       request.resource.data.createdBy == request.auth.uid;
      
      // แก้ไข/ลบ: Admin หรือเจ้าของ
      allow update, delete: if isAdmin() || 
                               (isVerified() && resource.data.createdBy == request.auth.uid);
    }

    // Game Items Collection
    match /gameItems/{itemId} {
      // อ่าน: ล็อกอิน + verified
      allow read: if isVerified();
      
      // สร้าง: ล็อกอิน + verified
      allow create: if isVerified();
      
      // แก้ไข/ลบ: Admin หรือเจ้าของเกม
      allow update, delete: if isAdmin() || isVerified();
    }
  }
}
```

4. คลิก **"Publish"**

---

### **ขั้นตอนที่ 3: สร้าง Firestore Indexes**

เมื่อคุณเรียกใช้ query ที่มี `orderBy` + `where` ครั้งแรก Firebase จะขึ้น error พร้อมลิงก์สร้าง Index

**วิธีสร้าง:**

1. เปิดคอนโซลของ Browser (F12)
2. ดู error message จะมีลิงก์แบบนี้:
   ```
   https://console.firebase.google.com/project/.../indexes?create_composite=...
   ```
3. คลิกลิงก์นั้น → Firebase จะเปิดหน้าสร้าง Index
4. คลิก **"Create Index"**
5. รอ 2-5 นาที ให้ Index สร้างเสร็จ

**หรือสร้างเอง:**

ไปที่ **Firestore Database → Indexes → Composite**

สร้าง Index 3 ตัว:

#### Index 1: Games with orderBy
```
Collection: games
Fields:
  - createdBy (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

#### Index 2: Games orderBy only
```
Collection: games
Fields:
  - createdAt (Descending)
Query Scope: Collection
```

#### Index 3: Game Items with orderBy
```
Collection: gameItems
Fields:
  - gameId (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

---

### **ขั้นตอนที่ 4: ทดสอบ**

1. **Refresh** หน้าเว็บ (Ctrl+R หรือ F5)
2. ไปหน้า **"เกม"**
3. คลิก **"เพิ่มเกมใหม่"**
4. กรอกข้อมูล:
   ```
   ชื่อเกม: Valorant
   หมวดหมู่: FPS
   รายละเอียด: เกม FPS ยอดนิยม
   URL รูปภาพ: https://source.unsplash.com/800x450/?valorant
   ```
5. คลิก **"เพิ่มเกม"**
6. ✅ ควรเห็นเกมปรากฏในรายการ!

---

## 🐛 Troubleshooting เพิ่มเติม

### **ปัญหา 1: "Missing or insufficient permissions"**

**สาเหตุ:** Firestore Rules ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบว่าคุณ **login** แล้ว
2. ตรวจสอบว่า user ของคุณ **verified = true** ใน Firestore
3. ตรวจสอบ Rules ตามขั้นตอนที่ 2

### **ปัญหา 2: "Index not ready"**

**สาเหตุ:** Firestore Index กำลังสร้าง

**แก้ไข:**
1. รอ 2-5 นาที
2. Refresh หน้าเว็บ
3. ถ้ายังไม่ได้ ดูคอนโซล แล้วคลิกลิงก์สร้าง Index

### **ปัญหา 3: "ไม่พบเกมที่ต้องการ"**

**สาเหตุ:** ยังไม่มีเกมในฐานข้อมูล

**แก้ไข:**
1. กลับไปหน้า "เกม"
2. เพิ่มเกมใหม่ก่อน
3. จึงจะคลิกเข้าดูรายละเอียดได้

### **ปัญหา 4: หน้าว่างเปล่า ไม่มี error**

**สาเหตุ:** JavaScript error หรือ Firebase ยังไม่ initialize

**แก้ไข:**
1. เปิด Console (F12)
2. ดู error แดง ๆ
3. ลอง Clear cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R

---

## ✅ Checklist สำหรับเริ่มต้นใช้งาน

- [ ] Firebase Console เข้าได้
- [ ] Firestore Database เปิดแล้ว (mode: Production หรือ Test)
- [ ] Firestore Rules ตั้งค่าแล้ว (ตามขั้นตอนที่ 2)
- [ ] Login เข้าระบบสำเร็จ
- [ ] User ที่ login มี `verified: true`
- [ ] เพิ่มเกมทดสอบได้
- [ ] คลิกเข้าเกมเห็นรายละเอียด
- [ ] เพิ่มรายการเติมได้

---

## 🎯 ตัวอย่างข้อมูลใน Firestore

### **Collection: `games`**

```
games/abc123: {
  name: "Valorant",
  imageUrl: "https://...",
  category: "FPS",
  description: "เกม FPS ยอดนิยม",
  createdBy: "user_uid_123",
  createdAt: Timestamp(2024-01-01 10:00:00),
  updatedAt: Timestamp(2024-01-01 10:05:00)
}
```

### **Collection: `gameItems`**

```
gameItems/item123: {
  gameId: "abc123",
  name: "VP 1000",
  costPrice: 200,
  sellPrice: 250,
  imageUrl: "https://...",
  createdAt: Timestamp(2024-01-01 10:10:00)
}
```

### **Collection: `users`**

```
users/user_uid_123: {
  email: "seller@example.com",
  shopName: "My Game Shop",
  role: "seller",
  verified: true,
  createdAt: Timestamp(2024-01-01 09:00:00)
}
```

---

## 🔒 Firestore Rules สำหรับ Production

เมื่อเสร็จแล้ว ใช้ Rules นี้ (ปลอดภัยสุด):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVerified() {
      return isSignedIn() && 
             request.auth.token.email_verified == true &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verified == true;
    }
    
    function isOwner(ownerId) {
      return isSignedIn() && request.auth.uid == ownerId;
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }

    match /games/{gameId} {
      allow read: if isVerified();
      allow create: if isVerified() && 
                       request.resource.data.createdBy == request.auth.uid;
      allow update, delete: if isAdmin() || 
                               (isVerified() && resource.data.createdBy == request.auth.uid);
    }

    match /gameItems/{itemId} {
      allow read: if isVerified();
      allow create: if isVerified();
      allow update, delete: if isAdmin() || isVerified();
    }
  }
}
```

---

## 📞 ยังไม่ได้?

ถ้าทำทุกอย่างแล้วยังไม่ได้ ให้:

1. **เปิด Console** (F12)
2. **คัดลอก error ทั้งหมด**
3. **ส่งให้ผม** แล้วจะแก้ให้เลย!

---

## ✨ เมื่อทุกอย่างพร้อม

คุณจะสามารถ:
- ✅ เพิ่ม/แก้ไข/ลบเกม
- ✅ เพิ่ม/แก้ไข/ลบรายการเติม
- ✅ ดูสถิติ
- ✅ คำนวณกำไรอัตโนมัติ
- ✅ Admin จัดการทุกอย่าง
- ✅ Seller จัดการเฉพาะของตัวเอง

**Good luck! 🚀**

