import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { withRateLimit, validateOrigin, validateRequestSize, getClientIP } from './_middleware.js';

/**
 * Peamsub Check Order Status Proxy
 * Hides PEAMSUB_API_KEY from client-side
 * Protected with rate limiting
 */
async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
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

  if (!validateRequestSize(req)) {
    return res.status(413).json({ success: false, error: 'Request too large' });
  }

  if (!validateOrigin(req)) {
    console.warn(`⚠️ Invalid origin from IP: ${getClientIP(req)}`);
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: orderId'
      });
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.PEAMSUB_API_KEY || process.env.VITE_PEAMSUB_API_KEY;
    if (!apiKey) {
      console.error('❌ PEAMSUB_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Call Peamsub API with Basic Auth
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;

    // --- VPS PROXY CONFIGURATION ---
    const MY_VPS_PROXY = 'http://157.85.102.141:3002/proxy';

    // Helper function to send request via Fixed IP VPS
    const fetchViaVPS = async (url: string, options: any) => {
      return fetch(MY_VPS_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          method: options.method,
          headers: options.headers,
          body: options.body
        })
      });
    };

    const response = await fetchViaVPS('https://api.peamsub24hr.com/v2/order/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('❌ Peamsub Check Order Error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Order check failed',
        details: data
      });
    }

    // Return sanitized response
    return res.status(200).json({
      success: true,
      data: {
        order_id: data.data?.order_id,
        status: data.data?.status,
        message: data.message,
        created_at: data.data?.created_at,
        updated_at: data.data?.updated_at
      }
    });

  } catch (error: any) {
    console.error('❌ Peamsub Check Order Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default withRateLimit(handler);
