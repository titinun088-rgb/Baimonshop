
import http from 'http';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createHash } from 'crypto';
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
const INDEXGAME_API_BASE_URL = 'https://indexgame.in.th';
const WEPAY_API_URL = 'https://www.wepay.in.th/client_api.json.php';
const WEPAY_USERNAME = process.env.WEPAY_USERNAME || 'toey098994';
const WEPAY_PASSWORD = process.env.WEPAY_PASSWORD || 'Titinun088';
const WEPAY_CALLBACK_URL = process.env.WEPAY_CALLBACK_URL || 'https://www.baimonshop.com/api/wepay-callback';

// VPS Proxy - IP ถูก whitelist กับ Peamsub แล้ว
const MY_VPS_PROXY = 'http://157.85.102.141:3002/proxy';

// ส่งคำขอผ่าน VPS (IP ถูก whitelist)
const fetchViaVPS = async (targetUrl, options) => {
    return fetch(MY_VPS_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            targetUrl,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body
        })
    });
};

// md5 helper for wePAY
const md5 = (str) => createHash('md5').update(str).digest('hex');

const agent = new HttpsProxyAgent(FIXIE_URL);

// Cache for Index Game Token
let cachedIndexGameToken = null;
let indexGameTokenExpiresAt = 0;

async function getIndexGameToken() {
    // 🔥 HIGH PRIORITY: Use static token from .env to bypass Cloudflare Login 403
    if (process.env.INDEXGAME_STATIC_TOKEN) {
        console.log('🎫 [LocalServer] Using STATIC TOKEN from .env (Bypassing Login)');
        return process.env.INDEXGAME_STATIC_TOKEN;
    }

    if (cachedIndexGameToken && Date.now() < indexGameTokenExpiresAt) {
        return cachedIndexGameToken;
    }

    console.log('🔑 [LocalServer] Attempting Auto-Login to Index Game...');

    try {
        const response = await fetch(`${INDEXGAME_API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                username: INDEXGAME_USERNAME,
                password: INDEXGAME_PASSWORD
            })
        });

        const responseText = (await response.text()).trim();

        if (response.status === 403 || responseText.includes('Just a moment')) {
            console.error('❌ [LocalServer] Cloudflare BLOCKED Login (403).');
            console.log('💡 TIP: ก๊อปปี้ Token จากหน้าเบราว์เซอร์มาใส่ใน .env ช่อง INDEXGAME_STATIC_TOKEN เพื่อแก้ปัญหานี้ครับ');
            throw new Error('Cloudflare Blocked (403)');
        }

        const data = JSON.parse(responseText);
        if (data.status === true && data.token) {
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
                // ส่งผ่าน VPS Proxy (157.85.102.141) ที่ whitelist กับ Peamsub แล้ว
                const { endpoint, method = 'GET', body: apiBody } = data;
                const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;

                console.log(`   [VPS→Peamsub] ${method} ${PEAMSUB_API_BASE_URL}${endpoint}`);

                const apiRes = await fetchViaVPS(`${PEAMSUB_API_BASE_URL}${endpoint}`, {
                    method: method,
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: apiBody ? JSON.stringify(apiBody) : undefined
                });

                const responseText = await apiRes.text();
                let apiData;
                try {
                    apiData = JSON.parse(responseText);
                } catch (e) {
                    apiData = { message: responseText };
                }

                // Peamsub 404 = endpoint ไม่มี, 418 = บัญชีไม่มีสิทธิ์ → return empty gracefully
                if (apiRes.status === 404 || apiRes.status === 418) {
                    console.warn(`⚠️ [VPS→Peamsub] ${apiRes.status}: ${endpoint} - returning empty`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ statusCode: 200, data: [] }));
                    return;
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

            } else if (url === '/api/wepay-game') {
                // wePAY Game API - ส่งผ่าน VPS Proxy
                const { action, ...params } = data;
                const password_hash = md5(WEPAY_PASSWORD);

                console.log(`   [VPS→wePAY] action: ${action}`);

                let wepayBody;

                if (action === 'balance') {
                    wepayBody = { username: WEPAY_USERNAME, password_hash, type: 'balance_inquiry' };
                } else if (action === 'products') {
                    wepayBody = { username: WEPAY_USERNAME, password_hash, type: 'mtopup' };
                    if (params.pay_to_company) { wepayBody.pay_to_company = params.pay_to_company; wepayBody.payee_info = 'true'; }
                } else if (action === 'game_list') {
                    const glRes = await fetchViaVPS('https://www.wepay.in.th/comp_export.php?json', { method: 'GET', headers: {} });
                    const glText = await glRes.text();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    try { res.end(JSON.stringify(JSON.parse(glText))); } catch { res.end(glText); }
                    return;
                } else if (action === 'purchase') {
                    const { dest_ref, pay_to_company, pay_to_amount, pay_to_ref1, pay_to_ref2 } = params;
                    if (!dest_ref || !pay_to_company || !pay_to_amount || !pay_to_ref1) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing required parameters' }));
                        return;
                    }
                    wepayBody = { username: WEPAY_USERNAME, password_hash, resp_url: WEPAY_CALLBACK_URL, dest_ref, type: params.type || 'gtopup', pay_to_company, pay_to_amount: String(pay_to_amount), pay_to_ref1 };
                    if (pay_to_ref2) wepayBody.pay_to_ref2 = pay_to_ref2;
                } else if (action === 'check_order') {
                    const { transaction_id } = params;
                    if (!transaction_id) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing transaction_id' })); return; }
                    wepayBody = { username: WEPAY_USERNAME, password_hash, type: 'get_output', transaction_id };
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
                    return;
                }

                const wpRes = await fetchViaVPS(WEPAY_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(wepayBody)
                });
                const wpText = await wpRes.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                try { res.end(JSON.stringify(JSON.parse(wpText))); } catch { res.end(wpText); }
                return;

            } else if (url === '/api/indexgame') {
                const { endpoint, method = 'GET', body: apiBody } = data;

                // --- MOCK DATA FALLBACK ---
                const getMockData = () => {
                    if (endpoint === '/api/v1/games') {
                        return {
                            status: true,
                            data: [
                                { id: 101, gamename: 'Free Fire', image: 'https://img.indexgame.in.th/games/ff.png' },
                                { id: 102, gamename: 'RoV', image: 'https://img.indexgame.in.th/games/rov.png' },
                                { id: 103, gamename: 'Mobile Legends', image: 'https://img.indexgame.in.th/games/ml.png' },
                                { id: 104, gamename: 'Genshin Impact', image: 'https://img.indexgame.in.th/games/genshin.png' },
                                { id: 105, gamename: 'PUBG Mobile', image: 'https://img.indexgame.in.th/games/pubg.png' }
                            ]
                        };
                    }
                    if (endpoint.includes('/packs')) {
                        return {
                            status: true,
                            data: [
                                { pack_id: 1, name: '100 Diamonds', price_partner: 30, price_member: 35, point: "100", unit: "Diamonds" },
                                { pack_id: 2, name: '300 Diamonds', price_partner: 90, price_member: 100, point: "300", unit: "Diamonds" },
                                { pack_id: 3, name: '500 Diamonds', price_partner: 150, price_member: 165, point: "500", unit: "Diamonds" },
                                { pack_id: 4, name: '1000 Diamonds', price_partner: 300, price_member: 330, point: "1000", unit: "Diamonds" }
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
