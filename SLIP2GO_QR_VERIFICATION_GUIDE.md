# Slip2Go QR Code Verification API Guide

## 📋 Overview

เอกสารนี้อธิบายการใช้งาน API สำหรับตรวจสอบสลิปด้วย QR Code ผ่าน Slip2Go

---

## 🔌 API Endpoint

### ตรวจสอบสลิปด้วย QR Code

```
POST https://connect.slip2go.com/api/verify-slip/qr-code/info
```

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
    "qrCode": "00020101021129370016A000000677010...",
    "checkCondition": {
      // Optional: เงื่อนไขในการตรวจสอบ
      "checkAmount": {
        "operator": "eq",
        "value": 100.00
      }
    }
  }
}
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
import { verifySlipByQRCode, createCheckCondition, createCheckAmount } from '@/lib/slip2goUtils';

// ตรวจสอบสลิปด้วย QR Code
const qrCode = "00020101021129370016A000000677...";

// สร้างเงื่อนไขการตรวจสอบ (ถ้าต้องการ)
const checkCondition = createCheckCondition({
  checkAmount: createCheckAmount('eq', 100.00)
});

// เรียกใช้ API
const result = await verifySlipByQRCode(qrCode, checkCondition);

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

---

## 🎯 Response Codes

| Code | Message | Description |
|------|---------|-------------|
| `200000` | Slip found | พบสลิปและตรวจสอบเรียบร้อย |
| `400001` | Slip not found | ไม่พบสลิป |
| `400002` | Invalid QR Code | QR Code ไม่ถูกต้อง |
| `400003` | Amount mismatch | จำนวนเงินไม่ตรงกับเงื่อนไข |
| `401000` | Unauthorized | API Key ไม่ถูกต้อง |

---

## 📊 Console Debug Logs

เมื่อเรียกใช้ `verifySlipByQRCode()` จะแสดง logs ดังนี้:

```
🔍 กำลังตรวจสอบสลิปด้วย QR Code...
📊 Check Condition: { checkAmount: { operator: 'eq', value: 100 } }
📤 Request: {
  url: 'https://connect.slip2go.com/api/verify-slip/qr-code/info',
  body: { payload: { qrCode: '...', checkCondition: {...} } }
}
📥 Response: { code: '200000', message: 'Slip found' }
✅ พบสลิป!
  💰 จำนวนเงิน: 100
  📅 วันที่: 2024-05-29T05:37:00.000Z
  👤 ผู้ส่ง: นาย สมชาย ใจดี
  👥 ผู้รับ: บริษัท สลิปทูโก จำกัด
  🔖 Reference ID: 92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx
```

---

## 🔗 Related APIs

- **ดึงข้อมูลสลิปเก่า**: `GET /api/verify-slip/{referenceId}` (Code: "200001")
- **ตรวจสอบสลิปด้วยรูปภาพ**: `POST /api/verify-slip/qr-image/info`

---

## ⚠️ หมายเหตุ

1. **QR Code Format**: QR Code ต้องเป็นรูปแบบ Thai QR Payment มาตรฐาน
2. **Response Time**: การตรวจสอบอาจใช้เวลา 1-3 วินาที
3. **Check Conditions**: สามารถใส่เงื่อนไขเพิ่มเติมได้ เช่น ตรวจสอบจำนวนเงิน, บัญชีผู้รับ, วันที่
4. **Reference ID**: ใช้สำหรับดึงข้อมูลสลิปย้อนหลัง และป้องกัน double-spend

---

## 📚 อ้างอิง

- Slip2Go Official Documentation: [https://connect.slip2go.com/docs](https://connect.slip2go.com/docs)
- Thai QR Payment Standard: [https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/ThaiQRPayment.aspx)

