# Payment System Guide

## ภาพรวมระบบชำระเงิน

ระบบชำระเงินของ Game Nexus รองรับวิธีการชำระเงินที่หลากหลายสำหรับผู้ใช้ในประเทศไทย:

### วิธีการชำระเงินที่รองรับ

1. **PromptPay**
   - ชำระผ่าน QR Code
   - ชำระผ่านหมายเลขโทรศัพท์
   - ไม่มีค่าธรรมเนียม
   - ดำเนินการทันที

2. **โอนเงินผ่านธนาคาร**
   - รองรับธนาคารต่างๆ ในประเทศไทย
   - ไม่มีค่าธรรมเนียม
   - ใช้เวลา 1-3 วันทำการ

3. **TrueMoney Wallet**
   - ชำระผ่าน TrueMoney Wallet
   - ไม่มีค่าธรรมเนียม
   - ดำเนินการทันที

## การใช้งาน

### 1. เข้าสู่หน้าชำระเงิน

```typescript
// Navigate to payment page with payment data
const paymentData = {
  amount: 1500,
  description: "Game Item Package",
  orderId: "ORDER-123456"
};

navigate("/payment", { state: paymentData });
```

### 2. เลือกวิธีการชำระเงิน

ผู้ใช้สามารถเลือกวิธีการชำระเงินที่สะดวกจากตัวเลือกที่มีให้

### 3. ดำเนินการชำระเงิน

ระบบจะแสดงข้อมูลการชำระเงินตามวิธีการที่เลือก:

#### PromptPay
- แสดง QR Code สำหรับสแกน
- แสดงหมายเลขโทรศัพท์สำหรับโอนเงิน
- แสดงจำนวนเงินที่ต้องชำระ

#### โอนเงินผ่านธนาคาร
- แสดงข้อมูลบัญชีธนาคาร
- แสดงหมายเลขอ้างอิงสำหรับการโอนเงิน
- แสดงจำนวนเงินที่ต้องชำระ

#### TrueMoney Wallet
- แสดงหมายเลข Wallet
- แสดงจำนวนเงินที่ต้องชำระ
- แสดงหมายเลข Transaction ID

### 4. ยืนยันการชำระเงิน

หลังจากดำเนินการชำระเงินแล้ว ผู้ใช้สามารถกดปุ่ม "ยืนยันการชำระเงิน" เพื่อแจ้งให้ระบบทราบ

## ฟีเจอร์หลัก

### UI/UX Features
- **Responsive Design**: รองรับการใช้งานบนอุปกรณ์ต่างๆ
- **Copy to Clipboard**: คัดลอกข้อมูลการชำระเงินได้ง่าย
- **Loading States**: แสดงสถานะการประมวลผล
- **Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม

### Security Features
- **Protected Route**: ต้องล็อกอินและยืนยันอีเมล
- **Data Validation**: ตรวจสอบข้อมูลการชำระเงิน
- **Reference Numbers**: ใช้หมายเลขอ้างอิงสำหรับติดตาม

## การพัฒนาต่อ

### การเชื่อมต่อ API จริง

```typescript
// ตัวอย่างการเชื่อมต่อกับ Payment Gateway
const processPayment = async (paymentData: PaymentData) => {
  try {
    const response = await fetch('/api/payment/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};
```

### การเพิ่ม Payment Gateway ใหม่

1. เพิ่มข้อมูล Payment Method ใน `paymentMethods` array
2. เพิ่ม case ใหม่ใน `generatePaymentDetails` function
3. เพิ่ม UI สำหรับแสดงข้อมูลการชำระเงิน

### การติดตามสถานะการชำระเงิน

```typescript
// ตัวอย่างการติดตามสถานะ
const checkPaymentStatus = async (orderId: string) => {
  const response = await fetch(`/api/payment/status/${orderId}`);
  const status = await response.json();
  return status;
};
```

## การทดสอบ

### ทดสอบผ่านหน้า Games
1. เข้าสู่หน้า Games (`/games`)
2. กดปุ่ม "ทดสอบการชำระเงิน"
3. เลือกวิธีการชำระเงิน
4. ทดสอบการทำงานของแต่ละวิธีการ

### ทดสอบการนำทาง
```typescript
// ทดสอบการส่งข้อมูลไปยังหน้า Payment
const testPaymentData = {
  amount: 1000,
  description: "Test Payment",
  orderId: "TEST-" + Date.now()
};

navigate("/payment", { state: testPaymentData });
```

## ข้อควรระวัง

1. **ข้อมูลการชำระเงิน**: ควรเก็บข้อมูลการชำระเงินในฐานข้อมูลเพื่อการติดตาม
2. **การตรวจสอบ**: ควรมีระบบตรวจสอบการชำระเงินจากธนาคารหรือ Payment Gateway
3. **ความปลอดภัย**: ข้อมูลการชำระเงินควรถูกเข้ารหัสและเก็บอย่างปลอดภัย
4. **การแจ้งเตือน**: ควรมีระบบแจ้งเตือนเมื่อมีการชำระเงินสำเร็จ

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่พบข้อมูลการชำระเงิน**
   - ตรวจสอบการส่งข้อมูลผ่าน navigation state
   - ตรวจสอบการเข้าถึงหน้า Payment

2. **QR Code ไม่แสดง**
   - ตรวจสอบการสร้าง QR Code URL
   - ตรวจสอบการแสดงผลใน UI

3. **การคัดลอกไม่ทำงาน**
   - ตรวจสอบการรองรับ Clipboard API
   - เพิ่ม fallback สำหรับเบราว์เซอร์เก่า

### การ Debug

```typescript
// เพิ่ม console.log เพื่อ debug
console.log('Payment Data:', paymentData);
console.log('Selected Method:', selectedMethod);
console.log('Payment Details:', paymentDetails);
```

## การอัปเดตในอนาคต

1. **การรองรับ Cryptocurrency**
2. **การเชื่อมต่อกับ Payment Gateway เพิ่มเติม**
3. **ระบบ Installment Payment**
4. **การรองรับสกุลเงินอื่น**
5. **ระบบ Refund และ Cancellation**
