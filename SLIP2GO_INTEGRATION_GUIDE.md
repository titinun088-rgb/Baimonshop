# Slip2Go API Integration Guide

## ภาพรวม

Slip2Go API เป็นบริการตรวจสอบสลิปการโอนเงินผ่าน QR Code และรูปภาพ สำหรับระบบ Game Nexus Dashboard

## การตั้งค่า

### 1. Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root และเพิ่ม:

```env
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
```

### 2. Secret Key

Secret Key ที่ได้รับ: `48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=`

## ฟีเจอร์ที่รองรับ

### 1. ตรวจสอบสลิปผ่าน QR Code
- รองรับ QR Code จากแอปธนาคารต่างๆ
- แยกข้อมูลการโอนเงินอัตโนมัติ
- ตรวจสอบความถูกต้องของข้อมูล

### 2. ตรวจสอบสลิปผ่านรูปภาพ
- รองรับไฟล์รูปภาพ JPG, PNG, GIF
- ใช้ AI ในการอ่านข้อมูลจากสลิป
- แสดงความแม่นยำของการอ่านข้อมูล

### 3. ข้อมูลที่ได้
- จำนวนเงิน
- ชื่อธนาคาร
- หมายเลขบัญชี
- ชื่อบัญชี
- วันที่ทำรายการ
- หมายเลขอ้างอิง

## การใช้งาน

### 1. เข้าสู่หน้าตรวจสอบสลิป

```
/slip-verification
```

### 2. เลือกวิธีการตรวจสอบ

#### QR Code Method
1. เปิดแอปธนาคาร
2. ไปที่ประวัติการโอนเงิน
3. เลือกรายการที่ต้องการตรวจสอบ
4. คัดลอก QR Code
5. วางในช่อง QR Code
6. กดปุ่ม "ตรวจสอบ QR Code"

#### Image Method
1. ถ่ายรูปสลิปการโอนเงิน
2. เลือกไฟล์รูปภาพ
3. กดปุ่ม "ตรวจสอบรูปภาพ"
4. รอผลการตรวจสอบ

### 3. ดูผลการตรวจสอบ

ระบบจะแสดงข้อมูลการโอนเงินที่ตรวจสอบได้:
- ✅ จำนวนเงิน
- ✅ ธนาคาร
- ✅ หมายเลขบัญชี
- ✅ ชื่อบัญชี
- ✅ วันที่ทำรายการ
- ✅ หมายเลขอ้างอิง

## API Endpoints

### 1. ตรวจสอบสลิปผ่าน QR Code

```http
POST /api/verify-slip/qr-code/info
Authorization: Bearer 48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
Content-Type: application/json

{
  "payload": {
    "qrCode": "004100060000000402TH9104xxxx"
  }
}
```

### 2. ตรวจสอบสลิปผ่านรูปภาพ

```http
POST /api/verify-slip/image
Authorization: Bearer 48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
Content-Type: multipart/form-data

image: [file]
```

### 3. ตรวจสอบข้อมูลบัญชี

```http
GET /api/account/info
Authorization: Bearer 48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
Content-Type: application/json
```

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

## การใช้งานในโค้ด

### 1. Import Functions

```typescript
import { 
  verifySlipByQRCode, 
  verifySlipByImage,
  checkSlip2GoAPIStatus 
} from '@/lib/slip2goUtils';
```

### 2. ตรวจสอบสลิปผ่าน QR Code

```typescript
const handleQRCodeVerification = async (qrCode: string) => {
  try {
    const result = await verifySlipByQRCode(qrCode);
    
    if (result.success) {
      console.log('Amount:', result.data?.amount);
      console.log('Bank:', result.data?.bank);
      console.log('Account:', result.data?.accountNumber);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### 3. ตรวจสอบสลิปผ่านรูปภาพ

```typescript
const handleImageVerification = async (file: File) => {
  try {
    const result = await verifySlipByImage(file);
    
    if (result.success) {
      console.log('Verification successful:', result.data);
      console.log('Confidence:', result.data?.confidence);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### 4. ตรวจสอบสถานะ API

```typescript
const checkAPIHealth = async () => {
  const isHealthy = await checkSlip2GoAPIStatus();
  console.log('API Status:', isHealthy ? 'Healthy' : 'Unhealthy');
};
```

## Error Handling

### Common Errors

1. **401 Unauthorized**
   - ตรวจสอบ Secret Key
   - ตรวจสอบรูปแบบ Authorization header

2. **400 Bad Request**
   - ตรวจสอบรูปแบบ QR Code
   - ตรวจสอบขนาดไฟล์รูปภาพ

3. **500 Internal Server Error**
   - ติดต่อ Slip2Go support
   - ตรวจสอบสถานะ API

### Error Handling Example

```typescript
const handleVerification = async () => {
  try {
    const result = await verifySlipByQRCode(qrCode);
    
    if (result.success) {
      // Handle success
      toast.success('ตรวจสอบสลิปสำเร็จ');
      setVerificationResult(result);
    } else {
      // Handle API error
      toast.error(result.error || 'ไม่สามารถตรวจสอบสลิปได้');
    }
  } catch (error) {
    // Handle network error
    toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    console.error('Error:', error);
  }
};
```

## Security Best Practices

### 1. Environment Variables
- เก็บ Secret Key ใน environment variables เท่านั้น
- ไม่ commit Secret Key ลงใน repository

### 2. HTTPS
- ใช้ HTTPS เสมอเมื่อเรียก API
- ตรวจสอบ SSL certificate

### 3. Data Validation
- ตรวจสอบข้อมูลที่ได้รับจาก API
- Sanitize input data

### 4. Rate Limiting
- จำกัดจำนวนการเรียก API ต่อผู้ใช้
- Implement retry mechanism

## Testing

### 1. Test QR Code
```
004100060000000402TH9104xxxx
```

### 2. Test Image
ใช้รูปภาพสลิปจริงที่มีข้อมูลชัดเจน

### 3. Unit Tests

```typescript
import { verifySlipByQRCode } from '@/lib/slip2goUtils';

describe('Slip2Go API', () => {
  test('should verify QR code successfully', async () => {
    const result = await verifySlipByQRCode('004100060000000402TH9104xxxx');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **QR Code ไม่ถูกต้อง**
   - ตรวจสอบรูปแบบ QR Code
   - ใช้ QR Code จากแอปธนาคารจริง

2. **รูปภาพไม่ชัด**
   - ถ่ายรูปใหม่ให้ชัดเจน
   - ตรวจสอบแสงสว่าง

3. **API ไม่ตอบสนอง**
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบสถานะ Slip2Go API

### Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('API URL:', process.env.REACT_APP_SLIP2GO_API_URL);
  console.log('Secret Key:', process.env.REACT_APP_SLIP2GO_SECRET_KEY ? 'Set' : 'Not Set');
}
```

## การพัฒนาต่อ

### 1. เพิ่ม Payment Gateway
- เชื่อมต่อกับ Omise
- เชื่อมต่อกับ 2C2P
- เชื่อมต่อกับ TrueMoney

### 2. เพิ่มฟีเจอร์
- บันทึกประวัติการตรวจสอบ
- ส่งอีเมลแจ้งเตือน
- Dashboard สำหรับดูสถิติ

### 3. ปรับปรุง UI/UX
- เพิ่ม Dark Mode
- ปรับปรุง Mobile Experience
- เพิ่ม Animation

## Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- ติดต่อ Slip2Go Support
- ตรวจสอบ Documentation
- สร้าง Issue ใน GitHub Repository
