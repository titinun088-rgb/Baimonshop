# Slip2Go Image Verification API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับตรวจสอบสลิปด้วยรูปภาพผ่าน Slip2Go

---

## 🔌 API Endpoint

### ตรวจสอบสลิปด้วยรูปภาพ

```
POST https://connect.slip2go.com/api/verify-slip/qr-image/info
```

**Content-Type:** `multipart/form-data`  
**Authentication:** Bearer Token (Required)

---

## 📤 Request Structure

### Headers
```json
{
  "Authorization": "Bearer {secretKey}"
}
```

### Form Data
| Key | Type | Description | Required | Example |
|-----|------|-------------|----------|---------|
| `file` | File | ไฟล์รูปสลิป | ✅ | `slip.png`, `slip.jpg`, `slip.jpeg` |
| `payload` | JSON | เงื่อนไขการตรวจสอบ | ❌ | `{ "checkDuplicate": true, ... }` |

---

## 📊 Payload Structure (JSON)

### 1. ตรวจสอบสลิปซ้ำ
```json
{
  "checkDuplicate": true  // ตรวจสอบสลิปซ้ำ
}
```

### 2. ตรวจสอบบัญชีผู้รับ
```json
{
  "checkReceiver": [
    {
      "accountType": "01004",           // รหัสธนาคาร
      "accountNameTH": "สมชาย สลิปทูโก", // ชื่อบัญชีไทย
      "accountNameEN": "Somchay Slip2go", // ชื่อบัญชีอังกฤษ
      "accountNumber": "1234567890"      // เลขบัญชี
    }
  ]
}
```

### 3. ตรวจสอบจำนวนเงิน
```json
{
  "checkAmount": {
    "type": "eq",    // "eq" | "gte" | "lte"
    "amount": 100.00
  }
}
```

### 4. ตรวจสอบวันที่
```json
{
  "checkDate": {
    "type": "eq",    // "eq" | "gte" | "lte"
    "date": "2025-10-05T14:48:00.000Z"  // ISO 8601 GMT
  }
}
```

### 5. ตัวอย่าง Payload ครบถ้วน
```json
{
  "checkDuplicate": true,
  "checkReceiver": [
    {
      "accountType": "01004",
      "accountNameTH": "สมชาย สลิปทูโก",
      "accountNameEN": "Somchay Slip2go",
      "accountNumber": "1234567890"
    }
  ],
  "checkAmount": {
    "type": "eq",
    "amount": 100.00
  },
  "checkDate": {
    "type": "eq",
    "date": "2025-10-05T14:48:00.000Z"
  }
}
```

---

## 🏦 Bank Account Types

| Code | Bank Name | Description |
|------|-----------|-------------|
| `01002` | กรุงเทพ | Bangkok Bank |
| `01004` | กสิกรไทย | Kasikorn Bank |
| `01006` | กรุงไทย | Krung Thai Bank |
| `01011` | ทหารไทยธนชาต | TMB Thanachart Bank |
| `01014` | ไทยพาณิชย์ | SCB |
| `01025` | กรุงศรีอยุธยา | Krungsri Bank |
| `01069` | ทหารไทยธนชาต | TMB Thanachart Bank |
| `01022` | ซีไอเอ็มบีไทย | CIMB Thai Bank |
| `01067` | ทิสโก้ | TISCO Bank |
| `01024` | ยูโอบี | UOB |
| `01071` | ไทยเครดิต | Thai Credit Bank |
| `01073` | แลนด์ แอนด์ เฮ้าส์ | LH Bank |
| `01070` | ไอซีบีซี (ไทย) | ICBC Thai |
| `01098` | พัฒนาวิสาหกิจ | SME Bank |
| `01034` | เกษตรและสหกรณ์ | BAAC |
| `01035` | ส่งออกและนำเข้า | EXIM Bank |
| `01030` | ออมสิน | GSB |
| `01033` | อาคารสงเคราะห์ | GHB |
| `01066` | อิสลามแห่งประเทศไทย | Islamic Bank |
| `02001` | PromptPay | เบอร์โทรศัพท์ |
| `02003` | PromptPay | บัตรประชาชน |
| `02004` | PromptPay | รหัส E-Wallet |
| `03000` | K+ Shop | KBANK, SCB, BBL, TTB |
| `04000` | True Money Wallet | True Money Wallet |

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

