# ⚡ Quick Image URL Reference

## 🚨 ถ้าเห็นข้อมูล 403 Forbidden

```
GET https://scontent.fcnx3-1.fna.fbcdn.net/... 403 (Forbidden)
```

### 👉 **ทำนี้ทันที:**

1. ❌ **ลบ** Facebook URL
2. ✅ **ใช้** Unsplash URL แทน
3. 💾 **บันทึก** การเปลี่ยนแปลง

---

## ✅ URL ที่ใช้ได้ (Copy & Paste)

### 🎨 Unsplash (หนึ่งที่ดีที่สุด!)
```
https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop
```

### 📸 Imgur
```
https://i.imgur.com/abc123def.jpg
```

### 🎮 Steam CDN
```
https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg
```

### 💾 Firebase Storage
```
https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/image.jpg
```

---

## ❌ ห้ามใช้

| แหล่ง | เหตุผล |
|------|-------|
| 🚫 Facebook CDN | 403 Forbidden (hotlinking protection) |
| 🚫 Instagram CDN | 403 Forbidden (hotlinking protection) |
| 🚫 localhost | ใช้ในเครื่องไม่ได้ |
| 🚫 192.168.x.x | Private IP ใช้ไม่ได้ |

---

## 🚀 วิธีได้ URL

### ขั้นตอน 1: เลือกแหล่ง
- **ต้องการรูปคุณภาพสูง?** → Unsplash ✅
- **ต้องการอัปโหลดของตัวเอง?** → Imgur ✅
- **ต้องการเคลื่อนไหว?** → Cloudinary ✅

### ขั้นตอน 2: ได้รูป
- ไป unsplash.com / imgur.com
- ค้นหา / อัปโหลดรูป
- คลิกขวา → Copy Image Address
- Paste ใน form

### ขั้นตอน 3: ยืนยัน
- ระบบจะแสดง Preview
- ตรวจสอบว่าถูกต้อง
- บันทึก ✅

---

## 💡 Pro Tips

1. **ทดสอบ URL ใน Browser ก่อน**
   - เปิด URL ใน tab ใหม่
   - ถ้ารูปแสดง = ใช้ได้ ✅
   - ถ้า 403 Forbidden = ห้ามใช้ ❌

2. **ใช้ Unsplash Parameters**
   ```
   ?w=400&h=300&fit=crop
   ```
   - `w=400` = ความกว้าง 400px
   - `h=300` = ความสูง 300px
   - `fit=crop` = ครอปให้พอดี

3. **ขนาดรูป**
   - เล็กเกินไป: ต่ำค่า
   - ใหญ่เกินไป: โหลดช้า
   - เหมาะสม: 400-800px

---

## ❓ FAQ ด่วน

**Q: สามารถใช้ Facebook URL ได้ไหม?**  
A: ไม่ได้ ❌ ใช้ Unsplash แทน ✅

**Q: URL หมดอายุไหม?**  
A: Facebook: 24-48 ชม | Unsplash: ถาวร

**Q: อัปโหลดรูปของตัวเองได้ไหม?**  
A: ได้! ใช้ Imgur หรือ Firebase Storage

---

**เพิ่มเติม:** ดู `FACEBOOK_CDN_403_FIX.md` สำหรับรายละเอียดเต็ม

