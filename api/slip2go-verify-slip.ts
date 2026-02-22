import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit, validateOrigin, getClientIP } from './_middleware.js';
import FormData from 'form-data';

// ==========================================
// Slip2Go Verify Slip API Proxy
// Hides SLIP2GO_SECRET_KEY from client-side
// ==========================================

interface CheckCondition {
  amount?: number;
  accountNumber?: string;
  accountName?: string;
  dateTime?: string;
  ref1?: string;
  ref2?: string;
  checkDuplicate?: boolean;
  checkReceiver?: Array<{
    accountType?: string;
    accountNumber?: string;
    accountNameTH?: string;
    accountNameEN?: string;
  }>;
  checkAmount?: {
    type?: string;
    amount?: string;
  };
  checkDate?: {
    type?: string;
    date?: string;
  };
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://baimonshop.com',
    'https://baimonshop.vercel.app',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Security: Validate origin
  if (!validateOrigin(req)) {
    console.warn(`⚠️ Invalid origin from IP: ${getClientIP(req)}`);
    res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
    return;
  }

  try {
    const { method, qrCode, imageUrl, base64Image, referenceId, checkCondition } = req.body;

    if (!method) {
      res.status(400).json({ error: 'Method is required' });
      return;
    }

    // Get Secret Key from Environment (server-side only)
    const SLIP2GO_SECRET_KEY = process.env.SLIP2GO_SECRET_KEY || process.env.VITE_SLIP2GO_SECRET_KEY;
    // ใช้ Base URL เท่านั้น (ไม่รวม /api/verify-slip)
    const SLIP2GO_BASE_URL = 'https://connect.slip2go.com';

    console.log('🔑 Environment check:', {
      hasSecretKey: !!SLIP2GO_SECRET_KEY,
      secretKeyLength: SLIP2GO_SECRET_KEY?.length,
      baseUrl: SLIP2GO_BASE_URL
    });

    if (!SLIP2GO_SECRET_KEY) {
      console.error('❌ SLIP2GO_SECRET_KEY is not configured');
      res.status(500).json({ error: 'API configuration error - Missing SLIP2GO_SECRET_KEY' });
      return;
    }

    let endpoint = '';
    let body: any = {};
    const headers: any = {
      'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };

    // Select endpoint based on method
    switch (method) {
      case 'reference-id':
        endpoint = `${SLIP2GO_BASE_URL}/api/verify-slip/reference-id/info`;
        body = {
          payload: {
            referenceId
          }
        };
        break;

      case 'qr-code':
        endpoint = `${SLIP2GO_BASE_URL}/api/verify-slip/qr-code/info`;
        body = {
          payload: {
            qrCode,
            ...(checkCondition && { checkCondition })
          }
        };
        break;

      case 'qr-image-url':
        endpoint = `${SLIP2GO_BASE_URL}/api/verify-slip/qr-image-link/info`;
        body = {
          payload: {
            imageUrl,
            ...(checkCondition && { checkCondition })
          }
        };
        break;

      case 'qr-base64':
        if (!base64Image) {
          console.error('❌ base64Image is missing');
          res.status(400).json({ error: 'base64Image is required for qr-base64 method' });
          return;
        }
        
        // แปลง base64 กลับเป็น Buffer สำหรับ FormData
        endpoint = `${SLIP2GO_BASE_URL}/api/verify-slip/qr-image/info`;
        
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const form = new FormData();
        form.append('file', imageBuffer, {
          filename: 'slip.jpg',
          contentType: 'image/jpeg'
        });
        
        if (checkCondition) {
          form.append('payload', JSON.stringify(checkCondition));
        }
        
        console.log('🔍 Verifying slip with Slip2Go...');
        console.log('📤 Endpoint:', endpoint);
        console.log('📤 Method:', method);
        console.log('📤 Image buffer size:', imageBuffer.length);
        
        // เรียก Slip2Go API ด้วย FormData (Node.js) - ใช้ body as any เพราะ TypeScript ไม่รู้จัก FormData type
        const formResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
            ...form.getHeaders()
          },
          body: form as any
        });
        
        console.log('📥 Slip2Go response status:', formResponse.status);
        
        if (!formResponse.ok) {
          const errorText = await formResponse.text();
          console.error('❌ Slip2Go API error response:', errorText);
          res.status(formResponse.status).json({
            success: false,
            error: `Slip2Go API error: ${formResponse.status}`,
            details: errorText
          });
          return;
        }
        
        const formData_response = await formResponse.json();
        console.log('✅ Slip2Go response code:', formData_response.code);
        res.status(200).json(formData_response);
        return;

      default:
        res.status(400).json({ error: 'Invalid method' });
        return;
    }

  } catch (error: any) {
    console.error('❌ Slip verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Error details:', { message: errorMessage, stack: errorStack });
    
    res.status(500).json({
      success: false,
      error: 'Slip verification failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}

export default withRateLimit(handler);
