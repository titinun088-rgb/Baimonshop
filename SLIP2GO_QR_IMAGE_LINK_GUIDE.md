# Slip2Go QR Image Link Generation API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับสร้าง URL รูปภาพ QR PromptPay ผ่าน Slip2Go

---

## 🔌 API Endpoint

### สร้าง URL รูปภาพ QR PromptPay

```
POST https://connect.slip2go.com/api/qr-payment/generate-qr-image-link
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
  "amount": "88.88",
  "accountName": "บริษัท สลิปทูโก จำกัด"
}
```

### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `amount` | String | ✅ | จำนวนเงินที่ต้องการสร้าง QR Code | `"88.88"` |
| `accountName` | String | ❌ | ชื่อบัญชีผู้รับ | `"บริษัท สลิปทูโก จำกัด"` |

---

## 📥 Response Structure

### Success Response (Code: "200")

```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "qrImageLink": "https://xxxxxxxxxx.com/slip_qr_code.jpg",
    "accountName": "บริษัท สลิปทูโก จำกัด",
    "amount": "88.88"
  }
}
```

### Error Response

```json
{
  "code": "400",
  "message": "Invalid amount",
  "data": undefined
}
```

---

## 🔑 Response Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `code` | String | รหัสผลลัพธ์การทำรายการ | `"200"` |
| `message` | String | ข้อความผลลัพธ์ | `"Success"` |
| `data` | Object | ข้อมูล QR Image Link (ถ้ามี) | `{ ... }` |
| `data.qrImageLink` | String | URL รูปภาพ QR Code | `"https://xxxxxxxxxx.com/slip_qr_code.jpg"` |
| `data.accountName` | String | ชื่อบัญชีผู้รับ | `"บริษัท สลิปทูโก จำกัด"` |
| `data.amount` | String | จำนวนเงินที่ต้องการสร้าง QR Code | `"88.88"` |

---

## 💻 การใช้งานใน Code

### JavaScript/TypeScript

```typescript
import { generateQRImageLink } from '@/lib/slip2goUtils';

// สร้าง URL รูปภาพ QR PromptPay
const result = await generateQRImageLink(88.88, 'บริษัท สลิปทูโก จำกัด');

if (result.success && result.data) {
  console.log('✅ สร้าง QR Image Link สำเร็จ!');
  console.log('Image Link:', result.data.qrImageLink);
  console.log('ชื่อบัญชี:', result.data.accountName);
  console.log('จำนวนเงิน:', result.data.amount);
  
  // แสดงรูปภาพ QR Code
  const img = document.createElement('img');
  img.src = result.data.qrImageLink;
  img.alt = 'QR Code PromptPay';
  document.body.appendChild(img);
} else {
  console.error('❌ ไม่สามารถสร้าง QR Image Link:', result.error);
}
```

### React Example

```tsx
import { useState } from 'react';
import { generateQRImageLink } from '@/lib/slip2goUtils';

const QRImageGenerator = () => {
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('บริษัท สลิปทูโก จำกัด');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      const result = await generateQRImageLink(parseFloat(amount), accountName);
      setResult(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <label>จำนวนเงิน:</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="88.88"
        />
      </div>
      
      <div>
        <label>ชื่อบัญชี:</label>
        <input 
          type="text" 
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'กำลังสร้าง...' : 'สร้าง QR Image Link'}
      </button>

      {result && (
        <div>
          {result.success ? (
            <div>
              <h3>✅ สร้าง QR Image Link สำเร็จ!</h3>
              <p>Image Link: {result.data.qrImageLink}</p>
              <p>ชื่อบัญชี: {result.data.accountName}</p>
              <p>จำนวนเงิน: {result.data.amount} บาท</p>
              
              {/* แสดงรูปภาพ QR Code */}
              <img 
                src={result.data.qrImageLink} 
                alt="QR Code PromptPay"
                style={{ maxWidth: '300px', height: 'auto' }}
              />
            </div>
          ) : (
            <div>
              <h3>❌ ไม่สามารถสร้าง QR Image Link</h3>
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
const { generateQRImageLink } = require('./slip2goUtils');

// สร้าง URL รูปภาพ QR
const result = await generateQRImageLink(88.88, 'บริษัท สลิปทูโก จำกัด');

if (result.success) {
  console.log('✅ สร้าง QR Image Link สำเร็จ!');
  console.log('Image Link:', result.data.qrImageLink);
  console.log('ชื่อบัญชี:', result.data.accountName);
  console.log('จำนวนเงิน:', result.data.amount);
} else {
  console.error('❌ ไม่สามารถสร้าง QR Image Link:', result.error);
}
```

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `generateQRImageLink()` จะแสดง logs ดังนี้:

