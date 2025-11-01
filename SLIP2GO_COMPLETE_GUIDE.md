# Slip2Go API Complete Integration Guide

## ภาพรวม

Slip2Go API รองรับการตรวจสอบสลิปการโอนเงินและสร้าง QR Code สำหรับรับเงิน พร้อมเงื่อนไขการตรวจสอบที่หลากหลาย

## API Endpoints

### 1. ตรวจสอบสลิปผ่าน QR Code
```
POST https://connect.slip2go.com/api/verify-slip/qr-code/info
Authorization: Bearer {secretKey}
Content-Type: application/json
```

### 2. สร้าง QR Code สำหรับรับเงิน
```
POST https://connect.slip2go.com/api/qr-payment/generate-qr-code
Authorization: Bearer {secretKey}
Content-Type: application/json
```

### 3. สร้าง QR Image Link
```
POST https://connect.slip2go.com/api/qr-payment/generate-qr-image-link
Authorization: Bearer {secretKey}
Content-Type: application/json
```

### 4. ตรวจสอบสลิปด้วย Reference ID
```
GET https://connect.slip2go.com/api/verify-slip/{referenceId}
Authorization: Bearer {secretKey}
Content-Type: application/json
```

### 5. ตรวจสอบข้อมูลบัญชี
```
GET https://connect.slip2go.com/api/account/info
Authorization: Bearer {secretKey}
Content-Type: application/json
```

## Response Format

### ตรวจสอบสลิปผ่าน QR Code