## 💻 การใช้งานใน Code

### JavaScript/TypeScript

```typescript
import { verifySlipByImage, createCheckCondition, createCheckAmount } from '@/lib/slip2goUtils';

// ตรวจสอบสลิปด้วยรูปภาพ
const imageFile = document.getElementById('slipFile').files[0];

// สร้างเงื่อนไขการตรวจสอบ
const checkCondition = createCheckCondition({
  checkDuplicate: true,  // ตรวจสอบสลิปซ้ำ
  checkReceiver: [
    {
      accountType: "01004",  // กสิกรไทย
      accountNameTH: "สมชาย สลิปทูโก",
      accountNumber: "1234567890"
    }
  ],
  checkAmount: createCheckAmount('eq', 100.00)
});

// เรียกใช้ API
const result = await verifySlipByImage(imageFile, checkCondition);

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
import { verifySlipByImage, createCheckCondition, createCheckAmount } from '@/lib/slip2goUtils';

const SlipVerification = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    if (!imageFile) return;

    const checkCondition = createCheckCondition({
      checkDuplicate: true,
      checkAmount: createCheckAmount('eq', 100.00)
    });

    const result = await verifySlipByImage(imageFile, checkCondition);
    setResult(result);
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleVerify}>ตรวจสอบสลิป</button>
      
      {result && (
        <div>
          {result.success ? (
            <div>
              <h3>✅ พบสลิป!</h3>
              <p>จำนวนเงิน: {result.data.amount} บาท</p>
              <p>ผู้ส่ง: {result.data.sender.account.name}</p>
              <p>ผู้รับ: {result.data.receiver.account.name}</p>
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

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `verifySlipByImage()` จะแสดง logs ดังนี้:

```
🔍 กำลังตรวจสอบสลิปด้วยรูปภาพ...
📁 ไฟล์: slip.png (245760 bytes)
📊 Check Condition: {
  "checkDuplicate": true,
  "checkAmount": { "operator": "eq", "value": 100 }
}
📤 Payload: {
  "checkDuplicate": true,
  "checkAmount": {
    "operator": "eq",
    "value": 100
  }
}
📤 Request URL: https://connect.slip2go.com/api/verify-slip/qr-image/info
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
| `400002` | Invalid image | รูปภาพไม่ถูกต้อง |
| `400003` | Amount mismatch | จำนวนเงินไม่ตรงกับเงื่อนไข |
| `400004` | Account mismatch | บัญชีไม่ตรงกับเงื่อนไข |
| `400005` | Duplicate slip | สลิปซ้ำ |
| `401000` | Unauthorized | API Key ไม่ถูกต้อง |

---

## 📁 Supported File Types

| Format | Extension | Max Size | Description |
|--------|-----------|----------|-------------|
| PNG | `.png` | 10MB | รูปภาพ PNG |
| JPEG | `.jpg`, `.jpeg` | 10MB | รูปภาพ JPEG |
| WebP | `.webp` | 10MB | รูปภาพ WebP |

---

## ⚠️ เงื่อนไขการใช้งาน

1. **API Secret**: ต้องระบุ API Secret ใน Header ทุกครั้ง
2. **IP Whitelist**: สามารถกำหนด IP Whitelist ได้
3. **Check Conditions**: ระบุเฉพาะ Key ที่ต้องการตรวจสอบ
4. **File Size**: รูปภาพต้องไม่เกิน 10MB
5. **Image Quality**: รูปภาพต้องชัดเจนพอที่จะอ่าน QR Code ได้

---

## 🔗 Related APIs

- **ตรวจสอบสลิปด้วย QR Code**: `POST /api/verify-slip/qr-code/info`
- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}`

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)