```javascript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
    const authHeader = `Basic ${ Buffer.from(PEAMSUB_API_KEY).toString('base64') } `;

    // Configure Proxy Agent (Fixie)
    // STRATEGY: Use Port 8080 and Disable SSL Verify
    const proxyUrl = 'http://fixie:KKToygSsimaMOLE@criterium.usefixie.com:8080';
    
    let agent: any = undefined;

    try {
      console.log(`Configuring Proxy(Port 8080, NoSSL)`);
      agent = new HttpsProxyAgent({
        host: 'criterium.usefixie.com',
        port: 8080,
        auth: 'fixie:KKToygSsimaMOLE',
        rejectUnauthorized: false
      });
      
    } catch (proxyError) {
      console.error('Failed to create proxy agent:', proxyError);
    }

    // เรียก Peamsub API
    const response = await fetch(`${ PEAMSUB_API_BASE_URL }${ endpoint } `, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      agent
    });

    let data;
    const responseText = await response.text();

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.warn('Peamsub API returned non-JSON:', responseText.substring(0, Math.min(responseText.length, 200)));
      
      // CRITICAL: Cannot return 407 to browser
      const finalStatus = response.status === 407 ? 500 : response.status;
      
      return res.status(finalStatus).json({
         statusCode: response.status,
         error: response.ok ? null : 'API Error',
         message: response.status === 407 ? 'Proxy Authentication Failed' : (responseText || `API returned status ${ response.status } `),
         data: null
      });
    }

    // CRITICAL: Cannot return 407 to browser
    const finalStatus = response.status === 407 ? 500 : response.status;
    return res.status(finalStatus).json(data);
  } catch (error) {
    console.error('Peamsub API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```
