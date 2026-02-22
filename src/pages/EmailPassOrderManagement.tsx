import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllOrders,
  getAllGames,
  updateOrderStatus,
  getOrderById
} from '@/lib/emailPassGameUtils';
import { sendStatusUpdateNotification } from '@/lib/telegramBotUtils';
import { EmailPassGameOrder, EmailPassGame } from '@/types/emailPassGame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

type OrderStatus = EmailPassGameOrder['status'];

export default function EmailPassOrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<EmailPassGameOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<EmailPassGameOrder[]>([]);
  const [games, setGames] = useState<EmailPassGame[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<EmailPassGameOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterGame, setFilterGame] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filterStatus, filterGame, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, gamesData] = await Promise.all([
        getAllOrders(),
        getAllGames()
      ]);
      setOrders(ordersData);
      setGames(gamesData);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    // Filter by game
    if (filterGame !== 'all') {
      filtered = filtered.filter((order) => order.gameId === filterGame);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.userEmail.toLowerCase().includes(query) ||
          order.gameEmail.toLowerCase().includes(query) ||
          order.gameName.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: OrderStatus) => {
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

  const handleViewOrder = (order: EmailPassGameOrder) => {
    setSelectedOrder(order);
    setStatusNote(order.adminNote || '');
    setShowDetailDialog(true);
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder || !user) return;

    try {
      setUpdatingStatus(true);

      // Update order status
      await updateOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNote.trim() || undefined,
        user.email || undefined
      );

      // Reload order data (ไม่ต้องส่ง Telegram notification)
      
      toast({ title: 'อัปเดตสถานะสำเร็จ' });
      
      setShowDetailDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      failed: orders.filter((o) => o.status === 'failed').length
    };
  };

  const counts = getOrderCounts();

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
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">จัดการออเดอร์</h1>
        <p className="text-muted-foreground">
          จัดการคำสั่งซื้อเกม Email/Password
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order ID, Email..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>สถานะ</Label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด ({counts.all})</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ ({counts.pending})</SelectItem>
                  <SelectItem value="processing">กำลังทำ ({counts.processing})</SelectItem>
                  <SelectItem value="completed">สำเร็จ ({counts.completed})</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก ({counts.cancelled})</SelectItem>
                  <SelectItem value="failed">ล้มเหลว ({counts.failed})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>เกม</Label>
              <Select value={filterGame} onValueChange={setFilterGame}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.icon} {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการออเดอร์ ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              ไม่พบออเดอร์
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border hover:bg-muted transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.gameName}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Order ID:</span>
                          <p className="font-mono text-xs">{order.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ลูกค้า:</span>
                          <p className="break-all">{order.userEmail}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">แพ็กเกจ:</span>
                          <p>{order.packageName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ราคา:</span>
                          <p className="font-bold text-primary">
                            ฿{order.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">วันที่:</span>
                          <p>
                            {new Date(order.createdAt.toDate()).toLocaleString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      ดูรายละเอียด
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดออเดอร์</DialogTitle>
            <DialogDescription>Order ID: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">เกม</p>
                  <p className="font-medium">{selectedOrder.gameName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">แพ็กเกจ</p>
                  <p className="font-medium">{selectedOrder.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">มูลค่า</p>
                  <p className="font-medium">
                    {selectedOrder.packageValue} {selectedOrder.packageUnit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ราคา</p>
                  <p className="text-lg font-bold text-primary">
                    ฿{selectedOrder.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันที่สั่ง</p>
                  <p className="text-sm">
                    {new Date(selectedOrder.createdAt.toDate()).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>

              {/* Game Credentials */}
              <div className="space-y-3">
                <h4 className="font-medium">ข้อมูลบัญชีเกม</h4>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">อีเมล</p>
                      <p className="font-mono break-all text-black dark:text-white">{selectedOrder.gameEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">พาสเวิร์ด</p>
                      <p className="font-mono text-black dark:text-white">{selectedOrder.gamePassword}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-medium">ข้อมูลลูกค้า</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    {selectedOrder.userEmail}
                  </p>
                  {selectedOrder.note && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">หมายเหตุจากลูกค้า:</p>
                      <p className="text-sm mt-1">{selectedOrder.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Note */}
              <div className="space-y-2">
                <Label>หมายเหตุแอดมิน</Label>
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="ข้อความถึงลูกค้า..."
                  rows={3}
                />
              </div>

              {/* Status Actions */}
              <div className="space-y-3">
                <Label>อัปเดตสถานะ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('processing')}
                    disabled={updatingStatus || selectedOrder.status === 'processing'}
                  >
                    กำลังดำเนินการ
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={updatingStatus || selectedOrder.status === 'completed'}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    ✓ เสร็จสิ้น
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={updatingStatus || selectedOrder.status === 'cancelled'}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus('failed')}
                    disabled={updatingStatus || selectedOrder.status === 'failed'}
                  >
                    ล้มเหลว
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
