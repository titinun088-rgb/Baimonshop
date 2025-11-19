// Purchase History Storage Management
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
  setDoc,
  doc
} from "firebase/firestore";
import { 
  PeamsubPurchaseHistory, 
  PeamsubGameHistory, 
  PeamsubMobileHistory, 
  PeamsubCashCardHistory 
} from "./peamsubUtils";

// ประเภทที่ใช้ร่วมกันระหว่าง API และ Firestore
export type PurchaseType = 'premium' | 'game' | 'mobile' | 'cashcard';

// interface สำหรับ Firestore
// Basic purchase history interface
export interface BasePurchaseHistory {
  id?: string | number;
  type: 'premium' | 'game' | 'mobile' | 'cashcard';
  price: string | number;
  status: string;
  date: string;
  createdAt?: string;
  info?: string;
  resellerId: string;
  sellPrice?: number;
  recommendedPrice?: string;
  reference?: string;
  refId?: string;
}

// Firestore purchase history interface
export interface FirestorePurchaseHistory extends BasePurchaseHistory {
  userId: string;
  peamsubId: number;
  productName?: string;
  productId?: string;
  syncedAt?: Date;
  sellPrice?: number;
  recommendedPrice?: string;
  info?: string;
}

// Peamsub history union type
export type PeamsubHistory = PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubMobileHistory | PeamsubCashCardHistory;

// Common Peamsub history interface
export interface PeamsubHistoryBase {
  peamsubId: number; // ID จาก Peamsub API
  reference: string;
  productName?: string; // สำหรับ premium
  productId?: string; // สำหรับ premium
  info?: string; // สำหรับ game, mobile, cashcard
  price: string | number; // ราคาจาก API (ราคาทุน)
  recommendedPrice?: string; // ราคาแนะนำจาก API (ราคาขายแนะนำ)
  sellPrice: number; // ราคาที่จ่ายให้เว็บไซต์ (ราคาขายจริง)
  status: string;
  date: string;
  resellerId: string;
  syncedAt: Date; // วันที่ sync จาก API
}

/**
 * เก็บประวัติการซื้อลง Firestore
 */
export async function storePurchaseHistory(
  userId: string,
  type: 'premium' | 'game' | 'mobile' | 'cashcard',
  history: PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubMobileHistory | PeamsubCashCardHistory
): Promise<string> {
  try {
    console.log('💾 กำลังเก็บประวัติการซื้อลง Firestore...', { userId, type, history });
    
    // ใช้ reference + type เป็น unique key เพื่อไม่ให้ duplicate
    const reference = 'refId' in history ? history.refId : history.reference;
    const uniqueKey = `${type}_${reference}`;
    
    // ดึงราคาขายที่บันทึกไว้ก่อน (จาก reference)
    // ถ้าไม่มี ให้ลองดึงจาก history ที่มี sellPrice หรือใช้ราคาจาก API
    let sellPrice = 0;
    
    // 1. ตรวจสอบว่ามี recommendedPrice หรือ sellPrice ใน history หรือไม่
    if ('recommendedPrice' in history && (history as any).recommendedPrice) {
      sellPrice = parseFloat((history as any).recommendedPrice);
    } else if ('sellPrice' in history && typeof (history as any).sellPrice === 'number' && (history as any).sellPrice > 0) {
      sellPrice = (history as any).sellPrice;
    } else {
      try {
        const refKey = `${userId}_${type}_${reference}`;
        const refDocRef = doc(db, "user_purchase_references", refKey);
        const refDoc = await getDoc(refDocRef);
        if (refDoc.exists() && refDoc.data().sellPrice) {
          sellPrice = refDoc.data().sellPrice;
        }
      } catch (refError) {
        console.warn('⚠️ ไม่สามารถดึงราคาจาก reference ได้:', refError);
      }
      
      // 3. ถ้ายังไม่มี ให้ใช้ราคาจาก API
      if (sellPrice === 0) {
        const apiPrice = (history as { price: string | number }).price;
        sellPrice = typeof apiPrice === 'string' ? parseFloat(apiPrice) : apiPrice;
      }
    }
    
    // สร้าง object โดยไม่ใส่ undefined values (Firestore ไม่รองรับ)
    const historyRecord: Omit<FirestorePurchaseHistory, 'id'> = {
      userId,
      type,
      peamsubId: (history as any).id,
      reference: 'refId' in history ? (history as any).refId : (history as any).reference,
      price: (history as { price: string | number }).price,
      sellPrice: typeof sellPrice === 'number' && !isNaN(sellPrice) ? sellPrice : 0,
      status: (history as any).status || '',
      date: (history as any).date || '',
      resellerId: (history as any).resellerId || '',
      syncedAt: new Date()
    };
    
    // เพิ่ม optional fields เฉพาะเมื่อมีค่า (ไม่ใส่ undefined)
    if ('productName' in history && history.productName) {
      historyRecord.productName = history.productName;
    }
    if ('productId' in history && history.productId) {
      historyRecord.productId = history.productId;
    }
    if ('info' in history && history.info) {
      historyRecord.info = history.info;
    } else if ('prize' in history && history.prize) {
      // สำหรับ premium products ที่มี prize แทน info
      historyRecord.info = history.prize;
    }

    // ใช้ setDoc แทน addDoc เพื่อ update ถ้ามีอยู่แล้ว
    const docRef = doc(db, "peamsub_purchases", uniqueKey);
    await setDoc(docRef, historyRecord, { merge: true });
    
    console.log('✅ เก็บประวัติการซื้อสำเร็จ:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error storing purchase history:', error);
    throw error;
  }
}

