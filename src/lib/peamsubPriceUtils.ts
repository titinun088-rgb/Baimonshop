// Peamsub Product Price Management
// ระบบจัดการราคาสินค้า Peamsub ที่แอดมินสามารถตั้งได้

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Types
export interface PeamsubProductPrice {
  id: string; // Product ID from API
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game';

  // ราคาจาก API (ราคาทุน)
  apiPrice: number | string; // ราคาที่ต้องจ่ายให้ API

  // ราคาขายที่แอดมินตั้ง
  sellPrice: number; // ราคาที่ขายให้ลูกค้า

  // ข้อมูลเพิ่มเติม
  productName?: string;
  category?: string;

  // Metadata
  updatedAt: Date;
  updatedBy: string; // User ID ของแอดมินที่แก้ไข
}

/**
 * ตั้งราคาขายสินค้า
 */
export async function setPeamsubProductPrice(
  productId: number | string,
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game',
  sellPrice: number,
  apiPrice: number | string,
  productName?: string,
  category?: string,
  updatedBy?: string
): Promise<void> {
  try {
    console.log('💾 กำลังตั้งราคาสินค้า...', { productId, productType, sellPrice });

    const docId = `${productType}_${productId}`;
    const docRef = doc(db, "peamsub_product_prices", docId);

    const priceData: Omit<PeamsubProductPrice, 'id'> = {
      productType,
      apiPrice,
      sellPrice,
      productName: productName || '',
      category: category || '',
      updatedAt: new Date(),
      updatedBy: updatedBy || '',
    };

    await setDoc(docRef, priceData, { merge: true });

    console.log('✅ ตั้งราคาสินค้าสำเร็จ');
  } catch (error) {
    console.error('❌ Error setting product price:', error);
    throw error;
  }
}

/**
 * ดึงราคาขายสินค้า (ถ้าไม่มีให้คืนค่า null)
 */
export async function getPeamsubProductPrice(
  productId: number | string,
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game'
): Promise<PeamsubProductPrice | null> {
  try {
    const docId = `${productType}_${productId}`;
    const docRef = doc(db, "peamsub_product_prices", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as PeamsubProductPrice;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting product price:', error);
    return null;
  }
}

/**
 * ดึงราคาสินค้าทั้งหมด
 */
export async function getAllPeamsubProductPrices(): Promise<PeamsubProductPrice[]> {
  try {
    const pricesRef = collection(db, "peamsub_product_prices");
    const snapshot = await getDocs(pricesRef);

    const prices: PeamsubProductPrice[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      prices.push({
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as PeamsubProductPrice);
    });

    return prices;
  } catch (error) {
    console.error('❌ Error getting all product prices:', error);
    return [];
  }
}

/**
 * ดึงราคาสินค้าตามประเภท
 */
export async function getPeamsubProductPricesByType(
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game'
): Promise<PeamsubProductPrice[]> {
  try {
    const pricesRef = collection(db, "peamsub_product_prices");
    const q = query(pricesRef, where("productType", "==", productType));
    const snapshot = await getDocs(q);

    const prices: PeamsubProductPrice[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      prices.push({
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as PeamsubProductPrice);
    });

    return prices;
  } catch (error) {
    console.error('❌ Error getting product prices by type:', error);
    return [];
  }
}

/**
 * ลบราคาสินค้า
 */
export async function deletePeamsubProductPrice(
  productId: number | string,
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game'
): Promise<void> {
  try {
    const docId = `${productType}_${productId}`;
    const docRef = doc(db, "peamsub_product_prices", docId);
    await deleteDoc(docRef);
    console.log('✅ ลบราคาสินค้าสำเร็จ');
  } catch (error) {
    console.error('❌ Error deleting product price:', error);
    throw error;
  }
}

/**
 * ดึงราคาขายที่ควรใช้สำหรับสินค้า
 * ลำดับความสำคัญ: 1. Admin price (ถ้าตั้งไว้) 2. Recommended price (จาก API) 3. API price (ราคาปกติ)
 */
export async function getProductSellPrice(
  productId: number | string,
  productType: 'premium' | 'preorder' | 'game' | 'mobile' | 'cashcard' | 'wepay_game',
  apiPrice: number | string,
  recommendedPrice?: number | string // ราคาแนะนำจาก API (จะใช้เป็นราคาขายเริ่มต้น)
): Promise<number> {
  try {
    // 1. ตรวจสอบว่ามี admin price หรือไม่
    const adminPrice = await getPeamsubProductPrice(productId, productType);
    if (adminPrice && adminPrice.sellPrice > 0) {
      return adminPrice.sellPrice;
    }

    // 2. ถ้าไม่มี admin price ให้ใช้ recommended price (ราคาแนะนำ)
    if (recommendedPrice !== undefined && recommendedPrice !== null) {
      const recommendedPriceNum = typeof recommendedPrice === 'string'
        ? parseFloat(recommendedPrice)
        : recommendedPrice;
      if (!isNaN(recommendedPriceNum) && recommendedPriceNum > 0) {
        return recommendedPriceNum;
      }
    }

    // 3. ถ้าไม่มี recommended price ให้ใช้ API price (ราคาปกติ)
    const apiPriceNum = typeof apiPrice === 'string' ? parseFloat(apiPrice) : apiPrice;
    return isNaN(apiPriceNum) ? 0 : apiPriceNum;
  } catch (error) {
    console.error('❌ Error getting product sell price:', error);
    // Fallback: ใช้ recommended price ก่อน, แล้วค่อย API price
    if (recommendedPrice !== undefined && recommendedPrice !== null) {
      const recommendedPriceNum = typeof recommendedPrice === 'string'
        ? parseFloat(recommendedPrice)
        : recommendedPrice;
      if (!isNaN(recommendedPriceNum) && recommendedPriceNum > 0) {
        return recommendedPriceNum;
      }
    }
    const apiPriceNum = typeof apiPrice === 'string' ? parseFloat(apiPrice) : apiPrice;
    return isNaN(apiPriceNum) ? 0 : apiPriceNum;
  }
}

