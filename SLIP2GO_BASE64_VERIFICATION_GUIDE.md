# Slip2Go Base64 Verification API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับตรวจสอบสลิปด้วย Base64 Image ผ่าน Slip2Go

---

## 🔌 API Endpoint

### ตรวจสอบสลิปด้วย Base64

```
POST https://connect.slip2go.com/api/verify-slip/qr-base64/info
```

**Content-Type:** `application/json`  
**Authentication:** Bearer Token (Required)

---

## 📤 Request Structure

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {secretKey}"
}
```

### Body
```json
{
  "payload": {
    "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "checkCondition": {
      // Optional: เงื่อนไขในการตรวจสอบ
      "checkDuplicate": true,
      "checkReceiver": [...],
      "checkAmount": {...},
      "checkDate": {...}
    }
  }
}
```

---

## 📊 Base64 Image Format

### Supported Formats
| Format | MIME Type | Description |
|--------|-----------|-------------|
| PNG | `image/png` | รูปภาพ PNG |
| JPEG | `image/jpeg` | รูปภาพ JPEG |
| WebP | `image/webp` | รูปภาพ WebP |

### Base64 String Format
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

**Note:** API ต้องการเฉพาะ Base64 data เท่านั้น (ไม่รวม `data:image/...;base64,` prefix)

---

## 📥 Response Structure

### Success Response (Code: "200000")

```json
{
  "code": "200000",
  "message": "Slip found",
  "data": {
    "referenceId": "92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx",
    "decode": "00020101021129370016A0000006770101120114200242805291300496850103714406410707",
    "transRef": "015073144041ATF00999",
    "dateTime": "2024-05-29T05:37:00.000Z",
    "amount": 100.00,
    "ref1": null,
    "ref2": null,
    "ref3": null,
    "receiver": {
      "account": {
        "name": "บริษัท สลิปทูโก จำกัด",
        "bank": {
          "account": "xxx-x-x5366-x"
        },
        "proxy": {
          "type": "NATID",
          "account": "xxx-x-x5366-x"
        }
      },
      "bank": {
        "id": "004",
        "name": "ธนาคารกสิกรไทย"
      }
    },
    "sender": {
      "account": {
        "name": "นาย สมชาย ใจดี",
        "bank": {
          "account": "xxx-x-x9866-x"
        }
      },
      "bank": {
        "id": "004",
        "name": "ธนาคารกสิกรไทย"
      }
    }
  }
}
```

### Error Response

```json
{
  "code": "400001",
  "message": "Slip not found",
  "data": undefined
}
```

---

## 🔑 Response Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `code` | String | รหัสผลลัพธ์การทำรายการ | `"200000"` |
| `message` | String | ข้อความผลลัพธ์ | `"Slip found"` |
| `data` | Object | ข้อมูลสลิป (ถ้ามี) | `{ ... }` |
| `data.referenceId` | String | รหัสอ้างอิงสลิป | `"92887bd5..."` |
| `data.decode` | String | รหัสที่อ่านได้จาก QR Code | `"000201..."` |
| `data.transRef` | String | รหัสอ้างอิงของธนาคาร | `"015073144..."` |
| `data.dateTime` | String | วันและเวลาที่โอน (ISO 8601) | `"2024-05-29T05:37:00.000Z"` |
| `data.amount` | Number | จำนวนเงินที่โอน | `100.00` |
| `data.ref1` | String\|null | รหัสอ้างอิง 1 | `null` |
| `data.ref2` | String\|null | รหัสอ้างอิง 2 | `null` |
| `data.ref3` | String\|null | รหัสอ้างอิง 3 | `null` |

### Receiver Object

| Field | Type | Description |
|-------|------|-------------|
| `receiver.account.name` | String | ชื่อบัญชีผู้รับ |
| `receiver.account.bank.account` | String\|null | เลขบัญชีธนาคารผู้รับ |
| `receiver.account.proxy.type` | String\|null | ประเภทพร็อกซี่ (NATID, MSISDN, EWALLETID, EMAIL, BILLERID) |
| `receiver.account.proxy.account` | String\|null | เลขพร็อกซี่บัญชีผู้รับ |
| `receiver.bank.id` | String | รหัสธนาคารผู้รับ (เช่น "004" = กสิกรไทย) |
| `receiver.bank.name` | String\|null | ชื่อธนาคารผู้รับ |

### Sender Object

| Field | Type | Description |
|-------|------|-------------|
| `sender.account.name` | String | ชื่อผู้ส่ง |
| `sender.account.bank.account` | String | เลขที่บัญชีผู้ส่ง |
| `sender.bank.id` | String | รหัสธนาคารผู้ส่ง |
| `sender.bank.name` | String | ชื่อธนาคารผู้ส่ง |

---

## 💻 การใช้งานใน Code

### JavaScript/TypeScript

```typescript
import { 
  verifySlipByBase64, 
  fileToBase64, 
  createCheckCondition, 
  createCheckAmount 
} from '@/lib/slip2goUtils';

// วิธีที่ 1: ใช้ Base64 string โดยตรง
const base64String = "iVBORw0KGgoAAAANSUhEUgAA...";
const result = await verifySlipByBase64(base64String);

// วิธีที่ 2: แปลงไฟล์เป็น Base64 ก่อน
const imageFile = document.getElementById('slipFile').files[0];
const base64 = await fileToBase64(imageFile);
const result = await verifySlipByBase64(base64);

