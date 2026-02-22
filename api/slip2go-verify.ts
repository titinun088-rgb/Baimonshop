import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit, validateOrigin, validateRequestSize, validateAmount, getClientIP } from './_middleware.js';

/**
 * Slip2Go Verification Proxy
 * Hides SLIP2GO_SECRET_KEY from client-side
 * Protected with rate limiting and validation
 */
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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Validate request size
  if (!validateRequestSize(req, 500)) {
    console.warn(`⚠️ Request too large from IP: ${getClientIP(req)}`);
    return res.status(413).json({ success: false, error: 'Request too large' });
  }

  // Security: Validate origin (prevent CSRF)
  if (!validateOrigin(req)) {
    console.warn(`⚠️ Invalid origin from IP: ${getClientIP(req)}`);
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
  }

  try {
    const { log, amount } = req.body;

    if (!log || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: log, amount' 
      });
    }

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      console.warn(`⚠️ Invalid amount from IP: ${getClientIP(req)}`, { amount });
      return res.status(400).json({
        success: false,
        error: amountValidation.error
      });
    }

    // Get secret key from environment (server-side only)
    const secretKey = process.env.SLIP2GO_SECRET_KEY || process.env.VITE_SLIP2GO_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ SLIP2GO_SECRET_KEY not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Call Slip2Go API
    const apiUrl = process.env.SLIP2GO_API_URL || process.env.VITE_SLIP2GO_API_URL || 'https://connect.slip2go.com';
    const response = await fetch(`${apiUrl}/api/api-verify-slip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': secretKey
      },
      body: JSON.stringify({ log, amount })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Slip2Go API Error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Slip verification failed'
      });
    }

    // Return sanitized response
    return res.status(200).json({
      success: true,
      data: {
        verified: data.data?.verified || false,
        amount: data.data?.amount,
        date: data.data?.date,
        time: data.data?.time,
        sender: {
          displayName: data.data?.sender?.displayName,
          account: data.data?.sender?.account?.value
        },
        receiver: {
          displayName: data.data?.receiver?.displayName,
          account: data.data?.receiver?.account?.value
        }
      }
    });

  } catch (error) {
    console.error('❌ Slip2Go Proxy Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

// Export with rate limiting protection
export default withRateLimit(handler);