**Success Response (code: "200000"):**
```json
{
  "code": "200000",
  "message": "Slip found",
  "data": {
    "referenceId": "92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx",
    "decode": "00020101021129370016A0000006770101120114200242805291300496850103714406410707",
    "transRef": "015073144014FAT0099Y",
    "dateTime": "2024-05-29T05:37:00.000Z",
    "amount": 100.00,
    "ref1": "xxx",
    "ref2": "xxx",
    "ref3": "xxx",
    "receiver": {
      "account": {
        "name": "บริษัท สลิปทูโก จำกัด",
        "bank": {
          "account": "xxxx-x-5366-x"
        },
        "proxy": {
          "type": "NATID",
          "account": "xxxx-x-5366-x"
        }
      },
      "bank": {
        "id": "004",
        "name": "ธนาคารกสิกรไทย"
      }
    },
    "sender": {
      "account": {
        "name": "บริษัท สลิปทูโก จำกัด",
        "bank": {
          "account": "xxxx-x-9866-x"
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

### สร้าง QR Code

**Success Response (code: "200"):**
```json
{
  "code": "200",
  "message": "Success",
  "qrCode": "0041000600000101030040220014242082547BPM049885102TH9104xxxx",
  "accountName": "บริษัท สลิปทูโก จำกัด",
  "amount": "88.88"
}
```

### สร้าง QR Image Link

**Success Response (code: "200"):**
```json
{
  "code": "200",
  "message": "Success",
  "qrImageLink": "https://xxxxxxxxxx.com/slip_qr_code.jpg",
  "accountName": "บริษัท สลิปทูโก จำกัด",
  "amount": "88.88"
}
```

### ตรวจสอบสลิปด้วย Reference ID

**Success Response (code: "200001"):**
```json
{
  "code": "200001",
  "message": "Get Info Success",
  "data": {
    "referenceId": "92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx",
    "decode": "00020101021129370016A0000006770101120114200242805291300496850103714406410707",
    "transRef": "015073144014FAT0099Y",
    "dateTime": "2025-04-23T08:32:45.123Z",
    "verifyDate": "2025-04-23T08:32:45.123Z",
    "amount": 100.00,
    "ref1": "xxx",
    "ref2": "xxx",
    "ref3": "xxx",
    "receiver": {
      "account": {
        "name": "บริษัท สลิปทูโก จำกัด",
        "bank": {
          "account": "xxxx-x-5366-x"
        },
        "proxy": {
          "type": "NATID",
          "account": "xxxx-x-5366-x"
        }
      },
      "bank": {
        "id": "004",
        "name": "ธนาคารกสิกรไทย"
      }
    },
    "sender": {
      "account": {
        "name": "บริษัท สลิปทูโก จำกัด",
        "bank": {
          "account": "xxxx-x-9866-x"
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

### ตรวจสอบข้อมูลบัญชี

**Success Response:**
```json
{
  "data": {
    "shopName": "myShop",
    "package": "BASIC-1",
    "packageExpiredDate": "2024-05-29T05:37:00.000Z",
    "quotaLimit": 400,
    "quotaRemaining": 100,
    "creditRemaining": 0,
    "autoRenewalPackage": true,
    "checkSlipByCredit": false,
    "quotaQrLimit": 100,
    "quotaQrRemaining": 10
  }
}
```

## การใช้งานในโค้ด

### 1. ตรวจสอบสลิปผ่าน QR Code

```typescript
import { verifySlipByQRCode } from '@/lib/slip2goUtils';

const result = await verifySlipByQRCode('004100060000000402TH9104xxxx');

if (result.success) {
  console.log('Reference ID:', result.data?.referenceId);
  console.log('Amount:', result.data?.amount);
  console.log('Receiver:', result.data?.receiver.account.name);
  console.log('Sender:', result.data?.sender.account.name);
} else {
  console.error('Error:', result.error);
}
```

### 2. ตรวจสอบสลิปแบบมีเงื่อนไข

```typescript
import { verifySlipByQRCode, createCheckCondition, createCheckReceiver, ACCOUNT_TYPES } from '@/lib/slip2goUtils';

const checkCondition = createCheckCondition({
  checkDuplicate: true,
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK,
      accountNumber: '420-185366-6'
    })
  ]
});

const result = await verifySlipByQRCode('004100060000000402TH9104xxxx', checkCondition);
```

### 3. สร้าง QR Code สำหรับรับเงิน

```typescript
import { generateQRCode } from '@/lib/slip2goUtils';

const result = await generateQRCode(1000, 'Game Nexus');

if (result.success) {
  console.log('QR Code:', result.data?.qrCode);
  console.log('Account Name:', result.data?.accountName);
  console.log('Amount:', result.data?.amount);
} else {
  console.error('Error:', result.error);
}
```

### 4. สร้าง QR Image Link

```typescript
import { generateQRImageLink } from '@/lib/slip2goUtils';

const result = await generateQRImageLink(1000, 'Game Nexus');

if (result.success) {
  console.log('QR Image Link:', result.data?.qrImageLink);
  // แสดงรูปภาพ QR Code
  const img = document.createElement('img');
  img.src = result.data?.qrImageLink;
  document.body.appendChild(img);
} else {
  console.error('Error:', result.error);
}
```

### 5. ตรวจสอบสลิปด้วย Reference ID

```typescript
import { verifySlipByReferenceId } from '@/lib/slip2goUtils';

const result = await verifySlipByReferenceId('92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx');

if (result.success) {
  console.log('Amount:', result.data?.amount);
  console.log('DateTime:', result.data?.dateTime);
  console.log('Verify Date:', result.data?.verifyDate);
} else {
  console.error('Error:', result.error);
}
```

### 6. ตรวจสอบข้อมูลบัญชี

```typescript
import { getSlip2GoAccountInfo } from '@/lib/slip2goUtils';

const result = await getSlip2GoAccountInfo();

if (result.success) {
  console.log('Shop Name:', result.data?.shopName);
  console.log('Package:', result.data?.package);
  console.log('Quota Remaining:', result.data?.quotaRemaining);
  console.log('QR Quota Remaining:', result.data?.quotaQrRemaining);
} else {
  console.error('Error:', result.error);
}
```

## การใช้งานในหน้า Slip Verification

### 1. เข้าสู่หน้าตรวจสอบสลิป

```
/slip-verification
```

### 2. ตรวจสอบสลิปผ่าน QR Code

1. เลือกแท็บ "QR Code"
2. วาง QR Code ที่คัดลอกมาจากแอปธนาคาร
3. ตั้งเงื่อนไขการตรวจสอบ (ถ้าต้องการ)
4. กดปุ่ม "ตรวจสอบ QR Code"

### 3. ดูผลการตรวจสอบ

ระบบจะแสดงข้อมูลการโอนเงินที่ครบถ้วน:
- **จำนวนเงิน**
- **ธนาคารผู้รับ** และ **ธนาคารผู้ส่ง**
- **หมายเลขบัญชีผู้รับ** และ **หมายเลขบัญชีผู้ส่ง**
- **ชื่อบัญชีผู้รับ** และ **ชื่อผู้ส่ง**
- **วันที่ทำรายการ** และ **วันที่ตรวจสอบ**
- **รหัสอ้างอิงธนาคาร** และ **รหัสอ้างอิงสลิป**
- **รหัสอ้างอิงเพิ่มเติม** (Ref1, Ref2, Ref3)

## ข้อมูลที่ได้จาก Response

### ข้อมูลหลัก
- `referenceId`: รหัสอ้างอิงสลิป
- `decode`: รหัสที่อ่านได้จาก QR Code
- `transRef`: รหัสอ้างอิงของธนาคารผู้โอน
- `dateTime`: วันและเวลาที่โอน
- `verifyDate`: วันและเวลาที่ตรวจสอบ
- `amount`: จำนวนเงินที่โอน
- `ref1`, `ref2`, `ref3`: รหัสอ้างอิงเพิ่มเติม

### ข้อมูลผู้รับ (Receiver)
- `receiver.account.name`: ชื่อบัญชีผู้รับ
- `receiver.account.bank.account`: เลขบัญชีธนาคารผู้รับ
- `receiver.account.proxy.type`: ประเภทตัวแทน (NATID, MSISDN, EWALLETID, EMAIL, BILLERID)
- `receiver.account.proxy.account`: เลขตัวแทนบัญชีผู้รับ
- `receiver.bank.id`: เลขธนาคารผู้รับ
- `receiver.bank.name`: ชื่อธนาคารผู้รับ

### ข้อมูลผู้ส่ง (Sender)
- `sender.account.name`: ชื่อผู้ส่ง
- `sender.account.bank.account`: เลขที่บัญชีผู้ส่ง
- `sender.bank.id`: เลขธนาคารผู้ส่ง
- `sender.bank.name`: ชื่อธนาคารผู้ส่ง

## Error Handling

### Common Error Codes

1. **"200000"** - Slip found (สำเร็จ)
2. **"200001"** - Get Info Success (สำเร็จ)
3. **"200"** - Success (สำเร็จ)
4. **"400"** - Bad Request
5. **"401"** - Unauthorized
6. **"422"** - Unprocessable Entity

### Error Handling Example

```typescript
try {
  const result = await verifySlipByQRCode(qrCode);
  
  if (result.success) {
    // Handle success
    console.log('Verification successful:', result.data);
  } else {
    // Handle API error
    console.error('API Error:', result.error);
  }
} catch (error) {
  // Handle network error
  console.error('Network Error:', error);
}
```

## Best Practices

### 1. การจัดการ Response

- ตรวจสอบ `success` field ก่อนเข้าถึง `data`
- ใช้ optional chaining (`?.`) เมื่อเข้าถึง nested properties
- จัดการ error cases อย่างเหมาะสม

### 2. การแสดงผลข้อมูล

- แสดงข้อมูลที่จำเป็นเท่านั้น
- ใช้ `formatAmount()` และ `formatDate()` สำหรับการจัดรูปแบบ
- ให้ผู้ใช้สามารถคัดลอกข้อมูลได้

### 3. Performance

- Cache ผลลัพธ์เมื่อเป็นไปได้
- จำกัดจำนวนการเรียก API
- ใช้ debounce สำหรับ input

## Testing

### Test Cases

1. **QR Code ที่ถูกต้อง**
   ```
   004100060000000402TH9104xxxx
   ```

2. **QR Code ที่ไม่ถูกต้อง**
   ```
   invalid-qr-code
   ```

3. **Reference ID ที่ถูกต้อง**
   ```
   92887bd5-60d3-4744-9a98-b8574eaxxxxx-xx
   ```

4. **Reference ID ที่ไม่ถูกต้อง**
   ```
   invalid-reference-id
   ```

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **QR Code ไม่ถูกต้อง**
   - ตรวจสอบรูปแบบ QR Code
   - ใช้ QR Code จากแอปธนาคารจริง

2. **Reference ID ไม่พบ**
   - ตรวจสอบ Reference ID
   - ตรวจสอบว่าสลิปถูกส่งตรวจสอบแล้ว

3. **API ไม่ตอบสนอง**
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบสถานะ Slip2Go API

### Debug Mode

```typescript
const DEBUG = import.meta.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('QR Code:', qrCode);
  console.log('Reference ID:', referenceId);
  console.log('API URL:', import.meta.env.VITE_SLIP2GO_API_URL);
}
```

## การพัฒนาต่อ

### 1. เพิ่มฟีเจอร์

- บันทึกประวัติการตรวจสอบ
- ส่งอีเมลแจ้งเตือน
- Dashboard สำหรับดูสถิติ

### 2. ปรับปรุง UI/UX

- เพิ่ม Dark Mode
- ปรับปรุง Mobile Experience
- เพิ่ม Animation

### 3. เพิ่มการรองรับ

- รองรับสกุลเงินอื่น
- รองรับ Payment Gateway เพิ่มเติม
- รองรับการตรวจสอบแบบ Batch