```
🎯 กำลังสร้าง QR Image Link...
💰 จำนวนเงิน: 88.88
👤 ชื่อบัญชี: บริษัท สลิปทูโก จำกัด
📤 Request: {
  url: 'https://connect.slip2go.com/api/qr-payment/generate-qr-image-link',
  body: {
    amount: "88.88",
    accountName: "บริษัท สลิปทูโก จำกัด"
  }
}
📥 Response: { code: '200', message: 'Success' }
✅ สร้าง QR Image Link สำเร็จ!
  🔗 Image Link: https://xxxxxxxxxx.com/slip_qr_code.jpg
  👤 ชื่อบัญชี: บริษัท สลิปทูโก จำกัด
  💰 จำนวนเงิน: 88.88
```

---

## 🎯 Response Codes

| Code | Message | Description |
|------|---------|-------------|
| `200` | Success | สร้าง QR Image Link สำเร็จ |
| `400` | Invalid amount | จำนวนเงินไม่ถูกต้อง |
| `401` | Unauthorized | API Key ไม่ถูกต้อง |
| `500` | Internal Server Error | เกิดข้อผิดพลาดในระบบ |

---

## 🔧 Utility Functions

### สร้าง QR Image Link แบบง่าย
```typescript
import { generateQRImageLink } from '@/lib/slip2goUtils';

const createSimpleQRImage = async (amount: number, accountName?: string) => {
  const result = await generateQRImageLink(amount, accountName);
  return result.success ? result.data.qrImageLink : null;
};

// ใช้งาน
const qrImageUrl = await createSimpleQRImage(100, 'บริษัท สลิปทูโก จำกัด');
console.log('QR Image URL:', qrImageUrl);
```

### ตรวจสอบ URL รูปภาพ
```typescript
const validateQRImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
};

// ใช้งาน
const imageUrl = 'https://example.com/slip_qr_code.jpg';
if (validateQRImageUrl(imageUrl)) {
  console.log('✅ URL รูปภาพถูกต้อง');
} else {
  console.log('❌ URL รูปภาพไม่ถูกต้อง');
}
```

---

## 🖼️ Image URL Features

### Supported Image Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| JPEG | `.jpg`, `.jpeg` | รูปภาพ JPEG |
| PNG | `.png` | รูปภาพ PNG |
| GIF | `.gif` | รูปภาพ GIF |
| WebP | `.webp` | รูปภาพ WebP |

### Image URL Examples
```
✅ Valid URLs:
https://example.com/slip_qr_code.jpg
https://cdn.example.com/images/qr_code.png
https://storage.googleapis.com/bucket/qr_code.jpeg

❌ Invalid URLs:
ftp://example.com/slip_qr_code.jpg
file:///path/to/qr_code.png
https://example.com/slip_qr_code.txt
```

---

## ⚠️ ข้อจำกัด

1. **Amount Format**: จำนวนเงินต้องเป็น string และมีทศนิยมไม่เกิน 2 ตำแหน่ง
2. **Account Name**: ชื่อบัญชีต้องไม่เกิน 50 ตัวอักษร
3. **Image Size**: รูปภาพ QR Code จะมีขนาดมาตรฐาน (300x300 pixels)
4. **URL Expiry**: URL รูปภาพอาจมีอายุการใช้งานจำกัด
5. **API Rate Limit**: จำกัดการเรียกใช้ API ตาม plan

---

## 🔗 Related APIs

- **สร้างรหัส QR PromptPay**: `POST /api/qr-payment/generate-qr-code`
- **ตรวจสอบสลิปด้วย QR Code**: `POST /api/verify-slip/qr-code/info`
- **ตรวจสอบสลิปด้วยรูปภาพ**: `POST /api/verify-slip/qr-image/info`
- **ตรวจสอบสลิปด้วย Base64**: `POST /api/verify-slip/qr-base64/info`
- **ตรวจสอบสลิปด้วย URL**: `POST /api/verify-slip/qr-image-link/info`
- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}`

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)
- Image URL Validation: [https://developer.mozilla.org/en-US/docs/Web/API/URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
