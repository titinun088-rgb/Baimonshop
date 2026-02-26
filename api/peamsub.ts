import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// API key is server-side only
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

    if (!PEAMSUB_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

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

    // --- MOCK DATA FALLBACK ---
    const getMockData = () => {
      if (endpoint === '/v2/user/inquiry') {
        return { statusCode: 200, data: { username: 'MockUser', balance: '1000.00', rank: 3 } };
      }
      if (endpoint === '/v2/app-premium') {
        return {
          statusCode: 200,
          data: [
            { id: 1, name: 'Netflix Premium (Mock)', price: 150, pricevip: 140, agent_price: 145, type_app: 'Movie', stock: 10, img: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200', des: 'Mock Netflix Account' },
            { id: 2, name: 'YouTube Premium (Mock)', price: 50, pricevip: 40, agent_price: 45, type_app: 'Music', stock: 5, img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200', des: 'Mock YouTube Account' },
            { id: 3, name: 'Spotify Premium (Mock)', price: 30, pricevip: 20, agent_price: 25, type_app: 'Music', stock: 20, img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200', des: 'Mock Spotify Account' }
          ]
        };
      }
      return { statusCode: 200, data: [] };
    };
    // --------------------------

    // Call Peamsub API via VPS Proxy
    try {
      console.log(`📡 [VPS Proxy] Calling Peamsub: ${endpoint}`);
      const response = await fetchViaVPS(`${PEAMSUB_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn('Peamsub API returned non-JSON:', responseText.substring(0, 200));

        // Fallback to mock if it looks like a proxy error (Bad Gateway, etc.)
        if (response.status === 502 || response.status === 504 || response.status === 407 || responseText.includes('Bad gateway')) {
          console.log('⚠️ [Vercel] Proxy Error, falling back to mock.');
          return res.status(200).json(getMockData());
        }

        const finalStatus = response.status === 407 ? 500 : response.status;

        return res.status(finalStatus).json({
          statusCode: response.status,
          error: response.ok ? null : 'API Error',
          message: response.status === 407 ? 'Proxy Authentication Failed' : (responseText || `API returned status ${response.status}`),
          data: null
        });
      }

      // If data is returned but has no data property or is an error, check if we should mock
      if (!response.ok && (response.status >= 500 || response.status === 407)) {
        return res.status(200).json(getMockData());
      }

      const finalStatus = response.status === 407 ? 500 : response.status;
      return res.status(finalStatus).json(data);
    } catch (fetchError) {
      console.error('Fetch Error, falling back to mock:', fetchError);
      return res.status(200).json(getMockData());
    }
  } catch (error) {
    console.error('Peamsub API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
