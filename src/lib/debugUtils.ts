// Debug Utilities for Firebase Database Inspection
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from "firebase/firestore";

/**
 * ตรวจสอบข้อมูลทั้งหมดใน topup_transactions
 */
export async function inspectAllTopUpTransactions() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลทั้งหมดใน topup_transactions...');
    
    const q = query(
      collection(db, "topup_transactions"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบข้อมูลทั้งหมด ${querySnapshot.size} รายการ`);
    
    const transactions = [];
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
        createdAt: data.createdAt,
        completedAt: data.completedAt
      });
    });
    
    console.log('📋 ข้อมูลทั้งหมด:', transactions);
    return transactions;
  } catch (error) {
    console.error('❌ Error inspecting topup transactions:', error);
    return [];
  }
}

/**
 * ตรวจสอบข้อมูลสลิปตาม Reference ID พร้อมแสดงรายละเอียด
 */
export async function inspectSlipByReferenceId(referenceId: string) {
  try {
    console.log(`🔍 กำลังตรวจสอบ Reference ID: ${referenceId}`);
    
    const q = query(
      collection(db, "topup_transactions"),
      where("slipData.referenceId", "==", referenceId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบข้อมูล ${querySnapshot.size} รายการสำหรับ Reference ID: ${referenceId}`);
    
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📋 Document ID: ${doc.id}`);
      console.log(`📋 Data:`, data);
      console.log(`📋 slipData:`, data.slipData);
      console.log(`📋 slipData.referenceId:`, data.slipData?.referenceId);
      
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        verificationMethod: data.verificationMethod,
        slipData: data.slipData,
        createdAt: data.createdAt,
        completedAt: data.completedAt
      });
    });
    
    console.log('📋 ข้อมูลสลิป:', transactions);
    return transactions;
  } catch (error) {
    console.error('❌ Error inspecting slip by reference ID:', error);
    return [];
  }
}

/**
 * ตรวจสอบข้อมูลทั้งหมดใน topup_transactions พร้อมแสดงรายละเอียด
 */
export async function inspectAllTopUpTransactionsDetailed() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลทั้งหมดใน topup_transactions...');
    
    const q = query(
      collection(db, "topup_transactions"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบข้อมูลทั้งหมด ${querySnapshot.size} รายการ`);
    
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📋 Document ID: ${doc.id}`);
      console.log(`📋 Data:`, data);
      console.log(`📋 slipData:`, data.slipData);
      console.log(`📋 slipData.referenceId:`, data.slipData?.referenceId);
      console.log('---');
      
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        verificationMethod: data.verificationMethod,
        slipData: data.slipData,
        createdAt: data.createdAt,
        completedAt: data.completedAt
      });
    });
    
    console.log('📋 ข้อมูลทั้งหมด:', transactions);
    return transactions;
  } catch (error) {
    console.error('❌ Error inspecting topup transactions:', error);
    return [];
  }
}

/**
 * ตรวจสอบข้อมูลผู้ใช้ทั้งหมด
 */
export async function inspectAllUsers() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลผู้ใช้ทั้งหมด...');
    
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบผู้ใช้ทั้งหมด ${querySnapshot.size} คน`);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        balance: data.balance,
        role: data.role,
        createdAt: data.createdAt,
        lastTopUp: data.lastTopUp
      });
    });
    
    console.log('👥 ข้อมูลผู้ใช้:', users);
    return users;
  } catch (error) {
    console.error('❌ Error inspecting users:', error);
    return [];
  }
}

/**
 * ตรวจสอบข้อมูลทั้งหมดในฐานข้อมูล
 */
export async function inspectAllDatabaseData() {
  console.log('🚀 เริ่มตรวจสอบข้อมูลทั้งหมดในฐานข้อมูล...');
  
  const results = {
    topUpTransactions: await inspectAllTopUpTransactions(),
    users: await inspectAllUsers()
  };
  
  console.log('✅ ตรวจสอบข้อมูลเสร็จสิ้น');
  return results;
}
