# 💻 ตัวอย่างโค้ดระบบตรวจสอบสลิป (Code Examples)

## 📚 สารบัญ
1. [slip2goUtils.ts](#slip2goutilsts---complete-code)
2. [topupUtils.ts](#topuputilsts---complete-code)
3. [TopUp.tsx](#toptuptsx---complete-code)
4. [Users.tsx (เติม/หักเงิน)](#userstsx---topup--deduct-code)
5. [TopUpHistory.tsx](#topuphistorytsx---complete-code)
6. [SlipHistory.tsx](#sliphistorytsx---complete-code)

---

## slip2goUtils.ts - Complete Code

```typescript
// src/lib/slip2goUtils.ts

const SLIP2GO_API_KEY = import.meta.env.VITE_SLIP2GO_API_KEY || '';
const SLIP2GO_API_BASE_URL = 'https://api.slip2go.com/api/v1';

// ===== Types =====
export interface SlipData {
  referenceId: string;
  amount: number;
  dateTime: string;
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
  receiver: {
    account: {
      name: string;
      bank: {
        account: string | null;
      };
    };
    bank: {
      id: string;
      name: string | null;
    };
  };
  transRef: string;
  ref1?: string | null;
  ref2?: string | null;
  ref3?: string | null;
}

export interface SlipVerificationResult {
  success: boolean;
  data?: SlipData;
  error?: string;
}

export interface CheckCondition {
  amount?: number;
  transRef?: string;
  receiverAccount?: string;
}

// ===== Helper Functions =====
export function formatAmount(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' บาท';
}

export function formatDate(date: any): string {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== API Functions =====

/**
 * ตรวจสอบสลิปจากรูปภาพ
 */
export async function verifySlipByImage(
  imageFile: File,
  checkCondition?: CheckCondition
): Promise<SlipVerificationResult> {
  try {
    console.log('🔍 กำลังตรวจสอบสลิป...', { checkCondition });

    const formData = new FormData();
    formData.append('files', imageFile);

    if (checkCondition) {
      formData.append('amount', checkCondition.amount?.toString() || '');
      formData.append('transRef', checkCondition.transRef || '');
      if (checkCondition.receiverAccount) {
        formData.append('receiverAccount', checkCondition.receiverAccount);
      }
    }

    const response = await fetch(`${SLIP2GO_API_BASE_URL}/verify`, {
      method: 'POST',
      headers: {
        'x-authorization': SLIP2GO_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      console.log('✅ ตรวจสอบสลิปสำเร็จ:', result.data);
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.message || 'ไม่สามารถตรวจสอบสลิปได้'
      };
    }
  } catch (error) {
    console.error('❌ Error verifying slip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    };
  }
}

/**
 * ค้นหาข้อมูลสลิปด้วย Reference ID
 */
export async function getSlipByReferenceId(
  referenceId: string
): Promise<SlipData> {
  try {
    const response = await fetch(
      `${SLIP2GO_API_BASE_URL}/slips/${referenceId}`,
      {
        method: 'GET',
        headers: {
          'x-authorization': SLIP2GO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('ไม่พบข้อมูลสลิป');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting slip:', error);
    throw error;
  }
}

/**
 * สร้าง QR Code สำหรับ PromptPay
 */
export async function generatePromptPayQRCode(
  phoneNumber: string,
  amount: number
): Promise<string> {
  try {
    const response = await fetch(`${SLIP2GO_API_BASE_URL}/qr/promptpay`, {
      method: 'POST',
      headers: {
        'x-authorization': SLIP2GO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        amount: amount
      })
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถสร้าง QR Code ได้');
    }

    const result = await response.json();
    return result.data.qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR:', error);
    throw error;
  }
}

/**
 * สร้างลิงก์รูป QR Code (ไม่ใช้ API)
 */
export function generatePromptPayQRImageLink(
  phoneNumber: string,
  amount: number
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  return `https://promptpay.io/${cleanPhone}/${amount}.png`;
}
```

---

## topupUtils.ts - Complete Code

```typescript
// src/lib/topupUtils.ts

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// ===== Types =====
export interface TopUpTransaction {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'promptpay' | 'bank_transfer' | 'admin';
  verificationMethod: 'qr' | 'image' | 'manual';
  createdAt: any;
  completedAt?: any;
  failedAt?: any;
  failedReason?: string;
  slipData?: {
    referenceId?: string;
    senderName?: string;
    senderAccount?: string;
    receiverAccount?: string;
    amount?: number;
    transRef?: string;
    ref1?: string;
    ref2?: string;
    ref3?: string;
    reason?: string;
    adminTopUp?: boolean;
    adminDeduct?: boolean;
    adminId?: string;
  };
}

// ===== Functions =====

/**
 * สร้างธุรกรรมการเติมเงิน
 */
export async function createTopUpTransaction(
  userId: string,
  amount: number,
  paymentMethod: 'promptpay' | 'bank_transfer' | 'admin',
  verificationMethod: 'qr' | 'image' | 'manual',
  slipData?: any
): Promise<string> {
  try {
    const transactionData = {
      userId,
      amount,
      status: 'pending' as const,
      paymentMethod,
      verificationMethod,
      createdAt: Timestamp.now(),
      slipData: slipData || {}
    };

    const docRef = await addDoc(
      collection(db, 'topUpTransactions'),
      transactionData
    );

    console.log('✅ Created transaction:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  }
}

/**
 * อัปเดตธุรกรรมให้สำเร็จและเติมเงิน
 */
export async function completeTopUpTransaction(
  transactionId: string,
  userId: string,
  amount: number
): Promise<void> {
  try {
    // อัปเดตสถานะธุรกรรม
    const transactionRef = doc(db, 'topUpTransactions', transactionId);
    await updateDoc(transactionRef, {
      status: 'completed',
      completedAt: Timestamp.now()
    });

    // อัปเดตยอดเงินผู้ใช้
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(amount) // + สำหรับเติม, - สำหรับหัก
    });

    console.log('✅ Transaction completed:', transactionId);
  } catch (error) {
    console.error('❌ Error completing transaction:', error);
    throw error;
  }
}

/**
 * ตั้งค่าธุรกรรมให้ล้มเหลว
 */
export async function failTopUpTransaction(
  transactionId: string,
  reason: string
): Promise<void> {
  try {
    const transactionRef = doc(db, 'topUpTransactions', transactionId);
    await updateDoc(transactionRef, {
      status: 'failed',
      failedAt: Timestamp.now(),
      failedReason: reason
    });

    console.log('⚠️ Transaction failed:', transactionId);
  } catch (error) {
    console.error('❌ Error failing transaction:', error);
    throw error;
  }
}

/**
 * ดึงประวัติการเติมเงินของผู้ใช้
 */
export async function getUserTopUpHistory(
  userId: string
): Promise<TopUpTransaction[]> {
  try {
    const q = query(
      collection(db, 'topUpTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const transactions: TopUpTransaction[] = [];

    snapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as TopUpTransaction);
    });

    return transactions;
  } catch (error) {
    console.error('❌ Error getting history:', error);
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

    transactions.forEach((transaction) => {
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
    console.error('❌ Error getting stats:', error);
    throw error;
  }
}
```

---

## TopUp.tsx - Complete Code

```typescript
// src/pages/TopUp.tsx (ส่วนสำคัญ)

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { verifySlipByImage } from "@/lib/slip2goUtils";
import { createTopUpTransaction, completeTopUpTransaction } from "@/lib/topupUtils";
import { toast } from "sonner";

const TopUp = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(0);
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);

  // จัดการไฟล์รูปภาพ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return;
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ');
        return;
      }

      setSlipImage(file);
      toast.success('เลือกรูปภาพสำเร็จ');
    }
  };

  // ตรวจสอบสลิปและเติมเงิน
  const handleVerifySlip = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!slipImage) {
      toast.error('กรุณาเลือกรูปสลิป');
      return;
    }

    if (amount <= 0) {
      toast.error('กรุณากรอกจำนวนเงิน');
      return;
    }

    setVerifying(true);
    try {
      // 1. ตรวจสอบสลิป
      const checkCondition = {
        amount: amount,
        // receiverAccount: '1234567890' // เพิ่มถ้าต้องการตรวจสอบบัญชีปลายทาง
      };

      console.log('🔍 กำลังตรวจสอบสลิป...');
      const result = await verifySlipByImage(slipImage, checkCondition);

      if (!result.success || !result.data) {
        toast.error(result.error || 'ไม่สามารถตรวจสอบสลิปได้');
        return;
      }

      // 2. ตรวจสอบจำนวนเงิน
      if (result.data.amount !== amount) {
        toast.error(
          `จำนวนเงินไม่ตรงกัน (สลิป: ${result.data.amount} บาท, กรอก: ${amount} บาท)`
        );
        return;
      }

      // 3. สร้างธุรกรรม
      console.log('💾 กำลังสร้างธุรกรรม...');
      const transactionId = await createTopUpTransaction(
        user.uid,
        amount,
        'promptpay',
        'image',
        {
          referenceId: result.data.referenceId,
          senderName: result.data.sender.account.name,
          senderAccount: result.data.sender.account.bank.account,
          receiverAccount: result.data.receiver.account.bank.account || '',
          amount: result.data.amount,
          transRef: result.data.transRef,
          ref1: result.data.ref1,
          ref2: result.data.ref2,
          ref3: result.data.ref3
        }
      );

      // 4. เติมเงิน
      console.log('💰 กำลังเติมเงิน...');
      await completeTopUpTransaction(transactionId, user.uid, amount);

      // 5. สำเร็จ
      toast.success(`เติมเงิน ${amount.toLocaleString()} บาทสำเร็จ!`);
      
      // รีเซ็ตฟอร์ม
      setAmount(0);
      setSlipImage(null);

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('เกิดข้อผิดพลาดในการเติมเงิน');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* จำนวนเงิน */}
      <div>
        <Label>จำนวนเงิน (บาท)</Label>
        <Input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="กรอกจำนวนเงิน"
          min="1"
        />
      </div>

      {/* QR Code */}
      {amount > 0 && (
        <div className="text-center">
          <img
            src={`https://promptpay.io/0812345678/${amount}.png`}
            alt="QR Code"
            className="mx-auto w-64 h-64"
          />
          <p className="text-sm text-gray-600 mt-2">
            สแกน QR Code เพื่อโอนเงิน {amount.toLocaleString()} บาท
          </p>
        </div>
      )}

      {/* อัปโหลดสลิป */}
      <div>
        <Label>อัปโหลดสลิปการโอนเงิน</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {slipImage && (
          <p className="text-sm text-green-600 mt-2">
            ✓ เลือกไฟล์: {slipImage.name}
          </p>
        )}
      </div>

      {/* ปุ่มตรวจสอบ */}
      <Button
        onClick={handleVerifySlip}
        disabled={verifying || !slipImage || amount <= 0}
        className="w-full"
      >
        {verifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            กำลังตรวจสอบสลิป...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            ตรวจสอบสลิปและเติมเงิน
          </>
        )}
      </Button>
    </div>
  );
};

