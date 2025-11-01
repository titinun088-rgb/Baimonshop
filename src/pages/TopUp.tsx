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
import { useAuth } from "@/contexts/AuthContext";
import { 
  createTopUpTransaction, 
  completeTopUpTransaction,
  checkDuplicateTopUp 
} from "@/lib/topupUtils";

interface SlipVerificationResult {
  success: boolean;
  data?: {
    referenceId: string;
    decode: string;
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
  };
  error?: string;
}

type PaymentMethodType = 'promptpay' | 'bank_transfer' | 'truemoney' | null;

const TopUp = () => {
  const { user, userData, refreshUser, updateBalance } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SlipVerificationResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentMethods = [
    {
      id: 'promptpay' as PaymentMethodType,
      name: 'PromptPay',
      description: 'โอนผ่าน QR Code PromptPay ได้ทันที',
      icon: '📱',
      color: 'from-blue-500 to-blue-700',
      features: ['โอนได้ทันที', 'รองรับทุกธนาคาร', 'ตรวจสอบอัตโนมัติ'],
      recommended: true
    },
    {
      id: 'bank_transfer' as PaymentMethodType,
      name: 'โอนเงินธนาคาร',
      description: 'โอนเงินผ่านธนาคารโดยตรง',
      icon: '🏦',
      color: 'from-green-500 to-green-700',
      features: ['รองรับทุกธนาคาร', 'ตรวจสอบผ่านสลิป', 'ปลอดภัยสูง']
    }
    // TrueMoney Wallet ปิดการใช้งานชั่วคราว
    // {
    //   id: 'truemoney' as PaymentMethodType,
    //   name: 'TrueMoney Wallet',
    //   description: 'ชำระผ่าน TrueMoney Wallet',
    //   icon: '💳',
    //   color: 'from-orange-500 to-orange-700',
    //   features: ['สะดวกรวดเร็ว', 'ไม่มีค่าธรรมเนียม', 'ตรวจสอบทันที']
    // }
  ];


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("ไฟล์รูปภาพใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่า 5MB");
          return;
        }
        
        // ตรวจสอบขนาดไฟล์ (ไม่น้อยกว่า 10KB)
        if (file.size < 10 * 1024) {
          toast.error("ไฟล์รูปภาพเล็กเกินไป กรุณาเลือกไฟล์ที่ใหญ่กว่า 10KB");
          return;
        }
        
        console.log('📁 ไฟล์ที่เลือก:', file.name, `(${file.size} bytes)`);
        console.log('📊 ประเภทไฟล์:', file.type);
        
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      }
    }
  };

  const handleImageSubmit = async () => {
    if (!imageFile) {
      toast.error("กรุณาเลือกรูปภาพสลิป");
      return;
    }

    if (!user || !selectedPaymentMethod) {
      toast.error("กรุณาเข้าสู่ระบบและเลือกวิธีการชำระเงินก่อน");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // สร้าง check condition สำหรับตรวจสอบสลิปซ้ำ
      const checkCondition = createCheckCondition({
        checkDuplicate: true
      });

      console.log('🔍 กำลังตรวจสอบสลิปด้วย Slip2Go API (พร้อมตรวจสอบซ้ำ)...');
      const result = await verifySlipByImage(imageFile, checkCondition);
      
      console.log('📥 ผลลัพธ์จาก Slip2Go API:', result);
      console.log('📊 Success:', result.success);
      console.log('📊 Data:', result.data);
      console.log('📊 Error:', result.error);
      
      if (result.success && result.data) {
        // 🔍 Debug: แสดงข้อมูลที่ได้จาก API
        console.log('📊 ข้อมูลสลิปจาก API:', result.data);
        console.log('🏦 ธนาคารผู้รับ:', result.data.receiver?.bank);
        console.log('👤 บัญชีผู้รับ:', result.data.receiver?.account);
        console.log('📱 Proxy:', result.data.receiver?.account?.proxy);
        
        // ตรวจสอบข้อมูลที่จำเป็น
        console.log('🔍 ตรวจสอบข้อมูลที่จำเป็น:');
        console.log('  - Reference ID:', result.data.referenceId);
        console.log('  - Amount:', result.data.amount);
        console.log('  - DateTime:', result.data.dateTime);
        console.log('  - TransRef:', result.data.transRef);
        
        // ตรวจสอบเลขอ้างอิง (Reference ID) เท่านั้น
        console.log('🔍 เลขอ้างอิงสลิป:', result.data.referenceId);
        
        if (!result.data.referenceId) {
          console.error('❌ ไม่พบเลขอ้างอิงสลิป');
          toast.error("ไม่พบเลขอ้างอิงสลิป กรุณาตรวจสอบสลิปอีกครั้ง");
          setVerificationResult({
            success: false,
            error: "ไม่พบเลขอ้างอิงสลิป"
          });
          return;
        }

        // ตรวจสอบ response code ว่าสลิปซ้ำหรือไม่
        // ถ้า Slip2Go API ส่งกลับ response code 200501 = สลิปซ้ำ
        if (result.error && result.error.includes('duplicate')) {
          console.log('❌ พบสลิปซ้ำจาก Slip2Go API!');
          toast.error("สลิปซ้ำ - สลิปนี้เคยถูกตรวจสอบแล้ว");
          setVerificationResult({
            success: false,
            error: "สลิปซ้ำ - สลิปนี้เคยถูกตรวจสอบแล้ว"
          });
          return;
        }
        
        console.log('✅ สลิปถูกต้อง - ไม่ซ้ำ (ตรวจสอบโดย Slip2Go API)');
        
        // แสดงรายละเอียดสลิป
        console.log('🔄 กำลังตั้งค่า verification result...');
        setVerificationResult(result);
        console.log('✅ ตั้งค่า verification result เสร็จแล้ว');
        
        // อัปเดตจำนวนเงินที่จะเติมจากสลิป
        console.log('🔄 กำลังตั้งค่า top up amount...');
        setTopUpAmount(result.data.amount);
        console.log('✅ ตั้งค่า top up amount เสร็จแล้ว');
        
        console.log('✅ ตรวจสอบเลขอ้างอิงผ่าน! กำลังเติมเงิน...');
        console.log('💰 จำนวนเงินจากสลิป:', result.data.amount, 'บาท');
        console.log('👤 User ID ที่จะเติมเงิน:', user?.uid);
        
        // แสดงข้อความสลิปถูกต้อง
        toast.success("สลิปถูกต้อง - กำลังเติมเงินเข้าสู่ระบบ...");
        
        // เติมเงินอัตโนมัติทันที
        console.log('🔄 กำลังเรียก handleConfirmTopUp...');
        await handleConfirmTopUp(result.data);
        console.log('✅ handleConfirmTopUp เสร็จแล้ว');
          } else {
        // ตรวจสอบว่าเป็น error จากการซ้ำหรือไม่
        if (result.error && result.error.includes('duplicate')) {
          toast.error("สลิปซ้ำ - สลิปนี้เคยถูกตรวจสอบแล้ว");
          setVerificationResult({
            success: false,
            error: "สลิปซ้ำ - สลิปนี้เคยถูกตรวจสอบแล้ว"
          });
      } else {
        setVerificationResult(result);
        toast.error(result.error || "ไม่สามารถตรวจสอบสลิปได้");
        }
      }
    } catch (error) {
      console.error("Error in handleImageSubmit:", error);
      
      // ตรวจสอบประเภทของ error
      if (error instanceof Error) {
        if (error.message.includes('Slip not found')) {
          toast.error("ไม่พบสลิปในระบบ กรุณาตรวจสอบ:\n1. รูปภาพสลิปชัดเจนหรือไม่\n2. เป็นสลิปการโอนเงินจริงหรือไม่\n3. รอสักครู่แล้วลองใหม่\n4. ตรวจสอบการตั้งค่า API");
        } else if (error.message.includes('Network')) {
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        } else {
          toast.error("เกิดข้อผิดพลาดในการตรวจสอบสลิป กรุณาลองใหม่อีกครั้ง");
        }
      } else {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบสลิป");
      }
      
      setVerificationResult({
        success: false,
        error: "เกิดข้อผิดพลาดในการตรวจสอบสลิป"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmTopUp = async (slipData: any) => {
    if (!user || !selectedPaymentMethod) {
      toast.error("ข้อมูลไม่ครบถ้วน");
      return;
    }

    setIsProcessing(true);

    try {
      // ใช้จำนวนเงินจากสลิปแทน topUpAmount
      const slipAmount = slipData.amount || 0;
      
      console.log('💰 ยอดเงินก่อนเติม:', userData?.balance);
      console.log('💵 จำนวนที่จะเติมจากสลิป:', slipAmount, 'บาท');
      
      // 1. สร้างธุรกรรมการเติมเงิน
      const transactionId = await createTopUpTransaction(
        user.uid,
        slipAmount,
        selectedPaymentMethod,
        'image', // ใช้รูปภาพอย่างเดียว
        slipData
      );
      console.log('✅ สร้างธุรกรรม:', transactionId);
      
      // 2. อัปเดตยอดเงินและเปลี่ยนสถานะเป็น completed
      console.log('💰 กำลังบันทึกจำนวนเงิน', slipAmount, 'บาท ไปยัง User ID:', user.uid);
      await completeTopUpTransaction(transactionId, user.uid, slipAmount);
      console.log('✅ บันทึกจำนวนเงินสำเร็จ!');
      
      // 3. รอสักครู่ให้ Firestore sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 4. รีเฟรชข้อมูลผู้ใช้
      console.log('🔄 กำลังโหลดข้อมูลผู้ใช้ใหม่...');
      await refreshUser();
      console.log('✅ โหลดข้อมูลผู้ใช้ใหม่เสร็จแล้ว');
      console.log('💰 ยอดเงินหลังเติม:', userData?.balance);
      
      // 5. ตรวจสอบสลิปอีกครั้งจาก Slip2Go เพื่อยืนยัน
      console.log('🔍 ตรวจสอบสลิปจาก Slip2Go API อีกครั้ง...');
      const slipCheck = await getSlipByReferenceId(slipData.referenceId);
      if (slipCheck.success && slipCheck.data) {
        console.log('✅ ยืนยัน: สลิปถูกบันทึกใน Slip2Go แล้ว');
        console.log('   📊 Status Code:', slipCheck.code);
        console.log('   💬 Message:', slipCheck.message);
        console.log('   💰 จำนวนเงินที่ยืนยัน:', slipCheck.data.amount, 'บาท');
        console.log('   📅 วันที่โอน:', new Date(slipCheck.data.dateTime).toLocaleString('th-TH'));
        console.log('   👤 โอนจาก:', slipCheck.data.sender.account.name);
        console.log('   👥 โอนถึง:', slipCheck.data.receiver.account.name);
        console.log('   🎫 Trans Ref:', slipCheck.data.transRef);
      } else {
        console.warn('⚠️ ไม่สามารถดึงข้อมูลสลิปจาก Slip2Go:', slipCheck.error);
      }
      
      toast.success(
        `✅ เติมเงินสำเร็จ! บันทึกจำนวนเงิน ${formatAmount(slipAmount)} บาท ไปยัง User ID: ${user.uid}`,
        { duration: 5000 }
      );
      
      // Reset form
      setTopUpAmount(0);
      setImageFile(null);
      setImagePreview(null);
      setVerificationResult(null);
      setSelectedPaymentMethod(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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


  // Show payment method selection first
  if (!selectedPaymentMethod) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-5xl font-bold text-white flex items-center justify-center gap-3 mb-4">
                  <Wallet className="h-12 w-12 text-green-400" />
                  เติมเงิน
                </h1>
                <p className="text-gray-200 text-xl font-medium">
                  เลือกวิธีการเติมเงินที่สะดวกสำหรับคุณ
                </p>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className="relative cursor-pointer group"
                  >
                    {method.recommended && (
                      <div className="absolute -top-3 right-4 z-10">
                        <Badge className="bg-yellow-500 text-black font-bold px-3 py-1">
                          ⭐ แนะนำ
                        </Badge>
                      </div>
                    )}
                    <Card className="h-full bg-white hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 border-2 hover:border-blue-500">
                      <CardContent className="p-6">
                        <div className={`w-full h-32 bg-gradient-to-r ${method.color} rounded-lg mb-4 flex items-center justify-center text-6xl shadow-lg`}>
                          {method.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {method.name}
                        </h3>
                        <p className="text-gray-600 mb-4 min-h-[3rem]">
                          {method.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          {method.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 text-lg">
                          เลือกวิธีนี้
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Info Section */}
              <Card className="bg-white shadow-xl border-2 border-blue-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-blue-600" />
                    ข้อมูลสำคัญก่อนเติมเงิน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        ข้อดี
                      </h4>
                      <ul className="space-y-2 text-gray-700 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="font-medium">ตรวจสอบและอนุมัติอัตโนมัติทันที</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="font-medium">รองรับการเติมเงินตลอด 24 ชั่วโมง</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="font-medium">ไม่มีค่าธรรมเนียมการเติมเงิน</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="font-medium">ตรวจสอบสลิปอัตโนมัติด้วย AI</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ข้อควรระวัง
                      </h4>
                      <ul className="space-y-2 text-gray-700 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="font-medium">โปรดตรวจสอบจำนวนเงินให้ถูกต้องก่อนโอน</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="font-medium">เก็บสลิปไว้เป็นหลักฐานการโอนเงิน</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="font-medium">อย่าแชร์ข้อมูลส่วนตัวกับผู้อื่น</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="font-medium">ตรวจสอบบัญชีผู้รับให้ถูกต้อง</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show the payment form after method selection
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPaymentMethod(null);
                  resetForm();
                }}
                className="mb-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold"
              >
                ← กลับไปเลือกวิธีการเติมเงิน
              </Button>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Wallet className="h-8 w-8 text-green-400" />
                เติมเงินผ่าน {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
              </h1>
              <p className="text-gray-200 mt-2">เติมเงินเข้าบัญชีของคุณผ่านการตรวจสอบสลิปการโอนเงิน</p>
            </div>

            {/* Instructions - ย้ายมาด้านบน */}
            <Card className="mb-6 bg-white shadow-xl border-2 border-blue-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  📋 ข้อมูลการโอนเงิน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* แสดงข้อมูลตามวิธีที่เลือก */}
                {selectedPaymentMethod === 'promptpay' ? (
                  // PromptPay - แสดง QR Code
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-4 border-2 border-blue-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center">
                        <h3 className="font-bold text-base mb-2 text-blue-900">
                          📱 สแกน QR Code PromptPay
                        </h3>
                        <img 
                          src="/S__23691273.jpg" 
                          alt="QR Code PromptPay" 
                          className="max-w-[200px] w-full h-auto rounded-lg shadow-md border-4 border-white"
                        />
                        <div className="mt-2 text-center text-xs">
                          <p className="font-bold text-blue-900">
                            นาย พงศกร แก้วดำ
                          </p>
                          <p className="text-gray-700 font-semibold">เบอร์: 0959308178</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-sm">
                            <FileImage className="h-4 w-4 text-green-600" />
                            วิธีการเติมเงิน
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-800 font-medium">
                            <li>สแกน QR Code ด้านซ้ายเพื่อโอนเงิน</li>
                            <li>ถ่ายรูปสลิปการโอนเงิน</li>
                            <li>อัปโหลดรูปสลิป</li>
                            <li>ระบบจะตรวจสอบจำนวนเงินและเติมเงินอัตโนมัติ</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedPaymentMethod === 'bank_transfer' ? (
                  // โอนเงินธนาคาร - แสดงข้อมูลบัญชี
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border-2 border-green-300">
                    <h3 className="font-bold text-xl mb-4 text-green-900 text-center flex items-center justify-center gap-2">
                      🏦 ข้อมูลบัญชีสำหรับโอนเงิน
                    </h3>
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="bg-white rounded-lg p-4 border-2 border-green-400 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="text-gray-700 font-bold">ธนาคาร:</span>
                            <span className="text-green-800 font-bold text-lg">กสิกรไทย (KBANK)</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="text-gray-700 font-bold">เลขที่บัญชี:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-green-800 font-bold text-xl font-mono">0912552233</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText('0912552233');
                                  toast.success('คัดลอกเลขบัญชีแล้ว');
                                }}
                                className="h-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="text-gray-700 font-bold">ชื่อบัญชี:</span>
                            <span className="text-green-800 font-bold text-lg">นาย พงศกร แก้วดำ</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-sm">
                          <FileImage className="h-4 w-4 text-green-600" />
                          วิธีการเติมเงิน
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-800 font-medium">
                          <li>โอนเงินเข้าบัญชีด้านบน</li>
                          <li>ถ่ายรูปสลิปการโอนเงิน</li>
                          <li>อัปโหลดรูปสลิป</li>
                          <li>ระบบจะตรวจสอบจำนวนเงินและเติมเงินอัตโนมัติ</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : selectedPaymentMethod === 'truemoney' ? (
                  // TrueMoney - แสดง QR Code หรือข้อมูล
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-300">
                    <h3 className="font-bold text-xl mb-4 text-orange-900 text-center flex items-center justify-center gap-2">
                      💳 TrueMoney Wallet
                    </h3>
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="bg-white rounded-lg p-4 border-2 border-orange-400 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                            <span className="text-gray-700 font-bold">เบอร์ TrueMoney:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-orange-800 font-bold text-xl font-mono">0959308178</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText('0959308178');
                                  toast.success('คัดลอกเบอร์แล้ว');
                                }}
                                className="h-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                            <span className="text-gray-700 font-bold">ชื่อบัญชี:</span>
                            <span className="text-orange-800 font-bold text-lg">นาย พงศกร แก้วดำ</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-sm">
                          <FileImage className="h-4 w-4 text-orange-600" />
                          วิธีการเติมเงิน
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-800 font-medium">
                          <li>โอนเงินผ่าน TrueMoney Wallet</li>
                          <li>ถ่ายรูปสลิปการโอนเงิน</li>
                          <li>อัปโหลดรูปสลิป</li>
                          <li>ระบบจะตรวจสอบจำนวนเงินและเติมเงินอัตโนมัติ</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                  // ยังไม่เลือกวิธี
                  <div className="text-center py-8">
                    <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-bold">กรุณาเลือกวิธีการเติมเงินด้านบน</p>
                  </div>
                )}
              </CardContent>
            </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Up Form */}
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  กรอกข้อมูลการเติมเงิน
                </CardTitle>
                <CardDescription>
                  อัปโหลดสลิปการโอนเงิน ระบบจะตรวจสอบจำนวนเงินและเติมเงินอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Display - แสดงจำนวนเงินที่ตรวจสอบได้จากสลิป */}
                <div className="space-y-2">
                  <Label className="text-gray-900 font-bold">จำนวนเงินที่จะเติม</Label>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-700 mb-2">ระบบจะตรวจสอบจำนวนเงินจากสลิปอัตโนมัติ</p>
                      {topUpAmount > 0 ? (
                        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
                          <p className="text-lg font-bold text-green-800">
                            จำนวนเงินที่ตรวจสอบได้: {formatAmount(topUpAmount)} บาท
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600 font-medium">กรุณาอัปโหลดสลิปเพื่อตรวจสอบจำนวนเงิน</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Image Method - เหลือแค่รูปภาพอย่างเดียว */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUpload" className="text-gray-900 font-bold">เลือกรูปภาพสลิป</Label>
                      <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:bg-blue-100 transition">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="imageUpload"
                        />
                        <label htmlFor="imageUpload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm text-gray-900 font-bold">
                            คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                          </p>
                          <p className="text-xs text-gray-700 font-semibold mt-1">
                            รองรับไฟล์ JPG, PNG, GIF (10KB - 5MB)
                          </p>
                          <div className="mt-2 text-xs text-gray-600">
                            <p>💡 <strong>คำแนะนำ:</strong></p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>รูปภาพต้องชัดเจน</li>
                              <li>เป็นสลิปการโอนเงินจริง</li>
                              <li>รอสักครู่หลังโอนเงิน</li>
                            </ul>
                          </div>
                        </label>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="space-y-2">
                        <Label className="text-gray-900 font-bold">ตัวอย่างรูปภาพ</Label>
                        <div className="border-2 border-blue-400 rounded-lg p-2 bg-white">
                          <img 
                            src={imagePreview} 
                            alt="Slip preview" 
                            className="max-w-full h-auto max-h-48 mx-auto"
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleImageSubmit}
                      disabled={!imageFile || isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังตรวจสอบ...
                        </>
                      ) : (
                        <>
                          <FileImage className="h-4 w-4 mr-2" />
                          ตรวจสอบรูปภาพ
                        </>
                      )}
                    </Button>
                  </div>

                <Separator />

                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเซ็ตฟอร์ม
                </Button>
              </CardContent>
            </Card>

            {/* Verification Result */}
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult ? (
                    verificationResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  ผลการตรวจสอบ
                </CardTitle>
                <CardDescription>
                  {verificationResult ? (
                    verificationResult.success ? "สลิปถูกต้อง - เติมเงินสำเร็จ" : "ไม่สามารถตรวจสอบสลิปได้"
                  ) : "ยังไม่มีการตรวจสอบ"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!verificationResult ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-900 font-bold">กรุณากรอกจำนวนเงินและตรวจสอบสลิปการโอนเงิน</p>
                  </div>
                ) : verificationResult.success && verificationResult.data ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        สลิปถูกต้อง! บันทึกจำนวนเงิน {formatAmount(verificationResult.data.amount)} บาท ไปยัง User ID: {user?.uid}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-300">
                        <span className="text-gray-900 font-bold">จำนวนเงิน:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-green-700">
                            {formatAmount(verificationResult.data.amount)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(verificationResult.data!.amount.toString())}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900 font-bold">ธนาคารผู้รับ:</span>
                        <span className="font-bold text-gray-900">{verificationResult.data.receiver.bank.name || `ธนาคาร ID: ${verificationResult.data.receiver.bank.id}`}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900 font-bold">ชื่อบัญชีผู้รับ:</span>
                        <span className="font-bold text-gray-900">{verificationResult.data.receiver.account.name}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900 font-bold">ธนาคารผู้ส่ง:</span>
                        <span className="font-bold text-gray-900">{verificationResult.data.sender.bank.name}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900 font-bold">ชื่อผู้ส่ง:</span>
                        <span className="font-bold text-gray-900">{verificationResult.data.sender.account.name}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900 font-bold">วันที่ทำรายการ:</span>
                        <span className="text-sm font-bold text-gray-900">{formatDate(verificationResult.data.dateTime)}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                        <span className="text-gray-900 font-bold">รหัสอ้างอิง:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900">{verificationResult.data.referenceId}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(verificationResult.data!.referenceId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
                      <p className="text-center text-green-800 font-bold text-sm">
                        ✅ เติมเงินเรียบร้อยแล้ว! จำนวนเงินได้ถูกบันทึกไปยัง User ID ของคุณแล้ว
                      </p>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {verificationResult.error || "ไม่สามารถตรวจสอบสลิปได้"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
};

export default TopUp;
