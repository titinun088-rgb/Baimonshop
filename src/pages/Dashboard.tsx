import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Plus,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, getDailyChartData, getSalesByUser, getAllSales } from "@/lib/salesUtils";
import { getAllGames, getGamesByUser } from "@/lib/gameUtils";
import { Sale } from "@/types/sale";

const Dashboard = () => {
  const { user, userData, currentShopOwnerId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State สำหรับข้อมูลจริง
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCost: 0,
    todayProfit: 0,
    todayOrders: 0,
    monthSales: 0,
    monthProfit: 0,
    totalSales: 0,
    totalProfit: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [gamesCount, setGamesCount] = useState(0);

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูล
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        console.log("🔄 Dashboard: กำลังโหลดข้อมูล...");
        
        // ใช้ currentShopOwnerId หรือ user.uid
        const ownerId = currentShopOwnerId || user.uid;
        console.log("🔑 Dashboard: Using owner ID:", ownerId);
        console.log("👤 Dashboard: Current user ID:", user.uid);
        console.log("🏪 Dashboard: Current shop owner ID:", currentShopOwnerId);
        
        // โหลดสถิติ
        const statsData = await getDashboardStats(isAdmin ? undefined : ownerId);
        setStats(statsData);

        // โหลดกราฟ
        const chartData = await getDailyChartData(isAdmin ? undefined : ownerId);
        setChartData(chartData);

        // โหลดยอดขายล่าสุด (5 รายการ)
        const salesData = isAdmin ? await getAllSales() : await getSalesByUser(ownerId);
        setRecentSales(salesData.slice(0, 5));

        // โหลดจำนวนเกม
        const gamesData = isAdmin ? await getAllGames() : await getGamesByUser(ownerId);
        setGamesCount(gamesData.length);

        console.log("✅ Dashboard: โหลดข้อมูลเสร็จสิ้น");
      } catch (error) {
        console.error("❌ Dashboard: Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userData, currentShopOwnerId]); // เพิ่ม currentShopOwnerId เพื่อ reload เมื่อมีการเปลี่ยนแปลง

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "ภาพรวมทั้งหมดในระบบ" : "ภาพรวมยอดขายและสถิติร้านค้า"}
          </p>
        </div>
        <Button
          onClick={() => navigate("/sales")}
          className="bg-gradient-primary shadow-glow"
        >
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มยอดขาย
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ยอดขายวันนี้"
          value={`฿${stats.todaySales.toFixed(2)}`}
          change={`${stats.todayOrders} รายการ`}
          icon={DollarSign}
          trend={stats.todaySales > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="กำไรวันนี้"
          value={`฿${stats.todayProfit.toFixed(2)}`}
          change={`ต้นทุน ฿${stats.todayCost.toFixed(2)}`}
          icon={TrendingUp}
          trend={stats.todayProfit > 0 ? "up" : stats.todayProfit < 0 ? "down" : "neutral"}
        />
        <StatCard
          title="ยอดขายเดือนนี้"
          value={`฿${stats.monthSales.toFixed(2)}`}
          change={`${stats.monthOrders} รายการ`}
          icon={ShoppingCart}
          trend={stats.monthSales > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="เกมทั้งหมด"
          value={`${gamesCount}`}
          change={isAdmin ? "ในระบบทั้งหมด" : "ของคุณ"}
          icon={Package}
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>ยอดขายรายวัน (7 วันล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">ยังไม่มีข้อมูลยอดขาย</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="ยอดขาย"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>กำไรรายวัน (7 วันล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">ยังไม่มีข้อมูลกำไร</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" name="กำไร" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ยอดขายล่าสุด</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/sales")}
          >
            ดูทั้งหมด →
          </Button>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">
                ยังไม่มียอดขาย คลิก "เพิ่มยอดขาย" เพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            <div className="table-container">
              <Table className="table-compact">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">วันที่</TableHead>
                    {isAdmin && <TableHead className="hide-mobile">ร้าน</TableHead>}
                    <TableHead>เกม</TableHead>
                    <TableHead className="hide-mobile">รายการ</TableHead>
                    <TableHead className="text-right hide-mobile">จำนวน</TableHead>
                    <TableHead className="text-right">ยอดสุทธิ</TableHead>
                    <TableHead className="text-right">กำไร</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                        {sale.saleDate.toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="font-medium hide-mobile">
                          {sale.shopName || sale.userEmail}
                        </TableCell>
                      )}
                      <TableCell className="text-xs sm:text-sm">{sale.gameName}</TableCell>
                      <TableCell className="hide-mobile">{sale.gameItemName}</TableCell>
                      <TableCell className="text-right hide-mobile">{sale.quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm">
                        ฿{sale.netAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={sale.profit >= 0 ? "default" : "destructive"}
                          className={sale.profit >= 0 ? "bg-green-500" : ""}
                        >
                          {sale.profit >= 0 ? "+" : ""}฿{sale.profit.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
