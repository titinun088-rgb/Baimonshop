
import http from 'http';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import path from 'path';

// Manual .env loader for local development
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;

            const match = trimmedLine.match(/^([\w.-]+)\s*=\s*(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
        console.log('✅ [LocalServer] Loaded environment variables from .env');
    }
} catch (envError) {
    console.warn('⚠️ [LocalServer] Could not load .env file:', envError.message);
}

// Load config
// Load config from environment if possible
const PORT = 3001;
const PEAMSUB_API_KEY = process.env.PEAMSUB_API_KEY || 'uagoldifmlc8u1525k64ggqe';
const INDEXGAME_USERNAME = process.env.INDEXGAME_USERNAME || 'titinun088';
const INDEXGAME_PASSWORD = process.env.INDEXGAME_PASSWORD || 'titinun088';
const FIXIE_URL = process.env.FIXIE_URL || 'http://fixie:KKToygSsimaMOLE@criterium.usefixie.com:80';
const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';
const INDEXGAME_API_BASE_URL = 'https://api.indexgame.in.th';

const agent = new HttpsProxyAgent(FIXIE_URL);

// Cache for Index Game Token
let cachedIndexGameToken = null;
let indexGameTokenExpiresAt = 0;

async function getIndexGameToken() {
    // 1. Check for Manual/Static Token from .env (Bypass Cloudflare Login)
    if (process.env.INDEXGAME_STATIC_TOKEN) {
        return process.env.INDEXGAME_STATIC_TOKEN;
    }

    if (cachedIndexGameToken && Date.now() < indexGameTokenExpiresAt) {
        return cachedIndexGameToken;
    }

    console.log('🔑 [LocalServer] Logging in to Index Game API...');

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://api.indexgame.in.th/',
            'Origin': 'https://api.indexgame.in.th',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Upgrade-Insecure-Requests': '1'
        },
        body: JSON.stringify({
            username: INDEXGAME_USERNAME,
            password: INDEXGAME_PASSWORD
        })
    };

    try {
        console.log('📡 [LocalServer] Attempting Login (Direct Connect)...');
        let res = await fetch(`${INDEXGAME_API_BASE_URL}/api/v1/auth/login`, fetchOptions);
        let responseText = (await res.text()).trim();

        // Log Title if it's HTML
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) console.log(`📄 [LocalServer] Page Title: ${titleMatch[1]}`);

        if (res.status === 403 || responseText.includes('Just a moment') || responseText.includes('cloudflare')) {
            console.log('⚠️ [LocalServer] Direct access blocked. Attempting via Proxy...');
            try {
                // Wait a bit before proxy retry
                await new Promise(r => setTimeout(r, 1000));
                res = await fetch(`${INDEXGAME_API_BASE_URL}/api/v1/auth/login`, { ...fetchOptions, agent });
                responseText = (await res.text()).trim();
                console.log(`📡 [LocalServer] Proxy Status: ${res.status}`);
            } catch (pErr) {
                console.error('❌ [LocalServer] Proxy fail:', pErr.message);
            }
        }

        let data;
        try {
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                data = JSON.parse(responseText.substring(startIdx, endIdx + 1));
            } else {
                data = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.log(`📝 [LocalServer] Raw Response (first 100 chars): ${responseText.substring(0, 100)}`);
            throw new Error(`Cloudflare blocked connection (${res.status}). โปรดลองเปลี่ยน IP หรือรันบน Server จริง`);
        }

        if (data.status && data.token) {
            console.log('✅ [LocalServer] Login Success!');
            cachedIndexGameToken = data.token;
            indexGameTokenExpiresAt = Date.now() + (12 * 60 * 60 * 1000);
            return cachedIndexGameToken;
        }
        throw new Error(data.message || 'Login failed');
    } catch (err) {
        console.error('❌ [LocalServer] Login Error:', err.message);
        throw err;
    }
}

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

    // Body Parser
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const data = body ? JSON.parse(body) : {};
            const url = req.url;

            console.log(`📡 Request: ${req.method} ${url}`);

            if (url === '/api/peamsub') {
                // Generic Proxy
                const { endpoint, method = 'GET', body: apiBody } = data;

                const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

                console.log(`   Forwarding to: ${PEAMSUB_API_BASE_URL}${endpoint}`);

                const apiRes = await fetch(`${PEAMSUB_API_BASE_URL}${endpoint}`, {
                    method: method,
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: apiBody ? JSON.stringify(apiBody) : undefined,
                    agent
                });

                const responseText = await apiRes.text();
                let apiData;
                try {
                    apiData = JSON.parse(responseText);
                } catch (e) {
                    apiData = { message: responseText };
                }

                res.writeHead(apiRes.status === 407 ? 500 : apiRes.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(apiData));
                return;

            } else if (url === '/api/peamsub-check-order') {
                // Check Order Logic
                const { orderId } = data;
                const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

                const apiRes = await fetch(`${PEAMSUB_API_BASE_URL}/v2/order/check`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ order_id: orderId }),
                    agent
                });

                const apiData = await apiRes.json();

                // Mimic Vercel response structure
                if (!apiRes.ok) {
                    res.writeHead(apiRes.status === 407 ? 500 : apiRes.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: apiData.message, details: apiData }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        order_id: apiData.data?.order_id,
                        status: apiData.data?.status,
                        message: apiData.message
                    }
                }));
                return;

            } else if (url === '/api/peamsub-topup') {
                // Topup Logic
                const { productId, productData } = data;
                const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

                const apiRes = await fetch(`${PEAMSUB_API_BASE_URL}/v2/app-premium`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: productId, product_data: productData }),
                    agent
                });

                const apiData = await apiRes.json();

                if (!apiRes.ok) {
                    res.writeHead(apiRes.status === 407 ? 500 : apiRes.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: apiData.message, details: apiData }));
                    return;
                }

                if (!apiData.status) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: apiData.message || 'Order rejected', details: apiData }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        order_id: apiData.data?.order_id,
                        status: apiData.data?.status,
                        message: apiData.message
                    }
                }));
                return;

            } else if (url === '/api/indexgame') {
                const { endpoint, method = 'GET', body: apiBody } = data;

                // --- MOCK DATA FALLBACK ---
                const getMockData = () => {
                    if (endpoint === '/api/v1/games') {
                        return {
                            status: true,
                            data: [
                                { id: 101, name: 'Free Fire', image: 'https://img.indexgame.in.th/games/ff.png' },
                                { id: 102, name: 'RoV', image: 'https://img.indexgame.in.th/games/rov.png' },
                                { id: 103, name: 'Mobile Legends', image: 'https://img.indexgame.in.th/games/ml.png' },
                                { id: 104, name: 'Genshin Impact', image: 'https://img.indexgame.in.th/games/genshin.png' },
                                { id: 105, name: 'PUBG Mobile', image: 'https://img.indexgame.in.th/games/pubg.png' }
                            ]
                        };
                    }
                    if (endpoint.includes('/packs')) {
                        return {
                            status: true,
                            data: [
                                { id: 1, name: '100 Diamonds', price: 30, discount: 5 },
                                { id: 2, name: '300 Diamonds', price: 90, discount: 10 },
                                { id: 3, name: '500 Diamonds', price: 150, discount: 15 },
                                { id: 4, name: '1000 Diamonds', price: 300, discount: 20 }
                            ]
                        };
                    }
                    return { status: false, message: 'Endpoint not in mock list' };
                };
                // --------------------------

                try {
                    let token;
                    try {
                        token = await getIndexGameToken();
                    } catch (tokenErr) {
                        console.log('⚠️ [LocalServer] Token failed, using Mock Data instead.');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(getMockData()));
                        return;
                    }

                    console.log(`📡 [LocalServer] Forwarding to IndexGame: ${INDEXGAME_API_BASE_URL}${endpoint}`);
                    const fetchOptions = {
                        method: method,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Referer': 'https://api.indexgame.in.th/',
                            'Origin': 'https://api.indexgame.in.th'
                        },
                        body: apiBody ? JSON.stringify(apiBody) : undefined
                    };

                    let apiRes = await fetch(`${INDEXGAME_API_BASE_URL}${endpoint}`, fetchOptions);
                    let responseText = (await apiRes.text()).trim();

                    if (responseText.includes('Just a moment') || apiRes.status >= 400) {
                        console.log('⚠️ [LocalServer] API Blocked or Error, serving Mock Data.');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(getMockData()));
                        return;
                    }

                    console.log(`📡 [LocalServer] IndexGame Raw (200 chars): ${responseText.substring(0, 200)}`);
                    let apiData;
                    try {
                        const startIdx = responseText.indexOf('{');
                        const endIdx = responseText.lastIndexOf('}');
                        const arrayStartIdx = responseText.indexOf('[');
                        const arrayEndIdx = responseText.lastIndexOf(']');

                        let cleanedJson = responseText;
                        if (startIdx !== -1 && (arrayStartIdx === -1 || (startIdx < arrayStartIdx && startIdx !== -1))) {
                            cleanedJson = responseText.substring(startIdx, endIdx + 1);
                        } else if (arrayStartIdx !== -1) {
                            cleanedJson = responseText.substring(arrayStartIdx, arrayEndIdx + 1);
                        }
                        apiData = JSON.parse(cleanedJson);
                    } catch (pe) {
                        console.log('❌ [LocalServer] Parse fail, serving Mock Data.');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(getMockData()));
                        return;
                    }

                    res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(apiData));
                    return;
                } catch (err) {
                    console.error('❌ [LocalServer] IndexGame Proxy Error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
                return;

            } else {
                res.writeHead(404);
                res.end('Not Found');
            }

        } catch (error) {
            console.error('SERVER ERROR:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    });

});

server.listen(PORT, () => {
    console.log(`🚀 Local Backend Server running at http://localhost:${PORT}`);
    console.log(`   (Proxies requests to Peamsub via Fixie: ${FIXIE_URL.split('@')[1]})`);
});
