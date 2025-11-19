# วิธีใช้งาน Maintenance Mode (โหมดปิดปรับปรุงชั่วคราว)

## ภาพรวม
Maintenance Mode เป็นระบบที่ช่วยให้คุณสามารถปิดเว็บไซต์ชั่วคราวเพื่อทำการปรับปรุงได้ โดยจะแสดงหน้า "กำลังปิดปรับปรุงชั่วคราว" แทนหน้าเว็บไซต์ปกติ

## วิธีการเปิด Maintenance Mode

### 1. สำหรับ Local Development (.env.local)

เพิ่ม environment variable ต่อไปนี้ในไฟล์ `.env.local`:

```env
# เปิด Maintenance Mode (true หรือ 1 = เปิด, false หรือ 0 = ปิด)
VITE_MAINTENANCE_MODE=true

# ข้อความที่แสดงบนหน้า Maintenance (ไม่บังคับ)
VITE_MAINTENANCE_MESSAGE=เว็บไซต์กำลังปิดปรับปรุงชั่วคราว

# เวลาที่คาดการณ์ (ไม่บังคับ)
VITE_MAINTENANCE_TIME=ประมาณ 1-2 ชั่วโมง

# ข้อมูลติดต่อ (ไม่บังคับ)
VITE_MAINTENANCE_CONTACT=กรุณาติดต่อทีมงานผู้ดูแลระบบ
```

### 2. สำหรับ Production (Vercel)

1. ไปที่ Vercel Dashboard
2. เลือกโปรเจคของคุณ
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่ม environment variables ต่อไปนี้:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_MAINTENANCE_MODE` | `true` หรือ `1` | Production, Preview, Development |
| `VITE_MAINTENANCE_MESSAGE` | ข้อความที่ต้องการแสดง | Production, Preview, Development (ไม่บังคับ) |
| `VITE_MAINTENANCE_TIME` | เวลาที่คาดการณ์ | Production, Preview, Development (ไม่บังคับ) |
| `VITE_MAINTENANCE_CONTACT` | ข้อมูลติดต่อ | Production, Preview, Development (ไม่บังคับ) |

5. **Redeploy** โปรเจคเพื่อให้การเปลี่ยนแปลงมีผล

## วิธีการปิด Maintenance Mode

### Local Development
เปลี่ยนค่าใน `.env.local`:
```env
VITE_MAINTENANCE_MODE=false
```
แล้ว restart dev server

### Production (Vercel)
1. ไปที่ Vercel Dashboard → Settings → Environment Variables
2. เปลี่ยนค่า `VITE_MAINTENANCE_MODE` เป็น `false` หรือ `0`
3. หรือลบ environment variable นี้ออก
4. **Redeploy** โปรเจค

## หน้าที่สร้างขึ้น

### `/maintenance`
หน้า Maintenance ที่จะแสดงเมื่อเปิด Maintenance Mode

## การทำงาน

1. เมื่อ `VITE_MAINTENANCE_MODE` เป็น `true` หรือ `1`:
   - ผู้ใช้ทุกคนจะถูก redirect ไปที่ `/maintenance` อัตโนมัติ
   - ไม่สามารถเข้าถึงหน้าอื่นๆ ได้

2. เมื่อ `VITE_MAINTENANCE_MODE` เป็น `false` หรือ `0`:
   - ระบบทำงานปกติ
   - ผู้ใช้สามารถเข้าถึงทุกหน้าได้ตามปกติ

## หมายเหตุ

- **สำคัญ**: หลังจากเปลี่ยน environment variables ใน Vercel ต้อง **Redeploy** เพื่อให้การเปลี่ยนแปลงมีผล
- Maintenance Mode จะบล็อกผู้ใช้ทุกคน รวมถึง admin ด้วย
- ถ้าต้องการให้ admin เข้าถึงได้ในระหว่าง Maintenance Mode ต้องแก้ไขโค้ดเพิ่มเติม

