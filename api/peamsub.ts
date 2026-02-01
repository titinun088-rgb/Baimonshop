```javascript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as https from 'https';
import * as http from 'http';
import * as tls from 'tls';

// API key จะอยู่ใน server-side เท่านั้น (ไม่ถูก expose)
const PEAMSUB_API_KEY = process.env.PEAMSUB_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, method = 'GET', body } = req.body || {};

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  if (!PEAMSUB_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // --- MANUAL PROXY TUNNELING IMPLEMENTATION ---
  try {
    const responseData = await new Promise((resolve, reject) => {
      // Proxy Config
      const proxyHost = 'criterium.usefixie.com';
      const proxyPort = 80;
      const proxyUser = 'fixie';
      const proxyPass = 'KKToygSsimaMOLE';
      const proxyAuth = 'Basic ' + Buffer.from(`${ proxyUser }:${ proxyPass } `).toString('base64');

      // Target Config
      const targetHost = 'api.peamsub24hr.com';
      const targetPort = 443;

      console.log(`[Proxy] Connecting to ${ proxyHost }:${ proxyPort } -> ${ targetHost }:${ targetPort } `);

      // 1. Establish CONNECT Tunnel
      const connectReq = http.request({
        host: proxyHost,
        port: proxyPort,
        method: 'CONNECT',
        path: `${ targetHost }:${ targetPort } `,
        headers: {
          'Proxy-Authorization': proxyAuth,
          'Host': targetHost // Some proxies require this
        }
      });

      connectReq.on('connect', (proxyRes, proxySocket, head) => {
        if (proxyRes.statusCode !== 200) {
          console.error(`[Proxy] Connect Failed: ${ proxyRes.statusCode } ${ proxyRes.statusMessage } `);
          // Read any error body from proxy
          let proxyErrorBody = '';
          proxyRes.on('data', chunk => proxyErrorBody += chunk.toString());
          proxyRes.on('end', () => {
            console.log('Proxy Error Body:', proxyErrorBody);
            reject(new Error(`Proxy Authentication Failed: ${ proxyRes.statusCode } - ${ proxyErrorBody || proxyRes.statusMessage } `));
          });
          return;
        }

        console.log('[Proxy] Tunnel Established. Starting TLS handshake...');

        // 2. Establish TLS over the proxy socket
        const tlsSocket = tls.connect({
          socket: proxySocket,
          servername: targetHost
        }, () => {
          console.log('[Proxy] TLS Handshake Success. Sending Request...');

          // 3. Send Actual API Request
          const apiReq = https.request({
            host: targetHost,
            path: endpoint,
            method: method,
            headers: {
              'Authorization': `Basic ${ Buffer.from(PEAMSUB_API_KEY).toString('base64') } `,
              'Content-Type': 'application/json'
            },
            socket: tlsSocket, // Use our tunnelled socket
            agent: false // Important! Don't use default agent
          }, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
              resolve({
                status: apiRes.statusCode || 500,
                statusText: apiRes.statusMessage,
                data: data
              });
            });
          });

          apiReq.on('error', (e) => reject(e));

          if (body) {
            apiReq.write(JSON.stringify(body));
          }
          apiReq.end();
        });

        tlsSocket.on('error', (e) => {
          console.error('[TLS] Error:', e);
          reject(e);
        });
      });

      connectReq.on('error', (e) => {
        console.error('[Proxy] Connection Error:', e);
        reject(e);
      });

      connectReq.end();
    });

    // Handle Response (same logic as before)
    const result = responseData as any;
    
    try {
      const json = JSON.parse(result.data);
      return res.status(result.status).json(json);
    } catch (e) {
      console.warn('Non-JSON response:', result.data.substring(0, Math.min(result.data.length, 200))); // Limit log length
      return res.status(result.status).json({
         statusCode: result.status,
         error: result.status >= 400 ? 'API Error' : null,
         message: result.data || `API returned status ${ result.status } `,
         data: null
      });
    }

  } catch (error: any) {
    console.error('Manual Proxy Error:', error);
    // Convert Proxy Auth error to 500 to avoid browser blocking
    const status = error.message.includes('Proxy Authentication') ? 500 : 500;
    return res.status(status).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
}
```
