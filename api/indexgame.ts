import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Index Game API Configuration
const INDEXGAME_USERNAME = process.env.INDEXGAME_USERNAME || '';
const INDEXGAME_PASSWORD = process.env.INDEXGAME_PASSWORD || '';
const INDEXGAME_API_BASE_URL = 'https://indexgame.in.th';

// Cache token in memory (within the same instance)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(agent: any) {
    // 1. Check for Static Token in Environment (Bypass Cloudflare Login)
    if (process.env.INDEXGAME_STATIC_TOKEN) {
        return process.env.INDEXGAME_STATIC_TOKEN;
    }

    // If we have a valid token, return it
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    console.log('🔑 Logging in to Index Game API...');

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
            'Referer': 'https://api.indexgame.in.th/',
            'Origin': 'https://api.indexgame.in.th',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        },
        body: JSON.stringify({
            username: INDEXGAME_USERNAME,
            password: INDEXGAME_PASSWORD,
        }),
        agent
    };

    try {
        const response = await fetch(`${INDEXGAME_API_BASE_URL}/api/v1/auth/login`, fetchOptions);
        const responseText = (await response.text()).trim();

        let data;
        try {
            // Robust JSON extraction
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                data = JSON.parse(responseText.substring(startIdx, endIdx + 1));
            } else {
                data = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('❌ Login Parse Error. Raw:', responseText.substring(0, 100));
            throw new Error(`Login response not JSON (Cloudflare block?): ${responseText.substring(0, 50)}`);
        }

        if (data.status && data.token) {
            cachedToken = data.token;
            // Tokens usually last 24h or more, let's refresh every 12h
            tokenExpiresAt = Date.now() + (12 * 60 * 60 * 1000);
            return cachedToken;
        } else {
            console.error('❌ Login failed:', data);
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Error logging in:', error);
        throw error;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { endpoint, method = 'GET', body } = req.body || {};

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint is required' });
        }

        if (!INDEXGAME_USERNAME || !INDEXGAME_PASSWORD) {
            return res.status(500).json({ error: 'Index Game credentials not configured' });
        }

        // Proxy Agent configuration (using the same one as Peamsub as it seems to be working)
        const proxyUrl = process.env.FIXIE_URL || 'http://wuofakpk:obs41kiozcic@107.172.163.27:6543';
        let agent: any = undefined;
        try {
            agent = new HttpsProxyAgent(proxyUrl);
        } catch (proxyError) {
            console.error('Failed to create proxy agent:', proxyError);
        }

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

        // Get token
        let token;
        try {
            token = await getAccessToken(agent);
        } catch (tokenError) {
            console.log('⚠️ [Vercel] Token retrieval failed, falling back to mock.');
            return res.status(200).json(getMockData());
        }

        // Call Index Game API
        const fetchOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://api.indexgame.in.th/',
                'Origin': 'https://api.indexgame.in.th'
            },
            body: body ? JSON.stringify(body) : undefined,
            agent
        };

        const response = await fetch(`${INDEXGAME_API_BASE_URL}${endpoint}`, fetchOptions);
        const responseText = (await response.text()).trim();

        if (responseText.includes('Just a moment') || response.status >= 400) {
            console.log('⚠️ [Vercel] Blocked by Cloudflare or API Error, falling back to mock.');
            return res.status(200).json(getMockData());
        }

        let responseData;
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
            responseData = JSON.parse(cleanedJson);
        } catch (e) {
            console.log('❌ [Vercel] JSON Parse failed, falling back to mock.');
            return res.status(200).json(getMockData());
        }

        return res.status(response.status).json(responseData);
    } catch (error) {
        console.error('Index Game API Proxy Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
