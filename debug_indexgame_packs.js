
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const username = 'titinun088';
const password = 'titinun088';
const baseUrl = 'https://indexgame.in.th';
const proxyUrl = 'http://wuofakpk:obs41kiozcic@107.172.163.27:6543';
const agent = new HttpsProxyAgent(proxyUrl);

async function test() {
    try {
        const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            agent
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Test pack structure for ROV (ID 59)
        const packsRes = await fetch(`${baseUrl}/api/v1/games/59/packs`, {
            headers: { 'Authorization': `Bearer ${token}` },
            agent
        });
        const packsData = await packsRes.json();

        console.log('--- PACK STRUCTURE FOR ROV (ID 59) ---');
        console.log(JSON.stringify(packsData.data?.[0], null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

test();
