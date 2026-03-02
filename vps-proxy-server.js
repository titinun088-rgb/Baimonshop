// VPS Proxy Server - รันบน VPS ที่ 157.85.102.141
// ติดตั้ง: npm install node-fetch
// รัน: node vps-proxy-server.js
// PM2: pm2 start vps-proxy-server.js --name "proxy"

import http from 'http';
import fetch from 'node-fetch';
import https from 'https';

const PORT = 3002;

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const url = req.url;
            console.log(`📡 [VPS-Proxy] ${req.method} ${url}`);

            // Health check
            if (url === '/' || url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', ip: req.connection.localAddress }));
                return;
            }

            // Main proxy route
            if (url === '/proxy' && req.method === 'POST') {
                const { targetUrl, method = 'GET', headers = {}, body: requestBody } = JSON.parse(body);

                if (!targetUrl) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'targetUrl is required' }));
                    return;
                }

                console.log(`   → Forwarding to: ${targetUrl}`);

                const fetchOptions = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                };

                if (requestBody && method !== 'GET') {
                    fetchOptions.body = typeof requestBody === 'string'
                        ? requestBody
                        : JSON.stringify(requestBody);
                }

                const apiRes = await fetch(targetUrl, fetchOptions);
                const responseText = await apiRes.text();

                console.log(`   ← Response: ${apiRes.status} (${responseText.length} bytes)`);

                res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
                res.end(responseText);
                return;
            }

            // 404 fallback
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found', path: url }));

        } catch (error) {
            console.error('❌ [VPS-Proxy] Error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VPS Proxy Server running on port ${PORT}`);
    console.log(`   Health check: http://157.85.102.141:${PORT}/health`);
    console.log(`   Proxy route:  POST http://157.85.102.141:${PORT}/proxy`);
});
