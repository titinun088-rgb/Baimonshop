# 🔐 ระบบแยกสิทธิ์ Admin / Seller

## ✅ สิ่งที่แก้ไขแล้ว

### **ปัญหาเดิม:**
- ✅ Admin เห็นเมนูทุกอย่าง
- ❌ Seller (ร้านทั่วไป) ก็เห็นเมนูทุกอย่างเหมือนกัน
- ❌ ไม่มีการแยกสิทธิ์

### **หลังแก้ไข:**
- ✅ Admin เห็นเมนูทุกอย่าง
- ✅ Seller เห็นเฉพาะเมนูที่เกี่ยวข้อง
- ✅ มีการจำกัดสิทธิ์ตาม role

---

## 📋 เมนูที่แสดงตาม Role

### **Admin เห็น:**
```
✅ Dashboard        - ภาพรวมทั้งหมด
✅ เกม              - จัดการเกมทั้งระบบ
✅ ยอดขาย          - ยอดขายทั้งหมด
✅ ผู้ใช้           - จัดการผู้ใช้ทั้งหมด
✅ กิจกรรม         - ดู activity ทั้งหมด
✅ แจ้งเตือน       - แจ้งเตือนทั้งหมด
```

### **Seller เห็น:**
```
✅ Dashboard        - ภาพรวมของตัวเอง
✅ เกม              - จัดการเกมของตัวเอง
✅ ยอดขาย          - ยอดขายของตัวเอง
❌ ผู้ใช้           - ไม่เห็น (Admin only)
❌ กิจกรรม         - ไม่เห็น (Admin only)
✅ แจ้งเตือน       - แจ้งเตือนของตัวเอง
```

---

## 🔧 การทำงาน

### **1. กำหนด Roles ในเมนู**

```typescript
const allNavigation = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard,
    roles: ['admin', 'seller'] // ทั้งสองเห็น
  },
  { 
    name: "ผู้ใช้", 
    href: "/users", 
    icon: Users,
    roles: ['admin'] // เฉพาะ Admin
  },
  // ...
];
```

### **2. กรองเมนูตาม Role**

```typescript
const navigation = allNavigation.filter(item => 
  item.roles.includes(userData?.role || 'seller')
);
```

### **3. แสดงเฉพาะเมนูที่มีสิทธิ์**

- ถ้า role = 'admin' → เห็นทุกเมนู
- ถ้า role = 'seller' → เห็นเฉพาะเมนูที่ roles มี 'seller'

---

## 🎯 ตัวอย่างการใช้งาน

### **Admin Login:**

```
เข้าสู่ระบบด้วย admin@example.com
→ role = 'admin'
→ เห็นเมนู: Dashboard, เกม, ยอดขาย, ผู้ใช้, กิจกรรม, แจ้งเตือน
```

**Sidebar:**
```
┌─────────────────────┐
│ Game Shop           │
├─────────────────────┤
│ 🏠 Dashboard        │
│ 🎮 เกม              │
│ 💰 ยอดขาย          │
│ 👥 ผู้ใช้           │ ← เฉพาะ Admin
│ 📊 กิจกรรม         │ ← เฉพาะ Admin
│ 🔔 แจ้งเตือน       │
└─────────────────────┘
```

---

### **Seller Login:**

```
เข้าสู่ระบบด้วย seller@example.com
→ role = 'seller'
→ เห็นเมนู: Dashboard, เกม, ยอดขาย, แจ้งเตือน
```

**Sidebar:**
```
┌─────────────────────┐
│ Game Shop           │
├─────────────────────┤
│ 🏠 Dashboard        │
│ 🎮 เกม              │
│ 💰 ยอดขาย          │
│ 🔔 แจ้งเตือน       │
└─────────────────────┘
```

**ไม่เห็น:**
- ❌ ผู้ใช้
- ❌ กิจกรรม

---

## 🛡️ การป้องกันเพิ่มเติม

### **1. ProtectedRoute**

ป้องกันไม่ให้ Seller เข้า URL โดยตรง:

