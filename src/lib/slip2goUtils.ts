// Slip2Go API Integration
// สำหรับการตรวจสอบสลิปการโอนเงินผ่าน QR Code และรูปภาพ

interface Slip2GoConfig {
  apiUrl: string;
  secretKey: string;
}

interface QRCodeInfo {
  qrCode: string;
  checkCondition?: CheckCondition;
}

interface CheckCondition {
  checkDuplicate?: boolean;
  checkReceiver?: CheckReceiver[];
  checkAmount?: CheckAmount;
  checkDate?: CheckDate;
}

interface CheckReceiver {
  accountType?: string;
  accountNumber?: string;
  accountNameTH?: string;
  accountNameEN?: string;
}

interface CheckAmount {
  type: 'eq' | 'gte' | 'lte';
  amount: number;
}

interface CheckDate {
  type: 'eq' | 'gte' | 'lte';
  date: string;
}

interface SlipVerificationResult {
  success: boolean;
  data?: {
    referenceId: string;
    decode: string;
    transRef: string;
    dateTime: string;
    verifyDate?: string;
    amount: number;
    ref1?: string | null;
    ref2?: string | null;
    ref3?: string | null;
    receiver: {
      account: {
        name: string;
        bank: {
          account?: string | null;
        };
        proxy?: {
          type?: string | null;
          account?: string | null;
        } | null;
      };
      bank: {
        id: string;
        name?: string | null;
      };
    };
    sender: {
      account: {
        name: string;
        bank: {
          account: string;
        };
      };
      bank: {
        id: string;
        name: string;
      };
    };
  };
  error?: string;
}

interface Slip2GoResponse {
  code: string;
  message: string;
  data?: any;
}

interface QRCodeGenerateResult {
  success: boolean;
  data?: {
    qrCode: string;
    accountName: string;
    amount: string;
  };
  error?: string;
}

interface QRImageLinkResult {
  success: boolean;
  data?: {
    qrImageLink: string;
    accountName: string;
    amount: string;
  };
  error?: string;
}

interface AccountInfoResult {
  success: boolean;
  data?: {
    shopName: string;
    package: string;
    packageExpiredDate: string;
    quotaLimit: number;
    quotaRemaining: number;
    creditRemaining: number;
    autoRenewalPackage: boolean;
    checkSlipByCredit: boolean;
    quotaQrLimit: number;
    quotaQrRemaining: number;
  };
  error?: string;
}

interface ImageVerificationResult {
  success: boolean;
  data?: {
    amount: number;
    bank: string;
    accountNumber: string;
    accountName: string;
    transactionDate: string;
    reference: string;
    confidence: number;
  };
  error?: string;
}

class Slip2GoAPI {
  private config: Slip2GoConfig;

  constructor(config: Slip2GoConfig) {
    this.config = config;
  }

  // Helper method to clean API URL
  private getCleanApiUrl(): string {
    // Remove any path after the domain to get base URL
    return this.config.apiUrl.replace(/\/api.*$/, '');
  }

