// wePAY Game API Utilities
// อ้างอิง: https://www.wepay.in.th API Document

const WEPAY_PROXY_URL = '/api/wepay-game';

// ────────── Types ──────────

export interface WepayBalance {
    code: string;       // "00000" = สำเร็จ
    ledger_balance: string;
    available_balance: number;
}

/** สินค้าเกมจาก comp_export หรือ payee_info */
export interface WepayGameProduct {
    id: string;                   // pay_to_company code เช่น "ROV", "FF"
    name: string;                 // ชื่อแสดงผล
    category: string;             // หมวดหมู่ (= ชื่อเกม)
    pay_to_company: string;       // ใช้ส่งคำสั่งซื้อ
    pay_to_amount: string;        // จำนวนเงิน
    info: string;                 // รายละเอียดแพ็คเกจ
    price: string;                // ราคาต้นทุนจาก wePAY (บาท)
    recommendedPrice: string;     // ราคาขาย (admin กำหนด หรือ = price * markup)
    img: string;                  // รูปภาพ (ถ้ามี)
    format_id: string;            // regex สำหรับ validate ref1 (UID)
    type: string;                 // gtopup, mtopup, cashcard
    min_amount?: number;
    max_amount?: number;
}

export interface WepayPurchaseResult {
    code: string;           // "00000" = รับคำสั่งแล้ว
    transaction_id?: string;
    dest_ref?: string;
    message?: string;
    raw?: string;
}

export interface WepayOrderStatus {
    code: string;
    status?: string;        // "2" = สำเร็จ, "4" = ล้มเหลว
    transaction_id?: string;
    dest_ref?: string;
    sms?: string;
    operator_trxnsid?: string;
}

// ────────── Helper ──────────

async function wepayRequest<T>(body: object): Promise<T> {
    const res = await fetch(WEPAY_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`wePAY API error ${res.status}: ${text.substring(0, 200)}`);
    }

    return res.json();
}

// ────────── API Functions ──────────

/** ตรวจสอบยอดเงิน wePAY */
export const getWepayBalance = async (): Promise<WepayBalance> => {
    console.log('💰 ตรวจสอบยอดเงิน wePAY...');
    const data = await wepayRequest<WepayBalance>({ action: 'balance' });
    console.log('✅ wePAY Balance:', data);
    return data;
};

