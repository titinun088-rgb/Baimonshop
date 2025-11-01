# Slip2Go API Advanced Integration Guide

## ภาพรวม

Slip2Go API รองรับการตรวจสอบสลิปการโอนเงินผ่าน QR Code พร้อมเงื่อนไขการตรวจสอบที่หลากหลาย

## API Endpoint

```
POST https://connect.slip2go.com/api/verify-slip/qr-code/info
Authorization: Bearer {secretKey}
Content-Type: application/json
```

## การใช้งานพื้นฐาน

### 1. ตรวจสอบสลิปโดยไม่กำหนดเงื่อนไข

```typescript
import { verifySlipByQRCode } from '@/lib/slip2goUtils';

const result = await verifySlipByQRCode('004100060000000402TH9104xxxx');
```

### 2. ตรวจสอบสลิปแบบเช็คสลิปซ้ำ

```typescript
import { verifySlipByQRCode, CHECK_CONDITION_PRESETS } from '@/lib/slip2goUtils';

const result = await verifySlipByQRCode(
  '004100060000000402TH9104xxxx',
  CHECK_CONDITION_PRESETS.checkDuplicate()
);
```

## การตั้งเงื่อนไขการตรวจสอบ

### 1. ตรวจสอบประเภทบัญชี

```typescript
import { verifySlipByQRCode, createCheckCondition, createCheckReceiver, ACCOUNT_TYPES } from '@/lib/slip2goUtils';

const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK // 01004
    })
  ]
});

const result = await verifySlipByQRCode('004100060000000402TH9104xxxx', checkCondition);
```

### 2. ตรวจสอบเลขที่บัญชี

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountNumber: '420-185366-6'
    })
  ]
});
```

### 3. ตรวจสอบชื่อบัญชี

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountNameTH: 'สวัสดี วันจันทร์',
      accountNameEN: 'SawatDee WanJun'
    })
  ]
});
```

### 4. ตรวจสอบยอดเงินโอน

```typescript
import { createCheckAmount } from '@/lib/slip2goUtils';

const checkCondition = createCheckCondition({
  checkAmount: createCheckAmount('eq', 10000) // เท่ากับ 10,000 บาท
});

// หรือใช้ preset
const checkCondition = CHECK_CONDITION_PRESETS.checkExactAmount(10000);
```

### 5. ตรวจสอบวันที่โอน

```typescript
import { createCheckDate } from '@/lib/slip2goUtils';

const checkCondition = createCheckCondition({
  checkDate: createCheckDate('eq', '2025-04-23T08:32:45.123Z')
});
```

## ประเภทบัญชีที่รองรับ

```typescript
export const ACCOUNT_TYPES = {
  KASIKORN_BANK: '01004',        // ธนาคารกสิกรไทย
  PROMPTPAY_PHONE: '02001',      // PromptPay เบอร์โทรศัพท์
  MERCHANT: '03000',             // Merchant
  TRUEMONEY_WALLET: '04000',     // TrueMoney Wallet
  SCB_BANK: '01001',             // ธนาคารไทยพาณิชย์
  KBANK: '01002',                // ธนาคารกสิกรไทย
  BBL_BANK: '01003',             // ธนาคารกรุงเทพ
  TMB_BANK: '01005',             // ธนาคารทหารไทยธนชาต
  UOB_BANK: '01006',             // ธนาคารยูโอบี
  CITIBANK: '01007',             // ธนาคารซิตี้แบงก์
  HSBC_BANK: '01008',            // ธนาคารเอชเอสบีซี
  DEUTSCHE_BANK: '01009',        // ธนาคารดอยซ์แบงก์
  STANDARD_CHARTERED: '01010',   // ธนาคารสแตนดาร์ดชาร์เตอร์
  BANK_OF_AMERICA: '01011',      // ธนาคารออฟอเมริกา
  BNP_PARIBAS: '01012',          // ธนาคารบีเอ็นพี ปารีบาส
  SUMITOMO_MITSUI: '01013',      // ธนาคารซูมิโตโม มิตซุย
  MIZUHO_BANK: '01014',          // ธนาคารมิซูโฮ
  BANK_OF_CHINA: '01015',        // ธนาคารออฟไชน่า
  ICBC: '01016',                 // ธนาคารไอซีบีซี
  CHINA_CONSTRUCTION_BANK: '01017', // ธนาคารจีนคอนสตรัคชั่น
  AGRICULTURAL_BANK_OF_CHINA: '01018', // ธนาคารเกษตรกรรมจีน
  BANK_OF_COMMUNICATIONS: '01019', // ธนาคารคมนาคมจีน
  INDUSTRIAL_AND_COMMERCIAL_BANK: '01020' // ธนาคารอุตสาหกรรมและพาณิชย์จีน
} as const;
```

