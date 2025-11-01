import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Wallet,
  RefreshCw,
  ArrowUpCircle,
  Calendar,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTopUpHistory, getUserTopUpStats, TopUpTransaction } from "@/lib/topupUtils";
import { formatAmount, formatDate } from "@/lib/slip2goUtils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TopUpHistory = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TopUpTransaction[]>([]);
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
      console.error("Error loading top-up history:", error);
      
      // ตรวจสอบประเภทของ error
      if (error instanceof Error) {
        if (error.message.includes('index')) {
          toast.error("กำลังสร้าง index สำหรับฐานข้อมูล กรุณารอสักครู่แล้วลองใหม่");
        } else {
          toast.error("ไม่สามารถโหลดประวัติการเติมเงินได้");
        }
      } else {
        toast.error("ไม่สามารถโหลดประวัติการเติมเงินได้");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> สำเร็จ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> รอดำเนินการ</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> ล้มเหลว</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'promptpay':
        return '📱';
      case 'bank_transfer':
        return '🏦';
      case 'truemoney':
        return '💳';
      default:
        return '💰';
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'promptpay':
        return 'PromptPay';
      case 'bank_transfer':
        return 'โอนเงินธนาคาร';
      case 'truemoney':
        return 'TrueMoney Wallet';
      default:
        return method;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <History className="h-10 w-10 text-blue-400" />
                  ประวัติการเติมเงิน
                </h1>
                <p className="text-gray-200 mt-2">ดูประวัติและสถิติการเติมเงินของคุณ</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={loadHistory}
                  variant="outline"
                  className="bg-white hover:bg-gray-100"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </Button>
                <Button
                  onClick={() => navigate('/top-up')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  เติมเงิน
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white shadow-xl border-2 border-green-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">ยอดเงินคงเหลือ</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatAmount(userData?.balance || 0)}
                      </p>
                    </div>
                    <Wallet className="h-12 w-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-2 border-blue-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">เติมเงินรวม</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatAmount(stats.totalAmount)}
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-2 border-green-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">สำเร็จ</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.successfulTransactions} ครั้ง
                      </p>
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-2 border-yellow-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">รอดำเนินการ</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.pendingTransactions} ครั้ง
                      </p>
                    </div>
                    <Clock className="h-12 w-12 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  รายการทั้งหมด ({transactions.length})
                </CardTitle>
                <CardDescription className="text-gray-700">
                  ประวัติการเติมเงินของคุณทั้งหมด
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
                    <p className="text-gray-600 font-semibold">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 font-semibold mb-4">ยังไม่มีประวัติการเติมเงิน</p>
                    <Button onClick={() => navigate('/top-up')}>
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      เติมเงินเลย
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="border-2 border-white hover:border-gray-300 transition bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="text-4xl">{getPaymentMethodIcon(transaction.paymentMethod)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {getPaymentMethodName(transaction.paymentMethod)}
                                  </h4>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="font-semibold">
                                      {formatDate(transaction.createdAt)}
                                    </span>
                                  </div>
                                  {transaction.slipData && (
                                    <>
                                      <div className="font-semibold">
                                        ผู้ส่ง: {transaction.slipData.senderName}
                                      </div>
                                      <div className="text-xs text-gray-600 font-mono">
                                        Ref: {transaction.slipData.referenceId.substring(0, 20)}...
                                      </div>
                                    </>
                                  )}
                                  {transaction.verificationMethod && (
                                    <div className="text-xs">
                                      <Badge variant="outline" className="text-xs">
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        {transaction.verificationMethod === 'qr' ? 'QR Code' : 'รูปภาพ'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-3xl font-bold ${
                                transaction.status === 'completed' ? 'text-green-600' :
                                transaction.status === 'pending' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {transaction.status === 'completed' ? '+' : ''}
                                {formatAmount(transaction.amount)}
                              </p>
                              {transaction.completedAt && transaction.status === 'completed' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  เติมเมื่อ: {formatDate(transaction.completedAt)}
                                </p>
                              )}
                              {transaction.failedReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  {transaction.failedReason}
                                </p>
                              )}
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
        </div>
      </div>
    </Layout>
  );
};

export default TopUpHistory;

