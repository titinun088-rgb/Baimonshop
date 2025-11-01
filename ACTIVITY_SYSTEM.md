# 📊 ระบบกิจกรรม (Activity Logs System)

## ✅ สิ่งที่สร้างเสร็จแล้ว

ระบบบันทึกกิจกรรมสมบูรณ์ พร้อมใช้งาน! 🎉

### **ฟีเจอร์หลัก:**

1. ✅ **บันทึกกิจกรรมอัตโนมัติ**
   - บันทึกทุกครั้งที่ผู้ใช้ทำอะไร
   - เก็บข้อมูล: userId, email, shopName, action, details, timestamp
   - บันทึกลง Firestore (`activityLogs`)

2. ✅ **หน้ากิจกรรม (`/activity`) - Admin only**
   - ดูกิจกรรมทั้งระบบ (Admin)
   - Stats Cards (วันนี้, 7 วัน, เดือนนี้, ทั้งหมด)
   - Filter ตามผู้ใช้, ประเภท, วันที่
   - Timeline แสดงกิจกรรมล่าสุด
   - Top Users (ผู้ใช้ที่มีกิจกรรมมากที่สุด)

3. ✅ **กิจกรรมที่บันทึก**
   - เกม: สร้าง, แก้ไข, ลบ
   - รายการเติม: เพิ่ม, แก้ไข, ลบ
   - ยอดขาย: บันทึก, ลบ
   - ผู้ใช้: Login, Logout, สร้าง, แก้ไข, ลบ (พร้อมทำ)
   - รายงานปัญหา: แจ้ง, อัปเดต, ลบ (พร้อมทำ)
   - ประกาศ: สร้าง, แก้ไข, ลบ (พร้อมทำ)

---

## 📊 โครงสร้างข้อมูล

### **ActivityLog**

```typescript
interface ActivityLog {
  id: string;
  userId: string;              // UID ของผู้ทำ
  email: string;                // อีเมลผู้ทำ
  shopName?: string;            // ชื่อร้าน (ถ้ามี)
  action: ActivityAction;       // ประเภทกิจกรรม
  details: string;              // รายละเอียด
  metadata?: Record<string, any>; // ข้อมูลเพิ่มเติม
  timestamp: Date;              // เวลาที่เกิด
}
```

### **ActivityAction (ประเภทกิจกรรม)**

```typescript
type ActivityAction = 
  // Game
  | "game_created"
  | "game_updated"
  | "game_deleted"
  // Game Item
  | "game_item_created"
  | "game_item_updated"
  | "game_item_deleted"
  // Sale
  | "sale_created"
  | "sale_deleted"
  // User (พร้อมทำ)
  | "user_login"
  | "user_logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  // Report (พร้อมทำ)
  | "report_created"
  | "report_updated"
  | "report_deleted"
  // Notification (พร้อมทำ)
  | "notification_created"
  | "notification_updated"
  | "notification_deleted";
```

### **โครงสร้าง Firestore**

```
activityLogs/
├─ {logId}/
│  ├─ userId: "user-123"
│  ├─ email: "shop@example.com"
│  ├─ shopName: "ร้านเกมดี"
│  ├─ action: "game_created"
│  ├─ details: "สร้างเกม \"Valorant\""
│  ├─ metadata: { gameId: "...", gameName: "..." }
│  └─ timestamp: Timestamp
```

---

## 🔧 การทำงาน

### **1. บันทึกกิจกรรมอัตโนมัติ**

#### **ตัวอย่าง: สร้างเกม**

```typescript
// ใน gameUtils.ts - createGame()

// เมื่อสร้างเกมสำเร็จ
await logActivity({
  userId: user.uid,
  email: user.email,
  shopName: userData.shopName,
  action: "game_created",
  details: `สร้างเกม "${gameName}"`,
  metadata: { gameId, gameName },
});
```

**ผลลัพธ์:**
```
📝 บันทึกใน Firestore: activityLogs/{logId}
{
  userId: "abc123",
  email: "shop@example.com",
  shopName: "ร้านเกมดี",
  action: "game_created",
  details: "สร้างเกม \"Valorant\"",
  metadata: { gameId: "val-001", gameName: "Valorant" },
  timestamp: 2024-10-18 14:30:00
}
```

