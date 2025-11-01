// Slip Storage Management
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";

export interface SlipRecord {
  id?: string;
  referenceId: string;
  transRef: string;
  dateTime: string;
  verifyDate?: string;
  amount: number;
  ref1?: string | null;
  ref2?: string | null;
  ref3?: string | null;
  receiver: {
    account: {
      name: string;
      bank: {
        account?: string | null;
      };
      proxy?: {
        type?: string | null;
        account?: string | null;
      } | null;
    };
    bank: {
      id: string;
      name?: string | null;
    };
  };
  sender: {
    account: {
      name: string;
      bank: {
        account: string;
      };
    };
    bank: {
      id: string;
      name: string;
    };
  };
  verifiedBy?: string; // User ID ที่ตรวจสอบ
  verifiedAt: Date;
  isUsed: boolean; // ใช้เติมเงินแล้วหรือไม่
  usedBy?: string; // User ID ที่ใช้เติมเงิน
  usedAt?: Date;
}

/**
 * เก็บข้อมูลสลิปในฐานข้อมูล
 */
export async function storeSlipRecord(slipData: any, userId?: string): Promise<string> {
  try {
    console.log('💾 กำลังเก็บข้อมูลสลิปในฐานข้อมูล...');
    console.log('📋 Reference ID:', slipData.referenceId);
    
    const slipRecord: Omit<SlipRecord, 'id'> = {
      referenceId: slipData.referenceId || '',
      transRef: slipData.transRef || '',
      dateTime: slipData.dateTime || '',
      verifyDate: slipData.verifyDate || null,
      amount: slipData.amount || 0,
      ref1: slipData.ref1 || null,
      ref2: slipData.ref2 || null,
      ref3: slipData.ref3 || null,
      receiver: {
        account: {
          name: slipData.receiver?.account?.name || '',
          bank: {
            account: slipData.receiver?.account?.bank?.account || null
          },
          proxy: slipData.receiver?.account?.proxy || null
        },
        bank: {
          id: slipData.receiver?.bank?.id || '',
          name: slipData.receiver?.bank?.name || null
        }
      },
      sender: {
        account: {
          name: slipData.sender?.account?.name || '',
          bank: {
            account: slipData.sender?.account?.bank?.account || ''
          }
        },
        bank: {
          id: slipData.sender?.bank?.id || '',
          name: slipData.sender?.bank?.name || ''
        }
      },
      verifiedBy: userId,
      verifiedAt: new Date(),
      isUsed: false
    };

    const docRef = await addDoc(collection(db, "slip_records"), slipRecord);
    console.log('✅ เก็บข้อมูลสลิปสำเร็จ:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error storing slip record:', error);
    throw error;
  }
}

/**
 * ตรวจสอบว่าสลิปเคยถูกใช้หรือไม่
 */
export async function checkSlipDuplicate(referenceId: string): Promise<{
  isDuplicate: boolean;
  slipRecord?: SlipRecord;
}> {
  try {
    console.log('🔍 กำลังตรวจสอบสลิปซ้ำ...');
    console.log('📋 Reference ID:', referenceId);
    
    const q = query(
      collection(db, "slip_records"),
      where("referenceId", "==", referenceId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบข้อมูล ${querySnapshot.size} รายการสำหรับ Reference ID: ${referenceId}`);
    
    if (querySnapshot.empty) {
      console.log('✅ ไม่พบสลิปซ้ำ');
      return { isDuplicate: false };
    }
    
    const slipRecord = querySnapshot.docs[0].data() as SlipRecord;
    console.log('📋 ข้อมูลสลิปที่พบ:', slipRecord);
    console.log('📋 สถานะการใช้งาน:', slipRecord.isUsed);
    
    return {
      isDuplicate: true,
      slipRecord: {
        ...slipRecord,
        id: querySnapshot.docs[0].id
      }
    };
  } catch (error) {
    console.error('❌ Error checking slip duplicate:', error);
    return { isDuplicate: false };
  }
}

/**
 * อัปเดตสถานะสลิปว่าใช้เติมเงินแล้ว
 */
export async function markSlipAsUsed(slipRecordId: string, userId: string): Promise<void> {
  try {
    console.log('🔄 กำลังอัปเดตสถานะสลิปเป็น "ใช้แล้ว"...');
    console.log('📋 Slip Record ID:', slipRecordId);
    console.log('👤 User ID:', userId);
    
    const { updateDoc, doc } = await import("firebase/firestore");
    
    await updateDoc(doc(db, "slip_records", slipRecordId), {
      isUsed: true,
      usedBy: userId,
      usedAt: serverTimestamp()
    });
    
    console.log('✅ อัปเดตสถานะสลิปสำเร็จ');
  } catch (error) {
    console.error('❌ Error marking slip as used:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลสลิปทั้งหมด
 */
export async function getAllSlipRecords(): Promise<SlipRecord[]> {
  try {
    console.log('🔍 กำลังดึงข้อมูลสลิปทั้งหมด...');
    
    const q = query(
      collection(db, "slip_records"),
      orderBy("verifiedAt", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 พบข้อมูลสลิป ${querySnapshot.size} รายการ`);
    
    const slipRecords: SlipRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      slipRecords.push({
        ...data,
        id: doc.id,
        verifiedAt: data.verifiedAt?.toDate() || new Date(),
        usedAt: data.usedAt?.toDate()
      } as SlipRecord);
    });
    
    console.log('📋 ข้อมูลสลิปทั้งหมด:', slipRecords);
    return slipRecords;
  } catch (error) {
    console.error('❌ Error getting all slip records:', error);
    return [];
  }
}

/**
 * ดึงข้อมูลสลิปตาม Reference ID
 */
export async function getSlipRecordByReferenceId(referenceId: string): Promise<SlipRecord | null> {
  try {
    console.log('🔍 กำลังดึงข้อมูลสลิปตาม Reference ID...');
    console.log('📋 Reference ID:', referenceId);
    
    const q = query(
      collection(db, "slip_records"),
      where("referenceId", "==", referenceId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ ไม่พบข้อมูลสลิป');
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    const slipRecord: SlipRecord = {
      ...data,
      id: doc.id,
      verifiedAt: data.verifiedAt?.toDate() || new Date(),
      usedAt: data.usedAt?.toDate()
    } as SlipRecord;
    
    console.log('📋 ข้อมูลสลิปที่พบ:', slipRecord);
    return slipRecord;
  } catch (error) {
    console.error('❌ Error getting slip record by reference ID:', error);
    return null;
  }
}
