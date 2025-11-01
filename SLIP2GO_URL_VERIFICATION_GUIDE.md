# Slip2Go URL Verification API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับตรวจสอบสลิปด้วย Image URL ผ่าน Slip2Go

---

## 🔌 API Endpoint

### ตรวจสอบสลิปด้วย Image URL

```
POST https://connect.slip2go.com/api/verify-slip/qr-image-link/info
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
    "imageUrl": "https://example.com/slip.png",
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

## 🔗 Image URL Requirements

### Supported Protocols
| Protocol | Description | Example |
|----------|-------------|---------|
| `http://` | HTTP URL | `http://example.com/slip.png` |
| `https://` | HTTPS URL (Recommended) | `https://example.com/slip.png` |

### Supported File Extensions
| Extension | MIME Type | Description |
|-----------|-----------|-------------|
| `.png` | `image/png` | รูปภาพ PNG |
| `.jpg` | `image/jpeg` | รูปภาพ JPEG |
| `.jpeg` | `image/jpeg` | รูปภาพ JPEG |
| `.gif` | `image/gif` | รูปภาพ GIF |
| `.webp` | `image/webp` | รูปภาพ WebP |

### URL Examples
```
✅ Valid URLs:
https://example.com/slip.png
https://cdn.example.com/images/slip.jpg
http://localhost:3000/uploads/slip.jpeg
https://storage.googleapis.com/bucket/slip.webp

❌ Invalid URLs:
ftp://example.com/slip.png
file:///path/to/slip.png
https://example.com/slip.txt
```

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
  verifySlipByUrl, 
  isValidImageUrl, 
  createCheckCondition, 
  createCheckAmount 
} from '@/lib/slip2goUtils';

// ตรวจสอบ URL ก่อนใช้งาน
const imageUrl = "https://example.com/slip.png";

if (!isValidImageUrl(imageUrl)) {
  console.error('❌ URL ไม่ถูกต้อง');
  return;
}

// ตรวจสอบสลิป
const result = await verifySlipByUrl(imageUrl);

// ใช้เงื่อนไขการตรวจสอบ
const checkCondition = createCheckCondition({
  checkDuplicate: true,
  checkAmount: createCheckAmount('eq', 100.00)
});

const result = await verifySlipByUrl(imageUrl, checkCondition);

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
import { verifySlipByUrl, isValidImageUrl, createCheckCondition, createCheckAmount } from '@/lib/slip2goUtils';

const SlipVerification = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!imageUrl) return;

    // ตรวจสอบ URL
    if (!isValidImageUrl(imageUrl)) {
      alert('URL ไม่ถูกต้อง กรุณาใส่ URL รูปภาพที่ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      // สร้างเงื่อนไขการตรวจสอบ
      const checkCondition = createCheckCondition({
        checkDuplicate: true,
        checkAmount: createCheckAmount('eq', 100.00)
      });

      // ตรวจสอบสลิป
      const result = await verifySlipByUrl(imageUrl, checkCondition);
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
        type="url" 
        placeholder="https://example.com/slip.png"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
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
const { verifySlipByUrl, isValidImageUrl } = require('./slip2goUtils');

const imageUrl = 'https://example.com/slip.png';

// ตรวจสอบ URL
if (!isValidImageUrl(imageUrl)) {
  console.error('❌ URL ไม่ถูกต้อง');
  process.exit(1);
}

// ตรวจสอบสลิป
const result = await verifySlipByUrl(imageUrl);

if (result.success) {
  console.log('✅ พบสลิป!');
  console.log('จำนวนเงิน:', result.data.amount);
} else {
  console.error('❌ ไม่พบสลิป:', result.error);
}
```

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `verifySlipByUrl()` จะแสดง logs ดังนี้:

```
🔍 กำลังตรวจสอบสลิปด้วย URL...
🔗 Image URL: https://example.com/slip.png
📊 Check Condition: {
  "checkDuplicate": true,
  "checkAmount": { "operator": "eq", "value": 100 }
}
📤 Request: {
  url: 'https://connect.slip2go.com/api/verify-slip/qr-image-link/info',
  body: {
    payload: {
      imageUrl: "https://example.com/slip.png",
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
| `400002` | Invalid URL | URL ไม่ถูกต้อง |
| `400003` | Image not accessible | ไม่สามารถเข้าถึงรูปภาพได้ |
| `400004` | Amount mismatch | จำนวนเงินไม่ตรงกับเงื่อนไข |
| `400005` | Account mismatch | บัญชีไม่ตรงกับเงื่อนไข |
| `400006` | Duplicate slip | สลิปซ้ำ |
| `401000` | Unauthorized | API Key ไม่ถูกต้อง |

---

## 🔧 Utility Functions

### ตรวจสอบ URL
```typescript
import { isValidImageUrl } from '@/lib/slip2goUtils';

const url = 'https://example.com/slip.png';
if (isValidImageUrl(url)) {
  console.log('✅ URL ถูกต้อง');
} else {
  console.log('❌ URL ไม่ถูกต้อง');
}
```

### สร้าง URL จากไฟล์
```typescript
import { getImageUrl, revokeImageUrl } from '@/lib/slip2goUtils';

const file = document.getElementById('fileInput').files[0];
const url = getImageUrl(file);
console.log('Object URL:', url);

// ใช้เสร็จแล้วให้ revoke เพื่อประหยัด memory
revokeImageUrl(url);
```

---

## ⚠️ ข้อจำกัด

1. **URL Accessibility**: URL ต้องเข้าถึงได้จากอินเทอร์เน็ต
2. **Image Format**: รองรับ PNG, JPEG, GIF, WebP เท่านั้น
3. **File Size**: รูปภาพต้องไม่เกิน 10MB
4. **CORS**: URL ต้องรองรับ CORS หรือเป็น public URL
5. **SSL**: แนะนำใช้ HTTPS URL

---

## 🔗 Related APIs

- **ตรวจสอบสลิปด้วย QR Code**: `POST /api/verify-slip/qr-code/info`
- **ตรวจสอบสลิปด้วยรูปภาพ**: `POST /api/verify-slip/qr-image/info`
- **ตรวจสอบสลิปด้วย Base64**: `POST /api/verify-slip/qr-base64/info`
- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}`

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- URL Validation: [https://developer.mozilla.org/en-US/docs/Web/API/URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- CORS: [https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)