---

### **2. ดูกิจกรรมในหน้า `/activity`**

#### **Admin View:**

```
┌──────────────────────────────────────┐
│ กิจกรรม                              │
│ ติดตามกิจกรรมและการเคลื่อนไหวทั้งระบบ│
├──────────────────────────────────────┤
│ [วันนี้: 15] [7 วัน: 120] [เดือน: 450] [ทั้งหมด: 1,250] │
├──────────────────────────────────────┤
│ กรองข้อมูล                  [ล้างตัวกรอง] │
│ ├─ ผู้ใช้: [ทั้งหมด ▼]              │
│ ├─ ประเภท: [ทั้งหมด ▼]              │
│ ├─ วันที่เริ่มต้น: [________]        │
│ └─ วันที่สิ้นสุด: [________]        │
│ แสดง 1,250 จาก 1,250 กิจกรรม         │
├──────────────────────────────────────┤
│ กิจกรรมล่าสุด                        │
│                                      │
│ 🎮 สร้างเกมใหม่      [ร้านเกมดี]   │
│    สร้างเกม "Valorant"              │
│    📅 18 ต.ค. 2567, 14:30           │
│                                      │
│ 💰 บันทึกยอดขาย      [ร้าน A]      │
│    บันทึกยอดขาย "VP 1000" จำนวน 2...│
│    📅 18 ต.ค. 2567, 13:15           │
│                                      │
│ 🎮 แก้ไขเกม          [ร้าน B]      │
│    แก้ไขเกม "Genshin Impact"        │
│    📅 18 ต.ค. 2567, 11:00           │
│                                      │
└──────────────────────────────────────┘
```

---

### **3. Filter กิจกรรม**

#### **กรองตามผู้ใช้ (Admin only):**

```
เลือก: "ร้านเกมดี"
→ แสดงเฉพาะกิจกรรมของร้านเกมดี
```

#### **กรองตามประเภท:**

```
เลือก: "สร้างเกมใหม่"
→ แสดงเฉพาะกิจกรรม game_created
```

#### **กรองตามวันที่:**

```
วันที่เริ่มต้น: 2024-10-15
วันที่สิ้นสุด: 2024-10-18
→ แสดงกิจกรรมระหว่างวันที่ 15-18 ต.ค.
```

---

## 📝 กิจกรรมที่บันทึก

### **เกม (Games)**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `game_created` | สร้างเกมใหม่ | เขียว | 🎮 |
| `game_updated` | แก้ไขเกม | น้ำเงิน | 🎮 |
| `game_deleted` | ลบเกม | แดง | 🎮 |

**ตัวอย่าง:**
- "สร้างเกม \"Valorant\""
- "แก้ไขเกม \"Genshin Impact\""
- "ลบเกม \"Free Fire\""

---

### **รายการเติม (Game Items)**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `game_item_created` | เพิ่มรายการเติม | เขียว | 🎮 |
| `game_item_updated` | แก้ไขรายการเติม | น้ำเงิน | 🎮 |
| `game_item_deleted` | ลบรายการเติม | แดง | 🎮 |

**ตัวอย่าง:**
- "เพิ่มรายการเติม \"VP 1000\" ในเกม \"Valorant\""
- "แก้ไขรายการเติม \"GC 6480\" ในเกม \"Genshin Impact\""
- "ลบรายการเติม \"Diamond 2000\" ในเกม \"Free Fire\""

---

### **ยอดขาย (Sales)**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `sale_created` | บันทึกยอดขาย | เขียว | 💰 |
| `sale_deleted` | ลบยอดขาย | แดง | 💰 |

**ตัวอย่าง:**
- "บันทึกยอดขาย \"VP 1000\" จำนวน 2 รายการ (฿240.00)"
- "ลบยอดขาย (ID: sale-123)"

---