## เงื่อนไขการตรวจสอบยอดเงิน

```typescript
// เท่ากับ
createCheckAmount('eq', 10000)

// มากกว่าหรือเท่ากับ
createCheckAmount('gte', 10000)

// น้อยกว่าหรือเท่ากับ
createCheckAmount('lte', 10000)
```

## เงื่อนไขการตรวจสอบวันที่

```typescript
// เท่ากับ
createCheckDate('eq', '2025-04-23T08:32:45.123Z')

// ไม่ก่อน (มากกว่าหรือเท่ากับ)
createCheckDate('gte', '2025-04-23T08:32:45.123Z')

// ไม่เกิน (น้อยกว่าหรือเท่ากับ)
createCheckDate('lte', '2025-04-23T08:32:45.123Z')
```

## ตัวอย่างการใช้งานที่ซับซ้อน

### 1. ตรวจสอบบัญชีธนาคาร และ เลขที่บัญชี

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK,
      accountNumber: '420-185366-6'
    })
  ]
});
```

### 2. ตรวจสอบบัญชี PromptPay และ รหัส PromptPay

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.PROMPTPAY_PHONE,
      accountNumber: '0902369994'
    })
  ]
});
```

### 3. ตรวจสอบบัญชี TrueMoney ด้วยรหัส Wallet

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.TRUEMONEY_WALLET,
      accountNumber: '0902369994'
    })
  ]
});
```

### 4. ตรวจสอบหลายเงื่อนไขพร้อมกัน

```typescript
const checkCondition = createCheckCondition({
  checkDuplicate: true,
  checkReceiver: [
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK,
      accountNameTH: 'สวัสดี วันจันทร์',
      accountNameEN: 'SawatDee WanJun',
      accountNumber: '420-185366-6'
    })
  ],
  checkAmount: createCheckAmount('eq', 10000),
  checkDate: createCheckDate('eq', '2025-04-23T08:32:45.123Z')
});
```

### 5. ตรวจสอบหลายบัญชี (หากเงื่อนไขบัญชีใดเงื่อนไขหนึ่งถูกต้องจะนับว่าสลิปถูกต้อง)

```typescript
const checkCondition = createCheckCondition({
  checkReceiver: [
    createCheckReceiver({
      accountNumber: '7152477419'
    }),
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK,
      accountNumber: '0884950374'
    }),
    createCheckReceiver({
      accountType: ACCOUNT_TYPES.KASIKORN_BANK,
      accountNameTH: 'สวัสดี วันจันทร์',
      accountNameEN: 'SawatDee WanJun'
    })
  ]
});
```

## Preset Functions

```typescript
import { CHECK_CONDITION_PRESETS } from '@/lib/slip2goUtils';

// ตรวจสอบสลิปซ้ำ
CHECK_CONDITION_PRESETS.checkDuplicate()

// ตรวจสอบบัญชีธนาคารกสิกรไทย
CHECK_CONDITION_PRESETS.checkKasikornAccount('420-185366-6')

// ตรวจสอบ PromptPay เบอร์โทรศัพท์
CHECK_CONDITION_PRESETS.checkPromptPayPhone('0902369994')

// ตรวจสอบ TrueMoney Wallet
CHECK_CONDITION_PRESETS.checkTrueMoneyWallet('0902369994')

// ตรวจสอบยอดเงิน
CHECK_CONDITION_PRESETS.checkExactAmount(10000)
CHECK_CONDITION_PRESETS.checkMinimumAmount(1000)
CHECK_CONDITION_PRESETS.checkMaximumAmount(50000)

