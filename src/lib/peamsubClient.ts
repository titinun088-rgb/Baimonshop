import logger from './logger';

/**
 * Peamsub Client-Side API Wrapper
 * All API calls go through backend proxy to hide API keys
 */

export interface PeamsubTopupResponse {
  success: boolean;
  data?: {
    order_id?: string;
    status?: string;
    message?: string;
  };
  error?: string;
  details?: any;
}

export interface PeamsubCheckOrderResponse {
  success: boolean;
  data?: {
    order_id?: string;
    status?: string;
    message?: string;
    created_at?: string;
    updated_at?: string;
  };
  error?: string;
  details?: any;
}

/**
 * Helper to fetch with retries for IP rotation handling
 */
async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Statuses to retry: 5xx (Server), 429 (Rate Limit), 403 (Forbidden/IP Block), 401 (Auth)
      // We retry 403/401 because the proxy might rotate IPs and only one might be whitelisted.
      const status = response.status;
      const isRetryable = status >= 500 || status === 429 || status === 403 || status === 401;

      if (!response.ok && isRetryable && attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // 0.5s, 1s, 2s
        logger.warn(`⚠️ Request to ${url} failed with status ${status}, retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error: any) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        logger.warn(`⚠️ Network error calling ${url}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * สั่งซื้อการเติมเงินผ่าน Backend Proxy
 */
export async function createTopupOrder(
  productId: string,
  productData: any
): Promise<PeamsubTopupResponse> {
  try {
    logger.debug('🎯 สร้างคำสั่งซื้อเติมเงิน...', { productId });

    const response = await fetchWithRetry('/api/peamsub-topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        productData
      })
    });

    const data = await response.json();
    logger.debug('📥 ได้รับ Response จาก Backend:', data);

    if (!response.ok || !data.success) {
      logger.error('❌ Backend Response ไม่สำเร็จ:', data);
      return {
        success: false,
        error: data.error || 'การสั่งซื้อล้มเหลว',
        details: data.details
      };
    }

    logger.debug('✅ สร้างคำสั่งซื้อสำเร็จ');

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    logger.error('❌ Error creating topup order:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ'
    };
  }
}

/**
 * ตรวจสอบสถานะคำสั่งซื้อผ่าน Backend Proxy
 */
export async function checkOrderStatus(orderId: string): Promise<PeamsubCheckOrderResponse> {
  try {
    logger.debug('🎯 ตรวจสอบสถานะคำสั่งซื้อ...', { orderId });

    const response = await fetchWithRetry('/api/peamsub-check-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    logger.debug('📥 ได้รับ Response จาก Backend:', data);

    if (!response.ok || !data.success) {
      logger.error('❌ Backend Response ไม่สำเร็จ:', data);
      return {
        success: false,
        error: data.error || 'การตรวจสอบสถานะล้มเหลว',
        details: data.details
      };
    }

    logger.debug('✅ ตรวจสอบสถานะสำเร็จ');

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    logger.error('❌ Error checking order status:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
    };
  }
}
