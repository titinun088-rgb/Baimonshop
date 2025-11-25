import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Download, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { generatePromptPayQRImageLink } from '@/lib/slip2goUtils';

interface GeneratePromptPayQRProps {
  defaultAmount?: string;
  defaultAccountName?: string;
  defaultPromptPayCode?: string;
  defaultPromptPayType?: 'phone_number' | 'citizen_id' | 'e_wallet';
}

export const GeneratePromptPayQR = ({
  defaultAmount = '',
  defaultAccountName = 'ผู้ใช้ของฉัน',
  defaultPromptPayCode = '0989949413',
  defaultPromptPayType = 'phone_number'
}: GeneratePromptPayQRProps) => {
  const [promptPayCode, setPromptPayCode] = useState(defaultPromptPayCode);
  const [promptPayType, setPromptPayType] = useState<'phone_number' | 'citizen_id' | 'e_wallet'>(defaultPromptPayType);
  const [accountName, setAccountName] = useState(defaultAccountName);
  const [amount, setAmount] = useState(defaultAmount);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerateQR = async () => {
    if (!promptPayCode.trim()) {
      toast.error('กรุณากรอก PromptPay Code');
      return;
    }
    if (!accountName.trim()) {
      toast.error('กรุณากรอกชื่อบัญชี');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('กรุณากรอกจำนวนเงิน');
      return;
    }

    setLoading(true);
    try {
      const result = await generatePromptPayQRImageLink({
        promptPayCode: promptPayCode.trim(),
        promptPayType,
        accountName: accountName.trim(),
        amount
      });

      if (result.success) {
        setQrImageUrl(result.qrImageUrl || '');
        toast.success('สร้าง QR Code สำเร็จ!');
      } else {
        toast.error(result.error || 'ไม่สามารถสร้าง QR Code ได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrImageUrl) return;
    try {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `promptpay-qr-${Date.now()}.png`;
      link.click();
      toast.success('ดาวน์โหลดสำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถดาวน์โหลดได้');
    }
  };

  const handleCopyUrl = () => {
    if (!qrImageUrl) return;
    navigator.clipboard.writeText(qrImageUrl);
    toast.success('คัดลอก URL แล้ว');
  };

  const handleReset = () => {
    setPromptPayCode(defaultPromptPayCode);
    setPromptPayType(defaultPromptPayType);
    setAccountName(defaultAccountName);
    setAmount(defaultAmount);
    setQrImageUrl('');
  };

  return (
    <Card className="w-full bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <QrCode className="h-5 w-5 text-blue-600" />
          สร้าง QR Code PromptPay
        </CardTitle>
        <CardDescription className="text-gray-700 text-base">
          สร้างรหัส QR Code PromptPay สำหรับรับชำระเงิน
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PromptPay Code */}
          <div className="space-y-2">
            <Label htmlFor="promptPayCode" className="text-gray-900 font-semibold text-sm">
              PromptPay Code
            </Label>
            <Input
              id="promptPayCode"
              placeholder="0812345678"
              value={promptPayCode}
              onChange={(e) => setPromptPayCode(e.target.value)}
              disabled={loading}
              className="text-black font-bold text-base bg-white border-2 border-gray-300 placeholder:text-black"
            />
            <p className="text-xs text-gray-700 font-medium">เบอร์โทร/เลขประชาชน/E-wallet</p>
          </div>

          {/* PromptPay Type */}
          <div className="space-y-2">
            <Label htmlFor="promptPayType" className="text-gray-900 font-semibold text-sm">
              ประเภท PromptPay
            </Label>
            <select
              id="promptPayType"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black font-bold text-base"
              value={promptPayType}
              onChange={(e) => setPromptPayType(e.target.value as any)}
              disabled={loading}
            >
              <option value="phone_number">เบอร์โทรศัพท์</option>
              <option value="citizen_id">เลขบัตรประชาชน</option>
              <option value="e_wallet">E-Wallet</option>
            </select>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-gray-900 font-semibold text-sm">
              ชื่อบัญชี
            </Label>
            <Input
              id="accountName"
              placeholder="ชื่อผู้ใช้"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={loading}
              className="text-black font-bold text-base bg-white border-2 border-gray-300 placeholder:text-black"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-900 font-semibold text-sm">
              จำนวนเงิน (บาท)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="0.01"
              className="text-black font-bold text-lg bg-white border-2 border-gray-300 placeholder:text-black"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateQR}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                สร้าง QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                สร้าง QR Code
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* QR Code Display */}
        {qrImageUrl && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-xl">
                <img
                  src={qrImageUrl}
                  alt="PromptPay QR Code"
                  className="w-64 h-64 border-4 border-blue-500 rounded-lg p-2 bg-white shadow-lg"
                />
              </div>
              <p className="text-green-700 font-semibold text-sm">✅ สร้าง QR Code สำเร็จ</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  คัดลอก URL
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด
                </Button>
              </div>
            </div>

            {/* URL Display */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-semibold">URL QR Code</Label>
              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded text-xs break-all font-mono text-gray-900">
                {qrImageUrl}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratePromptPayQR;
