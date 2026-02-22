import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserOrders } from '@/lib/emailPassGameUtils';
import { EmailPassGameOrder } from '@/types/emailPassGame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Calendar, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function EmailPassGameHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<EmailPassGameOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserOrders(user.uid);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดประวัติได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EmailPassGameOrder['status']) => {
    const variants = {
      pending: { label: 'รอดำเนินการ', variant: 'secondary' as const },
      processing: { label: 'กำลังทำ', variant: 'default' as const },
      completed: { label: 'สำเร็จ', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const },
      failed: { label: 'ล้มเหลว', variant: 'destructive' as const }
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={status === 'completed' ? 'bg-green-500' : ''}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8 px-2 sm:px-0">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">ประวัติการเติมเกม</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          ประวัติการเติมเกมด้วย Email & Password
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">ยังไม่มีประวัติการเติม</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
                        <span>{order.gameName}</span>
                        {getStatusBadge(order.status)}
                      </CardTitle>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                        ฿{order.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground break-all">
                    Order ID: {order.id}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground shrink-0">แพ็กเกจ:</span>
                        <span className="font-medium truncate">{order.packageName}</span>
                      </div>
                    
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <span className="text-muted-foreground shrink-0">ค่า:</span>
                        <span className="font-medium">
                          {order.packageValue} {order.packageUnit}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <span className="text-muted-foreground shrink-0">อีเมล:</span>
                        <span className="font-medium break-all text-[10px] sm:text-xs">{order.gameEmail}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-muted-foreground text-[10px] sm:text-xs">วันที่สั่ง:</span>
                          <span className="font-medium text-[10px] sm:text-xs">
                            {new Date(order.createdAt.toDate()).toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>

                      {order.completedAt && (
                        <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <div className="flex flex-col min-w-0">
                            <span className="text-muted-foreground text-[10px] sm:text-xs">เสร็จเมื่อ:</span>
                            <span className="font-medium text-[10px] sm:text-xs">
                              {new Date(order.completedAt.toDate()).toLocaleString('th-TH')}
                            </span>
                          </div>
                        </div>
                      )}

                      {order.note && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground text-[10px] sm:text-xs">หมายเหตุ:</span>
                          <p className="mt-1 text-[10px] sm:text-xs bg-muted p-1.5 sm:p-2 rounded">{order.note}</p>
                        </div>
                      )}

                      {order.adminNote && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground text-[10px] sm:text-xs">ข้อความจากแอดมิน:</span>
                          <p className="mt-1 text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-950 p-1.5 sm:p-2 rounded border border-blue-200 dark:border-blue-800">
                            {order.adminNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