// วิธีที่ 3: ใช้เงื่อนไขการตรวจสอบ
const checkCondition = createCheckCondition({
  checkDuplicate: true,
  checkAmount: createCheckAmount('eq', 100.00)
});

const result = await verifySlipByBase64(base64, checkCondition);

if (result.success && result.data) {
  console.log('✅ พบสลิป!');
  console.log('Reference ID:', result.data.referenceId);
  console.log('จำนวนเงิน:', result.data.amount);
  console.log('ผู้ส่ง:', result.data.sender.account.name);
  console.log('ผู้รับ:', result.data.receiver.account.name);
} else {
  console.error('❌ ไม่พบสลิป:', result.error);
}
```

### React Example

```tsx
import { useState } from 'react';
import { verifySlipByBase64, fileToBase64, createCheckCondition, createCheckAmount } from '@/lib/slip2goUtils';

const SlipVerification = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!imageFile) return;

    setLoading(true);
    try {
      // แปลงไฟล์เป็น Base64
      const base64 = await fileToBase64(imageFile);
      
      // สร้างเงื่อนไขการตรวจสอบ
      const checkCondition = createCheckCondition({
        checkDuplicate: true,
        checkAmount: createCheckAmount('eq', 100.00)
      });

      // ตรวจสอบสลิป
      const result = await verifySlipByBase64(base64, checkCondition);
      setResult(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสลิป'}
      </button>
      
      {result && (
        <div>
          {result.success ? (
            <div>
              <h3>✅ พบสลิป!</h3>
              <p>จำนวนเงิน: {result.data.amount} บาท</p>
              <p>ผู้ส่ง: {result.data.sender.account.name}</p>
              <p>ผู้รับ: {result.data.receiver.account.name}</p>
              <p>Reference ID: {result.data.referenceId}</p>
            </div>
          ) : (
            <div>
              <h3>❌ ไม่พบสลิป</h3>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Node.js Example

```javascript
const fs = require('fs');
const { verifySlipByBase64 } = require('./slip2goUtils');

// อ่านไฟล์รูปภาพ
const imageBuffer = fs.readFileSync('slip.png');
const base64String = imageBuffer.toString('base64');

// ตรวจสอบสลิป
const result = await verifySlipByBase64(base64String);

if (result.success) {
  console.log('✅ พบสลิป!');
  console.log('จำนวนเงิน:', result.data.amount);
} else {
  console.error('❌ ไม่พบสลิป:', result.error);
}
```

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `verifySlipByBase64()` จะแสดง logs ดังนี้:

```
🔍 กำลังตรวจสอบสลิปด้วย Base64...
📊 Base64 Length: 245760 characters
📊 Check Condition: {
  "checkDuplicate": true,
  "checkAmount": { "operator": "eq", "value": 100 }
}
📤 Request: {
  url: 'https://connect.slip2go.com/api/verify-slip/qr-base64/info',
  body: {
    payload: {
      base64: "iVBORw0KGgoAAAANSUhEUgAA...",
      checkCondition: {...}
    }
  }
}
📥 Response: { code: '200000', message: 'Slip found' }
✅ พบสลิป!
  💰 จำนวนเงิน: 100
  📅 วันที่: 2024-05-29T05:37:00.000Z
  👤 ผู้ส่ง: นาย สมชาย ใจดี
  👥 ผู้รับ: บริษัท สลิปทูโก จำกัด
  🏦 ธนาคารผู้รับ: ธนาคารกสิกรไทย
  🔖 Reference ID: 92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx
  🎫 Trans Ref: 015073144041ATF00999
```

---

## 🎯 Response Codes

| Code | Message | Description |
|------|---------|-------------|
| `200000` | Slip found | พบสลิปและตรวจสอบเรียบร้อย |
| `400001` | Slip not found | ไม่พบสลิป |
| `400002` | Invalid Base64 | Base64 ไม่ถูกต้อง |
| `400003` | Amount mismatch | จำนวนเงินไม่ตรงกับเงื่อนไข |
| `400004` | Account mismatch | บัญชีไม่ตรงกับเงื่อนไข |
| `400005` | Duplicate slip | สลิปซ้ำ |
| `401000` | Unauthorized | API Key ไม่ถูกต้อง |

---

## 🔧 Utility Functions

### แปลงไฟล์เป็น Base64
```typescript
import { fileToBase64 } from '@/lib/slip2goUtils';

const file = document.getElementById('fileInput').files[0];
const base64 = await fileToBase64(file);
console.log('Base64:', base64);
```

### แปลง Base64 เป็นไฟล์
```typescript
import { base64ToFile } from '@/lib/slip2goUtils';

const base64 = "iVBORw0KGgoAAAANSUhEUgAA...";
const file = base64ToFile(base64, 'slip.png', 'image/png');
console.log('File:', file);
```

---

## ⚠️ ข้อจำกัด

1. **Base64 Size**: Base64 string ต้องไม่เกิน 10MB
2. **Image Quality**: รูปภาพต้องชัดเจนพอที่จะอ่าน QR Code ได้
3. **Format Support**: รองรับ PNG, JPEG, WebP เท่านั้น
4. **API Rate Limit**: จำกัดการเรียกใช้ API ตาม plan

---

## 🔗 Related APIs

- **ตรวจสอบสลิปด้วย QR Code**: `POST /api/verify-slip/qr-code/info`
- **ตรวจสอบสลิปด้วยรูปภาพ**: `POST /api/verify-slip/qr-image/info`
- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}`

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- Base64 Encoding: [https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)
