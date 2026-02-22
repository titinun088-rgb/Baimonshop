# 🚨 URGENT: แก้ไขช่องโหว่ API Keys ทันที!

## ⚠️ ปัญหาที่พบ

เว็บไซต์ถูกแฮกโดยการยิง API ไปซื้อของโดยตรง เพราะ **API keys ถูก expose ใน client-side code**

## ✅ การแก้ไขที่ทำแล้ว

### 1. สร้าง Backend API Proxies (Vercel Serverless Functions)

ไฟล์ที่สร้างใหม่:
- ✅ `api/slip2go-verify.ts` - ตรวจสอบสลิปผ่าน backend
- ✅ `api/slip2go-qrcode.ts` - สร้าง QR Code ผ่าน backend
- ✅ `api/peamsub-topup.ts` - เติมเงินผ่าน backend
- ✅ `api/peamsub-check-order.ts` - เช็คสถานะออเดอร์ผ่าน backend

### 2. สร้าง Client-Side Wrappers (ปลอดภัย)

ไฟล์ที่สร้างใหม่:
- ✅ `src/lib/slip2goClient.ts` - เรียกใช้ Slip2Go ผ่าน backend proxy
- ✅ `src/lib/peamsubClient.ts` - เรียกใช้ Peamsub ผ่าน backend proxy

## 🔥 ขั้นตอนที่ต้องทำทันที (CRITICAL)

### STEP 1: อัปเดต Vercel Environment Variables

1. ไปที่: https://vercel.com/titinun088-rgbs-projects/baimonshop/settings/environment-variables

2. **เพิ่ม** Environment Variables ต่อไปนี้ (Production + Preview + Development):

```
PEAMSUB_API_KEY=qgwvsh5rwvtevey8zdh4bj13
SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
SLIP2GO_API_URL=https://connect.slip2go.com
```

⚠️ **สำคัญ**: ต้องเลือก Environment ทั้งหมด (Production, Preview, Development)

### STEP 2: ลบ API Keys จาก .env.local (Local Development)

ลบบรรทัดเหล่านี้ออกจาก `.env.local`:
```bash
VITE_PEAMSUB_API_KEY=xxx  # ❌ ลบออก
VITE_SLIP2GO_SECRET_KEY=xxx  # ❌ ลบออก
VITE_SLIP2GO_API_URL=xxx  # ❌ ลบออก
```

✅ เก็บเฉพาะ Firebase และ Telegram configs ที่เป็น `VITE_*`

### STEP 3: Deploy ไปยัง Vercel

```bash
git add -A
git commit -m "security: move API keys to backend proxies - fix direct API attack"
git push
```

### STEP 4: ทดสอบหลัง Deploy

1. ทดสอบเติมเงิน (Peamsub)
2. ทดสอบตรวจสอบสลิป (Slip2Go)
3. ทดสอบสร้าง QR Code (Slip2Go)

## 🛡️ วิธีการทำงานแบบใหม่ (ปลอดภัย)

### ก่อนแก้ไข (ไม่ปลอดภัย):
```
Client (Browser) 
  ↓ [Direct call with API key visible]
External API (Peamsub/Slip2Go)
```
❌ API key โผล่ใน JavaScript bundle  
❌ แฮกเกอร์ดูได้ง่าย  
❌ สามารถยิง API โดยตรงได้

### หลังแก้ไข (ปลอดภัย):
```
Client (Browser)
  ↓ [No API key]
Backend Proxy (Vercel Function)
  ↓ [API key stored in environment variables]
External API (Peamsub/Slip2Go)
```
✅ API key ซ่อนใน server-side  
✅ Client ไม่เห็น API key เลย  
✅ แฮกเกอร์ยิง API โดยตรงไม่ได้

## 📋 Migration Checklist

### Immediate (ทำทันที):
- [x] สร้าง backend API proxies
- [x] สร้าง client-side wrappers
- [ ] เพิ่ม Environment Variables ใน Vercel
- [ ] ลบ API keys จาก .env.local
- [ ] Deploy ไปยัง Vercel
- [ ] ทดสอบ production

### Short-term (ภายใน 24 ชั่วโมง):
- [ ] หมุนเวียน API Keys ใหม่ (Rotate API Keys):
  - [ ] สร้าง API Key ใหม่ที่ Peamsub Dashboard
  - [ ] สร้าง API Key ใหม่ที่ Slip2Go Dashboard
  - [ ] อัปเดต Vercel Environment Variables
  - [ ] Redeploy

### Medium-term (ภายใน 1 สัปดาห์):
- [ ] ตรวจสอบ git history ว่ามี API keys เก่าหรือไม่
- [ ] ใช้ `git-filter-repo` ลบ .env.local ออกจาก git history
- [ ] ตั้งค่า rate limiting ใน backend proxies
- [ ] เพิ่ม request validation (จำกัดจำนวนคำขอต่อ IP)
- [ ] ตั้งค่า monitoring & alerts

## 🔑 วิธีหมุนเวียน API Keys (Recommended)

### Peamsub:
1. ไปที่: https://bo.peamsub.com/settings/api
2. คลิก "Generate New API Key"
3. คัดลอก API Key ใหม่
4. อัปเดตใน Vercel: `PEAMSUB_API_KEY`
5. Redeploy

### Slip2Go:
1. ไปที่: https://connect.slip2go.com/settings
2. คลิก "Regenerate Secret Key"
3. คัดลอก Secret Key ใหม่
4. อัปเดตใน Vercel: `SLIP2GO_SECRET_KEY`
5. Redeploy

## ⚡ Quick Test Commands

### ทดสอบ Backend Proxies (Local):
```bash
# ทดสอบ Slip2Go Verify
curl -X POST http://localhost:8080/api/slip2go-verify \
  -H "Content-Type: application/json" \
  -d '{"log":"test","amount":100}'

# ทดสอบ Peamsub Topup
curl -X POST http://localhost:8080/api/peamsub-topup \
  -H "Content-Type: application/json" \
  -d '{"productId":"1234","productData":{}}'
```

### ตรวจสอบว่า API keys ไม่โผล่ใน production:
```bash
# ค้นหาใน production bundle
curl https://baimonshop.vercel.app/_next/static/chunks/*.js | grep -i "peamsub\|slip2go"

# ควรไม่เจอ API key อะไรเลย!
```

## 📞 หากมีปัญหา

1. ตรวจสอบว่า Environment Variables ตั้งค่าใน Vercel แล้ว
2. ตรวจสอบว่า deploy สำเร็จแล้ว
3. เช็ค Vercel Logs: https://vercel.com/titinun088-rgbs-projects/baimonshop/logs
4. ถ้ายังมีปัญหา ให้ redeploy อีกครั้ง

---

**🚨 ทำทันที! ยิ่งช้ายิ่งเสี่ยง!**
