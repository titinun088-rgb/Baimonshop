import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Index Game API Configuration
const INDEXGAME_USERNAME = process.env.INDEXGAME_USERNAME || '';
const INDEXGAME_PASSWORD = process.env.INDEXGAME_PASSWORD || '';
const INDEXGAME_API_BASE_URL = 'https://api.indexgame.in.th';

// Cache token in memory (within the same instance)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(agent: any) {
    // If we have a valid token, return it
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    console.log('🔑 Logging in to Index Game API...');

    try {
        const response = await fetch(`${INDEXGAME_API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: INDEXGAME_USERNAME,
                password: INDEXGAME_PASSWORD,
            }),
            agent
        });

        const data = await response.json() as any;

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

        // Get token
        const token = await getAccessToken(agent);

        // Call Index Game API
        const fetchOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
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
            body: body ? JSON.stringify(body) : undefined,
            agent
        };

        const response = await fetch(`${INDEXGAME_API_BASE_URL}${endpoint}`, fetchOptions);

        const responseText = (await response.text()).trim();
        let responseData;

        try {
            // Robust JSON parsing for Index Game: find start/end of JSON
            const startIdxObj = responseText.indexOf('{');
            const endIdxObj = responseText.lastIndexOf('}');
            const startIdxArr = responseText.indexOf('[');
            const endIdxArr = responseText.lastIndexOf(']');

            let startIdx = -1;
            let endIdx = -1;

            if (startIdxObj !== -1 && (startIdxArr === -1 || startIdxObj < startIdxArr)) {
                startIdx = startIdxObj;
                endIdx = endIdxObj;
            } else if (startIdxArr !== -1) {
                startIdx = startIdxArr;
                endIdx = endIdxArr;
            }

            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                const cleanedJson = responseText.substring(startIdx, endIdx + 1);
                responseData = JSON.parse(cleanedJson);
            } else {
                responseData = JSON.parse(responseText);
            }
        } catch (e) {
            console.error('❌ IndexGame Proxy Parse Error:', e);
            responseData = { message: responseText };
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