```typescript
// ใน App.tsx
<Route
  path="/users"
  element={
    <ProtectedRoute requireAdmin={true}>
      <Users />
    </ProtectedRoute>
  }
/>
```

### **2. Backend Rules**

Firestore Rules ป้องกันไม่ให้อ่าน/เขียนข้อมูลที่ไม่มีสิทธิ์:

```javascript
// Firestore Rules
match /users/{userId} {
  allow read: if request.auth.uid != null;
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 📊 สรุปสิทธิ์

| ฟีเจอร์ | Admin | Seller |
|---------|-------|--------|
| **Dashboard** | ✅ ทั้งหมด | ✅ ของตัวเอง |
| **เกม** | ✅ ทั้งหมด | ✅ ของตัวเอง |
| **ยอดขาย** | ✅ ทั้งหมด | ✅ ของตัวเอง |
| **ผู้ใช้** | ✅ จัดการได้ | ❌ ไม่เห็น |
| **กิจกรรม** | ✅ ทั้งหมด | ❌ ไม่เห็น |
| **แจ้งเตือน** | ✅ ทั้งหมด | ✅ ของตัวเอง |

---

## 🔍 วิธีตรวจสอบ

### **1. ทดสอบ Admin:**

```
1. Login ด้วย admin account
2. ดูเมนูใน Sidebar
3. ✅ ควรเห็น 6 เมนู (ทั้งหมด)
4. ✅ มี badge "ADMIN"
```

### **2. ทดสอบ Seller:**

```
1. Login ด้วย seller account
2. ดูเมนูใน Sidebar
3. ✅ ควรเห็น 4 เมนู
4. ❌ ไม่เห็น "ผู้ใช้" และ "กิจกรรม"
5. ❌ ไม่มี badge "ADMIN"
```

### **3. ตรวจสอบ Role:**

```
เปิด Console (F12)
พิมพ์: console.log(userData?.role)

ผลลัพธ์:
- Admin: "admin"
- Seller: "seller"
```

---

## 💡 เพิ่มเมนูใหม่

ถ้าต้องการเพิ่มเมนูใหม่:

```typescript
const allNavigation = [
  // ... เมนูเดิม

  // เมนูใหม่
  { 
    name: "รายงาน", 
    href: "/reports", 
    icon: FileText,
    roles: ['admin'] // กำหนดว่าใครเห็นได้บ้าง
  },
];
```

**Options:**
- `roles: ['admin']` - เฉพาะ Admin
- `roles: ['seller']` - เฉพาะ Seller
- `roles: ['admin', 'seller']` - ทุกคน

---

## 🎨 Visual Indicator

### **Admin Badge:**
```
┌────────────────────────┐
│  👤  Admin User  ADMIN │
│  admin@example.com     │
└────────────────────────┘
      ↑ มี badge
```

### **Seller (ไม่มี Badge):**
```
┌────────────────────────┐
│  👤  Seller Shop       │
│  seller@example.com    │
└────────────────────────┘
```

---

## 🔐 Security Checklist

- [x] เมนูกรองตาม role
- [x] Admin badge แสดงชัดเจน
- [x] Seller ไม่เห็นเมนู Admin
- [ ] ProtectedRoute ป้องกัน URL (แนะนำเพิ่ม)
- [ ] Firestore Rules ป้องกัน Backend (แนะนำเพิ่ม)

---

## ✨ สรุป

**ปัญหา:** Seller เห็นเมนูทุกอย่างเหมือน Admin  
**วิธีแก้:** กรองเมนูตาม role  
**ผลลัพธ์:** 
- Admin เห็น 6 เมนู
- Seller เห็น 4 เมนู
- ไม่เห็น "ผู้ใช้" และ "กิจกรรม"

**ไฟล์ที่แก้:**
- ✅ `src/components/Layout.tsx`

---

**พร้อมใช้งานแล้ว!** 🎉

ลองทดสอบด้วยการ Login เป็น Seller และ Admin ดูครับ!

