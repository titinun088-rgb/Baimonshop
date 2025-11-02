import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileImage,
  Copy,
  RefreshCw,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  DollarSign,
  Wallet,
  Receipt
} from "lucide-react";
import { 
  verifySlipByImage, 
  formatAmount, 
  formatDate,
  createCheckCondition,
  createCheckAmount,
  getSlipByReferenceId
} from "@/lib/slip2goUtils";
import {
  checkUserBalance,
  topUpBalance
} from "@/lib/balanceUtils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  createTopUpTransaction, 
  completeTopUpTransaction,
  checkDuplicateTopUp 
} from "@/lib/topupUtils";

// ... (ส่วนอื่นๆ คงเดิม) ...

const TopUp = () => {
  // ... (state และ variables คงเดิม) ...

  const handleConfirmTopUp = async (slipData: any) => {
    if (!user || !selectedPaymentMethod) {
      toast.error("ข้อมูลไม่ครบถ้วน");
      return;
    }

    setIsProcessing(true);

    try {
      const amountToTopUp = slipData.amount || 0;
      
      // 1. สร้างธุรกรรมการเติมเงิน
      const transactionId = await createTopUpTransaction(
        user.uid,
        amountToTopUp,
        selectedPaymentMethod,
        'image',
        slipData
      );
      console.log('✅ สร้างธุรกรรม:', transactionId);
      
      // 2. อัปเดตยอดเงินและเปลี่ยนสถานะเป็น completed
      await completeTopUpTransaction(transactionId, user.uid, amountToTopUp);
      
      // 3. รีเฟรชข้อมูลผู้ใช้
      await refreshUser();
      
      console.log('💰 เติมเงินเข้าระบบ:', amountToTopUp, 'บาท');
      
      // แสดงข้อความสำเร็จ
      toast.success(
        `✅ เติมเงินสำเร็จ! เพิ่มจำนวนเงิน ${formatAmount(amountToTopUp)} บาท เข้าสู่ระบบ`,
        { duration: 5000 }
      );

      // รีเซ็ตฟอร์ม
      resetForm();
      setSelectedPaymentMethod(null);
      
    } catch (error) {
      console.error("❌ Error in handleConfirmTopUp:", error);
      toast.error("เกิดข้อผิดพลาดในการเติมเงิน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTopUpAmount(0);
    setImageFile(null);
    setImagePreview(null);
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ... (ส่วน JSX render คงเดิม) ...
};

export default TopUp;