// ตรวจสอบวันที่
CHECK_CONDITION_PRESETS.checkExactDate('2025-04-23T08:32:45.123Z')
CHECK_CONDITION_PRESETS.checkDateNotAfter('2025-04-23T08:32:45.123Z')
CHECK_CONDITION_PRESETS.checkDateNotBefore('2025-04-23T08:32:45.123Z')
```

## การใช้งานในหน้า Slip Verification

### 1. เข้าสู่หน้าตรวจสอบสลิป

```
/slip-verification
```

### 2. เปิดใช้งานการตั้งเงื่อนไข

- เปิด checkbox "การตั้งเงื่อนไขการตรวจสอบ"
- เลือกแท็บที่ต้องการตั้งเงื่อนไข:
  - **สลิปซ้ำ**: ตรวจสอบว่าสลิปนี้เคยถูกใช้แล้วหรือไม่
  - **บัญชีผู้รับ**: ตั้งเงื่อนไขบัญชีผู้รับเงิน
  - **ยอดเงิน**: ตั้งเงื่อนไขยอดเงินที่ต้องโอน
  - **วันที่**: ตั้งเงื่อนไขวันที่ทำรายการ

### 3. ตั้งเงื่อนไขบัญชีผู้รับ

- กดปุ่ม "เพิ่มบัญชี" เพื่อเพิ่มบัญชีผู้รับ
- เลือกประเภทบัญชี (ธนาคาร, PromptPay, TrueMoney, etc.)
- ใส่หมายเลขบัญชี
- ใส่ชื่อบัญชี (ไทย/อังกฤษ)

### 4. ตั้งเงื่อนไขยอดเงิน

- เปิด checkbox "ตรวจสอบยอดเงิน"
- เลือกเงื่อนไข: เท่ากับ, มากกว่าหรือเท่ากับ, น้อยกว่าหรือเท่ากับ
- ใส่จำนวนเงิน

### 5. ตั้งเงื่อนไขวันที่

- เปิด checkbox "ตรวจสอบวันที่"
- เลือกเงื่อนไข: เท่ากับ, ไม่ก่อน, ไม่เกิน
- เลือกวันที่และเวลา

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "amount": 1500,
    "bank": "ธนาคารกสิกรไทย",
    "accountNumber": "1234567890",
    "accountName": "บริษัท Game Nexus จำกัด",
    "transactionDate": "2024-01-15T10:30:00Z",
    "reference": "REF123456789",
    "confidence": 0.95
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid QR Code format"
}
```

## Error Handling

### Common Errors

1. **401 Unauthorized**
   - ตรวจสอบ Secret Key
   - ตรวจสอบรูปแบบ Authorization header

2. **400 Bad Request**
   - ตรวจสอบรูปแบบ QR Code
   - ตรวจสอบข้อมูลเงื่อนไข

3. **422 Unprocessable Entity**
   - ข้อมูลเงื่อนไขไม่ถูกต้อง
   - accountType ไม่ถูกต้อง

### Error Handling Example

```typescript
try {
  const result = await verifySlipByQRCode(qrCode, checkCondition);
  
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

### 1. การตั้งเงื่อนไข

- ใช้เงื่อนไขที่จำเป็นเท่านั้น
- ตรวจสอบข้อมูลก่อนส่ง
- ใช้ preset functions เมื่อเป็นไปได้

### 2. การจัดการ Error

- จัดการ error อย่างเหมาะสม
- แสดงข้อความ error ที่เข้าใจง่าย
- มี fallback mechanism

### 3. Performance

- จำกัดจำนวนการเรียก API
- Cache ผลลัพธ์เมื่อเป็นไปได้
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

3. **เงื่อนไขที่ถูกต้อง**
   ```typescript
   const checkCondition = createCheckCondition({
     checkReceiver: [
       createCheckReceiver({
         accountType: ACCOUNT_TYPES.KASIKORN_BANK,
         accountNumber: '420-185366-6'
       })
     ]
   });
   ```

4. **เงื่อนไขที่ไม่ถูกต้อง**
   ```typescript
   const checkCondition = createCheckCondition({
     checkReceiver: [
       createCheckReceiver({
         accountType: 'invalid-type',
         accountNumber: '420-185366-6'
       })
     ]
   });
   ```

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **QR Code ไม่ถูกต้อง**
   - ตรวจสอบรูปแบบ QR Code
   - ใช้ QR Code จากแอปธนาคารจริง

2. **เงื่อนไขไม่ทำงาน**
   - ตรวจสอบ accountType
   - ตรวจสอบรูปแบบข้อมูล

3. **API ไม่ตอบสนอง**
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบสถานะ Slip2Go API

### Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('QR Code:', qrCode);
  console.log('Check Condition:', checkCondition);
  console.log('API URL:', process.env.REACT_APP_SLIP2GO_API_URL);
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
