import { useState } from 'react';
import Layout from '@/components/Layout';
import GeneratePromptPayQR from '@/components/GeneratePromptPayQR';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus, Settings, Copy, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_PROMPTPAY_CONFIG } from '@/lib/paymentHelpers';

interface SavedQRConfig {
  id: string;
  name: string;
  promptPayCode: string;
  promptPayType: 'phone_number' | 'citizen_id' | 'e_wallet';
  accountName: string;
  defaultAmount: string;
  createdAt: Date;
}

const QRCodeManager = () => {
  const [configs, setConfigs] = useState<SavedQRConfig[]>([
    {
      id: '1',
      name: 'ผู้ใช้หลัก',
      promptPayCode: DEFAULT_PROMPTPAY_CONFIG.code,
      promptPayType: DEFAULT_PROMPTPAY_CONFIG.type,
      accountName: DEFAULT_PROMPTPAY_CONFIG.accountName,
      defaultAmount: '1000',
      createdAt: new Date()
    }
  ]);
  const [selectedConfig, setSelectedConfig] = useState<SavedQRConfig | null>(configs[0]);
  const [configName, setConfigName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSaveConfig = (config: SavedQRConfig) => {
    setConfigs([...configs, { ...config, id: Date.now().toString() }]);
    toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
  };

  const handleDeleteConfig = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
    if (selectedConfig?.id === id) {
      setSelectedConfig(configs[0] || null);
    }
    toast.success('ลบการตั้งค่าเรียบร้อยแล้ว');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 pt-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold flex items-center gap-3 mb-2 text-white">
                <QrCode className="h-10 w-10 text-blue-400" />
                จัดการ QR Code PromptPay
              </h1>
              <p className="text-gray-200 text-lg font-medium">
                สร้างและจัดการรหัส QR Code PromptPay สำหรับรับชำระเงิน
              </p>
            </div>

          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="generator" className="flex items-center gap-2 text-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Plus className="h-4 w-4" />
                สร้าง QR Code ใหม่
              </TabsTrigger>
              <TabsTrigger value="configs" className="flex items-center gap-2 text-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="h-4 w-4" />
                การตั้งค่าที่บันทึก ({configs.length})
              </TabsTrigger>
            </TabsList>

            {/* Generator Tab */}
            <TabsContent value="generator">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generator */}
                <div className="lg:col-span-2">
                  <GeneratePromptPayQR
                    defaultPromptPayCode={selectedConfig?.promptPayCode}
                    defaultPromptPayType={selectedConfig?.promptPayType}
                    defaultAccountName={selectedConfig?.accountName}
                    defaultAmount={selectedConfig?.defaultAmount}
                  />
                </div>

                {/* Quick Config Selection */}
                <div>
                  <Card className="bg-white shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                        <Settings className="h-4 w-4 text-blue-600" />
                        การตั้งค่าด่วน
                      </CardTitle>
                      <CardDescription className="text-gray-700 font-medium">
                        เลือกการตั้งค่าที่บันทึกไว้
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {configs.map(config => (
                        <button
                          key={config.id}
                          onClick={() => setSelectedConfig(config)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition ${
                            selectedConfig?.id === config.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-blue-400 bg-white'
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-900">{config.name}</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {config.accountName}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs font-semibold border-green-500 text-green-700">
                            {config.defaultAmount} บาท
                          </Badge>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Configs Tab */}
            <TabsContent value="configs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map(config => (
                  <Card key={config.id} className="border-2 bg-white shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base text-gray-900 font-bold">{config.name}</CardTitle>
                        <Badge variant="outline" className="text-xs font-semibold border-blue-500">
                          {config.promptPayType === 'phone_number' && '📱'}
                          {config.promptPayType === 'citizen_id' && '🆔'}
                          {config.promptPayType === 'e_wallet' && '💳'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-gray-800 font-medium">
                        {config.accountName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-900 font-semibold">Code</p>
                          <p className="font-mono text-xs bg-blue-50 border border-blue-200 text-gray-900 p-2 rounded break-all font-semibold">
                            {config.promptPayCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">จำนวนเงิน</p>
                          <p className="font-bold text-green-700 text-lg">
                            {config.defaultAmount} บาท
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">สร้างเมื่อ</p>
                          <p className="text-sm text-gray-800 font-medium">
                            {config.createdAt.toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedConfig(config)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          ใช้งาน
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteConfig(config.id)}
                          className="flex-1 text-xs text-red-600 hover:text-red-700"
                        >
                          ลบ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="mt-8 bg-white border-2 border-blue-300 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900 font-bold">ℹ️ ข้อมูลที่ควรรู้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-900 font-medium">
              <p>• QR Code ที่สร้างขึ้นจะใช้ได้ตลอดเวลา</p>
              <p>• คุณสามารถสร้าง QR Code ได้หลายรูปแบบสำหรับบัญชีต่างๆ</p>
              <p>• ต้องตั้งค่า Slip2Go API ให้ถูกต้องในไฟล์ .env ก่อน</p>
              <p>• สามารถดาวน์โหลด QR Code เป็นรูปภาพได้</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QRCodeManager;
