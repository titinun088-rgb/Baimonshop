// Top-up Transaction Management
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  increment
} from "firebase/firestore";

export interface TopUpTransaction {
  id?: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'promptpay' | 'bank_transfer' | 'truemoney';
  verificationMethod: 'qr' | 'image';
  slipData?: {
    referenceId: string;
    transRef: string;
    dateTime: string;
    senderName: string;
    senderBank: string;
    receiverName: string;
    receiverBank: string;
  };
  createdAt: Date;
  completedAt?: Date;
  failedReason?: string;
}

/**
 * สร้างธุรกรรมการเติมเงินใหม่
 */
export async function createTopUpTransaction(
  userId: string,
  amount: number,
  paymentMethod: 'promptpay' | 'bank_transfer' | 'truemoney',
  verificationMethod: 'qr' | 'image',
  slipData?: any
): Promise<string> {
  try {
    const transactionData = {
      userId,
      amount,
      status: 'pending' as const,
      paymentMethod,
      verificationMethod,
      slipData: slipData ? {
        referenceId: slipData.referenceId || '',
        transRef: slipData.transRef || '',
        dateTime: slipData.dateTime || '',
        senderName: slipData.sender?.account?.name || '',
        senderBank: slipData.sender?.bank?.name || '',
        receiverName: slipData.receiver?.account?.name || '',
        receiverBank: slipData.receiver?.bank?.name || ''
      } : undefined,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "topup_transactions"), transactionData);
    console.log("✅ Created top-up transaction:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating top-up transaction:", error);
    throw error;
  }
}

/**
 * อัปเดตสถานะธุรกรรมเป็น completed และอัปเดตยอดเงินในบัญชี
 */
export async function completeTopUpTransaction(
  transactionId: string,
  userId: string,
  amount: number
): Promise<void> {
  try {
    console.log('🔄 กำลังอัปเดตธุรกรรม:', transactionId);
    console.log('👤 User ID:', userId);
    console.log('💵 จำนวนเงิน:', amount);
    
    // อัปเดตสถานะธุรกรรม
    await updateDoc(doc(db, "topup_transactions", transactionId), {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    console.log('✅ อัปเดตสถานะธุรกรรมเป็น completed แล้ว');

    // ดึงข้อมูลผู้ใช้ก่อนอัปเดต
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ ไม่พบข้อมูลผู้ใช้:', userId);
      throw new Error('User not found');
    }
    
    const currentBalance = userDoc.data().balance || 0;
    console.log('💰 ยอดเงินปัจจุบันใน Firestore:', currentBalance);
    console.log('➕ จะเพิ่ม:', amount);
    console.log('🎯 ยอดเงินที่คาดหวัง:', currentBalance + amount);
    
    // อัปเดตยอดเงินในบัญชีผู้ใช้
    await updateDoc(userRef, {
      balance: increment(amount),
      lastTopUp: serverTimestamp()
    });
    
    // ตรวจสอบยอดเงินหลังอัปเดต
    const updatedUserDoc = await getDoc(userRef);
    const newBalance = updatedUserDoc.data()?.balance || 0;
    console.log('✅ ยอดเงินใหม่ใน Firestore:', newBalance);

    console.log("✅ Completed top-up transaction:", transactionId);
    console.log("💰 Added", amount, "to user balance");
  } catch (error) {
    console.error("❌ Error completing top-up transaction:", error);
    throw error;
  }
}

/**
 * อัปเดตสถานะธุรกรรมเป็น failed
 */
export async function failTopUpTransaction(
  transactionId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, "topup_transactions", transactionId), {
      status: 'failed',
      failedReason: reason,
      completedAt: serverTimestamp()
    });

    console.log("❌ Failed top-up transaction:", transactionId, "Reason:", reason);
  } catch (error) {
    console.error("❌ Error failing top-up transaction:", error);
    throw error;
  }
}

/**
 * ดึงประวัติการเติมเงินของผู้ใช้
 */
export async function getUserTopUpHistory(userId: string): Promise<TopUpTransaction[]> {
  try {
    // ใช้ query แบบง่าย ไม่ต้องใช้ composite index
    const q = query(
      collection(db, "topup_transactions"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const transactions: TopUpTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        verificationMethod: data.verificationMethod,
        slipData: data.slipData,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : undefined,
        failedReason: data.failedReason
      });
    });

    // เรียงลำดับใน JavaScript แทนการใช้ orderBy ใน Firestore
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return transactions;
  } catch (error) {
    console.error("❌ Error getting user top-up history:", error);
    throw error;
  }
}

/**
 * ดึงสถิติการเติมเงินของผู้ใช้
 */
export async function getUserTopUpStats(userId: string): Promise<{
  totalAmount: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}> {
  try {
    const transactions = await getUserTopUpHistory(userId);
    
    const stats = {
      totalAmount: 0,
      successfulTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0
    };

    transactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        stats.totalAmount += transaction.amount;
        stats.successfulTransactions++;
      } else if (transaction.status === 'pending') {
        stats.pendingTransactions++;
      } else if (transaction.status === 'failed') {
        stats.failedTransactions++;
      }
    });

    return stats;
  } catch (error) {
    console.error("❌ Error getting user top-up stats:", error);
    throw error;
  }
}

/**
 * ตรวจสอบว่ามีการเติมเงินซ้ำ (ใช้ referenceId)
 */
export async function checkDuplicateTopUp(referenceId: string): Promise<boolean> {
  try {
    console.log('🔍 checkDuplicateTopUp: กำลังตรวจสอบ Reference ID:', referenceId);
    
    const q = query(
      collection(db, "topup_transactions"),
      where("slipData.referenceId", "==", referenceId)
    );

    console.log('🔍 checkDuplicateTopUp: สร้าง query แล้ว');
    const querySnapshot = await getDocs(q);
    console.log('🔍 checkDuplicateTopUp: ได้ผลลัพธ์', querySnapshot.size, 'รายการ');
    
    const isEmpty = querySnapshot.empty;
    console.log('🔍 checkDuplicateTopUp: querySnapshot.empty =', isEmpty);
    console.log('🔍 checkDuplicateTopUp: จะ return', !isEmpty);
    
    return !isEmpty;
  } catch (error) {
    console.error("❌ Error checking duplicate top-up:", error);
    return false;
  }
}