### **ผู้ใช้ (Users) - พร้อมทำ**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `user_login` | เข้าสู่ระบบ | ม่วง | 👤 |
| `user_logout` | ออกจากระบบ | เทา | 👤 |
| `user_created` | สร้างผู้ใช้ | เขียว | 👤 |
| `user_updated` | แก้ไขผู้ใช้ | น้ำเงิน | 👤 |
| `user_deleted` | ลบผู้ใช้ | แดง | 👤 |

**ตัวอย่าง:**
- "เข้าสู่ระบบ"
- "สร้างผู้ใช้ \"shop@example.com\""
- "แก้ไขข้อมูลผู้ใช้ \"admin@example.com\""

---

### **รายงานปัญหา (Reports) - พร้อมทำ**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `report_created` | แจ้งปัญหา | เขียว | 📋 |
| `report_updated` | อัปเดตรายงานปัญหา | น้ำเงิน | 📋 |
| `report_deleted` | ลบรายงานปัญหา | แดง | 📋 |

**ตัวอย่าง:**
- "แจ้งปัญหา \"ไม่สามารถเข้าสู่ระบบได้\""
- "อัปเดตรายงานปัญหา (สถานะ: แก้ไขแล้ว)"

---

### **ประกาศ (Notifications) - พร้อมทำ**

| Action | Label | สี | Icon |
|--------|-------|-----|------|
| `notification_created` | สร้างประกาศ | เขียว | 🔔 |
| `notification_updated` | แก้ไขประกาศ | น้ำเงิน | 🔔 |
| `notification_deleted` | ลบประกาศ | แดง | 🔔 |

**ตัวอย่าง:**
- "สร้างประกาศ \"แจ้งปิดปรับปรุงระบบ\""
- "แก้ไขประกาศ \"ฟีเจอร์ใหม่: ระบบยอดขาย\""

---

## 🎯 ตัวอย่างการใช้งาน

### **Scenario 1: Seller เพิ่มเกมและรายการเติม**

```
1. Seller Login → shop@example.com
2. ไปที่ /games → คลิก "เพิ่มเกมใหม่"
3. กรอก: "Valorant", หมวดหมู่: "FPS"
4. บันทึกเกมสำเร็จ
   → 📝 บันทึก Log:
      action: "game_created"
      details: "สร้างเกม \"Valorant\""
      
5. คลิกเข้าเกม Valorant → คลิก "เพิ่มรายการ"
6. กรอก: "VP 1000", ราคาทุน: 100, ราคาขาย: 125
7. บันทึกรายการสำเร็จ
   → 📝 บันทึก Log:
      action: "game_item_created"
      details: "เพิ่มรายการเติม \"VP 1000\" ในเกม \"Valorant\""
```

**ผล:**
```
Admin ดูที่ /activity จะเห็น:

🎮 สร้างเกมใหม่      [ร้านเกมดี]
   สร้างเกม "Valorant"
   📅 18 ต.ค. 2567, 14:30

🎮 เพิ่มรายการเติม    [ร้านเกมดี]
   เพิ่มรายการเติม "VP 1000" ในเกม "Valorant"
   📅 18 ต.ค. 2567, 14:32
```

---

### **Scenario 2: Seller บันทึกยอดขาย**

```
1. ไปที่ /sales → คลิก "เพิ่มยอดขายใหม่"
2. เลือกเกม: Valorant
3. เลือกรายการ: VP 1000
4. จำนวน: 2, ส่วนลด: 10
5. บันทึกยอดขายสำเร็จ (฿240.00, กำไร ฿40.00)
   → 📝 บันทึก Log:
      action: "sale_created"
      details: "บันทึกยอดขาย \"VP 1000\" จำนวน 2 รายการ (฿240.00)"
      metadata: { saleId, gameId, quantity: 2, netAmount: 240, profit: 40 }
```

**ผล:**
```
Admin ดูที่ /activity จะเห็น:

💰 บันทึกยอดขาย      [ร้านเกมดี]
   บันทึกยอดขาย "VP 1000" จำนวน 2 รายการ (฿240.00)
   📅 18 ต.ค. 2567, 15:00
```

---

### **Scenario 3: Admin ดูสถิติกิจกรรม**