  /**
   * ตรวจสอบสลิปผ่าน QR Code
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/verify-slip/qr-code/info
   * Response Code: "200000" = "Slip found"
   * Response Message: "Slip found"
   * 
   * @param qrCode - รหัส QR Code จากสลิป
   * @param checkCondition - เงื่อนไขในการตรวจสอบ (จำนวนเงิน, วันที่, บัญชี ฯลฯ)
   * @returns Promise<SlipVerificationResult> - ผลลัพธ์การตรวจสอบพร้อมข้อมูลสลิป
   */
  async verifySlipByQRCode(qrCode: string, checkCondition?: CheckCondition): Promise<SlipVerificationResult> {
    try {
      console.log('🔍 กำลังตรวจสอบสลิปด้วย QR Code...');
      console.log('📊 Check Condition:', checkCondition);
      
      const baseUrl = this.getCleanApiUrl();
      const requestBody = {
        payload: {
          qrCode: qrCode,
          ...(checkCondition && { checkCondition })
        }
      };
      
      console.log('📤 Request:', {
        url: `${baseUrl}/api/verify-slip/qr-code/info`,
        body: requestBody
      });
      
      const response = await fetch(`${baseUrl}/api/verify-slip/qr-code/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response codes ที่มีข้อมูลเหมือน Slip Found (200000)
      // 200000 = Slip Found
      // 200001 = Get Info Success (เฉพาะ /api/account/info)
      // 200200 = Slip is Valid
      // 200401 = Recipient Account Not Match
      // 200402 = Transfer Amount Not Match
      // 200403 = Transfer Date Not Match
      // 200501 = Slip is Duplicated
      if ((responseData.code === '200000' || responseData.code === '200001' || responseData.code === '200200' || 
           responseData.code === '200401' || responseData.code === '200402' || responseData.code === '200403' || 
           responseData.code === '200501') && responseData.data) {
        console.log('✅ สลิปถูกต้อง! Response Code:', responseData.code);
        
        // ตรวจสอบ response codes ที่มีเงื่อนไขไม่ตรง
        if (responseData.code === '200401') {
          console.warn('⚠️ บัญชีผู้รับไม่ถูกต้อง!');
          return {
            success: false,
            error: 'บัญชีผู้รับไม่ถูกต้อง - กรุณาตรวจสอบบัญชีผู้รับ'
          };
        }
        
        if (responseData.code === '200402') {
          console.warn('⚠️ ยอดโอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'ยอดโอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบจำนวนเงิน'
          };
        }
        
        if (responseData.code === '200403') {
          console.warn('⚠️ วันที่โอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'วันที่โอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบวันที่โอน'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        console.log('✅ พบสลิป!');
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        console.log('  📅 วันที่:', responseData.data.dateTime);
        console.log('  👤 ผู้ส่ง:', responseData.data.sender?.account?.name);
        console.log('  👥 ผู้รับ:', responseData.data.receiver?.account?.name);
        console.log('  🔖 Reference ID:', responseData.data.referenceId);
        
        return {
          success: true,
          data: {
            referenceId: responseData.data.referenceId || '',
            decode: responseData.data.decode || '',
            transRef: responseData.data.transRef || '',
            dateTime: responseData.data.dateTime || '',
            verifyDate: responseData.data.verifyDate,
            amount: responseData.data.amount || 0,
            ref1: responseData.data.ref1,
            ref2: responseData.data.ref2,
            ref3: responseData.data.ref3,
            receiver: {
              account: {
                name: responseData.data.receiver?.account?.name || '',
                bank: {
                  account: responseData.data.receiver?.account?.bank?.account
                },
                proxy: responseData.data.receiver?.account?.proxy
              },
              bank: {
                id: responseData.data.receiver?.bank?.id || '',
                name: responseData.data.receiver?.bank?.name
              }
            },
            sender: {
              account: {
                name: responseData.data.sender?.account?.name || '',
                bank: {
                  account: responseData.data.sender?.account?.bank?.account || ''
                }
              },
              bank: {
                id: responseData.data.sender?.bank?.id || '',
                name: responseData.data.sender?.bank?.name || ''
              }
            }
          }
        };
      } else {
        console.warn('⚠️ ไม่พบสลิปหรือสลิปไม่ถูกต้อง:', responseData.message);
        console.warn('⚠️ Response Code:', responseData.code);
        console.warn('⚠️ Response Data:', responseData.data);
        
        // ตรวจสอบ response codes ที่มีข้อมูลจำกัด
        if (responseData.code === '200404') {
          console.warn('⚠️ ไม่พบสลิปในระบบธนาคาร!');
          return {
            success: false,
            error: 'ไม่พบสลิปในระบบธนาคาร - กรุณาตรวจสอบสลิปอีกครั้ง'
          };
        }
        
        if (responseData.code === '200500') {
          console.warn('⚠️ สลิปเสีย/สลิปปลอม!');
          return {
            success: false,
            error: 'สลิปเสีย/สลิปปลอม - กรุณาใช้สลิปที่ถูกต้อง'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถตรวจสอบสลิปได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go QR Code verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ตรวจสอบสลิปผ่านรูปภาพ
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/verify-slip/qr-image/info
   * Content-Type: multipart/form-data
   * 
   * @param imageFile - ไฟล์รูปสลิป (PNG, JPG, JPEG)
   * @param checkCondition - เงื่อนไขในการตรวจสอบ (จำนวนเงิน, บัญชี, วันที่, สลิปซ้ำ)
   * @returns Promise<SlipVerificationResult> - ผลลัพธ์การตรวจสอบพร้อมข้อมูลสลิป
   */
  async verifySlipByImage(imageFile: File, checkCondition?: CheckCondition): Promise<SlipVerificationResult> {
    try {
      console.log('🔍 กำลังตรวจสอบสลิปด้วยรูปภาพ...');
      console.log('📁 ไฟล์:', imageFile.name, `(${imageFile.size} bytes)`);
      console.log('📊 Check Condition:', checkCondition);
      
      const formData = new FormData();
      formData.append('file', imageFile);
      
      if (checkCondition) {
        formData.append('payload', JSON.stringify(checkCondition));
        console.log('📤 Payload:', JSON.stringify(checkCondition, null, 2));
      }

      const baseUrl = this.getCleanApiUrl();
      console.log('📤 Request URL:', `${baseUrl}/api/verify-slip/qr-image/info`);
      
      const response = await fetch(`${baseUrl}/api/verify-slip/qr-image/info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response codes ที่มีข้อมูลเหมือน Slip Found (200000)
      // 200000 = Slip Found
      // 200001 = Get Info Success (เฉพาะ /api/account/info)
      // 200200 = Slip is Valid
      // 200401 = Recipient Account Not Match
      // 200402 = Transfer Amount Not Match
      // 200403 = Transfer Date Not Match
      // 200501 = Slip is Duplicated
      if ((responseData.code === '200000' || responseData.code === '200001' || responseData.code === '200200' || 
           responseData.code === '200401' || responseData.code === '200402' || responseData.code === '200403' || 
           responseData.code === '200501') && responseData.data) {
        console.log('✅ สลิปถูกต้อง! Response Code:', responseData.code);
        
        // ตรวจสอบ response codes ที่มีเงื่อนไขไม่ตรง
        if (responseData.code === '200401') {
          console.warn('⚠️ บัญชีผู้รับไม่ถูกต้อง!');
          return {
            success: false,
            error: 'บัญชีผู้รับไม่ถูกต้อง - กรุณาตรวจสอบบัญชีผู้รับ'
          };
        }
        
        if (responseData.code === '200402') {
          console.warn('⚠️ ยอดโอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'ยอดโอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบจำนวนเงิน'
          };
        }
        
        if (responseData.code === '200403') {
          console.warn('⚠️ วันที่โอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'วันที่โอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบวันที่โอน'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        console.log('✅ พบสลิป!');
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        console.log('  📅 วันที่:', responseData.data.dateTime);
        console.log('  👤 ผู้ส่ง:', responseData.data.sender?.account?.name);
        console.log('  👥 ผู้รับ:', responseData.data.receiver?.account?.name);
        console.log('  🏦 ธนาคารผู้รับ:', responseData.data.receiver?.bank?.name);
        console.log('  🔖 Reference ID:', responseData.data.referenceId);
        console.log('  🎫 Trans Ref:', responseData.data.transRef);
        
        return {
          success: true,
          data: {
            referenceId: responseData.data.referenceId || '',
            decode: responseData.data.decode || '',
            transRef: responseData.data.transRef || '',
            dateTime: responseData.data.dateTime || '',
            verifyDate: responseData.data.verifyDate,
            amount: responseData.data.amount || 0,
            ref1: responseData.data.ref1,
            ref2: responseData.data.ref2,
            ref3: responseData.data.ref3,
            receiver: {
              account: {
                name: responseData.data.receiver?.account?.name || '',
                bank: {
                  account: responseData.data.receiver?.account?.bank?.account
                },
                proxy: responseData.data.receiver?.account?.proxy
              },
              bank: {
                id: responseData.data.receiver?.bank?.id || '',
                name: responseData.data.receiver?.bank?.name
              }
            },
            sender: {
              account: {
                name: responseData.data.sender?.account?.name || '',
                bank: {
                  account: responseData.data.sender?.account?.bank?.account || ''
                }
              },
              bank: {
                id: responseData.data.sender?.bank?.id || '',
                name: responseData.data.sender?.bank?.name || ''
              }
            }
          }
        };
      } else {
        console.warn('⚠️ ไม่พบสลิปหรือสลิปไม่ถูกต้อง:', responseData.message);
        console.warn('⚠️ Response Code:', responseData.code);
        console.warn('⚠️ Response Data:', responseData.data);
        
        // ตรวจสอบ response codes ที่มีข้อมูลจำกัด
        if (responseData.code === '200404') {
          console.warn('⚠️ ไม่พบสลิปในระบบธนาคาร!');
          return {
            success: false,
            error: 'ไม่พบสลิปในระบบธนาคาร - กรุณาตรวจสอบสลิปอีกครั้ง'
          };
        }
        
        if (responseData.code === '200500') {
          console.warn('⚠️ สลิปเสีย/สลิปปลอม!');
          return {
            success: false,
            error: 'สลิปเสีย/สลิปปลอม - กรุณาใช้สลิปที่ถูกต้อง'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถตรวจสอบสลิปได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go Image verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ตรวจสอบสลิปผ่าน Base64 Image
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/verify-slip/qr-base64/info
   * Content-Type: application/json
   * 
   * @param base64Image - รูปภาพสลิปในรูปแบบ Base64
   * @param checkCondition - เงื่อนไขในการตรวจสอบ (จำนวนเงิน, บัญชี, วันที่, สลิปซ้ำ)
   * @returns Promise<SlipVerificationResult> - ผลลัพธ์การตรวจสอบพร้อมข้อมูลสลิป
   */
  async verifySlipByBase64(base64Image: string, checkCondition?: CheckCondition): Promise<SlipVerificationResult> {
    try {
      console.log('🔍 กำลังตรวจสอบสลิปด้วย Base64...');
      console.log('📊 Base64 Length:', base64Image.length, 'characters');
      console.log('📊 Check Condition:', checkCondition);
      
      const baseUrl = this.getCleanApiUrl();
      const requestBody = {
        payload: {
          base64: base64Image,
          ...(checkCondition && { checkCondition })
        }
      };
      
      console.log('📤 Request:', {
        url: `${baseUrl}/api/verify-slip/qr-base64/info`,
        body: requestBody
      });
      
      const response = await fetch(`${baseUrl}/api/verify-slip/qr-base64/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response codes ที่มีข้อมูลเหมือน Slip Found (200000)
      // 200000 = Slip Found
      // 200001 = Get Info Success (เฉพาะ /api/account/info)
      // 200200 = Slip is Valid
      // 200401 = Recipient Account Not Match
      // 200402 = Transfer Amount Not Match
      // 200403 = Transfer Date Not Match
      // 200501 = Slip is Duplicated
      if ((responseData.code === '200000' || responseData.code === '200001' || responseData.code === '200200' || 
           responseData.code === '200401' || responseData.code === '200402' || responseData.code === '200403' || 
           responseData.code === '200501') && responseData.data) {
        console.log('✅ สลิปถูกต้อง! Response Code:', responseData.code);
        
        // ตรวจสอบ response codes ที่มีเงื่อนไขไม่ตรง
        if (responseData.code === '200401') {
          console.warn('⚠️ บัญชีผู้รับไม่ถูกต้อง!');
          return {
            success: false,
            error: 'บัญชีผู้รับไม่ถูกต้อง - กรุณาตรวจสอบบัญชีผู้รับ'
          };
        }
        
        if (responseData.code === '200402') {
          console.warn('⚠️ ยอดโอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'ยอดโอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบจำนวนเงิน'
          };
        }
        
        if (responseData.code === '200403') {
          console.warn('⚠️ วันที่โอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'วันที่โอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบวันที่โอน'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        console.log('✅ พบสลิป!');
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        console.log('  📅 วันที่:', responseData.data.dateTime);
        console.log('  👤 ผู้ส่ง:', responseData.data.sender?.account?.name);
        console.log('  👥 ผู้รับ:', responseData.data.receiver?.account?.name);
        console.log('  🏦 ธนาคารผู้รับ:', responseData.data.receiver?.bank?.name);
        console.log('  🔖 Reference ID:', responseData.data.referenceId);
        console.log('  🎫 Trans Ref:', responseData.data.transRef);
        
        return {
          success: true,
          data: {
            referenceId: responseData.data.referenceId || '',
            decode: responseData.data.decode || '',
            transRef: responseData.data.transRef || '',
            dateTime: responseData.data.dateTime || '',
            verifyDate: responseData.data.verifyDate,
            amount: responseData.data.amount || 0,
            ref1: responseData.data.ref1,
            ref2: responseData.data.ref2,
            ref3: responseData.data.ref3,
            receiver: {
              account: {
                name: responseData.data.receiver?.account?.name || '',
                bank: {
                  account: responseData.data.receiver?.account?.bank?.account
                },
                proxy: responseData.data.receiver?.account?.proxy
              },
              bank: {
                id: responseData.data.receiver?.bank?.id || '',
                name: responseData.data.receiver?.bank?.name
              }
            },
            sender: {
              account: {
                name: responseData.data.sender?.account?.name || '',
                bank: {
                  account: responseData.data.sender?.account?.bank?.account || ''
                }
              },
              bank: {
                id: responseData.data.sender?.bank?.id || '',
                name: responseData.data.sender?.bank?.name || ''
              }
            }
          }
        };
      } else {
        console.warn('⚠️ ไม่พบสลิปหรือสลิปไม่ถูกต้อง:', responseData.message);
        console.warn('⚠️ Response Code:', responseData.code);
        console.warn('⚠️ Response Data:', responseData.data);
        
        // ตรวจสอบ response codes ที่มีข้อมูลจำกัด
        if (responseData.code === '200404') {
          console.warn('⚠️ ไม่พบสลิปในระบบธนาคาร!');
          return {
            success: false,
            error: 'ไม่พบสลิปในระบบธนาคาร - กรุณาตรวจสอบสลิปอีกครั้ง'
          };
        }
        
        if (responseData.code === '200500') {
          console.warn('⚠️ สลิปเสีย/สลิปปลอม!');
          return {
            success: false,
            error: 'สลิปเสีย/สลิปปลอม - กรุณาใช้สลิปที่ถูกต้อง'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถตรวจสอบสลิปได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go Base64 verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ตรวจสอบสลิปผ่าน Image URL
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/verify-slip/qr-image-link/info
   * Content-Type: application/json
   * 
   * @param imageUrl - URL ของรูปภาพสลิป
   * @param checkCondition - เงื่อนไขในการตรวจสอบ (จำนวนเงิน, บัญชี, วันที่, สลิปซ้ำ)
   * @returns Promise<SlipVerificationResult> - ผลลัพธ์การตรวจสอบพร้อมข้อมูลสลิป
   */
  async verifySlipByUrl(imageUrl: string, checkCondition?: CheckCondition): Promise<SlipVerificationResult> {
    try {
      console.log('🔍 กำลังตรวจสอบสลิปด้วย URL...');
      console.log('🔗 Image URL:', imageUrl);
      console.log('📊 Check Condition:', checkCondition);
      
      const baseUrl = this.getCleanApiUrl();
      const requestBody = {
        payload: {
          imageUrl: imageUrl,
          ...(checkCondition && { checkCondition })
        }
      };
      
      console.log('📤 Request:', {
        url: `${baseUrl}/api/verify-slip/qr-image-link/info`,
        body: requestBody
      });
      
      const response = await fetch(`${baseUrl}/api/verify-slip/qr-image-link/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response codes ที่มีข้อมูลเหมือน Slip Found (200000)
      // 200000 = Slip Found
      // 200001 = Get Info Success (เฉพาะ /api/account/info)
      // 200200 = Slip is Valid
      // 200401 = Recipient Account Not Match
      // 200402 = Transfer Amount Not Match
      // 200403 = Transfer Date Not Match
      // 200501 = Slip is Duplicated
      if ((responseData.code === '200000' || responseData.code === '200001' || responseData.code === '200200' || 
           responseData.code === '200401' || responseData.code === '200402' || responseData.code === '200403' || 
           responseData.code === '200501') && responseData.data) {
        console.log('✅ สลิปถูกต้อง! Response Code:', responseData.code);
        
        // ตรวจสอบ response codes ที่มีเงื่อนไขไม่ตรง
        if (responseData.code === '200401') {
          console.warn('⚠️ บัญชีผู้รับไม่ถูกต้อง!');
          return {
            success: false,
            error: 'บัญชีผู้รับไม่ถูกต้อง - กรุณาตรวจสอบบัญชีผู้รับ'
          };
        }
        
        if (responseData.code === '200402') {
          console.warn('⚠️ ยอดโอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'ยอดโอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบจำนวนเงิน'
          };
        }
        
        if (responseData.code === '200403') {
          console.warn('⚠️ วันที่โอนไม่ตรงเงื่อนไข!');
          return {
            success: false,
            error: 'วันที่โอนไม่ตรงเงื่อนไข - กรุณาตรวจสอบวันที่โอน'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        console.log('✅ พบสลิป!');
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        console.log('  📅 วันที่:', responseData.data.dateTime);
        console.log('  👤 ผู้ส่ง:', responseData.data.sender?.account?.name);
        console.log('  👥 ผู้รับ:', responseData.data.receiver?.account?.name);
        console.log('  🏦 ธนาคารผู้รับ:', responseData.data.receiver?.bank?.name);
        console.log('  🔖 Reference ID:', responseData.data.referenceId);
        console.log('  🎫 Trans Ref:', responseData.data.transRef);
        
        return {
          success: true,
          data: {
            referenceId: responseData.data.referenceId || '',
            decode: responseData.data.decode || '',
            transRef: responseData.data.transRef || '',
            dateTime: responseData.data.dateTime || '',
            verifyDate: responseData.data.verifyDate,
            amount: responseData.data.amount || 0,
            ref1: responseData.data.ref1,
            ref2: responseData.data.ref2,
            ref3: responseData.data.ref3,
            receiver: {
              account: {
                name: responseData.data.receiver?.account?.name || '',
                bank: {
                  account: responseData.data.receiver?.account?.bank?.account
                },
                proxy: responseData.data.receiver?.account?.proxy
              },
              bank: {
                id: responseData.data.receiver?.bank?.id || '',
                name: responseData.data.receiver?.bank?.name
              }
            },
            sender: {
              account: {
                name: responseData.data.sender?.account?.name || '',
                bank: {
                  account: responseData.data.sender?.account?.bank?.account || ''
                }
              },
              bank: {
                id: responseData.data.sender?.bank?.id || '',
                name: responseData.data.sender?.bank?.name || ''
              }
            }
          }
        };
      } else {
        console.warn('⚠️ ไม่พบสลิปหรือสลิปไม่ถูกต้อง:', responseData.message);
        console.warn('⚠️ Response Code:', responseData.code);
        console.warn('⚠️ Response Data:', responseData.data);
        
        // ตรวจสอบ response codes ที่มีข้อมูลจำกัด
        if (responseData.code === '200404') {
          console.warn('⚠️ ไม่พบสลิปในระบบธนาคาร!');
          return {
            success: false,
            error: 'ไม่พบสลิปในระบบธนาคาร - กรุณาตรวจสอบสลิปอีกครั้ง'
          };
        }
        
        if (responseData.code === '200500') {
          console.warn('⚠️ สลิปเสีย/สลิปปลอม!');
          return {
            success: false,
            error: 'สลิปเสีย/สลิปปลอม - กรุณาใช้สลิปที่ถูกต้อง'
          };
        }
        
        if (responseData.code === '200501') {
          console.warn('⚠️ สลิปซ้ำ!');
          return {
            success: false,
            error: 'duplicate - สลิปนี้เคยถูกตรวจสอบแล้ว'
          };
        }
        
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถตรวจสอบสลิปได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go URL verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * สร้างรหัส QR PromptPay
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/qr-payment/generate-qr-code
   * Content-Type: application/json
   * Response Code: "200" = "Success"
   * 
   * @param amount - จำนวนเงินที่ต้องการสร้าง QR Code
   * @param accountName - ชื่อบัญชีผู้รับ (optional)
   * @returns Promise<QRCodeGenerateResult> - ผลลัพธ์การสร้าง QR Code
   */
  async generateQRCode(amount: number, accountName?: string): Promise<QRCodeGenerateResult> {
    try {
      console.log('🎯 กำลังสร้างรหัส QR PromptPay...');
      console.log('💰 จำนวนเงิน:', amount);
      console.log('👤 ชื่อบัญชี:', accountName || 'Game Nexus');
      
      const baseUrl = this.getCleanApiUrl();
      const requestBody = {
        amount: amount.toString(),
        accountName: accountName || 'Game Nexus'
      };
      
      console.log('📤 Request:', {
        url: `${baseUrl}/api/qr-payment/generate-qr-code`,
        body: requestBody
      });
      
      const response = await fetch(`${baseUrl}/api/qr-payment/generate-qr-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response code "200" = "Success"
      if (responseData.code === '200' && responseData.data?.qrCode) {
        console.log('✅ สร้าง QR Code สำเร็จ!');
        console.log('  🔖 QR Code:', responseData.data.qrCode);
        console.log('  👤 ชื่อบัญชี:', responseData.data.accountName);
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        
        return {
          success: true,
          data: {
            qrCode: responseData.data.qrCode,
            accountName: responseData.data.accountName || '',
            amount: responseData.data.amount || ''
          }
        };
      } else {
        console.warn('⚠️ ไม่สามารถสร้าง QR Code:', responseData.message);
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถสร้าง QR Code ได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go QR Code generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * สร้าง QR Image Link
   * 
   * API Endpoint: POST https://connect.slip2go.com/api/qr-payment/generate-qr-image-link
   * Content-Type: application/json
   * Response Code: "200" = "Success"
   * 
   * @param amount - จำนวนเงินที่ต้องการสร้าง QR Code
   * @param accountName - ชื่อบัญชีผู้รับ (optional)
   * @returns Promise<QRImageLinkResult> - ผลลัพธ์การสร้าง QR Image Link
   */
  async generateQRImageLink(amount: number, accountName?: string): Promise<QRImageLinkResult> {
    try {
      console.log('🎯 กำลังสร้าง QR Image Link...');
      console.log('💰 จำนวนเงิน:', amount);
      console.log('👤 ชื่อบัญชี:', accountName || 'Game Nexus');
      
      const baseUrl = this.getCleanApiUrl();
      const requestBody = {
        amount: amount.toString(),
        accountName: accountName || 'Game Nexus'
      };
      
      console.log('📤 Request:', {
        url: `${baseUrl}/api/qr-payment/generate-qr-image-link`,
        body: requestBody
      });
      
      const response = await fetch(`${baseUrl}/api/qr-payment/generate-qr-image-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      console.log('📥 Response:', {
        code: responseData.code,
        message: responseData.message,
        data: responseData.data
      });
      
      console.log('🔍 Response Code Check:', {
        is200000: responseData.code === '200000', // Slip Found
        is200001: responseData.code === '200001', // Get Info Success
        is200200: responseData.code === '200200', // Slip is Valid
        is200401: responseData.code === '200401', // Recipient Account Not Match
        is200402: responseData.code === '200402', // Transfer Amount Not Match
        is200403: responseData.code === '200403', // Transfer Date Not Match
        is200404: responseData.code === '200404', // Slip Not Found
        is200500: responseData.code === '200500', // Slip is Fraud
        is200501: responseData.code === '200501', // Slip is Duplicated
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : 'No data'
      });
      
      // Response code "200" = "Success"
      if (responseData.code === '200' && responseData.data?.qrImageLink) {
        console.log('✅ สร้าง QR Image Link สำเร็จ!');
        console.log('  🔗 Image Link:', responseData.data.qrImageLink);
        console.log('  👤 ชื่อบัญชี:', responseData.data.accountName);
        console.log('  💰 จำนวนเงิน:', responseData.data.amount);
        
        return {
          success: true,
          data: {
            qrImageLink: responseData.data.qrImageLink,
            accountName: responseData.data.accountName || '',
            amount: responseData.data.amount || ''
          }
        };
      } else {
        console.warn('⚠️ ไม่สามารถสร้าง QR Image Link:', responseData.message);
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถสร้าง QR Image Link ได้'
        };
      }
    } catch (error) {
      console.error('❌ Slip2Go QR Image Link generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ตรวจสอบสลิปด้วย referenceId
   */
  async verifySlipByReferenceId(referenceId: string): Promise<SlipVerificationResult> {
    try {
      const baseUrl = this.getCleanApiUrl();
      const response = await fetch(`${baseUrl}/api/verify-slip/${referenceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      if (responseData.code === '200001' && responseData.data) {
        return {
          success: true,
          data: {
            referenceId: responseData.data.referenceId || '',
            decode: responseData.data.decode || '',
            transRef: responseData.data.transRef || '',
            dateTime: responseData.data.dateTime || '',
            verifyDate: responseData.data.verifyDate,
            amount: responseData.data.amount || 0,
            ref1: responseData.data.ref1,
            ref2: responseData.data.ref2,
            ref3: responseData.data.ref3,
            receiver: {
              account: {
                name: responseData.data.receiver?.account?.name || '',
                bank: {
                  account: responseData.data.receiver?.account?.bank?.account
                },
                proxy: responseData.data.receiver?.account?.proxy
              },
              bank: {
                id: responseData.data.receiver?.bank?.id || '',
                name: responseData.data.receiver?.bank?.name
              }
            },
            sender: {
              account: {
                name: responseData.data.sender?.account?.name || '',
                bank: {
                  account: responseData.data.sender?.account?.bank?.account || ''
                }
              },
              bank: {
                id: responseData.data.sender?.bank?.id || '',
                name: responseData.data.sender?.bank?.name || ''
              }
            }
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถตรวจสอบสลิปได้'
        };
      }
    } catch (error) {
      console.error('Slip2Go Reference ID verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ตรวจสอบข้อมูลบัญชี
   */
  async getAccountInfo(): Promise<AccountInfoResult> {
    try {
      const baseUrl = this.getCleanApiUrl();
      const response = await fetch(`${baseUrl}/api/account/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: Slip2GoResponse = await response.json();
      
      if (responseData.data) {
        return {
          success: true,
          data: {
            shopName: responseData.data.shopName || '',
            package: responseData.data.package || '',
            packageExpiredDate: responseData.data.packageExpiredDate || '',
            quotaLimit: responseData.data.quotaLimit || 0,
            quotaRemaining: responseData.data.quotaRemaining || 0,
            creditRemaining: responseData.data.creditRemaining || 0,
            autoRenewalPackage: responseData.data.autoRenewalPackage || false,
            checkSlipByCredit: responseData.data.checkSlipByCredit || false,
            quotaQrLimit: responseData.data.quotaQrLimit || 0,
            quotaQrRemaining: responseData.data.quotaQrRemaining || 0
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'ไม่สามารถดึงข้อมูลบัญชีได้'
        };
      }
    } catch (error) {
      console.error('Slip2Go Account info error:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะ API
   */
  async checkAPIStatus(): Promise<boolean> {
    try {
      const baseUrl = this.getCleanApiUrl();
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Slip2Go API status check error:', error);
      return false;
    }
  }
}

// Configuration
const SLIP2GO_CONFIG: Slip2GoConfig = {
  apiUrl: import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com',
  secretKey: import.meta.env.VITE_SLIP2GO_SECRET_KEY || ''
};

// Create API instance
export const slip2GoAPI = new Slip2GoAPI(SLIP2GO_CONFIG);

// Utility functions
export const verifySlipByQRCode = (qrCode: string, checkCondition?: CheckCondition) => {
  return slip2GoAPI.verifySlipByQRCode(qrCode, checkCondition);
};

export const verifySlipByImage = (imageFile: File, checkCondition?: CheckCondition) => {
  return slip2GoAPI.verifySlipByImage(imageFile, checkCondition);
};

export const verifySlipByBase64 = (base64Image: string, checkCondition?: CheckCondition) => {
  return slip2GoAPI.verifySlipByBase64(base64Image, checkCondition);
};

export const verifySlipByUrl = (imageUrl: string, checkCondition?: CheckCondition) => {
  return slip2GoAPI.verifySlipByUrl(imageUrl, checkCondition);
};

export const getSlip2GoAccountInfo = () => {
  return slip2GoAPI.getAccountInfo();
};

export const checkSlip2GoAPIStatus = () => {
  return slip2GoAPI.checkAPIStatus();
};

export const generateQRCode = (amount: number, accountName?: string) => {
  return slip2GoAPI.generateQRCode(amount, accountName);
};

export const generateQRImageLink = (amount: number, accountName?: string) => {
  return slip2GoAPI.generateQRImageLink(amount, accountName);
};

export const verifySlipByReferenceId = (referenceId: string) => {
  return slip2GoAPI.verifySlipByReferenceId(referenceId);
};

// Helper function to format QR Code data
export const formatQRCodeData = (qrCode: string): string => {
  // Remove any whitespace and ensure proper format
  return qrCode.trim().replace(/\s/g, '');
};

// Helper function to validate QR Code format
export const isValidQRCode = (qrCode: string): boolean => {
  // Basic validation for Thai QR Code format
  const thaiQRPattern = /^[0-9]{15,}$/;
  return thaiQRPattern.test(qrCode);
};

// Helper function to format amount
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
};

// Helper function to convert file to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper function to convert Base64 to File
export const base64ToFile = (base64: string, filename: string, mimeType: string = 'image/png'): File => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
};

// Helper function to validate image URL
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    return validProtocols.includes(urlObj.protocol) && 
           validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
};

// Helper function to get image URL from file
export const getImageUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Helper function to revoke image URL
export const revokeImageUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return dateString;
  }
};

// Helper functions for creating check conditions
export const createCheckCondition = (options: {
  checkDuplicate?: boolean;
  checkReceiver?: CheckReceiver[];
  checkAmount?: CheckAmount;
  checkDate?: CheckDate;
}): CheckCondition => {
  return {
    checkDuplicate: options.checkDuplicate,
    checkReceiver: options.checkReceiver,
    checkAmount: options.checkAmount,
    checkDate: options.checkDate
  };
};

export const createCheckReceiver = (options: {
  accountType?: string;
  accountNumber?: string;
  accountNameTH?: string;
  accountNameEN?: string;
}): CheckReceiver => {
  return {
    accountType: options.accountType,
    accountNumber: options.accountNumber,
    accountNameTH: options.accountNameTH,
    accountNameEN: options.accountNameEN
  };
};

export const createCheckAmount = (type: 'eq' | 'gte' | 'lte', amount: number): CheckAmount => {
  return { type, amount };
};

export const createCheckDate = (type: 'eq' | 'gte' | 'lte', date: string): CheckDate => {
  return { type, date };
};

// Account type constants
export const ACCOUNT_TYPES = {
  KASIKORN_BANK: '01004',
  PROMPTPAY_PHONE: '02001',
  MERCHANT: '03000',
  TRUEMONEY_WALLET: '04000',
  SCB_BANK: '01001',
  KBANK: '01002',
  BBL_BANK: '01003',
  TMB_BANK: '01005',
  UOB_BANK: '01006',
  CITIBANK: '01007',
  HSBC_BANK: '01008',
  DEUTSCHE_BANK: '01009',
  STANDARD_CHARTERED: '01010',
  BANK_OF_AMERICA: '01011',
  BNP_PARIBAS: '01012',
  SUMITOMO_MITSUI: '01013',
  MIZUHO_BANK: '01014',
  BANK_OF_CHINA: '01015',
  ICBC: '01016',
  CHINA_CONSTRUCTION_BANK: '01017',
  AGRICULTURAL_BANK_OF_CHINA: '01018',
  BANK_OF_COMMUNICATIONS: '01019',
  INDUSTRIAL_AND_COMMERCIAL_BANK: '01020'
} as const;

// Common check condition presets
export const CHECK_CONDITION_PRESETS = {
  // ตรวจสอบสลิปซ้ำ
  checkDuplicate: (): CheckCondition => createCheckCondition({ checkDuplicate: true }),
  
  // ตรวจสอบบัญชีธนาคารกสิกรไทย
  checkKasikornAccount: (accountNumber: string): CheckCondition => 
    createCheckCondition({
      checkReceiver: [createCheckReceiver({ accountType: ACCOUNT_TYPES.KASIKORN_BANK, accountNumber })]
    }),
  
  // ตรวจสอบ PromptPay เบอร์โทรศัพท์
  checkPromptPayPhone: (phoneNumber: string): CheckCondition =>
    createCheckCondition({
      checkReceiver: [createCheckReceiver({ accountType: ACCOUNT_TYPES.PROMPTPAY_PHONE, accountNumber: phoneNumber })]
    }),
  
  // ตรวจสอบ TrueMoney Wallet
  checkTrueMoneyWallet: (walletId: string): CheckCondition =>
    createCheckCondition({
      checkReceiver: [createCheckReceiver({ accountType: ACCOUNT_TYPES.TRUEMONEY_WALLET, accountNumber: walletId })]
    }),
  
  // ตรวจสอบยอดเงิน
  checkExactAmount: (amount: number): CheckCondition =>
    createCheckCondition({
      checkAmount: createCheckAmount('eq', amount)
    }),
  
  // ตรวจสอบยอดเงินขั้นต่ำ
  checkMinimumAmount: (amount: number): CheckCondition =>
    createCheckCondition({
      checkAmount: createCheckAmount('gte', amount)
    }),
  
  // ตรวจสอบยอดเงินสูงสุด
  checkMaximumAmount: (amount: number): CheckCondition =>
    createCheckCondition({
      checkAmount: createCheckAmount('lte', amount)
    }),
  
  // ตรวจสอบวันที่
  checkExactDate: (date: string): CheckCondition =>
    createCheckCondition({
      checkDate: createCheckDate('eq', date)
    }),
  
  // ตรวจสอบวันที่ไม่เกิน
  checkDateNotAfter: (date: string): CheckCondition =>
    createCheckCondition({
      checkDate: createCheckDate('lte', date)
    }),
  
  // ตรวจสอบวันที่ไม่ก่อน
  checkDateNotBefore: (date: string): CheckCondition =>
    createCheckCondition({
      checkDate: createCheckDate('gte', date)
    })
} as const;

/**
 * สร้าง QR Code PromptPay (Base64 Image)
 * ใช้เมื่อต้องการ Base64 แทน URL
 */
export async function generatePromptPayQRCode(data: {
  promptPayCode: string;
  promptPayType: 'phone_number' | 'citizen_id' | 'e_wallet';
  accountName: string;
  amount: string;
}): Promise<{
  success: boolean;
  qrCode?: string;
  data?: any;
  error?: string;
}> {
  try {
    console.log('🎯 สร้าง QR Code PromptPay (Base64)...', data);

    const apiUrl = import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com';
    const secretKey = import.meta.env.VITE_SLIP2GO_SECRET_KEY;

    if (!secretKey) {
      throw new Error('ไม่พบ Secret Key');
    }

    // Clean API URL - remove any path after the domain
    const baseUrl = apiUrl.replace(/\/api.*$/, '');

    const response = await fetch(
      `${baseUrl}/api/qr-payment/generate-qr-code`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `API Error: ${response.status}`
      );
    }

    const result = await response.json();

    console.log('✅ สร้าง QR Code สำเร็จ');

    return {
      success: true,
      qrCode: result.data?.qrCode || result.qrCode,
      data: result.data || result
    };
  } catch (error: any) {
    console.error('❌ Error creating QR Code:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถสร้าง QR Code ได้'
    };
  }
}

/**
 * สร้าง URL รูป QR Code PromptPay
 * แตกต่างจาก generatePromptPayQRCode ที่ส่งคืน URL แทน Base64
 */
export async function generatePromptPayQRImageLink(data: {
  promptPayCode: string;
  promptPayType: 'phone_number' | 'citizen_id' | 'e_wallet';
  accountName: string;
  amount: string;
}): Promise<{
  success: boolean;
  qrImageUrl?: string;
  data?: any;
  error?: string;
}> {
  try {
    console.log('🎯 สร้าง URL QR Code PromptPay...', data);

    const apiUrl = import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com';
    const secretKey = import.meta.env.VITE_SLIP2GO_SECRET_KEY;

    if (!secretKey) {
      throw new Error('ไม่พบ Secret Key');
    }

    // Clean API URL - remove any path after the domain
    const baseUrl = apiUrl.replace(/\/api.*$/, '');

    const response = await fetch(
      `${baseUrl}/api/qr-payment/generate-qr-image-link`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `API Error: ${response.status}`
      );
    }

    const result = await response.json();

    console.log('✅ สร้าง URL QR Code สำเร็จ');

    return {
      success: true,
      qrImageUrl: result.data?.qrImageUrl || result.qrImageUrl || result.data?.imageUrl,
      data: result.data || result
    };
  } catch (error: any) {
    console.error('❌ Error creating QR Image Link:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถสร้าง URL QR Code ได้'
    };
  }
}

/**
 * Interface สำหรับข้อมูลสลิปที่ดึงจาก Slip2Go API
 */
export interface SlipInfoResponse {
  code: string;
  message: string;
  data?: {
    referenceId: string;
    decode: string;
    transRef: string;
    dateTime: string;
    verifyDate?: string;
    amount: number;
    ref1?: string | null;
    ref2?: string | null;
    ref3?: string | null;
    receiver: {
      account: {
        name: string;
        bank: {
          account?: string | null;
        };
        proxy?: {
          type?: string | null; // "NATID" | "MSISDN" | "EWALLETID" | "EMAIL" | "BILLERID"
          account?: string | null;
        } | null;
      };
      bank: {
        id: string;
        name?: string | null;
      };
    };
    sender: {
      account: {
        name: string;
        bank: {
          account: string;
        };
      };
      bank: {
        id: string;
        name: string;
      };
    };
  };
}

/**
 * ดึงข้อมูลสลิปเก่าจาก Reference ID
 * ใช้สำหรับตรวจสอบสลิปที่เคยยืนยันแล้ว
 * 
 * @param referenceId - รหัสอ้างอิงสลิปที่ได้จากการตรวจสอบครั้งแรก
 * @returns Promise พร้อมข้อมูลสลิปแบบละเอียด
 */
export async function getSlipByReferenceId(referenceId: string): Promise<{
  success: boolean;
  data?: SlipInfoResponse['data'];
  code?: string;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🔍 ดึงข้อมูลสลิปเก่า Reference ID:', referenceId);

    const apiUrl = import.meta.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com';
    const secretKey = import.meta.env.VITE_SLIP2GO_SECRET_KEY;

    if (!secretKey) {
      throw new Error('ไม่พบ Secret Key');
    }

    // Clean API URL - remove any path after the domain
    const baseUrl = apiUrl.replace(/\/api.*$/, '');

    const response = await fetch(
      `${baseUrl}/api/verify-slip/${referenceId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status}`
      );
    }

    const result: SlipInfoResponse = await response.json();

    console.log('✅ ดึงข้อมูลสลิปสำเร็จ');
    console.log('📊 Code:', result.code);
    console.log('💬 Message:', result.message);
    
    if (result.data) {
      console.log('📝 รายละเอียดสลิป:');
      console.log('  💰 จำนวนเงิน:', result.data.amount);
      console.log('  📅 วันที่โอน:', result.data.dateTime);
      console.log('  👤 ผู้ส่ง:', result.data.sender.account.name);
      console.log('  🏦 ธนาคารผู้ส่ง:', result.data.sender.bank.name);
      console.log('  👥 ผู้รับ:', result.data.receiver.account.name);
      console.log('  🏦 ธนาคารผู้รับ:', result.data.receiver.bank.name || result.data.receiver.bank.id);
      console.log('  🔖 Reference ID:', result.data.referenceId);
      console.log('  🎫 Trans Ref:', result.data.transRef);
    }

    return {
      success: true,
      data: result.data,
      code: result.code,
      message: result.message
    };
  } catch (error: any) {
    console.error('❌ Error getting slip by reference ID:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถดึงข้อมูลสลิปได้'
    };
  }
}

export default Slip2GoAPI;
