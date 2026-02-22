// Peamsub API Utilities
// API Documentation: https://api.peamsub24hr.com

const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';
// Note: PEAMSUB_API_KEY is now handled on the backend (api/peamsub.ts)

// Types
export interface PeamsubUserData {
  username: string;
  balance: string;
  rank: number; // 1 = ตัวแทนจำหน่าย; 3 = ตัวแทน VIP
}

export interface PeamsubPurchaseHistory {
  id: number;
  productName: string;
  productId: string;
  prize: string;
  img: string;
  price: string;
  refId: string;
  resellerId: string;
  status: string;
  date: string;
}

export interface PeamsubClaimResponse {
  ticketId: string;
}

export interface PeamsubClaimCallback {
  ticketId: string;
  status: string;
  prize: string;
}

// Claim status enum
export type ClaimStatus =
  | 'wrong_password'
  | 'incorrect_pin'
  | 'youtube_premium_disconnect'
  | 'netflix_screen_disconnect'
  | 'others';

// Claim request interface
export interface ClaimRequest {
  reference: string;
  status: ClaimStatus;
  description?: string;
  callbackUrl?: string;
}

// Claim response interface
export interface ClaimResponse {
  ticketId: string;
}

export interface PeamsubPurchaseHistory {
  id: number;
  productName: string;
  productId: string;
  prize: string;
  img: string;
  price: string;
  refId: string;
  resellerId: string;
  status: string;
  date: string;
}

export interface PeamsubPreorderCallback {
  ticketId: string;
  status: string;
  prize: string;
}

export interface PeamsubProduct {
  id: number;
  name: string;
  price: number; // ราคาขายปกติ
  pricevip: number; // ราคาตัวแทนจำหน่าย
  agent_price: number; // ราคาตัวแทนสมาชิก
  type_app: string; // หมวดหมู่ของแอพ
  stock: number; // จำนวนของที่เหลืออยู่ในสต็อก
  img: string; // รูปสินค้า
  des: string; // คำอธิบายสินค้า
}

export interface PeamsubPreorderProduct {
  id: number;
  name: string;
  price: number; // ราคาขายปกติ
  pricevip: number; // ราคาตัวแทนจำหน่าย
  agent_price: number; // ราคาตัวแทนสมาชิก
  type_app: string; // หมวดหมู่ของแอพ
  stock: number; // จำนวนของที่เหลืออยู่ในสต็อก
  img: string; // รูปสินค้า
  des: string; // คำอธิบายสินค้า
}

export interface PeamsubGameProduct {
  id: number;
  category: string;
  recommendedPrice: string;
  price: string;
  discount: string;
  info: string;
  img: string;
  format_id: string;
  indexgame_game_id?: number;
  indexgame_input_config?: any;
}

export interface PeamsubGameHistory {
  id: number;
  reference: string;
  info: string;
  price: number;
  status: string;
  date: string;
  resellerId: string;
}

export interface PeamsubMobileProduct {
  id: number;
  category: string;
  recommendedPrice: string;
  price: string;
  discount: string;
  info: string;
  img: string;
  format_id: string;
}

export interface PeamsubMobileHistory {
  id: number;
  reference: string;
  info: string;
  price: number;
  status: string;
  date: string;
  resellerId: string;
}

export interface PeamsubPreorderHistory {
  id: number;
  reference: string;
  info: string;
  price: number;
  status: string;
  date: string;
  resellerId: string;
}

export interface PeamsubCashCardProduct {
  id: number;
  category: string;
  recommendedPrice: string;
  price: string;
  discount: string;
  info: string;
  img: string;
  format_id: string;
}

export interface PeamsubCashCardHistory {
  id: number;
  reference: string;
  info: string;
  price: number;
  status: string;
  date: string;
  resellerId: string;
}

// Mobile products interface
export interface PeamsubMobileProduct {
  id: number;
  category: string;
  recommendedPrice: string;
  price: string;
  discount: string;
  info: string;
  img: string;
  format_id: string;
}

// Mobile top-up request interface
export interface MobileTopUpRequest {
  id: number;
  number: string;
  reference: string;
}

// Mobile top-up response interface
export interface MobileTopUpResponse {
  statusCode: number;
}

// Mobile history interface
export interface PeamsubMobileHistory {
  id: number;
  reference: string;
  info: string;
  price: number;
  status: string;
  date: string;
  resellerId: string;
}

export interface PeamsubApiResponse<T> {
  statusCode: number;
  data: T;
}

