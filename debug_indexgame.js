
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

        const gamesRes = await fetch(`${baseUrl}/api/v1/games`, {
            headers: { 'Authorization': `Bearer ${token}` },
            agent
        });
        const gamesData = await gamesRes.json();

        console.log('--- ALL PRODUCTS FROM API ---');
        gamesData.data.forEach(g => {
            console.log(`[${g.id}] ${g.primary_name}`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

test();
