# 🔧 วิธีตั้งค่า Environment Variables

## ⚡ Quick Setup (คัดลอกและวาง)

### **ขั้นที่ 1: สร้างไฟล์**

สร้างไฟล์ใหม่ชื่อ `.env.local` ในโฟลเดอร์นี้:
```
C:\Users\ADMINS\Documents\game-nexus-dash\.env.local
```

### **ขั้นที่ 2: คัดลอกเนื้อหาด้านล่างวางลงไป**

```env
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
```

### **ขั้นที่ 3: บันทึกไฟล์**

กด `Ctrl+S` เพื่อบันทึก

### **ขั้นที่ 4: รีสตาร์ท Dev Server**

ใน Terminal:
```bash
# กด Ctrl+C เพื่อหยุด
# จากนั้นรันใหม่
npm run dev
```

---

## 🎯 สำหรับผู้ที่ใช้ Command Line

### Windows (PowerShell):
```powershell
@"
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

### Windows (CMD):
```cmd
echo VITE_SLIP2GO_API_URL=https://connect.slip2go.com > .env.local
echo VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4= >> .env.local
```

### Mac/Linux:
```bash
cat > .env.local << EOF
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
EOF
```

---

## ✅ ทดสอบว่าสำเร็จ

เปิด Browser Console (F12) และพิมพ์:
```javascript
console.log('✅ API URL:', import.meta.env.VITE_SLIP2GO_API_URL);
console.log('✅ Secret Key:', import.meta.env.VITE_SLIP2GO_SECRET_KEY ? 'Set' : 'Not Set');
```

ผลลัพธ์ที่ควรได้:
```
✅ API URL: https://connect.slip2go.com
✅ Secret Key: Set
```

---

## 🚀 ทดสอบ QR Code Generator

1. ไปที่: `http://localhost:5173/qr-code-manager`
2. กรอกข้อมูล:
   - PromptPay Code: `0959308178`
   - ชื่อบัญชี: `พงศกร แก้วดำ`
   - จำนวนเงิน: `400`
3. คลิก "สร้าง QR Code"
4. ดูรูป QR Code ✅

---

## 🔒 ความปลอดภัย

⚠️ **อย่า commit ไฟล์ `.env.local` ไปยัง Git!**

ตรวจสอบว่า `.gitignore` มี:
```
.env
.env.local
.env*.local
```

---

**เสร็จแล้ว! ทำตามขั้นตอนด้านบน แล้วรีสตาร์ท dev server!** 🎉