// Helper function to make API requests to Index Game with retry logic
const makeIndexGameRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<PeamsubApiResponse<T>> => {
  const proxyUrl = '/api/indexgame';

  const proxyPayload = {
    endpoint: endpoint,
    method: options.method || 'GET',
    body: options.body ? JSON.parse(options.body as string) : undefined
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyPayload)
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.message) errorMessage = errorData.message;
          } catch (e) {
            errorMessage = responseText.substring(0, 100);
          }
        } catch (e) { }

        if (attempt < retries && (response.status >= 500 || response.status === 429)) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Index Game API returns data directly, but our proxy might wrap it or return it as is.
      // We expect the proxy to return { status: boolean, data: ... } or similar if successful.
      // For compatibility with PeamsubApiResponse, we wrap it.
      return {
        statusCode: response.status,
        data: data as T
      };
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

// Helper function to make API requests with retry logic
const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<PeamsubApiResponse<T>> => {
  // Use the local Vercel API proxy
  const proxyUrl = '/api/peamsub';

  // Prepare payload for the proxy
  const proxyPayload = {
    endpoint: endpoint,
    method: options.method || 'GET',
    body: options.body ? JSON.parse(options.body as string) : undefined
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Always POST to the proxy
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyPayload)
      });

      if (!response.ok) {
        // Try to parse error message from response body
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;

        try {
          errorData = await response.json();
          if (errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
          console.error('❌ API Error Response:', errorData);
        } catch (parseError) {
          // If we can't parse JSON, just use the status
          console.error('❌ Could not parse error response');
        }

        // Special handling for PreamSub Single IP Constraint
        // Retry on 401/403 because Fixie rotates IPs and PreamSub might only whitelist one.
        // ALSO: PreamSub sometimes returns 400 with "IP ... Whitelist" message.
        const errorMsgString = errorMessage || '';
        const isIpMessage = errorMsgString.includes('Whitelist') || errorMsgString.includes('IP');

        const isIpBlockError =
          response.status === 403 ||
          response.status === 401 ||
          (response.status === 400 && isIpMessage);

        const isServerSideError = response.status >= 500;
        const isRateLimit = response.status === 429;

        // Don't retry for client errors (4xx) unless it's IP/Auth related or Rate Limit
        if (response.status >= 400 && response.status < 500 && !isIpBlockError && !isRateLimit) {
          throw new Error(errorMessage);
        }

        // Retry if attempts remain and condition met
        if (attempt < retries && (isServerSideError || isRateLimit || isIpBlockError)) {
          const delay = Math.pow(2, attempt) * 500; // Start at 500ms
          console.warn(`⚠️ API request failed (${response.status} - ${isIpBlockError ? 'IP Block' : 'Error'}), retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // For network errors, retry with exponential backoff
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`⚠️ Network error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, don't retry
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
};

// API Functions
export const getPeamsubUserInfo = async (): Promise<PeamsubUserData> => {
  try {
    console.log('👤 กำลังดึงข้อมูลผู้ใช้ Peamsub...');
    const response = await makeApiRequest<PeamsubUserData>('/v2/user/inquiry');
    if (response.statusCode === 200) {
      console.log('✅ ข้อมูลผู้ใช้ Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error getting Peamsub user info:', error);
    throw error;
  }
};

export const getPeamsubProducts = async (): Promise<PeamsubProduct[]> => {
  try {
    console.log('🛍️ กำลังดึงรายการสินค้าแอพพรีเมียม Peamsub...');
    const response = await makeApiRequest<PeamsubProduct[]>('/v2/app-premium');
    if (response.statusCode === 200) {
      console.log('✅ รายการสินค้าแอพพรีเมียม Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error getting Peamsub products:', error);
    throw error;
  }
};

export const getPeamsubPreorderProducts = async (): Promise<PeamsubPreorderProduct[]> => {
  try {
    console.log('⏰ กำลังดึงรายการสินค้าพรีออเดอร์ Peamsub...');
    const response = await makeApiRequest<PeamsubPreorderProduct[]>('/v2/app-preorder');
    if (response.statusCode === 200) {
      console.log('✅ รายการสินค้าพรีออเดอร์ Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('418')) {
        console.warn('⚠️ Peamsub preorder products API returned 418 (rate limited) - skipping gracefully');
        // Return empty array instead of throwing error for graceful degradation
        return [];
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('❌ Peamsub API authentication failed - check API key');
        throw new Error('การยืนยันตัวตนล้มเหลว กรุณาตรวจสอบ API Key');
      } else if (error.message.includes('429')) {
        console.warn('⚠️ Peamsub API rate limited - too many requests');
        throw new Error('ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
      }
    }

    // Only log other errors
    console.error('❌ Error getting Peamsub preorder products:', error);

    throw error;
  }
};

// Cache for game products to avoid redundant parallel fetching
let cachedGameProducts: PeamsubGameProduct[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getPeamsubGameProducts = async (): Promise<PeamsubGameProduct[]> => {
  try {
    // Return cache if it's still fresh
    if (cachedGameProducts && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      console.log('🎮 [IndexGame] Returning cached game products');
      return cachedGameProducts;
    }

    console.log('🎮 [IndexGame] กำลังดึงรายการสินค้าเติมเกม...');

    // 1. Get all games
    const response = await makeIndexGameRequest<any>('/api/v1/games');

    // Index Game API structure: { data: [ { id, gamename, ... } ] }
    const gamesData = response.data?.data || [];

    if (!Array.isArray(gamesData)) {
      console.warn('⚠️ Index Game games data is not an array:', gamesData);
      return [];
    }

    console.log(`✅ พบเกม ${gamesData.length} รายการ กำลังดึงแพ็กเกจ...`);

    // 2. For each game, get its packs in parallel
    // To avoid hitting rate limits too hard, we could do this in chunks, 
    // but let's try parallel first.
    const productPromises = gamesData.map(async (game: any) => {
      try {
        const packsResponse = await makeIndexGameRequest<any>(`/api/v1/games/${game.id}/packs`);
        const packsData = packsResponse.data?.data || [];

        return packsData.map((pack: any) => ({
          id: pack.pack_id, // We'll need to handle potential ID collisions later if necessary
          category: game.gamename, // Mapping gamename to category for UI compatibility
          recommendedPrice: (pack.price_member || pack.price || 0).toString(), // Suggested retail price from API
          price: (pack.price_partner || pack.price || 0).toString(), // Cost price for the shop
          discount: "0",
          info: `${pack.point} ${pack.unit}`,
          img: "", // Index Game API doesn't seem to provide game images in this list
          format_id: "", // Managed differently in Index Game via 'input' array
          // Custom field to help with purchase
          indexgame_game_id: game.id,
          indexgame_input_config: game.input
        }));
      } catch (err) {
        console.error(`❌ Error fetching packs for game ${game.id}:`, err);
        return [];
      }
    });

    const allPacksArrays = await Promise.all(productPromises);
    const flatProducts = allPacksArrays.flat();

    // Update cache
    cachedGameProducts = flatProducts;
    lastFetchTime = Date.now();

    console.log(`✅ ดึงรายการสินค้าเติมเกม IndexGame สำเร็จ: ${flatProducts.length} รายการ`);
    return flatProducts;
  } catch (error) {
    console.error('❌ Error getting Index Game products:', error);
    return [];
  }
};

export const purchasePeamsubProduct = async (id: number, reference: string): Promise<string> => {
  try {
    console.log('🛒 กำลังซื้อสินค้า Peamsub...', { id, reference });
    const response = await makeApiRequest<{ statusCode: number }>('/v2/app-premium', {
      method: 'POST',
      body: JSON.stringify({ id, reference })
    });

    if (response.statusCode === 200) {
      console.log('✅ ซื้อสินค้า Peamsub สำเร็จ');
      return 'ซื้อสินค้าสำเร็จ';
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error purchasing Peamsub product:', error);
    throw error;
  }
};

export const getPeamsubPurchaseHistory = async (references?: string[]): Promise<PeamsubPurchaseHistory[]> => {
  try {
    console.log('📋 กำลังดึงประวัติการซื้อสินค้า Peamsub...', references ? `สำหรับ references: ${references.join(', ')}` : 'ทั้งหมด');

    const response = await makeApiRequest<PeamsubPurchaseHistory[]>('/v2/app-premium/history', {
      method: 'POST',
      body: JSON.stringify({
        references: references || [] // ส่ง array ว่างเพื่อดึงประวัติทั้งหมด
      })
    });

    if (response.statusCode === 200) {
      console.log('✅ ประวัติการซื้อสินค้า Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('418')) {
        console.warn('⚠️ Peamsub purchase history API returned 418 (rate limited) - skipping gracefully');
        // Return empty array instead of throwing error for graceful degradation
        return [];
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('❌ Peamsub API authentication failed - check API key');
        throw new Error('การยืนยันตัวตนล้มเหลว กรุณาตรวจสอบ API Key');
      } else if (error.message.includes('429')) {
        console.warn('⚠️ Peamsub API rate limited - too many requests');
        throw new Error('ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
      }
    }

    // Only log other errors
    console.error('❌ Error getting Peamsub purchase history:', error);
    throw error;
  }
};

export const claimPeamsubProduct = async (claimRequest: ClaimRequest): Promise<ClaimResponse> => {
  try {
    console.log('🎫 กำลังเคลมสินค้า Peamsub...', claimRequest);

    const response = await makeApiRequest<ClaimResponse>('/v2/app-premium/claim', {
      method: 'POST',
      body: JSON.stringify(claimRequest)
    });

    if (response.statusCode === 200) {
      console.log('✅ เคลมสินค้า Peamsub สำเร็จ:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error claiming Peamsub product:', error);
    throw error;
  }
};

export const purchasePeamsubPreorder = async (id: number, reference: string, callbackUrl?: string): Promise<string> => {
  try {
    console.log('⏰ กำลังพรีออเดอร์สินค้า Peamsub...', { id, reference, callbackUrl });
    const response = await makeApiRequest<{ statusCode: number }>('/v2/app-preorder', {
      method: 'POST',
      body: JSON.stringify({ id, reference, callbackUrl })
    });

    if (response.statusCode === 200) {
      console.log('✅ พรีออเดอร์สินค้า Peamsub สำเร็จ');
      return 'พรีออเดอร์สินค้าสำเร็จ';
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error preordering Peamsub product:', error);
    throw error;
  }
};

export const getPeamsubPreorderHistory = async (): Promise<PeamsubPreorderHistory[]> => {
  try {
    console.log('📋 กำลังดึงประวัติการพรีออเดอร์ Peamsub...');
    const response = await makeApiRequest<PeamsubPreorderHistory[]>('/v2/app-preorder/history');
    if (response.statusCode === 200) {
      console.log('✅ ประวัติการพรีออเดอร์ Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('418')) {
        console.warn('⚠️ Peamsub preorder history API returned 418 (rate limited) - skipping gracefully');
        // Return empty array instead of throwing error for graceful degradation
        return [];
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('❌ Peamsub API authentication failed - check API key');
        throw new Error('การยืนยันตัวตนล้มเหลว กรุณาตรวจสอบ API Key');
      } else if (error.message.includes('429')) {
        console.warn('⚠️ Peamsub API rate limited - too many requests');
        throw new Error('ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
      }
    }

    // Only log other errors
    console.error('❌ Error getting Peamsub preorder history:', error);
    throw error;
  }
};

export const testPeamsubConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 กำลังทดสอบการเชื่อมต่อ Peamsub API...');
    const response = await makeApiRequest<PeamsubUserData>('/v2/user/inquiry');
    if (response.statusCode === 200) {
      console.log('✅ การเชื่อมต่อ Peamsub API สำเร็จ');
      return true;
    } else {
      console.log('❌ การเชื่อมต่อ Peamsub API ล้มเหลว:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Peamsub connection:', error);
    return false;
  }
};

// Game API Functions
export const purchasePeamsubGame = async (packId: number, uid: string, reference: string, gameId?: number): Promise<string> => {
  try {
    console.log('🎮 [IndexGame] กำลังเติมเกม...', { packId, uid, reference, gameId });

    // Index Game requires game_id and pack_id separately.
    // We pass gameId accumulated during product mapping.

    if (!gameId) {
      throw new Error('Missing Game ID for Index Game purchase');
    }

    // Map input based on game config if available
    // Instead of using arguments, we find the product from cache if available.
    const product = cachedGameProducts?.find(p => p.id === packId && p.indexgame_game_id === gameId);
    const apiInputConfig = product?.indexgame_input_config || [];

    const inputData: any = {};
    if (Array.isArray(apiInputConfig) && apiInputConfig.length > 0) {
      // Use the input_id specified by the API for each input
      // If we only have one UID from the UI, we assign it to the first input_id
      const firstInputId = apiInputConfig[0].input_id;
      inputData[firstInputId.toString()] = {
        "name": "uid",
        "value": uid
      };
    } else {
      // Fallback to "1"
      inputData["1"] = {
        "name": "uid",
        "value": uid
      };
    }

    const response = await makeIndexGameRequest<any>('/api/v1/purchase', {
      method: 'POST',
      body: JSON.stringify({
        game_id: gameId,
        pack_id: packId,
        input: inputData
      })
    });

    const data = response.data;
    if (data.status) {
      console.log('✅ เติมเกมสำเร็จ:', data);
      return `เติมเกมสำเร็จ (Order ID: ${data.order_id})`;
    } else {
      throw new Error(data.message || 'เติมเกมไม่สำเร็จ');
    }
  } catch (error: any) {
    console.error('❌ Error purchasing game:', error);
    throw error;
  }
};

export const getPeamsubGameHistory = async (orderIds: string[] = []): Promise<PeamsubGameHistory[]> => {
  try {
    console.log('📋 [IndexGame] กำลังดึงประวัติการเติมเกม (ตรวจสอบสถานะ)...');

    // Index Game doesn't have a broad history API like Peamsub, 
    // it focuses on order status. We map recent orders.
    const historyPromises = orderIds.map(async (id) => {
      try {
        const response = await makeIndexGameRequest<any>(`/api/v1/order/${id}`);
        const data = response.data;

        // Map Status: 1=Pending, 2=Success, 3=Canceled, 4=Refunded
        let status = 'pending';
        if (data.status === 2) status = 'success';
        if (data.status === 3 || data.status === 4) status = 'failed';

        return {
          id: parseInt(data.order_id) || 0,
          reference: data.order_id,
          info: `${data.details?.game || ''} - Pack ${data.details?.pack || ''}`,
          price: 0, // Not provided in status API directly
          status: status,
          date: new Date().toISOString(), // Status API might not return date
          resellerId: ""
        } as PeamsubGameHistory;
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(historyPromises);
    return results.filter(r => r !== null) as PeamsubGameHistory[];
  } catch (error) {
    console.error('❌ Error getting game history:', error);
    return [];
  }
};

// Mobile API Functions

export const purchasePeamsubMobile = async (id: number, number: string, reference: string): Promise<string> => {
  try {
    console.log('📱 กำลังเติมเน็ต-เติมเงินมือถือ...', { id, number, reference });
    const response = await makeApiRequest<{ statusCode: number }>('/v2/mobile', {
      method: 'POST',
      body: JSON.stringify({ id, number, reference })
    });

    if (response.statusCode === 200) {
      console.log('✅ เติมเน็ต-เติมเงินมือถือสำเร็จ');
      return 'เติมเน็ต-เติมเงินมือถือสำเร็จ';
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error purchasing mobile:', error);
    throw error;
  }
};


// Cash Card API Functions
export const getPeamsubCashCardProducts = async (): Promise<PeamsubCashCardProduct[]> => {
  try {
    console.log('💳 กำลังดึงรายการสินค้าบัตรเงินสด...');
    const response = await makeApiRequest<PeamsubCashCardProduct[]>('/v2/cashcard');
    if (response.statusCode === 200) {
      // กรองสินค้าที่เป็น STEAM หรือ TMN ออก
      const filteredProducts = response.data.filter(product => {
        const category = product.category?.toUpperCase() || '';
        const info = product.info?.toUpperCase() || '';

        // ตรวจสอบว่ามีคำว่า STEAM หรือ TMN ใน category หรือ info หรือไม่
        const isSteam = category.includes('STEAM') || info.includes('STEAM');
        const isTMN = category.includes('TMN') || info.includes('TMN') || category.includes('TRUEMONEY') || info.includes('TRUEMONEY');

        // คืนค่า true ถ้าไม่ใช่ STEAM หรือ TMN (จะเก็บไว้)
        return !isSteam && !isTMN;
      });

      console.log(`✅ กรองสินค้าบัตรเงินสด: ${response.data.length} -> ${filteredProducts.length} รายการ`);
      console.log(`   ลบ STEAM/TMN ออก ${response.data.length - filteredProducts.length} รายการ`);
      return filteredProducts;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error getting cash card products:', error);
    throw error;
  }
};

export const purchasePeamsubCashCard = async (id: number, reference: string): Promise<string> => {
  try {
    console.log('💳 กำลังซื้อบัตรเงินสด...', { id, reference });

    // Validate parameters
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new Error(`Invalid product ID: ${id}`);
    }

    if (!reference || typeof reference !== 'string' || reference.trim() === '') {
      throw new Error(`Invalid reference: ${reference}`);
    }

    // Get user info
    const userInfo = await getPeamsubUserInfo();
    const userBalance = parseFloat(userInfo.balance) || 0;

    // Get product info
    const products = await getPeamsubCashCardProducts();
    const product = products.find(p => p.id === id);

    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    const productPrice = parseFloat(product.recommendedPrice) || 0;

    // Check balance
    if (userBalance < productPrice) {
      throw new Error("Insufficient balance");
    }

    // Prepare request payload
    const payload = { id, reference };
    console.log('📤 Sending cash card purchase request:', payload);

    const response = await makeApiRequest<{ statusCode: number }>('/v2/cashcard', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('📥 Cash card purchase response:', response);

    if (response.statusCode === 200) {
      console.log('✅ ซื้อบัตรเงินสดสำเร็จ');
      return 'ซื้อบัตรเงินสดสำเร็จ';
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error purchasing cash card:', error);
    throw error;
  }
};

export const getPeamsubCashCardHistory = async (references: string[] = []): Promise<PeamsubCashCardHistory[]> => {
  try {
    console.log('📋 กำลังดึงประวัติการซื้อบัตรเงินสด...');
    const response = await makeApiRequest<PeamsubCashCardHistory[]>('/v2/cashcard/history', {
      method: 'POST',
      body: JSON.stringify({ references })
    });

    if (response.statusCode === 200) {
      console.log('✅ ประวัติการซื้อบัตรเงินสด:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error getting cash card history:', error);
    throw error;
  }
};

// Get mobile products
export const getPeamsubMobileProducts = async (): Promise<PeamsubMobileProduct[]> => {
  try {
    console.log('📱 กำลังดึงรายการสินค้าเติมเน็ต-เติมเงินมือถือ Peamsub...');

    const response = await makeApiRequest<PeamsubMobileProduct[]>('/v2/mobile');

    if (response.statusCode === 200) {
      console.log('✅ รายการสินค้าเติมเน็ต-เติมเงินมือถือ Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('418')) {
        console.warn('⚠️ Peamsub mobile products API returned 418 (rate limited) - skipping gracefully');
        // Return empty array instead of throwing error for graceful degradation
        return [];
      } else if (error.message.includes('401')) {
        console.error('❌ Unauthorized access to Peamsub mobile products API');
        throw new Error('Unauthorized access to Peamsub mobile products API');
      } else if (error.message.includes('403')) {
        console.error('❌ Forbidden access to Peamsub mobile products API');
        throw new Error('Forbidden access to Peamsub mobile products API');
      } else if (error.message.includes('429')) {
        console.error('❌ Rate limited by Peamsub mobile products API');
        throw new Error('Rate limited by Peamsub mobile products API');
      }
    }
    // Only log other errors
    console.error('❌ Error getting Peamsub mobile products:', error);
    throw error;
  }
};

// Top-up mobile
export const topUpMobile = async (topUpRequest: MobileTopUpRequest): Promise<MobileTopUpResponse> => {
  try {
    console.log('📱 กำลังเติมเน็ต-เติมเงินมือถือ Peamsub...', topUpRequest);

    const response = await makeApiRequest<MobileTopUpResponse>('/v2/mobile', {
      method: 'POST',
      body: JSON.stringify(topUpRequest)
    });

    if (response.statusCode === 200) {
      console.log('✅ เติมเน็ต-เติมเงินมือถือ Peamsub สำเร็จ:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error topping up mobile:', error);
    throw error;
  }
};

// Get mobile top-up history
export const getPeamsubMobileHistory = async (references?: string[]): Promise<PeamsubMobileHistory[]> => {
  try {
    console.log('📱 กำลังดึงประวัติการเติมเน็ต-เติมเงินมือถือ Peamsub...', references ? `สำหรับ references: ${references.join(', ')}` : 'ทั้งหมด');

    const response = await makeApiRequest<PeamsubMobileHistory[]>('/v2/mobile/history', {
      method: 'POST',
      body: JSON.stringify({
        references: references || [] // ส่ง array ว่างเพื่อดึงประวัติทั้งหมด
      })
    });

    if (response.statusCode === 200) {
      console.log('✅ ประวัติการเติมเน็ต-เติมเงินมือถือ Peamsub:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('418')) {
        console.warn('⚠️ Peamsub mobile history API returned 418 (rate limited) - skipping gracefully');
        // Return empty array instead of throwing error for graceful degradation
        return [];
      } else if (error.message.includes('401')) {
        console.error('❌ Unauthorized access to Peamsub mobile history API');
        throw new Error('Unauthorized access to Peamsub mobile history API');
      } else if (error.message.includes('403')) {
        console.error('❌ Forbidden access to Peamsub mobile history API');
        throw new Error('Forbidden access to Peamsub mobile history API');
      } else if (error.message.includes('429')) {
        console.error('❌ Rate limited by Peamsub mobile history API');
        throw new Error('Rate limited by Peamsub mobile history API');
      }
    }
    // Only log other errors
    console.error('❌ Error getting Peamsub mobile history:', error);
    throw error;
  }
};

// Format functions
export const formatPeamsubUserInfo = (user: PeamsubUserData): string => {
  return `👤 ชื่อผู้ใช้: ${user.username}
💰 ยอดเงินคงเหลือ: ฿${parseFloat(user.balance).toLocaleString()}
🏆 ระดับสมาชิก: ${user.rank === 1 ? 'ตัวแทนจำหน่าย' : user.rank === 3 ? 'ตัวแทน VIP' : 'สมาชิก'}`;
};

export const formatPeamsubProduct = (product: PeamsubProduct): string => {
  return `🛍️ ${product.name}
💰 ราคาปกติ: ${product.price} บาท
💎 ราคา VIP: ${product.pricevip} บาท
👑 ราคา Agent: ${product.agent_price} บาท
📦 สต็อก: ${product.stock} ชิ้น
📝 รายละเอียด: ${product.des}`;
};

export const formatPeamsubPurchaseHistory = (history: PeamsubPurchaseHistory): string => {
  return `🛒 ${history.productName}
💰 ราคา: ${history.price} บาท
🎁 รางวัล: ${history.prize}
📋 Reference: ${history.refId}
📊 สถานะ: ${history.status}
📅 วันที่: ${new Date(history.date).toLocaleString('th-TH')}`;
};

export const formatPeamsubPreorderProduct = (product: PeamsubPreorderProduct): string => {
  return `⏰ ${product.name}
💰 ราคาปกติ: ${product.price} บาท
💎 ราคา VIP: ${product.pricevip} บาท
👑 ราคา Agent: ${product.agent_price} บาท
📦 สต็อก: ${product.stock} ชิ้น
📝 รายละเอียด: ${product.des}`;
};

export const formatPeamsubGameProduct = (product: PeamsubGameProduct): string => {
  return `🎮 ${product.category}
📊 ราคาแนะนำ: ${product.recommendedPrice} บาท
💰 ราคาสินค้า: ${product.price} บาท
🎯 ส่วนลด: ${product.discount} บาท
📝 รายละเอียด: ${product.info}
🆔 Format ID: ${product.format_id}`;
};

// Filter functions
export const filterProductsByPrice = (products: PeamsubProduct[], maxPrice: number): PeamsubProduct[] => {
  return products.filter(product => product.price <= maxPrice);
};

export const filterProductsByStock = (products: PeamsubProduct[], minStock: number): PeamsubProduct[] => {
  return products.filter(product => product.stock >= minStock);
};

export const filterPreorderProductsByCategory = (products: PeamsubPreorderProduct[], category: string): PeamsubPreorderProduct[] => {
  return products.filter(product => product.type_app.toLowerCase().includes(category.toLowerCase()));
};

export const filterPreorderProductsByPrice = (products: PeamsubPreorderProduct[], maxPrice: number): PeamsubPreorderProduct[] => {
  return products.filter(product => product.price <= maxPrice);
};

export const filterGameProductsByCategory = (products: PeamsubGameProduct[], category: string): PeamsubGameProduct[] => {
  return products.filter(product => product.category.toLowerCase().includes(category.toLowerCase()));
};

export const filterGameProductsByPrice = (products: PeamsubGameProduct[], maxPrice: number): PeamsubGameProduct[] => {
  return products.filter(product => {
    const price = parseFloat(product.price);
    return !isNaN(price) && price <= maxPrice;
  });
};

export const filterPurchaseHistoryByStatus = (history: PeamsubPurchaseHistory[], status: string): PeamsubPurchaseHistory[] => {
  return history.filter(item => item.status.toLowerCase() === status.toLowerCase());
};

export const filterPurchaseHistoryByDate = (history: PeamsubPurchaseHistory[], startDate: Date, endDate: Date): PeamsubPurchaseHistory[] => {
  return history.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

export const filterPreorderHistoryByStatus = (history: PeamsubPreorderHistory[], status: string): PeamsubPreorderHistory[] => {
  return history.filter(item => item.status.toLowerCase() === status.toLowerCase());
};

export const filterPreorderHistoryByDate = (history: PeamsubPreorderHistory[], startDate: Date, endDate: Date): PeamsubPreorderHistory[] => {
  return history.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Search functions
export const searchProducts = (products: PeamsubProduct[], query: string): PeamsubProduct[] => {
  return products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.des.toLowerCase().includes(query.toLowerCase()) ||
    product.type_app.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchPreorderProducts = (products: PeamsubPreorderProduct[], query: string): PeamsubPreorderProduct[] => {
  return products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.des.toLowerCase().includes(query.toLowerCase()) ||
    product.type_app.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchGameProducts = (products: PeamsubGameProduct[], query: string): PeamsubGameProduct[] => {
  return products.filter(product =>
    product.category.toLowerCase().includes(query.toLowerCase()) ||
    product.info.toLowerCase().includes(query.toLowerCase())
  );
};

// Sort functions
export const sortProductsByPrice = (products: PeamsubProduct[], ascending: boolean = true): PeamsubProduct[] => {
  return [...products].sort((a, b) => ascending ? a.price - b.price : b.price - a.price);
};

export const sortProductsByStock = (products: PeamsubProduct[], ascending: boolean = true): PeamsubProduct[] => {
  return [...products].sort((a, b) => ascending ? a.stock - b.stock : b.stock - a.stock);
};

export const sortPreorderProductsByPrice = (products: PeamsubPreorderProduct[], ascending: boolean = true): PeamsubPreorderProduct[] => {
  return [...products].sort((a, b) => ascending ? a.price - b.price : b.price - a.price);
};

export const sortGameProductsByPrice = (products: PeamsubGameProduct[], ascending: boolean = true): PeamsubGameProduct[] => {
  return [...products].sort((a, b) => {
    const priceA = parseFloat(a.price);
    const priceB = parseFloat(b.price);
    const validPriceA = isNaN(priceA) ? (ascending ? Infinity : -Infinity) : priceA;
    const validPriceB = isNaN(priceB) ? (ascending ? Infinity : -Infinity) : priceB;
    return ascending ? validPriceA - validPriceB : validPriceB - validPriceA;
  });
};

export const sortPurchaseHistoryByDate = (history: PeamsubPurchaseHistory[], ascending: boolean = true): PeamsubPurchaseHistory[] => {
  return [...history].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const sortPreorderHistoryByDate = (history: PeamsubPreorderHistory[], ascending: boolean = true): PeamsubPreorderHistory[] => {
  return [...history].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Price calculation functions
export const getProductPriceByRank = (product: PeamsubProduct, rank: number): number => {
  switch (rank) {
    case 1: // ตัวแทนจำหน่าย
      return product.pricevip;
    case 3: // ตัวแทน VIP
      return product.agent_price;
    default:
      return product.price;
  }
};

export const getPreorderProductPriceByRank = (product: PeamsubPreorderProduct, rank: number): number => {
  switch (rank) {
    case 1: // ตัวแทนจำหน่าย
      return product.pricevip;
    case 3: // ตัวแทน VIP
      return product.agent_price;
    default:
      return product.price;
  }
};

// Stock check functions
export const isProductInStock = (product: PeamsubProduct): boolean => {
  return product.stock > 0;
};

export const isPreorderProductInStock = (product: PeamsubPreorderProduct): boolean => {
  return product.stock > 0;
};

// Balance calculation functions
export const calculateRemainingBalance = (currentBalance: number, purchaseAmount: number): number => {
  return currentBalance - purchaseAmount;
};

export const calculateTotalPurchaseAmount = (products: PeamsubProduct[], rank: number): number => {
  return products.reduce((total, product) => total + getProductPriceByRank(product, rank), 0);
};

export const calculateTotalPreorderAmount = (products: PeamsubPreorderProduct[], rank: number): number => {
  return products.reduce((total, product) => total + getPreorderProductPriceByRank(product, rank), 0);
};

export const hasEnoughBalance = (currentBalance: number, requiredAmount: number): boolean => {
  return currentBalance >= requiredAmount;
};

// Summary functions
export const getProductSummary = (products: PeamsubProduct[]): { totalProducts: number; totalStock: number; averagePrice: number } => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const averagePrice = totalProducts > 0 ? products.reduce((sum, product) => sum + product.price, 0) / totalProducts : 0;

  return { totalProducts, totalStock, averagePrice };
};

export const getPreorderProductSummary = (products: PeamsubPreorderProduct[]): { totalProducts: number; totalStock: number; averagePrice: number } => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const averagePrice = totalProducts > 0 ? products.reduce((sum, product) => sum + product.price, 0) / totalProducts : 0;

  return { totalProducts, totalStock, averagePrice };
};

export const getGameProductSummary = (products: PeamsubGameProduct[]): {
  totalProducts: number;
  totalPrice: number;
  averagePrice: number;
  categories: string[];
  cheapestProduct: PeamsubGameProduct | null;
  mostExpensiveProduct: PeamsubGameProduct | null
} => {
  const totalProducts = products.length;
  const validProducts = products.filter(product => !isNaN(parseFloat(product.price)));
  const totalPrice = validProducts.reduce((sum, product) => {
    const price = parseFloat(product.price);
    return isNaN(price) ? sum : sum + price;
  }, 0);

  const averagePrice = validProducts.length > 0 ? totalPrice / validProducts.length : 0;

  // Get unique categories
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  const cheapestProduct = validProducts.length > 0 ? validProducts.reduce((cheapest, product) => {
    const price = parseFloat(product.price);
    const cheapestPrice = parseFloat(cheapest.price);
    return isNaN(price) ? cheapest : (isNaN(cheapestPrice) || price < cheapestPrice ? product : cheapest);
  }) : null;

  const mostExpensiveProduct = validProducts.length > 0 ? validProducts.reduce((mostExpensive, product) => {
    const price = parseFloat(product.price);
    const mostExpensivePrice = parseFloat(mostExpensive.price);
    return isNaN(price) ? mostExpensive : (isNaN(mostExpensivePrice) || price > mostExpensivePrice ? product : mostExpensive);
  }) : null;

  return { totalProducts, totalPrice, averagePrice, categories, cheapestProduct, mostExpensiveProduct };
};

// Utility functions
export const generateReferenceId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
};

export const getClaimStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'สำเร็จ';
    case 'failed':
      return 'ล้มเหลว';
    case 'pending':
      return 'รอดำเนินการ';
    default:
      return status;
  }
};

// Purchase validation functions
export const canPurchaseProduct = (product: PeamsubProduct, userBalance: number, userRank: number): { canPurchase: boolean; price: number; reason?: string } => {
  const price = getProductPriceByRank(product, userRank);

  if (!isProductInStock(product)) {
    return { canPurchase: false, price, reason: 'สินค้าหมดสต็อก' };
  }

  if (!hasEnoughBalance(userBalance, price)) {
    return { canPurchase: false, price, reason: 'ยอดเงินไม่เพียงพอ' };
  }

  return { canPurchase: true, price };
};

export const canPurchasePreorderProduct = (product: PeamsubPreorderProduct, userBalance: number, userRank: number): { canPurchase: boolean; price: number; reason?: string } => {
  const price = getPreorderProductPriceByRank(product, userRank);

  if (!isPreorderProductInStock(product)) {
    return { canPurchase: false, price, reason: 'สินค้าหมดสต็อก' };
  }

  if (!hasEnoughBalance(userBalance, price)) {
    return { canPurchase: false, price, reason: 'ยอดเงินไม่เพียงพอ' };
  }

  return { canPurchase: true, price };
};