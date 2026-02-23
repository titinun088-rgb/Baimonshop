import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const WEPAY_API_URL = 'https://www.wepay.in.th/client_api.json.php';
const WEPAY_USERNAME = process.env.WEPAY_USERNAME || '';
const WEPAY_PASSWORD = process.env.WEPAY_PASSWORD || '';
const WEPAY_CALLBACK_URL = process.env.WEPAY_CALLBACK_URL || 'https://www.baimonshop.com/api/wepay-callback';

function md5(str: string): string {
    return createHash('md5').update(str).digest('hex');
}

function getProxyAgent() {
    const proxyUrl = process.env.FIXIE_URL || 'http://wuofakpk:obs41kiozcic@107.172.163.27:6543';
    try {
        console.log('🌐 Using Webshare Proxy:', proxyUrl.replace(/:([^:@]+)@/, ':***@'));
        return new HttpsProxyAgent(proxyUrl);
    } catch (e) {
        console.error('⚠️ Failed to create proxy agent:', e);
        return undefined;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!WEPAY_USERNAME || !WEPAY_PASSWORD) {
        return res.status(500).json({ error: 'wePAY credentials not configured' });
    }

    const password_hash = md5(WEPAY_PASSWORD);
    const { action, ...params } = req.body || {};
    const agent = getProxyAgent();

    try {
        // ─── 1. ตรวจสอบยอดเงิน ─────────────────────────────────────────────
        if (action === 'balance') {
            const response = await fetch(WEPAY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: WEPAY_USERNAME,
                    password_hash,
                    type: 'balance_inquiry',
                }),
                agent,
            });
            const text = await response.text();
            console.log('💰 wePAY balance raw response:', text);
            try {
                const data = JSON.parse(text);
                return res.status(200).json(data);
            } catch (e) {
                return res.status(200).json({ raw: text, error: 'Invalid JSON' });
            }
        }

        // ─── 2. ดึงรายการสินค้าเกม (เช็ค payee_info) ───────────────────────
        if (action === 'products') {
            const { pay_to_company } = params;
            const body: any = {
                username: WEPAY_USERNAME,
                password_hash,
                type: 'mtopup',
            };
            if (pay_to_company) {
                body.pay_to_company = pay_to_company;
                body.payee_info = 'true';
            }

            const response = await fetch(WEPAY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                agent,
            });
            const text = await response.text();
            console.log('🎮 wePAY products raw response:', text.substring(0, 200));
            try {
                const data = JSON.parse(text);
                return res.status(200).json(data);
            } catch (e) {
                return res.status(200).json({ raw: text, error: 'Invalid JSON' });
            }
        }

        // ─── 3. ดึงรายการสินค้าทั้งหมดจาก comp_export ──────────────────────
        if (action === 'game_list') {
            const response = await fetch('https://www.wepay.in.th/comp_export.php?json', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                agent,
            });
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                return res.status(200).json(data);
            } catch (e) {
                console.error('❌ Failed to parse comp_export JSON:', text.substring(0, 100));
                return res.status(200).json({ raw: text, error: 'Invalid JSON' });
            }
        }

        // ─── 4. สั่งซื้อ / เติมเกม ──────────────────────────────────────────
        if (action === 'purchase') {
            const { dest_ref, pay_to_company, pay_to_amount, pay_to_ref1, pay_to_ref2 } = params;

            if (!dest_ref || !pay_to_company || !pay_to_amount || !pay_to_ref1) {
                return res.status(400).json({ error: 'Missing required parameters: dest_ref, pay_to_company, pay_to_amount, pay_to_ref1' });
            }

            const purchaseBody: any = {
                username: WEPAY_USERNAME,
                password_hash,
                resp_url: WEPAY_CALLBACK_URL,
                dest_ref,
                type: 'mtopup',
                pay_to_company,
                pay_to_amount: String(pay_to_amount),
                pay_to_ref1,
            };

            if (pay_to_ref2) {
                purchaseBody.pay_to_ref2 = pay_to_ref2;
            }

            console.log('📤 wePAY purchase request:', { ...purchaseBody, password_hash: '***' });

            const response = await fetch(WEPAY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseBody),
                agent,
            });

            const text = await response.text();
            console.log('📥 wePAY purchase response:', text.substring(0, 500));

            let data: any;
            try {
                data = JSON.parse(text);
            } catch {
                return res.status(200).json({ raw: text });
            }

            return res.status(200).json(data);
        }

        // ─── 5. ตรวจสอบสถานะ order ──────────────────────────────────────────
        if (action === 'check_order') {
            const { transaction_id } = params;
            if (!transaction_id) {
                return res.status(400).json({ error: 'Missing transaction_id' });
            }

            const response = await fetch(WEPAY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: WEPAY_USERNAME,
                    password_hash,
                    type: 'get_output',
                    transaction_id,
                }),
                agent,
            });

            const data = await response.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (error) {
        console.error('wePAY API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
