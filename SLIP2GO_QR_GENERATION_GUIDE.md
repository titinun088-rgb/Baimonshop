# Slip2Go QR Code Generation API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับสร้างรหัส QR PromptPay ผ่าน Slip2Go

---

## 🔌 API Endpoints

### 1. สร้างรหัส QR PromptPay (Base64)

```
POST https://connect.slip2go.com/api/qr-payment/generate-qr-code
```

**Content-Type:** `application/json`  
**Authentication:** Bearer Token (Required)

### 2. สร้าง QR Image Link

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
    "qrCode": "0041000600000101030040220014242082547BPM049885102TH9104xxxx",
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
| `data` | Object | ข้อมูล QR Code (ถ้ามี) | `{ ... }` |
| `data.qrCode` | String | รหัสอ้างอิง QR Code | `"0041000600000101030040220014242082547BPM049885102TH9104xxxx"` |
| `data.accountName` | String | ชื่อบัญชีผู้รับ | `"บริษัท สลิปทูโก จำกัด"` |
| `data.amount` | String | จำนวนเงินที่ต้องการสร้าง QR Code | `"88.88"` |

---

## 💻 การใช้งานใน Code

### JavaScript/TypeScript

```typescript
import { generateQRCode, generateQRImageLink } from '@/lib/slip2goUtils';

// สร้างรหัส QR PromptPay (Base64)
const qrResult = await generateQRCode(88.88, 'บริษัท สลิปทูโก จำกัด');

if (qrResult.success && qrResult.data) {
  console.log('✅ สร้าง QR Code สำเร็จ!');
  console.log('QR Code:', qrResult.data.qrCode);
  console.log('ชื่อบัญชี:', qrResult.data.accountName);
  console.log('จำนวนเงิน:', qrResult.data.amount);
} else {
  console.error('❌ ไม่สามารถสร้าง QR Code:', qrResult.error);
}

// สร้าง QR Image Link
const imageResult = await generateQRImageLink(88.88, 'บริษัท สลิปทูโก จำกัด');

if (imageResult.success && imageResult.data) {
  console.log('✅ สร้าง QR Image Link สำเร็จ!');
  console.log('Image Link:', imageResult.data.qrImageLink);
} else {
  console.error('❌ ไม่สามารถสร้าง QR Image Link:', imageResult.error);
}
```

### React Example

```tsx
import { useState } from 'react';
import { generateQRCode, generateQRImageLink } from '@/lib/slip2goUtils';

const QRCodeGenerator = () => {
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('บริษัท สลิปทูโก จำกัด');
  const [qrResult, setQrResult] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateQR = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      const result = await generateQRCode(parseFloat(amount), accountName);
      setQrResult(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      const result = await generateQRImageLink(parseFloat(amount), accountName);
      setImageResult(result);
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

      <div>
        <button onClick={handleGenerateQR} disabled={loading}>
          {loading ? 'กำลังสร้าง...' : 'สร้างรหัส QR'}
        </button>
        
        <button onClick={handleGenerateImage} disabled={loading}>
          {loading ? 'กำลังสร้าง...' : 'สร้าง QR Image Link'}
        </button>
      </div>

      {qrResult && (
        <div>
          {qrResult.success ? (
            <div>
              <h3>✅ สร้างรหัส QR สำเร็จ!</h3>
              <p>QR Code: {qrResult.data.qrCode}</p>
              <p>ชื่อบัญชี: {qrResult.data.accountName}</p>
              <p>จำนวนเงิน: {qrResult.data.amount} บาท</p>
            </div>
          ) : (
            <div>
              <h3>❌ ไม่สามารถสร้างรหัส QR</h3>
              <p>{qrResult.error}</p>
            </div>
          )}
        </div>
      )}

      {imageResult && (
        <div>
          {imageResult.success ? (
            <div>
              <h3>✅ สร้าง QR Image Link สำเร็จ!</h3>
              <p>Image Link: {imageResult.data.qrImageLink}</p>
              <img src={imageResult.data.qrImageLink} alt="QR Code" />
            </div>
          ) : (
            <div>
              <h3>❌ ไม่สามารถสร้าง QR Image Link</h3>
              <p>{imageResult.error}</p>
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
const { generateQRCode, generateQRImageLink } = require('./slip2goUtils');

// สร้างรหัส QR
const qrResult = await generateQRCode(88.88, 'บริษัท สลิปทูโก จำกัด');

if (qrResult.success) {
  console.log('✅ สร้างรหัส QR สำเร็จ!');
  console.log('QR Code:', qrResult.data.qrCode);
} else {
  console.error('❌ ไม่สามารถสร้างรหัส QR:', qrResult.error);
}

// สร้าง QR Image Link
const imageResult = await generateQRImageLink(88.88, 'บริษัท สลิปทูโก จำกัด');

if (imageResult.success) {
  console.log('✅ สร้าง QR Image Link สำเร็จ!');
  console.log('Image Link:', imageResult.data.qrImageLink);
} else {
  console.error('❌ ไม่สามารถสร้าง QR Image Link:', imageResult.error);
}
```

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `generateQRCode()` จะแสดง logs ดังนี้:

