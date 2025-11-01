import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Building2, 
  Package, 
  Calendar, 
  CreditCard, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  QrCode,
  Shield,
  Info
} from "lucide-react";
import { 
  getSlip2GoAccountInfo,
  formatDate
} from "@/lib/slip2goUtils";

interface AccountInfo {
  shopName: string;
  package: string;
  packageExpiredDate: string;
  quotaLimit: number;
  quotaRemaining: number;
  creditRemaining: number;
  autoRenewalPackage: boolean;
  checkSlipByCredit: boolean;
  quotaQrLimit: number;
  quotaQrRemaining: number;
}

const AccountInfo = () => {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAccountInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSlip2GoAccountInfo();
      
      if (result.success && result.data) {
        setAccountInfo(result.data);
        setLastUpdated(new Date());
        toast.success('ดึงข้อมูลบัญชีสำเร็จ');
      } else {
        setError(result.error || 'ไม่สามารถดึงข้อมูลบัญชีได้');
        toast.error(result.error || 'ไม่สามารถดึงข้อมูลบัญชีได้');
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี');
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const getQuotaPercentage = (remaining: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((remaining / limit) * 100);
  };

  const getQuotaStatus = (remaining: number, limit: number) => {
    const percentage = getQuotaPercentage(remaining, limit);
    if (percentage >= 50) return 'good';
    if (percentage >= 20) return 'warning';
    return 'critical';
  };

  const getQuotaColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQuotaProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const isPackageExpired = (expiredDate: string) => {
    return new Date(expiredDate) < new Date();
  };

  const getDaysUntilExpiry = (expiredDate: string) => {
    const now = new Date();
    const expiry = new Date(expiredDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (error && !accountInfo) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">ข้อมูลบัญชี</h1>
              <p className="text-gray-600 mt-2">ข้อมูลบัญชีและโควต้าของคุณ</p>
            </div>
            
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <Button onClick={fetchAccountInfo} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    ลองใหม่
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ข้อมูลบัญชี</h1>
                <p className="text-gray-600 mt-2">ข้อมูลบัญชีและโควต้าของคุณ</p>
              </div>
              <Button 
                onClick={fetchAccountInfo} 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    รีเฟรช
                  </>
                )}
              </Button>
            </div>
            
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                อัปเดตล่าสุด: {formatDate(lastUpdated.toISOString())}
              </p>
            )}
          </div>

          {accountInfo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shop Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    ข้อมูลร้าน
                  </CardTitle>
                  <CardDescription>
                    ข้อมูลพื้นฐานของผู้ใช้
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ชื่อร้าน:</span>
                    <span className="font-medium">{accountInfo.shopName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">แพ็กเกจ:</span>
                    <Badge variant="outline" className="font-mono">
                      {accountInfo.package}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">วันหมดอายุ:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        isPackageExpired(accountInfo.packageExpiredDate) 
                          ? 'text-red-600' 
                          : getDaysUntilExpiry(accountInfo.packageExpiredDate) <= 7 
                            ? 'text-yellow-600' 
                            : 'text-gray-600'
                      }`}>
                        {formatDate(accountInfo.packageExpiredDate)}
                      </span>
                      {!isPackageExpired(accountInfo.packageExpiredDate) && (
                        <Badge 
                          variant={
                            getDaysUntilExpiry(accountInfo.packageExpiredDate) <= 7 
                              ? 'destructive' 
                              : 'secondary'
                          }
                        >
                          {getDaysUntilExpiry(accountInfo.packageExpiredDate)} วัน
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isPackageExpired(accountInfo.packageExpiredDate) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        แพ็กเกจหมดอายุแล้ว กรุณาต่ออายุแพ็กเกจ
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Package Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    การตั้งค่าแพ็กเกจ
                  </CardTitle>
                  <CardDescription>
                    การตั้งค่าสำหรับแพ็กเกจปัจจุบัน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ต่ออายุอัตโนมัติ:</span>
                    <div className="flex items-center gap-2">
                      {accountInfo.autoRenewalPackage ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={accountInfo.autoRenewalPackage ? 'text-green-600' : 'text-red-600'}>
                        {accountInfo.autoRenewalPackage ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ตรวจสลิปด้วยเครดิต:</span>
                    <div className="flex items-center gap-2">
                      {accountInfo.checkSlipByCredit ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={accountInfo.checkSlipByCredit ? 'text-green-600' : 'text-red-600'}>
                        {accountInfo.checkSlipByCredit ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Slip Verification Quota */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    โควต้าการตรวจสอบสลิป
                  </CardTitle>
                  <CardDescription>
                    จำนวนครั้งที่เหลือในการตรวจสอบสลิป
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ใช้แล้ว:</span>
                      <span className="font-medium">
                        {formatNumber(accountInfo.quotaLimit - accountInfo.quotaRemaining)} / {formatNumber(accountInfo.quotaLimit)}
                      </span>
                    </div>
                    
                    <Progress 
                      value={getQuotaPercentage(accountInfo.quotaRemaining, accountInfo.quotaLimit)} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">คงเหลือ:</span>
                      <span className={`font-bold ${
                        getQuotaColor(getQuotaStatus(accountInfo.quotaRemaining, accountInfo.quotaLimit))
                      }`}>
                        {formatNumber(accountInfo.quotaRemaining)}
                      </span>
                    </div>
                  </div>

                  {accountInfo.quotaRemaining === 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        โควต้าการตรวจสอบสลิปหมดแล้ว กรุณาต่ออายุแพ็กเกจ
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* QR Code Generation Quota */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    โควต้าการสร้าง QR Code
                  </CardTitle>
                  <CardDescription>
                    จำนวนครั้งที่เหลือในการสร้าง QR Code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ใช้แล้ว:</span>
                      <span className="font-medium">
                        {formatNumber(accountInfo.quotaQrLimit - accountInfo.quotaQrRemaining)} / {formatNumber(accountInfo.quotaQrLimit)}
                      </span>
                    </div>
                    
                    <Progress 
                      value={getQuotaPercentage(accountInfo.quotaQrRemaining, accountInfo.quotaQrLimit)} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">คงเหลือ:</span>
                      <span className={`font-bold ${
                        getQuotaColor(getQuotaStatus(accountInfo.quotaQrRemaining, accountInfo.quotaQrLimit))
                      }`}>
                        {formatNumber(accountInfo.quotaQrRemaining)}
                      </span>
                    </div>
                  </div>

                  {accountInfo.quotaQrRemaining === 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        โควต้าการสร้าง QR Code หมดแล้ว กรุณาต่ออายุแพ็กเกจ
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Credit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    เครดิตคงเหลือ
                  </CardTitle>
                  <CardDescription>
                    จำนวนเครดิตที่ใช้สำหรับการตรวจสอบสลิปส่วนเกิน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatCurrency(accountInfo.creditRemaining)}
                    </div>
                    <p className="text-sm text-gray-600">
                      เครดิตสำหรับการตรวจสอบสลิปส่วนเกิน
                    </p>
                  </div>

                  {accountInfo.creditRemaining === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        ไม่มีเครดิตคงเหลือ การตรวจสอบสลิปส่วนเกินจะใช้โควต้าปกติ
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    สรุปการใช้งาน
                  </CardTitle>
                  <CardDescription>
                    ภาพรวมการใช้งานและสถานะบัญชี
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {getQuotaPercentage(accountInfo.quotaRemaining, accountInfo.quotaLimit)}%
                      </div>
                      <div className="text-sm text-gray-600">โควต้าการตรวจสอบสลิป</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {getQuotaPercentage(accountInfo.quotaQrRemaining, accountInfo.quotaQrLimit)}%
                      </div>
                      <div className="text-sm text-gray-600">โควต้าการสร้าง QR Code</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {formatCurrency(accountInfo.creditRemaining)}
                      </div>
                      <div className="text-sm text-gray-600">เครดิตคงเหลือ</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && accountInfo && (
            <Alert variant="destructive" className="mt-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                เกิดข้อผิดพลาดในการอัปเดตข้อมูล: {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AccountInfo;



