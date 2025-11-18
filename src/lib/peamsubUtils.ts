// Peamsub API Utilities
// API Documentation: https://api.peamsub24hr.com

const PEAMSUB_API_BASE_URL = 'https://api.peamsub24hr.com';
const PEAMSUB_API_KEY = import.meta.env.VITE_PEAMSUB_API_KEY || '';

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

// Helper function to make API requests with retry logic
const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<PeamsubApiResponse<T>> => {
  // Check if API key is available
  if (!PEAMSUB_API_KEY || PEAMSUB_API_KEY.trim() === '') {
    console.error('❌ Peamsub API Key is missing! Please check your .env.local file and restart the dev server.');
    throw new Error('Peamsub API Key is not configured. Please set VITE_PEAMSUB_API_KEY in .env.local and restart the dev server.');
  }

  const url = `${PEAMSUB_API_BASE_URL}${endpoint}`;
  const authHeader = `Basic ${btoa(PEAMSUB_API_KEY)}`;
  
  // Debug: Log API key info (first 3 and last 3 chars only for security)
  const keyPreview = PEAMSUB_API_KEY.length > 6 
    ? `${PEAMSUB_API_KEY.substring(0, 3)}...${PEAMSUB_API_KEY.substring(PEAMSUB_API_KEY.length - 3)}`
    : '***';
  console.log(`🔑 Peamsub API Request: ${endpoint}`);
  console.log(`   API Key: ${keyPreview} (length: ${PEAMSUB_API_KEY.length})`);
  console.log(`   Auth Header: ${authHeader.substring(0, 20)}...`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        // Special handling for 401 Unauthorized
        if (response.status === 401) {
          console.error('❌ Peamsub API: 401 Unauthorized');
          console.error('   - Check if API key is correct in .env.local');
          console.error('   - Make sure to restart dev server after changing .env.local');
          console.error('   - Current API key length:', PEAMSUB_API_KEY.length);
          throw new Error(`HTTP error! status: 401 (Unauthorized) - Please check your API key in .env.local`);
        }
        
        // Don't retry for client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // For server errors (5xx) or rate limits (429), retry if attempts remain
        if (attempt < retries && (response.status >= 500 || response.status === 429)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`⚠️ API request failed (${response.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
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

export const getPeamsubGameProducts = async (): Promise<PeamsubGameProduct[]> => {
  try {
    console.log('🎮 กำลังดึงรายการสินค้าเติมเกม Peamsub...');

    // ทำ retry ในกรณีที่เกิด rate limit หรือ network error
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 วินาที

    while (retryCount < maxRetries) {
      try {
        // ดึงข้อมูลโดยตรงจาก endpoint โดยไม่ใช้ pagination
        const response = await makeApiRequest<PeamsubGameProduct[]>('/v2/game', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache', // ป้องกัน cache
          }
        });

        if (response.statusCode === 200) {
          let products: PeamsubGameProduct[] = [];

          // ตรวจสอบรูปแบบ response
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data && typeof response.data === 'object') {
            const responseData = response.data as any;
            if (Array.isArray(responseData.data)) {
              products = responseData.data;
            } else if (Array.isArray(responseData)) {
              products = responseData;
            }
          }

          // ตรวจสอบความถูกต้องของข้อมูล
          const validProducts = products.filter(product => 
            product && 
            typeof product === 'object' &&
            'id' in product &&
            'category' in product
          );

          // ลบข้อมูลซ้ำ
          const uniqueProducts = validProducts.filter((product, index, self) => 
            index === self.findIndex((p) => p.id === product.id)
          );

          console.log(`✅ ดึงรายการสินค้าเติมเกม Peamsub สำเร็จ: ${uniqueProducts.length} รายการ`);
          
          // Log warning ถ้าได้ข้อมูลน้อยผิดปกติ
          if (uniqueProducts.length < 10) {
            console.warn('⚠️ Warning: ได้รับข้อมูลเกมน้อยกว่าที่ควร อาจมีปัญหากับ API');
          }

          return uniqueProducts;
        } else {
          throw new Error(`API returned status code: ${response.statusCode}`);
        }
      } catch (error: any) {
        retryCount++;
        
        // ถ้าเป็น rate limit หรือ network error ให้ retry
        if (error.message.includes('429') || error.message.includes('network')) {
          if (retryCount < maxRetries) {
            console.warn(`⚠️ Retry ${retryCount}/${maxRetries} after ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }
        
        // ถ้าเป็น error อื่นๆ หรือ retry ครบแล้ว ให้ throw
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  } catch (error) {
    console.error('❌ Error getting Peamsub game products:', error);
    
    // Return empty array instead of throwing error for graceful degradation
    console.warn('⚠️ Returning empty array for graceful degradation');
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
export const purchasePeamsubGame = async (id: number, uid: string, reference: string): Promise<string> => {
  try {
    console.log('🎮 กำลังเติมเกม...', { id, uid, reference });
    const response = await makeApiRequest<{ statusCode: number }>('/v2/game', {
      method: 'POST',
      body: JSON.stringify({ id, uid, reference })
    });
    
    if (response.statusCode === 200) {
      console.log('✅ เติมเกมสำเร็จ');
      return 'เติมเกมสำเร็จ';
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error purchasing game:', error);
    throw error;
  }
};

export const getPeamsubGameHistory = async (references: string[] = []): Promise<PeamsubGameHistory[]> => {
  try {
    console.log('📋 กำลังดึงประวัติการเติมเกม...');
    const response = await makeApiRequest<PeamsubGameHistory[]>('/v2/game/history', {
      method: 'POST',
      body: JSON.stringify({ references })
    });
    
    if (response.statusCode === 200) {
      console.log('✅ ประวัติการเติมเกม:', response.data);
      return response.data;
    } else {
      throw new Error(`API returned status code: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error getting game history:', error);
    throw error;
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
      console.log('✅ รายการสินค้าบัตรเงินสด:', response.data);
      return response.data;
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

    const response = await makeApiRequest<{ statusCode: number }>('/v2/cashcard', {
      method: 'POST',
      body: JSON.stringify({ id, reference })
    });
    
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