// ────────── Cache ──────────
let cachedGameProducts: WepayGameProduct[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที

/** ล้าง Cache สินค้าเกม */
export const clearGameProductsCache = () => {
    cachedGameProducts = null;
    lastFetchTime = 0;
};

/** ดึงรายการสินค้าเกมทั้งหมดจาก comp_export พร้อมระบบ Cache */
export const getWepayGameProducts = async (forceRefresh = false): Promise<WepayGameProduct[]> => {
    // ใช้ Cache ถ้ายังไม่หมดอายุและไม่ได้สั่ง Force Refresh
    const now = Date.now();
    if (!forceRefresh && cachedGameProducts && (now - lastFetchTime < CACHE_DURATION)) {
        console.log('🚀 Using cached wePAY game products');
        return cachedGameProducts;
    }

    try {
        console.log('🎮 กำลังดึงรายการสินค้าเกม wePAY (Full Scan)...');
        const data = await wepayRequest<any>({ action: 'game_list' });

        let allItems: WepayGameProduct[] = [];

        // wePAY จะแบ่งหมวดหมู่ใน data.data: { gtopup: [], mtopup: [], cashcard: [] }
        const categories = [
            { key: 'gtopup', type: 'gtopup' },
            { key: 'mtopup', type: 'mtopup' },
            { key: 'cashcard', type: 'cashcard' }
        ];

        const sourceData = data?.data || {};

        categories.forEach(cat => {
            const rawItems = sourceData[cat.key];
            if (rawItems && Array.isArray(rawItems)) {
                console.log(`📦 Analyzing ${rawItems.length} items in ${cat.key}`);

                const products = rawItems
                    .filter((item: any) => {
                        if (!item) return false;
                        const company = (item.company_id || item.code || item.company_code || item.pay_to_company || '').toUpperCase();
                        const name = (item.company_name || item.name || '').toUpperCase();

                        // รายการที่จะให้ "ข้าม" (Non-Game Blacklist - จัดหนัก)
                        const blacklist = [
                            '12CALL', 'AIS', 'DTAC', 'TMVH', 'TRUE', 'MY', 'PENGUIN', 'CAT', 'TOT', // มือถือ
                            'REFILL', 'TOPUP', 'TOP-UP', 'PREPAID', 'POSTPAID', 'MOBILE', // คำที่เกี่ยวกับเติมเงิน
                            'MEA', 'MWA', 'PEA', 'PWA', 'ELECTRIC', 'WATER', // บิลค่าน้ำค่าไฟ
                            'BILL', 'EXPRESSWAY', 'INSURANCE', 'EASY PASS', // บริการอื่นๆ
                            '3BB', 'FIBRE', 'SINET', 'CINET', 'INTERNET', // อินเทอร์เน็ตบ้าน
                            'TRUEMONEY', 'TMN', 'WALLET', 'BEEPAY', // กระเป๋าเงิน
                            'AEON', 'KTC', 'FIRST CHOICE', 'UMAY', 'PROMISE', // บัตรเครดิต/เงินกู้
                            'LEASING', 'CAR', 'MOTORCYCLE', // เช่าซื้อ
                            'GRAB', 'LINEMAN', 'LALAMOVE', 'FOOD', // ขนส่ง/อาหาร
                            'SURVEY', 'DONATION', 'MEMBER', 'CARD', // สมาชิก/บริจาค
                            'NETFLIX', 'VIU', 'MONOMAX', 'SPOTIFY', 'YOUTUBE', // สตรีมมิ่ง
                            'JOOX', 'WETV', 'IQIYI', 'TIKTOK', // โซเชียล/บันเทิงทั่วไป
                            'เติมเงิน', 'รายเดือน', 'เน็ต' // คำภาษาไทยที่เกี่ยวกับเติมเงิน
                        ];

                        // รายการเกมที่อนุญาต (Whitelist)
                        const gameWhitelist = [
                            'HEARTOPIA', 'ROV', 'FREE FIRE', 'PUBG', 'GENSHIN',
                            'VALORANT', 'ROBLOX', 'STEAM', 'RAZER', 'GARENA',
                            'MOBILE LEGENDS', 'MLBB', 'ARENA OF VALOR', 'GAME'
                        ];

                        // ถ้าเป็นหมวด mtopup (ซึ่ง 99% เป็นเติมเงินมือถือ) 
                        // จะให้อนุญาตเฉพาะตัวที่อยู่ใน Whitelist เท่านั้น
                        if (cat.type === 'mtopup') {
                            return gameWhitelist.some(w => name.includes(w) || company.includes(w));
                        }

                        // สำหรับหมวดอื่น ถ้าอยู่ใน blacklist ให้ข้ามไปเลย 
                        if (blacklist.some(b => company.includes(b) || name.includes(b))) {
                            // ยกเว้นถ้าชื่ออยู่ใน whitelist จริงๆ
                            if (gameWhitelist.some(w => name.includes(w) || company.includes(w))) return true;
                            return false;
                        }

                        return !!(item.company_id || item.code || item.company_code || item.pay_to_company);
                    })
                    .flatMap((item: any, idx: number) => {
                        const company = item.company_id || item.code || item.company_code || item.pay_to_company || `${cat.key}_${idx}`;
                        const name = item.company_name || item.name || company;

                        // กรณีมี denomination (แพ็คเกจย่อย)
                        if (item.denomination && Array.isArray(item.denomination) && item.denomination.length > 0) {
                            return item.denomination.map((denom: any, dIdx: number) => ({
                                id: `${company}_${dIdx}`,
                                name,
                                category: name,
                                pay_to_company: company,
                                pay_to_amount: String(denom.price || denom.amount || ''),
                                info: denom.description || denom.name || `${name} ${denom.price || denom.amount} บาท`,
                                price: String(denom.price || denom.amount || '0'),
                                recommendedPrice: String(denom.price || denom.amount || denom.recommended_price || '0'),
                                img: item.img || item.image || '',
                                format_id: item.refs_format?.ref1 || item.format || item.format_id || item.ref1_format || '',
                                type: cat.type,
                                min_amount: Number(item.minimum_amount || 0),
                                max_amount: Number(item.maximum_amount || 0),
                            }));
                        }

                        // กรณีเป็นสินค้าเดี่ยว
                        return [{
                            id: `${company}_${idx}`,
                            name,
                            category: name,
                            pay_to_company: company,
                            pay_to_amount: String(item.amount || item.pay_to_amount || item.price || ''),
                            info: item.detail || item.description || item.info || '',
                            price: String(item.cost_price || item.price || item.amount || item.pay_to_amount || '0'),
                            recommendedPrice: String(item.sell_price || item.recommended_price || item.price || item.amount || '0'),
                            img: item.img || item.image || '',
                            format_id: item.refs_format?.ref1 || item.format || item.format_id || item.ref1_format || '',
                            type: cat.type,
                            min_amount: Number(item.minimum_amount || item.min_amount || 0),
                            max_amount: Number(item.maximum_amount || item.max_amount || 0),
                        }];
                    });

                allItems = [...allItems, ...products];
            }
        });

        // กรณี API ส่งมาเป็น array ตรงๆ (legacy/fallback)
        if (allItems.length === 0 && Array.isArray(data)) {
            // ... (keep fallback if needed, but comp_export usually follows the categorical structure above)
        }

        console.log(`✅ ดึงสินค้า wePAY สำเร็จ: ทั้งหมด ${allItems.length} รายการ`);

        // บันทึกลง Cache
        cachedGameProducts = allItems;
        lastFetchTime = Date.now();

        return allItems;
    } catch (error) {
        console.error('❌ Error getting wePAY products:', error);
        return [];
    }
};


/** ดึงข้อมูลสินค้าของเกมเฉพาะตัว (payee_info) */
export const getWepayGamePayeeInfo = async (pay_to_company: string): Promise<any> => {
    console.log(`🎮 ดึง payee_info ของ ${pay_to_company}...`);
    const data = await wepayRequest<any>({ action: 'products', pay_to_company });
    console.log('✅ payee_info:', data);
    return data;
};

/** สั่งซื้อ / เติมเกม */
export const purchaseWepayGame = async (params: {
    dest_ref: string;
    pay_to_company: string;
    pay_to_amount: string;
    pay_to_ref1: string;  // UID / ID ผู้เล่น
    pay_to_ref2?: string; // Server ID (ถ้ามี)
    type?: string;        // gtopup, mtopup, cashcard
}): Promise<WepayPurchaseResult> => {
    console.log('🎮 กำลังเติมเกมผ่าน wePAY...', { ...params });
    const data = await wepayRequest<any>({
        action: 'purchase',
        ...params,
    });
    console.log('📥 wePAY purchase full response:', JSON.stringify(data));

    // กรณี VPS ส่ง raw text กลับมา (JSON parse ล้มเหลว)
    if (data.raw !== undefined) {
        throw new Error(`wePAY ตอบกลับผิดปกติ: ${String(data.raw).substring(0, 100)}`);
    }

    // กรณีไม่มี code field เลย
    if (data.code === undefined) {
        throw new Error(`wePAY ไม่ตอบสนอง: ${JSON.stringify(data).substring(0, 150)}`);
    }

    if (data.code !== '00000') {
        const errorText = wepayErrorText(data.code);
        throw new Error(`wePAY: ${errorText} (code: ${data.code})`);
    }

    return data as WepayPurchaseResult;
};


/** ตรวจสอบสถานะ order */
export const checkWepayOrder = async (transaction_id: string): Promise<WepayOrderStatus> => {
    console.log('🔍 ตรวจสอบสถานะ wePAY order:', transaction_id);
    const data = await wepayRequest<WepayOrderStatus>({ action: 'check_order', transaction_id });
    console.log('✅ wePAY order status:', data);
    return data;
};

/** แปลง status code เป็นข้อความ */
export const wepayStatusText = (status: string | undefined): string => {
    switch (status) {
        case '2': return 'สำเร็จ';
        case '4': return 'ล้มเหลว';
        case '1': return 'รอดำเนินการ';
        default: return status || 'ไม่ทราบสถานะ';
    }
};

/** wePAY error code → ข้อความ */
export const wepayErrorText = (code: string): string => {
    const map: Record<string, string> = {
        '00000': 'สำเร็จ',
        '20005': 'IP ไม่ได้รับอนุญาต (ต้องแจ้ง wePAY whitelist)',
        '30005': 'Callback URL ไม่ถูกต้อง',
        '30006': 'ไม่พบบัญชีผู้เล่นในระบบเกม (AID หรือ UID ไม่ถูกต้อง) กรุณาตรวจสอบ ID ในเกมอีกครั้ง',
        '30016': 'รหัสอ้างอิงซ้ำ (dest_ref ซ้ำ)',
        '30017': 'ไม่พบบริการนี้',
        '30018': 'จำนวนเงินไม่ถูกต้อง',
        '30019': 'ยอดเงินไม่พอ',
        '30020': 'ระบบปลายทางผิดพลาด กรุณาลองใหม่',
        '30021': 'บัญชีผู้เล่นไม่ถูกต้อง',
    };
    return map[code] || `Error code: ${code}`;
};
