import logger from './logger';

/**
 * Slip2Go Client-Side API Wrapper
 * All API calls go through backend proxy to hide secret keys
 */

export interface SlipVerificationResult {
  success: boolean;
  verified?: boolean;
  data?: {
    verified: boolean;
    amount?: number;
    date?: string;
    time?: string;
    sender?: {
      displayName?: string;
      account?: string;
    };
    receiver?: {
      displayName?: string;
      account?: string;
    };
  };
  error?: string;
}

export interface QRCodeResult {
  success: boolean;
  qrImage?: string;
  qrString?: string;
  error?: string;
}

/**
 * ตรวจสอบสลิปผ่าน Backend Proxy
 */
export async function verifySlip(log: string, amount: number): Promise<SlipVerificationResult> {
  try {
    logger.debug('🎯 เริ่มตรวจสอบสลิป...', { amount });

    const response = await fetch('/api/slip2go-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ log, amount })
    });

    const data = await response.json();
    logger.debug('📥 ได้รับ Response จาก Backend:', data);

    if (!response.ok || !data.success) {
      logger.error('❌ Backend Response ไม่สำเร็จ:', data);
      return {
        success: false,
        verified: false,
        error: data.error || 'การตรวจสอบสลิปล้มเหลว',
        data: data.data
      };
    }

    const verified = data.data?.verified === true;

    if (!verified) {
      logger.warn('⚠️ สลิปไม่ผ่านการตรวจสอบ');
      return {
        success: false,
        verified: false,
        error: 'สลิปไม่ผ่านการตรวจสอบ หรือข้อมูลไม่ถูกต้อง',
        data: data.data
      };
    }

    logger.debug('✅ สลิปผ่านการตรวจสอบ');

    return {
      success: true,
      verified: true,
      data: data.data
    };
  } catch (error: any) {
    logger.error('❌ Error verifying slip:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป'
    };
  }
}

/**
 * สร้าง QR Code PromptPay ผ่าน Backend Proxy
 */
export async function generateQRCode(amount: number): Promise<QRCodeResult> {
  try {
    logger.debug('🎯 สร้าง QR Code สำหรับจำนวน:', amount);

    const response = await fetch('/api/slip2go-qrcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'ไม่สามารถสร้าง QR Code ได้');
    }

    return {
      success: true,
      qrImage: data.data.qrImage,
      qrString: data.data.qrString
    };
  } catch (error: any) {
    logger.error('❌ Error generating QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * สร้างข้อมูล Slip2Go Config (สำหรับ backward compatibility)
 * ตอนนี้ไม่ได้ใช้ secret key แล้ว เพราะเรียกผ่าน backend
 */
export function getSlip2GoConfig() {
  return {
    apiUrl: 'https://connect.slip2go.com', // Public URL (not sensitive)
    secretKey: 'HIDDEN' // Secret key is now on backend only
  };
}
