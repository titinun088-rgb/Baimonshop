
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function test() {
    try {
        const res = await fetch('https://www.wepay.in.th/comp_export.php?json');
        const data = await res.json();
        const src = data.data || {};
        console.log('Categories:', Object.keys(src));
        if (src.gtopup) {
            console.log('Sample gtopup (first 2):', JSON.stringify(src.gtopup.slice(0, 2), null, 2));
        }
        // check for ROV/FF in any category
        const allItems = [...(src.gtopup || []), ...(src.mtopup || []), ...(src.cashcard || [])];
        const games = allItems.filter(i => {
            const n = (i.company_name || i.name || '').toUpperCase();
            return n.includes('ROV') || n.includes('FREE FIRE') || n.includes('PUBG');
        });
        console.log('Sample ROV/FF items (first 5):', JSON.stringify(games.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
