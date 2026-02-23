// Test Peamsub API - Direct only (no proxy)
const PEAMSUB_API_KEY = 'uagoldifmlc8u1525k64ggqe';
const authHeader = 'Basic ' + Buffer.from(PEAMSUB_API_KEY).toString('base64');

console.log('🔑 Auth Header:', authHeader);
console.log('');

// Test direct without proxy
console.log('📡 Testing direct API (no proxy)...');
try {
    const res = await fetch('https://api.peamsub24hr.com/api/v1/products', {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
    });

    console.log('✅ Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('📥 Response (first 500 chars):', text.substring(0, 500));
} catch (err) {
    console.error('❌ Direct connection error:', err.message);
    console.error('Cause:', err.cause?.message || err.cause);
}

// Ping test
console.log('');
console.log('🌐 Checking if peamsub24hr.com resolves...');
import { lookup } from 'dns/promises';
try {
    const result = await lookup('api.peamsub24hr.com');
    console.log('✅ DNS resolved:', result);
} catch (e) {
    console.error('❌ DNS failed:', e.message);
}