```
Admin ไปที่ /activity

Dashboard:
├─ วันนี้: 25 กิจกรรม
├─ 7 วันล่าสุด: 180 กิจกรรม
├─ เดือนนี้: 520 กิจกรรม
└─ ทั้งหมด: 1,250 กิจกรรม

ผู้ใช้ที่มีกิจกรรมมากที่สุด:
#1 ร้านเกมดี      250 กิจกรรม
#2 ร้าน A         180 กิจกรรม
#3 ร้าน B         150 กิจกรรม
#4 ร้าน C         120 กิจกรรม
#5 ร้าน D         100 กิจกรรม
```

---

### **Scenario 4: Admin กรองกิจกรรม**

```
1. เลือกผู้ใช้: "ร้านเกมดี"
2. เลือกประเภท: "บันทึกยอดขาย"
3. วันที่: 15 ต.ค. - 18 ต.ค.
4. ✅ แสดง 15 จาก 1,250 กิจกรรม

ผลลัพธ์:
├─ แสดงเฉพาะยอดขายของร้านเกมดี
├─ ในช่วงวันที่ 15-18 ต.ค.
└─ จำนวน 15 รายการ
```

---

## 📁 ไฟล์ที่สร้าง/แก้ไข

### **1. Types:**
- ✅ `src/types/activity.ts` - Types สำหรับ ActivityLog และ Filter

### **2. Utils:**
- ✅ `src/lib/activityUtils.ts` - บันทึกและดึง logs, คำนวณสถิติ

### **3. Utils (แก้ไขเพิ่ม log):**
- ✅ `src/lib/gameUtils.ts` - เพิ่มการบันทึก log (game_*, game_item_*)
- ✅ `src/lib/salesUtils.ts` - เพิ่มการบันทึก log (sale_*)

### **4. Pages:**
- ✅ `src/pages/Activity.tsx` - หน้ากิจกรรม พร้อม Filter และ Stats

---

## 🚀 วิธีใช้งาน

### **1. ดูกิจกรรม (Admin):**

```
1. Login เป็น Admin
2. ไปที่ /activity
3. ✅ เห็นกิจกรรมทั้งระบบ
```

### **2. กรองกิจกรรม:**

```
1. ไปที่ /activity
2. เลือก:
   ├─ ผู้ใช้ (Admin only)
   ├─ ประเภท
   ├─ วันที่เริ่มต้น
   └─ วันที่สิ้นสุด
3. ✅ ดูผลลัพธ์
4. คลิก "ล้างตัวกรอง" เพื่อรีเซ็ต
```

### **3. ดูสถิติ:**

```
Stats Cards:
├─ วันนี้: กิจกรรมวันนี้
├─ 7 วัน: กิจกรรม 7 วันล่าสุด
├─ เดือนนี้: กิจกรรมเดือนนี้
└─ ทั้งหมด: กิจกรรมทั้งหมด

Top Users (Admin):
└─ 5 ผู้ใช้ที่มีกิจกรรมมากที่สุด
```

---

## 🔥 ฟีเจอร์พิเศษ

### **1. บันทึกอัตโนมัติ**

```
ทุกครั้งที่ผู้ใช้:
├─ สร้างเกม → บันทึก log อัตโนมัติ
├─ แก้ไขเกม → บันทึก log อัตโนมัติ
├─ ลบเกม → บันทึก log อัตโนมัติ
├─ บันทึกยอดขาย → บันทึก log อัตโนมัติ
└─ ... ทุกกิจกรรม
```

### **2. Metadata ละเอียด**

```
log.metadata = {
  gameId: "val-001",
  gameName: "Valorant",
  quantity: 2,
  netAmount: 240,
  profit: 40,
  ...
}

→ เก็บข้อมูลเพิ่มเติมสำหรับการวิเคราะห์
```

### **3. สี และ Icon ตาม Action**

```
🎮 game_* → สีเขียว/น้ำเงิน/แดง
💰 sale_* → สีเขียว/แดง
👤 user_* → สีม่วง/เทา/เขียว/น้ำเงิน/แดง
📋 report_* → สีเขียว/น้ำเงิน/แดง
🔔 notification_* → สีเขียว/น้ำเงิน/แดง
```

