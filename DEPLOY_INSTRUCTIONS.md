# คำสั่ง Deploy ไปยัง Vercel

## ขั้นตอนการ Deploy

### 1. Login เข้า Vercel (ถ้ายังไม่ได้ login)
```bash
vercel login
```
- จะเปิด browser ให้ login
- อนุญาตให้ Vercel CLI เข้าถึงบัญชี

### 2. Deploy ไปยัง Production
```bash
vercel --prod --yes
```

## หรือ Deploy แบบทีละขั้นตอน:

1. **Login:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod --yes
   ```

## หมายเหตุ:
- ไฟล์ `vercel.json` ถูกตั้งค่าไว้แล้ว
- Build จะใช้ `npm run build` อัตโนมัติ
- Output directory คือ `dist/`
- QR Code ไฟล์ (`S__23691273.jpg`) จะถูก deploy ไปด้วย

## หลังจาก Deploy สำเร็จ:
- คุณจะได้รับ URL ของเว็บไซต์
- QR Code PromptPay ควรแสดงขึ้นมาในหน้าเติมเงินแล้ว

