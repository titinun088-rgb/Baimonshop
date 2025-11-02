import { db } from "./firebase";
import {
  doc,
  serverTimestamp,
  getDoc,
  runTransaction
} from "firebase/firestore";

/**
 * อัพเดทยอดเงินในบัญชีผู้ใช้
 */
export async function updateUserBalance(userId: string, amount: number, isTopUp: boolean = true): Promise<{
  success: boolean;
  newBalance: number | null;
  error?: string;
}> {
  try {
    console.log(`${isTopUp ? '💰 กำลังเติมเงิน' : '💸 กำลังหักเงิน'} จำนวน:`, amount, 'สำหรับผู้ใช้:', userId);
    
    const userRef = doc(db, "users", userId);
    let newBalance: number;
    
    // ใช้ transaction เพื่อให้แน่ใจว่าการอัพเดทยอดเงินถูกต้อง
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }
      
      const currentBalance = userDoc.data().balance || 0;
      
      // ถ้าเป็นการหักเงิน ต้องตรวจสอบยอดก่อน
      if (!isTopUp && currentBalance < amount) {
        throw new Error('ยอดเงินไม่เพียงพอ');
      }
      
      newBalance = isTopUp ? (currentBalance + amount) : (currentBalance - amount);
      
      transaction.update(userRef, {
        balance: newBalance,
        lastUpdated: serverTimestamp()
      });
    });

    return {
      success: true,
      newBalance: newBalance!
    };
    
  } catch (error) {
    console.error(`❌ Error ${isTopUp ? 'adding to' : 'deducting from'} balance:`, error);
    return {
      success: false,
      newBalance: null,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดทยอดเงิน'
    };
  }
}

/**
 * เติมเงินเข้าบัญชีผู้ใช้
 */
export async function topUpBalance(userId: string, amount: number): Promise<{
  success: boolean;
  newBalance: number | null;
  error?: string;
}> {
  return updateUserBalance(userId, amount, true);
}

/**
 * หักเงินจากบัญชีผู้ใช้
 */
export async function deductBalance(userId: string, amount: number): Promise<{
  success: boolean;
  newBalance: number | null;
  error?: string;
}> {
  return updateUserBalance(userId, amount, false);
}

/**
 * ตรวจสอบยอดเงินของผู้ใช้
 */
export async function checkUserBalance(userId: string): Promise<number | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data().balance || 0;
  } catch (error) {
    console.error('❌ Error checking balance:', error);
    return null;
  }
}