### **4. Top Users Ranking**

```
Admin เห็น:
#1 ร้านเกมดี      250 กิจกรรม ⭐
#2 ร้าน A         180 กิจกรรม
#3 ร้าน B         150 กิจกรรม
#4 ร้าน C         120 กิจกรรม
#5 ร้าน D         100 กิจกรรม
```

---

## 🛠️ Firestore Collection: `activityLogs`

### **โครงสร้าง:**

```
activityLogs/
├─ log-001/
│  ├─ userId, email, shopName
│  ├─ action, details
│  ├─ metadata: { ... }
│  └─ timestamp
├─ log-002/
│  └─ ...
```

### **ตัวอย่างข้อมูล:**

```json
{
  "userId": "abc123",
  "email": "shop@example.com",
  "shopName": "ร้านเกมดี",
  "action": "game_created",
  "details": "สร้างเกม \"Valorant\"",
  "metadata": {
    "gameId": "val-001",
    "gameName": "Valorant"
  },
  "timestamp": "2024-10-18T14:30:00Z"
}
```

---

## 📈 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Activity Logs
    match /activityLogs/{logId} {
      // อ่าน: เฉพาะของตัวเอง หรือ Admin
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // สร้าง: เฉพาะคนที่ล็อกอิน (ระบบบันทึกอัตโนมัติ)
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      
      // แก้ไข/ลบ: ห้าม (logs ไม่ควรถูกแก้ไขหรือลบ)
      allow update, delete: if false;
    }
  }
}
```

---

## ⚠️ หมายเหตุสำคัญ

### **การบันทึก Log เป็น Optional**

```typescript
// ใน gameUtils.ts
export async function createGame(
  data: GameData,
  userInfo?: { userId, email, shopName } // ← Optional
) {
  // ... สร้างเกม ...
  
  // บันทึก log เฉพาะเมื่อมี userInfo
  if (userInfo) {
    await logActivity({ ... });
  }
}
```

**เหตุผล:**
- เพื่อไม่ให้ระบบเก่าที่เรียก `createGame()` โดยไม่ส่ง userInfo เกิด error
- ทำให้สามารถค่อยๆ เพิ่ม log ในส่วนที่ต้องการได้

**แนะนำ:**
- เพิ่ม userInfo ในทุกที่ที่เรียกใช้ function เหล่านี้

---

## ✨ สรุป

### **✅ ระบบที่สร้างเสร็จแล้ว:**

1. **บันทึกอัตโนมัติ** - บันทึกทุกกิจกรรมลง Firestore
2. **หน้า Activity** - Admin ดูกิจกรรมทั้งระบบ พร้อม Filter
3. **Stats Dashboard** - แสดงสถิติ วันนี้, 7 วัน, เดือนนี้, ทั้งหมด
4. **Top Users** - Admin เห็นผู้ใช้ที่มีกิจกรรมมากที่สุด
5. **Timeline View** - แสดงกิจกรรมล่าสุดพร้อมสีและ icon

### **📊 กิจกรรมที่บันทึก:**

- ✅ เกม (สร้าง, แก้ไข, ลบ)
- ✅ รายการเติม (เพิ่ม, แก้ไข, ลบ)
- ✅ ยอดขาย (บันทึก, ลบ)
- 🔜 ผู้ใช้ (Login, Logout, CRUD) - พร้อมทำ
- 🔜 รายงานปัญหา (CRUD) - พร้อมทำ
- 🔜 ประกาศ (CRUD) - พร้อมทำ

### **🔐 สิทธิ์:**

- ✅ Admin: ดูกิจกรรมทั้งระบบ + กรองได้
- ✅ Seller: (ไม่เห็นเมนู Activity - Admin only)

---

**พร้อมใช้งานแล้ว! 🎉**

ไปที่ `/activity` (Admin) เพื่อดูกิจกรรมทั้งระบบ!

**หมายเหตุ:** logs จะเริ่มบันทึกตั้งแต่ตอนนี้เป็นต้นไป กิจกรรมในอดีตจะไม่มีใน logs