```
🎯 กำลังสร้างรหัส QR PromptPay...
💰 จำนวนเงิน: 88.88
👤 ชื่อบัญชี: บริษัท สลิปทูโก จำกัด
📤 Request: {
  url: 'https://connect.slip2go.com/api/qr-payment/generate-qr-code',
  body: {
    amount: "88.88",
    accountName: "บริษัท สลิปทูโก จำกัด"
  }
}
📥 Response: { code: '200', message: 'Success' }
✅ สร้าง QR Code สำเร็จ!
  🔖 QR Code: 0041000600000101030040220014242082547BPM049885102TH9104xxxx
  👤 ชื่อบัญชี: บริษัท สลิปทูโก จำกัด
  💰 จำนวนเงิน: 88.88
```

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
  🔗 Image Link: https://example.com/qr-image.png
  👤 ชื่อบัญชี: บริษัท สลิปทูโก จำกัด
  💰 จำนวนเงิน: 88.88
```

---

## 🎯 Response Codes

| Code | Message | Description |
|------|---------|-------------|
| `200` | Success | สร้าง QR Code สำเร็จ |
| `400` | Invalid amount | จำนวนเงินไม่ถูกต้อง |
| `401` | Unauthorized | API Key ไม่ถูกต้อง |
| `500` | Internal Server Error | เกิดข้อผิดพลาดในระบบ |

---

## 🔧 Utility Functions

### สร้าง QR Code แบบง่าย
```typescript
import { generateQRCode } from '@/lib/slip2goUtils';

const createSimpleQR = async (amount: number) => {
  const result = await generateQRCode(amount);
  return result.success ? result.data.qrCode : null;
};

// ใช้งาน
const qrCode = await createSimpleQR(100);
console.log('QR Code:', qrCode);
```

### สร้าง QR Image แบบง่าย
```typescript
import { generateQRImageLink } from '@/lib/slip2goUtils';

const createSimpleQRImage = async (amount: number) => {
  const result = await generateQRImageLink(amount);
  return result.success ? result.data.qrImageLink : null;
};

// ใช้งาน
const qrImageUrl = await createSimpleQRImage(100);
console.log('QR Image URL:', qrImageUrl);
```

---

## ⚠️ ข้อจำกัด

1. **Amount Format**: จำนวนเงินต้องเป็น string และมีทศนิยมไม่เกิน 2 ตำแหน่ง
2. **Account Name**: ชื่อบัญชีต้องไม่เกิน 50 ตัวอักษร
3. **API Rate Limit**: จำกัดการเรียกใช้ API ตาม plan
4. **QR Code Format**: รหัส QR ที่ได้จะเป็นรูปแบบ Thai QR Payment มาตรฐาน

---

## 🔗 Related APIs

- **ตรวจสอบสลิปด้วย QR Code**: `POST /api/verify-slip/qr-code/info`
- **ตรวจสอบสลิปด้วยรูปภาพ**: `POST /api/verify-slip/qr-image/info`
- **ตรวจสอบสลิปด้วย Base64**: `POST /api/verify-slip/qr-base64/info`
- **ตรวจสอบสลิปด้วย URL**: `POST /api/verify-slip/qr-image-link/info`
- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}`

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)
- QR Code Generation: [https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