/**
 * ดึงประวัติการซื้อจาก Firestore
 */
export async function getUserPurchaseHistory(
  userId: string
): Promise<FirestorePurchaseHistory[]> {
  try {
    console.log('📋 กำลังดึงประวัติการซื้อจาก Firestore...', userId);
    
    // ใช้ query แบบง่ายๆ ที่ไม่ต้องใช้ Index (ลบ orderBy ออก)
    const q = query(
      collection(db, "peamsub_purchases"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const history: FirestorePurchaseHistory[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        syncedAt: data.syncedAt?.toDate ? data.syncedAt.toDate() : new Date(data.syncedAt)
      } as FirestorePurchaseHistory);
    });
    
    // เรียงลำดับใน JavaScript แทน (ใหม่สุดก่อน)
    history.sort((a, b) => {
      const dateA = new Date(a.date || a.syncedAt || 0).getTime();
      const dateB = new Date(b.date || b.syncedAt || 0).getTime();
      return dateB - dateA; // ใหม่สุดก่อน
    });
    
    console.log('✅ ดึงประวัติการซื้อสำเร็จ:', history.length, 'รายการ');
    return history;
  } catch (error) {
    console.error('❌ Error getting purchase history:', error);
    throw error;
  }
}

/**
 * ดึงประวัติการซื้อทั้งหมด (สำหรับ Admin)
 */
export async function getAllPurchaseHistory(): Promise<FirestorePurchaseHistory[]> {
  try {
    console.log('📋 กำลังดึงประวัติการซื้อทั้งหมดจาก Firestore...');

    const q = query(collection(db, 'peamsub_purchases'));
    const querySnapshot = await getDocs(q);
    const history: FirestorePurchaseHistory[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      history.push({
        id: docSnap.id,
        ...data,
        syncedAt: (data as any).syncedAt?.toDate ? (data as any).syncedAt.toDate() : new Date((data as any).syncedAt)
      } as FirestorePurchaseHistory);
    });

    // เรียงลำดับใหม่สุดก่อน
    history.sort((a, b) => {
      const dateA = new Date(a.date || a.syncedAt || 0).getTime();
      const dateB = new Date(b.date || b.syncedAt || 0).getTime();
      return dateB - dateA;
    });

    console.log('✅ ดึงประวัติการซื้อทั้งหมดสำเร็จ:', history.length, 'รายการ');
    return history;
  } catch (error) {
    console.error('❌ Error getting all purchase history:', error);
    throw error;
  }
}

/**
 * Sync ประวัติจาก API ลง Firestore
 * ใช้เพื่อ sync ประวัติใหม่ๆ จาก API มาเก็บใน Firestore
 * แต่จะเก็บเฉพาะ reference ที่ user นี้เคยซื้อจริงๆ
 */
export async function syncPurchaseHistoryFromAPI(
  userId: string,
  type: 'premium' | 'game' | 'mobile' | 'cashcard',
  histories: (PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubMobileHistory | PeamsubCashCardHistory)[]
): Promise<void> {
  try {
    console.log(`🔄 กำลัง sync ประวัติการซื้อ ${type} จาก API ลง Firestore...`, histories.length);
    
    // ดึง reference ทั้งหมดที่ user นี้เคยซื้อ
    const userReferences = await getUserPurchaseReferences(userId, type);
    console.log(`📋 User references:`, userReferences);
    
    // Filter เฉพาะประวัติที่มี reference ตรงกับของ user
    const userHistories = histories.filter(history => {
      const ref = 'refId' in history ? history.refId : history.reference;
      return userReferences.includes(ref);
    });
    
    console.log(`✅ พบประวัติของผู้ใช้`, userHistories.length, 'รายการ จาก', histories.length, 'รายการทั้งหมด');
    
    // เก็บแต่ละรายการ
    const promises = userHistories.map(history => storePurchaseHistory(userId, type, history));
    await Promise.all(promises);
    
    console.log('✅ Sync ประวัติการซื้อสำเร็จ:', userHistories.length, 'รายการ');
  } catch (error) {
    console.error('❌ Error syncing purchase history:', error);
    throw error;
  }
}

/**
 * เพิ่ม reference เมื่อมีการซื้อสินค้าสำเร็จ พร้อมบันทึกราคาขาย
 */
