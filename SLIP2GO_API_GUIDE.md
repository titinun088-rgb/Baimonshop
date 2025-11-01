# Slip2Go API Configuration

## Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจคและเพิ่มตัวแปรต่อไปนี้:

```env
# Slip2Go API Configuration
VITE_SLIP2GO_API_URL=https://connect.slip2go.com
VITE_SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
```

## การใช้งาน

### 1. ตรวจสอบสลิปผ่าน QR Code

```typescript
import { verifySlipByQRCode } from '@/lib/slip2goUtils';

const qrCode = "004100060000000402TH9104xxxx";
const result = await verifySlipByQRCode(qrCode);

if (result.success) {
  console.log('Amount:', result.data?.amount);
  console.log('Bank:', result.data?.bank);
  console.log('Account:', result.data?.accountNumber);
} else {
  console.error('Error:', result.error);
}
```

### 2. ตรวจสอบสลิปผ่านรูปภาพ

```typescript
import { verifySlipByImage } from '@/lib/slip2goUtils';

const fileInput = document.getElementById('imageFile') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const result = await verifySlipByImage(file);
  
  if (result.success) {
    console.log('Verification successful:', result.data);
  } else {
    console.error('Verification failed:', result.error);
  }
}
```

### 3. ตรวจสอบสถานะ API

```typescript
import { checkSlip2GoAPIStatus } from '@/lib/slip2goUtils';

const isAPIHealthy = await checkSlip2GoAPIStatus();
console.log('API Status:', isAPIHealthy ? 'Healthy' : 'Unhealthy');
```

## API Endpoints

### 1. ตรวจสอบสลิปผ่าน QR Code
- **URL**: `POST /api/verify-slip/qr-code/info`
- **Headers**: 
  - `Authorization: Bearer {secretKey}`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "payload": {
      "qrCode": "004100060000000402TH9104xxxx"
    }
  }
  ```

### 2. ตรวจสอบสลิปผ่านรูปภาพ
- **URL**: `POST /api/verify-slip/image`
- **Headers**: 
  - `Authorization: Bearer {secretKey}`
- **Body**: FormData with image file

### 3. ตรวจสอบข้อมูลบัญชี
- **URL**: `GET /api/account/info`
- **Headers**: 
  - `Authorization: Bearer {secretKey}`
  - `Content-Type: application/json`

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
  // Handle network or other errors
  console.error('Network Error:', error);
}
```

## Security Notes

1. **Secret Key**: เก็บ Secret Key ใน environment variables เท่านั้น
2. **HTTPS**: ใช้ HTTPS เสมอเมื่อเรียก API
3. **Validation**: ตรวจสอบข้อมูลที่ได้รับจาก API ก่อนใช้งาน
4. **Rate Limiting**: จำกัดจำนวนการเรียก API ต่อผู้ใช้

## Testing

### Test QR Code
```
004100060000000402TH9104xxxx
```

### Test Image
ใช้รูปภาพสลิปจริงที่มีข้อมูลชัดเจน

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **401 Unauthorized**
   - ตรวจสอบ Secret Key
   - ตรวจสอบรูปแบบ Authorization header

2. **400 Bad Request**
   - ตรวจสอบรูปแบบ QR Code
   - ตรวจสอบขนาดไฟล์รูปภาพ

3. **500 Internal Server Error**
   - ติดต่อ Slip2Go support
   - ตรวจสอบสถานะ API

### Debug Mode

```typescript
// เปิด debug mode
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('API URL:', process.env.REACT_APP_SLIP2GO_API_URL);
  console.log('Secret Key:', process.env.REACT_APP_SLIP2GO_SECRET_KEY ? 'Set' : 'Not Set');
}
```
