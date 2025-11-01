import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import GeneratePromptPayQR from "@/components/GeneratePromptPayQR";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  CheckCircle, 
  Copy, 
  Loader2,
  ArrowLeft,
  QrCode,
  Plus
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fee: number;
  processingTime: string;
}

const Payment = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get payment data from navigation state
  const paymentData = location.state as {
    amount: number;
    description: string;
    orderId: string;
  } || { amount: 0, description: "", orderId: "" };

  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "promptpay",
      name: "PromptPay",
      description: "ชำระผ่าน QR Code หรือหมายเลขโทรศัพท์",
      icon: <QrCode className="h-6 w-6 text-blue-600" />,
      fee: 0,
      processingTime: "ทันที"
    },
    {
      id: "bank_transfer",
      name: "โอนเงินผ่านธนาคาร",
      description: "โอนเงินผ่านธนาคารต่างๆ",
      icon: <Building2 className="h-6 w-6 text-green-600" />,
      fee: 0,
      processingTime: "1-3 วันทำการ"
    },
    {
      id: "truemoney",
      name: "TrueMoney Wallet",
      description: "ชำระผ่าน TrueMoney Wallet",
      icon: <Wallet className="h-6 w-6 text-orange-600" />,
      fee: 0,
      processingTime: "ทันที"
    }
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentDetails(null);
    setShowQRCode(false);
  };

  const generatePaymentDetails = () => {
    if (!selectedMethod) {
      toast.error("กรุณาเลือกวิธีการชำระเงิน");
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      let details = null;

      switch (selectedMethod) {
        case "promptpay":
          details = {
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021229370016A000000677010111011300660000000005802TH5303764540" + paymentData.amount + "6304",
            phoneNumber: "0812345678",
            amount: paymentData.amount
          };
          setShowQRCode(true);
          break;
        
        case "bank_transfer":
          details = {
            bankName: "ธนาคารกสิกรไทย",
            accountNumber: "1234567890",
            accountName: "บริษัท Game Nexus จำกัด",
            amount: paymentData.amount,
            reference: paymentData.orderId
          };
          break;
        
        case "truemoney":
          details = {
            walletId: "0812345678",
            amount: paymentData.amount,
            transactionId: `TM${Date.now()}`
          };
          break;
      }

      setPaymentDetails(details);
      setIsProcessing(false);
      toast.success("สร้างข้อมูลการชำระเงินเรียบร้อยแล้ว");
    }, 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}เรียบร้อยแล้ว`);
  };

  const confirmPayment = () => {
    toast.success("ยืนยันการชำระเงินเรียบร้อยแล้ว ระบบจะตรวจสอบและอัปเดตสถานะในไม่ช้า");
    navigate("/sales");
  };

  if (!paymentData.amount) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการชำระเงิน</h2>
                <p className="text-gray-600 mb-6">กรุณาเลือกสินค้าและยืนยันการสั่งซื้อก่อน</p>
                <Button onClick={() => navigate("/games")} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับไปเลือกสินค้า
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
            <p className="text-gray-600 mt-2">เลือกวิธีการชำระเงินที่สะดวกสำหรับคุณ</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  สรุปการสั่งซื้อ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">รายการ:</span>
                  <span className="font-medium">{paymentData.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">หมายเลขอ้างอิง:</span>
                  <span className="font-mono text-sm">{paymentData.orderId}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>ยอดรวม:</span>
                  <span className="text-green-600">฿{paymentData.amount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>เลือกวิธีการชำระเงิน</CardTitle>
                <CardDescription>
                  เลือกวิธีการชำระเงินที่สะดวกสำหรับคุณ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedMethod} onValueChange={handlePaymentMethodSelect}>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {method.icon}
                            <div>
                              <Label htmlFor={method.id} className="font-medium cursor-pointer">
                                {method.name}
                              </Label>
                              <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>ค่าธรรมเนียม: ฿{method.fee}</span>
                            <span>เวลาดำเนินการ: {method.processingTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <Button 
                  onClick={generatePaymentDetails}
                  disabled={!selectedMethod || isProcessing}
                  className="w-full mt-6"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังสร้างข้อมูลการชำระเงิน...
                    </>
                  ) : (
                    "สร้างข้อมูลการชำระเงิน"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  ข้อมูลการชำระเงิน
                </CardTitle>
                <CardDescription>
                  กรุณาดำเนินการชำระเงินตามข้อมูลด้านล่าง
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMethod === "promptpay" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-4">ชำระผ่าน PromptPay</h3>
                      {showQRCode && (
                        <div className="flex justify-center mb-4">
                          <img 
                            src={paymentDetails.qrCode} 
                            alt="QR Code" 
                            className="border rounded-lg"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">หมายเลขโทรศัพท์:</span>
                          <span className="font-mono">{paymentDetails.phoneNumber}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.phoneNumber, "หมายเลขโทรศัพท์")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">จำนวนเงิน:</span>
                          <span className="font-bold text-green-600">฿{paymentDetails.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === "bank_transfer" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">โอนเงินผ่านธนาคาร</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ชื่อธนาคาร</Label>
                        <div className="flex items-center gap-2">
                          <Input value={paymentDetails.bankName} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.bankName, "ชื่อธนาคาร")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>หมายเลขบัญชี</Label>
                        <div className="flex items-center gap-2">
                          <Input value={paymentDetails.accountNumber} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.accountNumber, "หมายเลขบัญชี")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ชื่อบัญชี</Label>
                        <div className="flex items-center gap-2">
                          <Input value={paymentDetails.accountName} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.accountName, "ชื่อบัญชี")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>จำนวนเงิน</Label>
                        <div className="flex items-center gap-2">
                          <Input value={`฿${paymentDetails.amount.toLocaleString()}`} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.amount.toString(), "จำนวนเงิน")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>หมายเหตุ:</strong> กรุณาใส่หมายเลขอ้างอิง <code className="bg-yellow-100 px-1 rounded">{paymentDetails.reference}</code> ในการโอนเงิน
                      </p>
                    </div>
                  </div>
                )}

                {selectedMethod === "truemoney" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">ชำระผ่าน TrueMoney Wallet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>หมายเลข Wallet</Label>
                        <div className="flex items-center gap-2">
                          <Input value={paymentDetails.walletId} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.walletId, "หมายเลข Wallet")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>จำนวนเงิน</Label>
                        <div className="flex items-center gap-2">
                          <Input value={`฿${paymentDetails.amount.toLocaleString()}`} readOnly />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentDetails.amount.toString(), "จำนวนเงิน")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>หมายเหตุ:</strong> กรุณาโอนเงินไปยังหมายเลข Wallet ด้านบน และส่งหลักฐานการโอนเงินมาที่ support@gamenexus.com
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Button onClick={confirmPayment} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ยืนยันการชำระเงิน
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Payment;