export async function addUserPurchaseReference(
  userId: string,
  type: 'premium' | 'game' | 'mobile' | 'cashcard' | 'gamecode',
  reference: string,
  sellPrice?: number // ราคาที่จ่ายให้เว็บไซต์
): Promise<void> {
  try {
    console.log('💾 กำลังเก็บ reference:', { userId, type, reference, sellPrice });
    
    const uniqueKey = `${userId}_${type}_${reference}`;
    const docRef = doc(db, "user_purchase_references", uniqueKey);
    
    const referenceData: any = {
      userId,
      type,
      reference,
      createdAt: serverTimestamp()
    };
    
    // ถ้ามีราคาขาย ให้บันทึกด้วย
    if (sellPrice !== undefined && sellPrice !== null) {
      referenceData.sellPrice = sellPrice;
    }
    
    await setDoc(docRef, referenceData, { merge: true });
    
    console.log('✅ เก็บ reference สำเร็จ');
  } catch (error) {
    console.error('❌ Error adding user purchase reference:', error);
    throw error;
  }
}

/**
 * บันทึกการซื้อสินค้าพร้อมราคาขายที่จ่ายจริง
 */
export async function recordPurchaseWithSellPrice(
  userId: string,
  type: 'premium' | 'game' | 'mobile' | 'cashcard',
  reference: string,
  peamsubId: number,
  sellPrice: number, // ราคาที่จ่ายให้เว็บไซต์
  apiPrice: number | string, // ราคาจาก API
  productName?: string,
  productId?: string,
  info?: string,
  status: string = 'pending',
  resellerId: string = ''
): Promise<void> {
  try {
    console.log('💾 กำลังบันทึกการซื้อสินค้าพร้อมราคาขาย...', { userId, type, reference, sellPrice, apiPrice });
    
    // บันทึก reference พร้อมราคาขาย
    await addUserPurchaseReference(userId, type, reference, sellPrice);
    
    // บันทึกลง purchase history
    const uniqueKey = `${type}_${reference}`;
    const historyDocRef = doc(db, "peamsub_purchases", uniqueKey);
    
    const historyData: Omit<FirestorePurchaseHistory, 'id'> = {
      userId,
      type,
      peamsubId,
      reference,
      price: apiPrice,
      sellPrice,
      status,
      date: new Date().toISOString(),
      syncedAt: new Date()
    };
    
    // เพิ่ม optional fields เฉพาะเมื่อมีค่า (ไม่ใส่ undefined)
    if (productName) {
      historyData.productName = productName;
    }
    if (productId) {
      historyData.productId = productId;
    }
    if (info) {
      historyData.info = info;
    }
    if (resellerId) {
      historyData.resellerId = resellerId;
    }
    
    await setDoc(historyDocRef, historyData, { merge: true });
    
    console.log('✅ บันทึกการซื้อสินค้าพร้อมราคาขายสำเร็จ');
  } catch (error) {
    console.error('❌ Error recording purchase with sell price:', error);
    throw error;
  }
}

/**
 * ดึง reference ทั้งหมดที่ user เคยซื้อ
 */
export async function getUserPurchaseReferences(
  userId: string,
  type: 'premium' | 'game' | 'mobile' | 'cashcard'
): Promise<string[]> {
  try {
    console.log('📋 กำลังดึง user purchase references:', { userId, type });
    
    const q = query(
      collection(db, "user_purchase_references"),
      where("userId", "==", userId),
      where("type", "==", type)
    );
    
    const querySnapshot = await getDocs(q);
    const references: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      references.push(data.reference);
    });
    
    console.log('✅ ดึง references สำเร็จ:', references.length);
    return references;
  } catch (error) {
    console.error('❌ Error getting user purchase references:', error);
    return [];
  }
}

/**
 * แปลง FirestorePurchaseHistory กลับเป็น API format
 */
export function convertFirestoreToAPI(
  firestoreHistory: FirestorePurchaseHistory
): PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubMobileHistory | PeamsubCashCardHistory {
  // ใช้ recommendedPrice ถ้ามี ถ้าไม่มีให้ใช้ sellPrice
  const recommendedPrice = firestoreHistory.recommendedPrice || firestoreHistory.sellPrice?.toString() || '0';

  if (firestoreHistory.type === 'premium') {
    return {
      id: firestoreHistory.peamsubId,
      productName: firestoreHistory.productName || '',
      productId: firestoreHistory.productId || '',
      prize: firestoreHistory.info || '',
      img: '', // ไม่มีใน Firestore
      price: firestoreHistory.price as string,
      recommendedPrice, // เพิ่มราคาขาย
      refId: firestoreHistory.reference,
      resellerId: firestoreHistory.resellerId,
      status: firestoreHistory.status,
      date: firestoreHistory.date
    } as PeamsubPurchaseHistory;
  } else {
    // สำหรับ game, mobile, cashcard
    return {
      id: firestoreHistory.peamsubId,
      reference: firestoreHistory.reference,
      info: firestoreHistory.info || '',
      price: firestoreHistory.price as number,
      recommendedPrice, // เพิ่มราคาขาย
      status: firestoreHistory.status,
      date: firestoreHistory.date,
      resellerId: firestoreHistory.resellerId
    } as PeamsubGameHistory | PeamsubMobileHistory | PeamsubCashCardHistory;
  }
}

