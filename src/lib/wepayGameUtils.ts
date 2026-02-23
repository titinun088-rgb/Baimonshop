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

/** ดึงรายการสินค้าเกมทั้งหมดจาก comp_export */
export const getWepayGameProducts = async (): Promise<WepayGameProduct[]> => {
    try {
        console.log('🎮 กำลังดึงรายการสินค้าเกม wePAY...');
        const data = await wepayRequest<any>({ action: 'game_list' });

        // comp_export.php?json คืน array ของ object หรือ object ที่มี array
        let raw: any[] = [];
        if (Array.isArray(data)) {
            raw = data;
        } else if (data && typeof data === 'object') {
            // ลองหา key ที่เป็น array
            const keys = Object.keys(data);
            for (const k of keys) {
                if (Array.isArray(data[k])) { raw = data[k]; break; }
            }
        }

        // map เป็น WepayGameProduct
        const products: WepayGameProduct[] = raw
            .filter((item: any) => item && (item.code || item.company_code || item.pay_to_company))
            .map((item: any, idx: number) => {
                const company = item.code || item.company_code || item.pay_to_company || `GAME_${idx}`;
                return {
                    id: `${company}_${idx}`,
                    name: item.name || item.company_name || company,
                    category: item.group || item.category || item.company_name || company,
                    pay_to_company: company,
                    pay_to_amount: String(item.amount || item.pay_to_amount || ''),
                    info: item.detail || item.description || item.info || '',
                    price: String(item.cost_price || item.price || item.amount || '0'),
                    recommendedPrice: String(item.sell_price || item.price || item.amount || '0'),
                    img: item.img || item.image || '',
                    format_id: item.format || item.format_id || item.ref1_format || '',
                    min_amount: Number(item.min_amount || 0),
                    max_amount: Number(item.max_amount || 0),
                };
            });

        console.log(`✅ ดึงสินค้าเกม wePAY: ${products.length} รายการ`);
        return products;
    } catch (error) {
        console.error('❌ Error getting wePAY game products:', error);
        console.warn('⚠️ Returning empty array for graceful degradation');
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
}): Promise<WepayPurchaseResult> => {
    console.log('🎮 กำลังเติมเกมผ่าน wePAY...', { ...params });
    const data = await wepayRequest<WepayPurchaseResult>({
        action: 'purchase',
        ...params,
    });
    console.log('✅ wePAY purchase result:', data);

    if (data.code !== '00000') {
        throw new Error(`wePAY error ${data.code}: ${data.message || 'Unknown error'}`);
    }

    return data;
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
        '30016': 'รหัสอ้างอิงซ้ำ (dest_ref ซ้ำ)',
        '30019': 'ยอดเงินไม่พอ',
        '30005': 'Callback URL ไม่ถูกต้อง',
        '20005': 'IP ไม่ได้รับอนุญาต (ต้องแจ้ง wePAY whitelist)',
    };
    return map[code] || `Error code: ${code}`;
};
