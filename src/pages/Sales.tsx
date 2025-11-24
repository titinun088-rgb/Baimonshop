import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Seo from '@/components/Seo';
import CreateSaleDialog from "@/components/CreateSaleDialog";
import EditSaleDialog from "@/components/EditSaleDialog";
import ImportDialog from "@/components/ImportDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, DollarSign, ShoppingCart, Trash2, Loader2, Edit, MoreVertical, Package, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { Sale } from "@/types/sale";
import { getSalesByUser, getAllSales, getDashboardStats, deleteSale, exportSalesToCSV, importSalesFromExcel } from "@/lib/salesUtils";
import { getAllGames, getGamesByUser, getGameItems, Game, GameItem } from "@/lib/gameUtils";

const Sales = () => {
  const { user, userData, currentShopOwnerId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    todayOrders: 0,
    todayQuantity: 0,
  });
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filterShop, setFilterShop] = useState<string>("all");

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูล
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("🔄 Sales: กำลังโหลดข้อมูล...");
      
      // ใช้ currentShopOwnerId หรือ user.uid
      const ownerId = currentShopOwnerId || user.uid;
      console.log("🔑 Sales: Using owner ID:", ownerId);
      console.log("👤 Sales: Current user ID:", user.uid);
      console.log("🏪 Sales: Current shop owner ID:", currentShopOwnerId);
      console.log("🔒 Sales: Is admin:", isAdmin);
      
      // โหลดเกมและรายการเติม
      const gamesData = isAdmin ? await getAllGames() : await getGamesByUser(ownerId);
      setGames(gamesData);

      // โหลดรายการเติมทั้งหมด
      const allItems: GameItem[] = [];
      for (const game of gamesData) {
        const items = await getGameItems(game.id);
        allItems.push(...items);
      }
      setGameItems(allItems);

      // โหลดยอดขาย
      const salesData = isAdmin ? await getAllSales() : await getSalesByUser(ownerId);
      setSales(salesData);

      // โหลดสถิติ
      const statsData = await getDashboardStats(isAdmin ? undefined : ownerId);
      
      // คำนวณจำนวนที่ขายวันนี้
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todaySalesData = salesData.filter(sale => sale.saleDate >= todayStart);
      const todayQuantity = todaySalesData.reduce((sum, sale) => sum + sale.quantity, 0);
      
      setStats({
        todaySales: statsData.todaySales,
        todayProfit: statsData.todayProfit,
        todayOrders: statsData.todayOrders,
        todayQuantity,
      });

      console.log("✅ Sales: โหลดข้อมูลเสร็จสิ้น");
    } catch (error) {
      console.error("❌ Sales: Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userData, currentShopOwnerId]); // เพิ่ม currentShopOwnerId เพื่อ reload เมื่อมีการเปลี่ยนแปลง

  // กรองยอดขายตามร้าน (สำหรับ Admin)
  const filteredSales = isAdmin && filterShop !== "all"
    ? sales.filter((sale) => sale.userId === filterShop)
    : sales;

  // รายการร้านทั้งหมด (สำหรับ Admin)
  const shops = Array.from(new Set(sales.map((sale) => sale.userId))).map((userId) => {
    const sale = sales.find((s) => s.userId === userId);
    return {
      userId,
      shopName: sale?.shopName || sale?.userEmail || "ไม่ทราบชื่อ",
    };
  });

  // แก้ไขยอดขาย
  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setEditDialogOpen(true);
  };

  // ลบยอดขาย
  const handleExport = () => {
    if (filteredSales.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const filename = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    const result = exportSalesToCSV(filteredSales, filename);

    if (result.success) {
      toast.success(`ส่งออกข้อมูล ${filteredSales.length} รายการสำเร็จ`);
    } else {
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleImport = async (file: File) => {
    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return { success: false, imported: 0, errors: ["กรุณาเข้าสู่ระบบก่อน"] };
    }

    const result = await importSalesFromExcel(
      file,
      user.uid,
      user.email || "",
      userData.shopName
    );

    return result;
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm("คุณต้องการลบยอดขายนี้หรือไม่?")) return;

    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    try {
      const result = await deleteSale(
        sale.id,
        {
          userId: user.uid,
          email: user.email || "",
          shopName: userData.shopName,
          saleName: `${sale.gameName} - ${sale.gameItemName}`,
        }
      );
      
      if (result.success) {
        toast.success("ลบยอดขายสำเร็จ");
        await loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบยอดขาย");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="ยอดขาย — BaimonShop" description="ดูและจัดการยอดขายของคุณ" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">ยอดขาย</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "ยอดขายทั้งหมดในระบบ" : "จัดการและติดตามยอดขายของคุณ"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-primary shadow-glow w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">เพิ่มยอดขายใหม่</span>
              <span className="sm:hidden">เพิ่มยอดขาย</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดขายวันนี้</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{stats.todaySales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayOrders} รายการ
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำไรวันนี้</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.todayProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {stats.todayProfit >= 0 ? "+" : ""}฿{stats.todayProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                จากยอดขาย ฿{stats.todaySales.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนรายการ</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">รายการวันนี้</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนที่ขาย</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayQuantity}</div>
              <p className="text-xs text-muted-foreground">ชิ้นที่ขายวันนี้</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter (Admin only) */}
        {isAdmin && shops.length > 0 && (
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>กรองตามร้าน</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={filterShop} onValueChange={setFilterShop}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="เลือกร้าน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด ({sales.length})</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.userId} value={shop.userId}>
                      {shop.shopName} ({sales.filter(s => s.userId === shop.userId).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Sales Table */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>รายการยอดขาย</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">
                  ยังไม่มียอดขาย คลิก "เพิ่มยอดขายใหม่" เพื่อเริ่มต้น
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
                      <TableHead className="text-right hide-mobile">ต้นทุน</TableHead>
                      <TableHead className="text-right hide-mobile">ราคาขาย</TableHead>
                      <TableHead className="text-right hide-mobile">ส่วนลด</TableHead>
                      <TableHead className="text-right">ยอดสุทธิ</TableHead>
                      <TableHead className="text-right">กำไร</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
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
                        <TableCell className="text-right hide-mobile">
                          ฿{sale.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right hide-mobile">
                          ฿{sale.totalSell.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right hide-mobile">
                          {sale.discount > 0 && (
                            <Badge variant="secondary" className="text-xs">-฿{sale.discount.toFixed(2)}</Badge>
                          )}
                        </TableCell>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(sale)}>
                                <Edit className="mr-2 h-4 w-4" />
                                แก้ไข
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(sale)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                ลบ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Sale Dialog */}
      <CreateSaleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadData}
        games={games}
        gameItems={gameItems}
      />

      {/* Edit Sale Dialog */}
      <EditSaleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        sale={selectedSale}
        games={games}
        gameItems={gameItems}
        onSuccess={loadData}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="นำเข้ายอดขายจาก Excel"
        description="อัปโหลดไฟล์ Excel เพื่อนำเข้ายอดขายหลายรายการพร้อมกัน"
        templateHeaders={["เกม", "รายการเติม", "จำนวน", "ส่วนลด"]}
        onImport={handleImport}
        onSuccess={loadData}
      />
    </Layout>
  );
};

export default Sales;
