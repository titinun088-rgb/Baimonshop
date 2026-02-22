import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Config from .env
const PEAMSUB_API_KEY = 'uagoldifmlc8u1525k64ggqe';
const FIXIE_URL = 'http://fixie:KKToygSsimaMOLE@criterium.usefixie.com:80';
const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';

async function testConnection() {
    console.log('🔍 Testing Peamsub API Connection...');
    console.log('----------------------------------------');

    // 1. Check Outbound IP via Proxy
    try {
        console.log('1️⃣  Checking Outbound IP via Fixie Proxy...');
        const agent = new HttpsProxyAgent(FIXIE_URL);
        const ipResponse = await fetch('https://api.ipify.org?format=json', { agent });
        const ipData = await ipResponse.json();
        console.log(`✅  Outbound IP: ${ipData.ip}`);
    } catch (error) {
        console.error('❌  Failed to check IP:', error.message);
    }

    console.log('----------------------------------------');

    // 2. Test Peamsub API
    try {
        console.log('2️⃣  Testing Peamsub API (User Inquiry)...');

        const authHeader = `Basic ${Buffer.from(PEAMSUB_API_KEY).toString('base64')}`;
        const agent = new HttpsProxyAgent(FIXIE_URL);

        // We'll try hitting the user inquiry endpoint
        // Retrying logic to simulate the fix
        let success = false;
        for (let i = 0; i < 5; i++) {
            console.log(`   Attempt ${i + 1}...`);

            try {
                const response = await fetch(`${PEAMSUB_API_BASE_URL}/v2/user/inquiry`, {
                    method: 'GET',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                    },
                    agent
                });

                const status = response.status;
                console.log(`   Status: ${status}`);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅  SUCCESS! Connected to Peamsub API.');
                    console.log('   Response Data:', JSON.stringify(data, null, 2));
                    success = true;
                    break;
                } else {
                    const text = await response.text();
                    console.log(`❌  Failed. Body: ${text}`);

                    if (status === 403 || status === 401) {
                        console.log('   (Likely IP Blocked or Auth Error - Retrying to hit other IP)');
                    } else {
                        break; // Don't retry other errors
                    }
                }
            } catch (err) {
                console.error('   Network Error:', err.message);
            }

            // Wait before retry
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!success) {
            console.log('\n❌  All attempts failed. Please check:');
            console.log('    1. Is the IP whitelisted in Peamsub?');
            console.log('    2. Is the API Key correct?');
            console.log('    3. Is Peamsub API down?');
        }

    } catch (error) {
        console.error('❌  Unexpected Error:', error);
    }
}

testConnection();
