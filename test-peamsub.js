const https = require('https');

const PEAMSUB_API_KEY = 'uagoldifmlc8u1525k64ggqe';
const authHeader = 'Basic ' + Buffer.from(PEAMSUB_API_KEY).toString('base64');

console.log('🔑 API Key:', PEAMSUB_API_KEY);
console.log('🔑 Auth Header:', authHeader);
console.log('');

// Test 1: Direct connection (no proxy)
console.log('📡 Test 1: Direct connection to Peamsub API...');
const options = {
    hostname: 'api.peamsub24hr.com',
    port: 443,
    path: '/api/v1/products',
    method: 'GET',
    headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
    }
};

const req = https.request(options, (res) => {
    console.log('✅ Status:', res.statusCode);
    console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('📥 Response (first 500 chars):', data.substring(0, 500));
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
    console.error('Error code:', e.code);
});

req.setTimeout(10000, () => {
    console.error('❌ Request timed out!');
    req.destroy();
});

req.end();
