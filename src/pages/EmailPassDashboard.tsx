import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getAllGames } from '@/lib/emailPassGameUtils';
import { DashboardStats, EmailPassGame } from '@/types/emailPassGame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import {
  Loader2,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  Gamepad2,
  ArrowRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function EmailPassDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [games, setGames] = useState<EmailPassGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, gamesData] = await Promise.all([
        getDashboardStats(),
        getAllGames()
      ]);
      setStats(statsData);
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard - เกม Email/Password</h1>
            <p className="text-muted-foreground">ภาพรวมระบบเติมเกมด้วย Email & Password</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/email-pass-game-management')}
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              จัดการเกม
            </Button>
            <Button onClick={() => navigate('/email-pass-order-management')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              จัดการออเดอร์
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ออเดอร์วันนี้</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                รายการสั่งซื้อวันนี้
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้วันนี้</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{(stats?.todayRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ยอดขายที่เสร็จสิ้นวันนี้
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ออเดอร์ที่ต้องดำเนินการ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้ทั้งหมด</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{(stats?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                จาก {stats?.totalOrders || 0} ออเดอร์
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Games */}
          <Card>
            <CardHeader>
              <CardTitle>เกมยอดนิยม Top 5</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.topGames && stats.topGames.length > 0 ? (
                <div className="space-y-4">
                  {stats.topGames.map((game, index) => (
                    <div key={game.gameId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{game.gameName}</p>
                          <p className="text-sm text-muted-foreground">
                            {game.totalOrders} ออเดอร์
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          ฿{game.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>ยังไม่มีข้อมูล</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Games */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>เกมทั้งหมด ({games.length})</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/email-pass-game-management')}
              >
                จัดการ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {games.length > 0 ? (
                <div className="space-y-3">
                  {games.slice(0, 5).map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate('/email-pass-game-management')}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{game.icon}</span>
                        <div>
                          <p className="font-medium">{game.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {game.description}
                          </p>
                        </div>
                      </div>
                      <div>
                        {game.active ? (
                          <span className="text-xs text-green-600 font-medium">เปิด</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">ปิด</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {games.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/email-pass-game-management')}
                    >
                      ดูทั้งหมด ({games.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="mb-4">ยังไม่มีเกม</p>
                  <Button onClick={() => navigate('/email-pass-game-management')}>
                    เพิ่มเกมแรก
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>การดำเนินการด่วน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => navigate('/email-pass-order-management')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">ออเดอร์รอดำเนินการ</span>
                </div>
                <span className="text-2xl font-bold">{stats?.pendingOrders || 0}</span>
                <span className="text-sm text-muted-foreground">คลิกเพื่อดำเนินการ</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => navigate('/email-pass-game-management')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">จัดการเกม</span>
                </div>
                <span className="text-2xl font-bold">{games.length}</span>
                <span className="text-sm text-muted-foreground">เกมในระบบ</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => navigate('/email-pass-order-management')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">ออเดอร์ทั้งหมด</span>
                </div>
                <span className="text-2xl font-bold">{stats?.totalOrders || 0}</span>
                <span className="text-sm text-muted-foreground">รายการทั้งหมด</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
