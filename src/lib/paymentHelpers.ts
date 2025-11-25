/**
 * Payment Helper Functions
 * ฟังก์ชันช่วยเหลือสำหรับการชำระเงิน
 */

import { generatePromptPayQRImageLink, generatePromptPayQRCode } from './slip2goUtils';

/**
 * ข้อมูล PromptPay เริ่มต้น
 */
export const DEFAULT_PROMPTPAY_CONFIG = {
  code: '0989949413',
  type: 'phone_number' as const,
  accountName: 'ฐิตินันท์ กล้าหาญ'
};

/**
 * ตรวจสอบความถูกต้อง PromptPay Code
 */
export function validatePromptPayCode(code: string, type: string): { valid: boolean; error?: string } {
  if (!code.trim()) {
    return { valid: false, error: 'PromptPay Code ต้องไม่ว่างเปล่า' };
  }

  switch (type) {
    case 'phone_number':
      if (!/^\d{10}$/.test(code.replace(/\D/g, ''))) {
        return { valid: false, error: 'เบอร์โทรต้องเป็น 10 หลัก' };
      }
      break;
    case 'citizen_id':
      if (!/^\d{13}$/.test(code.replace(/\D/g, ''))) {
        return { valid: false, error: 'เลขบัตรประชาชนต้องเป็น 13 หลัก' };
      }
      break;
    case 'e_wallet':
      if (code.length < 10) {
        return { valid: false, error: 'E-wallet ต้องมีความยาวอย่างน้อย 10 ตัวอักษร' };
      }
      break;
  }

  return { valid: true };
}

/**
 * ตรวจสอบความถูกต้องจำนวนเงิน
 */
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: 'จำนวนเงินต้องมากกว่า 0' };
  }

  if (amountNum > 999999) {
    return { valid: false, error: 'จำนวนเงินไม่เกิน 999,999 บาท' };
  }

  return { valid: true };
}

/**
 * สร้าง QR Code URL ด้วย validation
 */
export async function createQRCodeWithValidation(params: {
  promptPayCode: string;
  promptPayType: 'phone_number' | 'citizen_id' | 'e_wallet';
  accountName: string;
  amount: string;
  useUrl?: boolean; // true = URL, false = Base64
}): Promise<{
  success: boolean;
  data?: string; // URL หรือ Base64
  error?: string;
}> {
  // ตรวจสอบ PromptPay Code
  const codeCheck = validatePromptPayCode(params.promptPayCode, params.promptPayType);
  if (!codeCheck.valid) {
    return { success: false, error: codeCheck.error };
  }

  // ตรวจสอบจำนวนเงิน
  const amountCheck = validateAmount(params.amount);
  if (!amountCheck.valid) {
    return { success: false, error: amountCheck.error };
  }

  // ตรวจสอบชื่อบัญชี
  if (!params.accountName.trim()) {
    return { success: false, error: 'ชื่อบัญชีต้องไม่ว่างเปล่า' };
  }

  try {
    if (params.useUrl) {
      // สร้าง URL QR Code
      const result = await generatePromptPayQRImageLink({
        promptPayCode: params.promptPayCode,
        promptPayType: params.promptPayType,
        accountName: params.accountName,
        amount: params.amount
      });

      if (result.success && result.qrImageUrl) {
        return { success: true, data: result.qrImageUrl };
      }
      return { success: false, error: result.error };
    } else {
      // สร้าง Base64 QR Code
      const result = await generatePromptPayQRCode({
        promptPayCode: params.promptPayCode,
        promptPayType: params.promptPayType,
        accountName: params.accountName,
        amount: params.amount
      });

      if (result.success && result.qrCode) {
        return { success: true, data: result.qrCode };
      }
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'เกิดข้อผิดพลาด' };
  }
}

/**
 * ฟอร์แมตจำนวนเงินเป็น Thai Currency
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * แปลง Base64 เป็น Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * ดาวน์โหลด QR Code ใน Base64
 */
export function downloadQRCodeBase64(base64: string, filename: string = 'qr-code.png'): void {
  try {
    const blob = base64ToBlob(base64);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading QR code:', error);
  }
}

/**
 * ดาวน์โหลด QR Code ใน URL
 */
export function downloadQRCodeURL(url: string, filename: string = 'qr-code.png'): void {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
  }
}

/**
 * Copy URL ไปยัง Clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Generate Payment Link
 */
export function generatePaymentLink(baseUrl: string, params: {
  amount: string | number;
  accountName: string;
  promptPayCode: string;
  promptPayType: string;
}): string {
  const url = new URL(baseUrl);
  url.searchParams.append('amount', params.amount.toString());
  url.searchParams.append('accountName', params.accountName);
  url.searchParams.append('promptPayCode', params.promptPayCode);
  url.searchParams.append('promptPayType', params.promptPayType);
  return url.toString();
}

export default {
  validatePromptPayCode,
  validateAmount,
  createQRCodeWithValidation,
  formatCurrency,
  base64ToBlob,
  downloadQRCodeBase64,
  downloadQRCodeURL,
  copyToClipboard,
  generatePaymentLink,
  DEFAULT_PROMPTPAY_CONFIG
};