export default TopUp;
```

---

## Users.tsx - TopUp & Deduct Code

```typescript
// src/pages/Users.tsx (ส่วนเติมและหักเงิน)

import { useState } from "react";
import { createTopUpTransaction, completeTopUpTransaction } from "@/lib/topupUtils";
import { toast } from "sonner";

const Users = () => {
  const [userToTopUp, setUserToTopUp] = useState<UserData | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpReason, setTopUpReason] = useState("");
  const [toppingUp, setToppingUp] = useState(false);

  const [userToDeduct, setUserToDeduct] = useState<UserData | null>(null);
  const [deductAmount, setDeductAmount] = useState(0);
  const [deductReason, setDeductReason] = useState("");
  const [deducting, setDeducting] = useState(false);

  // ✅ เติมเงินให้ผู้ใช้
  const handleTopUpUser = async () => {
    if (!userToTopUp || topUpAmount <= 0) return;

    setToppingUp(true);
    try {
      // สร้างธุรกรรม
      const transactionId = await createTopUpTransaction(
        userToTopUp.uid,
        topUpAmount,
        'admin',
        'manual',
        {
          adminTopUp: true,
          reason: topUpReason || 'เติมเงินโดยแอดมิน',
          adminId: 'admin'
        }
      );

      // เติมเงิน
      await completeTopUpTransaction(
        transactionId,
        userToTopUp.uid,
        topUpAmount
      );

      toast.success(
        `เติมเงิน ${topUpAmount.toLocaleString()} บาท ` +
        `ให้ ${userToTopUp.email} สำเร็จ`
      );

      // รีเซ็ต
      setTopUpDialogOpen(false);
      setUserToTopUp(null);
      setTopUpAmount(0);
      setTopUpReason("");

      // โหลดข้อมูลใหม่
      await loadUsers();
    } catch (error) {
      console.error("Error topping up user:", error);
      toast.error("เกิดข้อผิดพลาดในการเติมเงิน");
    } finally {
      setToppingUp(false);
    }
  };

  // ⚠️ หักเงินจากผู้ใช้
  const handleDeductUser = async () => {
    if (!userToDeduct || deductAmount <= 0) return;

    // ตรวจสอบยอดเงิน
    if ((userToDeduct.balance || 0) < deductAmount) {
      toast.error("ยอดเงินไม่เพียงพอที่จะหัก");
      return;
    }

    setDeducting(true);
    try {
      // สร้างธุรกรรมหักเงิน (ใช้จำนวนติดลบ)
      const transactionId = await createTopUpTransaction(
        userToDeduct.uid,
        -deductAmount, // ⚠️ ค่าติดลบ
        'admin',
        'manual',
        {
          adminDeduct: true,
          reason: deductReason || 'หักเงินโดยแอดมิน',
          adminId: 'admin'
        }
      );

      // หักเงิน
      await completeTopUpTransaction(
        transactionId,
        userToDeduct.uid,
        -deductAmount // ⚠️ ค่าติดลบ
      );

      toast.success(
        `หักเงิน ${deductAmount.toLocaleString()} บาท ` +
        `จาก ${userToDeduct.email} สำเร็จ`
      );

      // รีเซ็ต
      setDeductDialogOpen(false);
      setUserToDeduct(null);
      setDeductAmount(0);
      setDeductReason("");

      // โหลดข้อมูลใหม่
      await loadUsers();
    } catch (error) {
      console.error("Error deducting user:", error);
      toast.error("เกิดข้อผิดพลาดในการหักเงิน");
    } finally {
      setDeducting(false);
    }
  };

  return (
    <div>
      {/* Dialog เติมเงิน */}
      <AlertDialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เติมเงินให้ผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription>
              เติมเงินให้ <strong>{userToTopUp?.email}</strong>
              <br />
              ยอดเงินปัจจุบัน: <strong>{userToTopUp?.balance?.toLocaleString()} บาท</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>จำนวนเงิน (บาท)</Label>
              <Input
                type="number"
                value={topUpAmount || ""}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="กรอกจำนวนเงิน"
                min="1"
              />
            </div>
            <div>
              <Label>เหตุผล (ไม่บังคับ)</Label>
              <Input
                value={topUpReason}
                onChange={(e) => setTopUpReason(e.target.value)}
                placeholder="เช่น เติมเงินทดแทน, โบนัสพิเศษ"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toppingUp}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTopUpUser}
              disabled={toppingUp || topUpAmount <= 0}
              className="bg-green-600"
            >
              {toppingUp ? 'กำลังเติมเงิน...' : 'เติมเงิน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog หักเงิน */}
      <AlertDialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>หักเงินจากผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription>
              หักเงินจาก <strong>{userToDeduct?.email}</strong>
              <br />
              ยอดเงินปัจจุบัน: <strong>{userToDeduct?.balance?.toLocaleString()} บาท</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>จำนวนเงินที่จะหัก (บาท)</Label>
              <Input
                type="number"
                value={deductAmount || ""}
                onChange={(e) => setDeductAmount(Number(e.target.value))}
                placeholder="กรอกจำนวนเงินที่จะหัก"
                min="1"
                max={userToDeduct?.balance || 0}
              />
              {deductAmount > (userToDeduct?.balance || 0) && (
                <p className="text-sm text-red-500 mt-1">
                  ยอดเงินไม่เพียงพอ (สูงสุด {userToDeduct?.balance?.toLocaleString()} บาท)
                </p>
              )}
            </div>
            <div>
              <Label>เหตุผล (ไม่บังคับ)</Label>
              <Input
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
                placeholder="เช่น ปรับยอด, หักค่าปรับ"
              />
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                การหักเงินจะไม่สามารถยกเลิกได้ กรุณาตรวจสอบข้อมูลให้ถูกต้อง
              </AlertDescription>
            </Alert>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deducting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeductUser}
              disabled={
                deducting || 
                deductAmount <= 0 || 
                deductAmount > (userToDeduct?.balance || 0)
              }
              className="bg-red-600"
            >
              {deducting ? 'กำลังหักเงิน...' : 'หักเงิน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
```

---

## TopUpHistory.tsx - Complete Code

```typescript
// src/pages/TopUpHistory.tsx (ส่วนสำคัญ)

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTopUpHistory, getUserTopUpStats } from "@/lib/topupUtils";
import { formatAmount, formatDate } from "@/lib/slip2goUtils";

const TopUpHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        getUserTopUpHistory(user.uid),
        getUserTopUpStats(user.uid)
      ]);

      setTransactions(historyData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("ไม่สามารถโหลดประวัติได้");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            สำเร็จ
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            รอดำเนินการ
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            ล้มเหลว
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* สถิติ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>ยอดรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(stats.totalAmount)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>สำเร็จ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.successfulTransactions} รายการ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รอดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingTransactions} รายการ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ล้มเหลว</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {stats.failedTransactions} รายการ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* รายการทั้งหมด */}
        <Card>
          <CardHeader>
            <CardTitle>รายการทั้งหมด ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">ยังไม่มีประวัติการเติมเงิน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">
                              {transaction.paymentMethod === 'admin'
                                ? transaction.amount < 0
                                  ? 'หักเงินโดยแอดมิน'
                                  : 'เติมเงินโดยแอดมิน'
                                : transaction.paymentMethod === 'promptpay'
                                ? 'PromptPay'
                                : 'โอนเงินธนาคาร'}
                            </h4>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.slipData?.reason && (
                            <p className="text-sm text-gray-600">
                              {transaction.slipData.reason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            transaction.amount < 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            {transaction.amount > 0 && '+'}
                            {formatAmount(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TopUpHistory;
```

---

## SlipHistory.tsx - Complete Code

```typescript
// src/pages/SlipHistory.tsx (ส่วนสำคัญ)

import { useState } from "react";
import { getSlipByReferenceId } from "@/lib/slip2goUtils";
import { toast } from "sonner";

const SlipHistory = () => {
  const [referenceId, setReferenceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const handleSearchByReferenceId = async () => {
    if (!referenceId.trim()) {
      toast.error('กรุณากรอก Reference ID');
      return;
    }

    setIsLoading(true);
    try {
      const slipData = await getSlipByReferenceId(referenceId);
      setSelectedSlip(slipData);
      toast.success('พบข้อมูลสลิป!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('ไม่พบข้อมูลสลิป');
      setSelectedSlip(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('คัดลอกแล้ว!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาสลิป</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="กรอก Reference ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
              <Button onClick={handleSearchByReferenceId} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedSlip && (
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดสลิป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* จำนวนเงิน */}
              <div>
                <Label>จำนวนเงิน</Label>
                <p className="text-3xl font-bold text-green-600">
                  {selectedSlip.amount.toLocaleString()} บาท
                </p>
              </div>

              {/* ผู้ส่ง */}
              <div>
                <Label>ผู้ส่ง</Label>
                <p className="font-semibold">{selectedSlip.sender.account.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedSlip.sender.bank.name} - {selectedSlip.sender.account.bank.account}
                </p>
              </div>

              {/* ผู้รับ */}
              <div>
                <Label>ผู้รับ</Label>
                <p className="font-semibold">{selectedSlip.receiver.account.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedSlip.receiver.bank.name || 'PromptPay'}
                </p>
              </div>

              {/* Reference ID */}
              <div>
                <Label>Reference ID</Label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm">
                    {selectedSlip.referenceId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedSlip.referenceId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* วันที่ */}
              <div>
                <Label>วันที่ทำรายการ</Label>
                <p>{new Date(selectedSlip.dateTime).toLocaleString('th-TH')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SlipHistory;
```

---

**Last Updated:** December 7, 2025  
**Version:** 1.0.0
