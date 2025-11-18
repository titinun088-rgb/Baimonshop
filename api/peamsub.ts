import type { VercelRequest, VercelResponse } from '@vercel/node';

// API key จะอยู่ใน server-side เท่านั้น (ไม่ถูก expose)
const PEAMSUB_API_KEY = process.env.PEAMSUB_API_KEY || '';
const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, method = 'GET', body } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // ตรวจสอบว่ามี API key หรือไม่
    if (!PEAMSUB_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // เข้ารหัส API key ด้วย Base64
    const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

    // เรียก Peamsub API
    const response = await fetch(`${PEAMSUB_API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Peamsub API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

