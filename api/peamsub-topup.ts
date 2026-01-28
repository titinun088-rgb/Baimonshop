 import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { withRateLimit, validateOrigin, validateRequestSize, getClientIP } from './_middleware.js';

/**
 * Peamsub Top-up Proxy
 * Hides PEAMSUB_API_KEY from client-side
 * Protected with rate limiting and validation
 * CRITICAL: This endpoint can charge money - extra security required!
 */
async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers - strict for payment endpoint
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

  // CRITICAL: Extra security for payment endpoint
  if (!validateRequestSize(req, 200)) {
    console.warn(`⚠️ Request too large from IP: ${getClientIP(req)}`);
    return res.status(413).json({ success: false, error: 'Request too large' });
  }

  if (!validateOrigin(req)) {
    console.error(`🚨 SECURITY: Invalid origin attempting topup from IP: ${getClientIP(req)}`);
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
  }

  try {
    const { productId, productData } = req.body;

    if (!productId || !productData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, productData'
      });
    }

    // Log for security monitoring
    console.log(`🔐 Topup request from IP: ${getClientIP(req)}`, { productId });

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
    // Call Peamsub API with Basic Auth
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;

    // Configure Proxy Agent (Fixie)
    const proxyUrl = process.env.FIXIE_URL;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

    if (proxyUrl) {
      console.log(`ipv4 outbound proxy active: ${proxyUrl.split('@')[1] || 'configured'}`);
    }

    const response = await fetch('https://api.peamsub24hr.com/v2/app-premium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        product_id: productId,
        product_data: productData
      }),
      agent
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Peamsub API Error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Top-up order failed',
        details: data
      });
    }

    // Check response status
    if (!data.status) {
      return res.status(400).json({
        success: false,
        error: data.message || 'Order rejected by Peamsub',
        details: data
      });
    }

    // Return sanitized response
    return res.status(200).json({
      success: true,
      data: {
        order_id: data.data?.order_id,
        status: data.data?.status,
        message: data.message
      }
    });

  } catch (error) {
    console.error('❌ Peamsub Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Export with STRICT rate limiting (payment endpoint)
export default withRateLimit(handler);
