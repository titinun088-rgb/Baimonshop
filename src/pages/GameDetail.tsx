import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ArrowLeft, MoreVertical, Edit, Trash2, Loader2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { getGameById, getGameItems, deleteGameItem, exportGameItemsToCSV, importGameItemsFromExcel, Game, GameItem } from "@/lib/gameUtils";
import { useAuth } from "@/contexts/AuthContext";
import CreateGameItemDialog from "@/components/CreateGameItemDialog";
import EditGameItemDialog from "@/components/EditGameItemDialog";
import ImportDialog from "@/components/ImportDialog";

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, currentShopOwnerId } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [items, setItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GameItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = userData?.role === "admin";
  // ตรวจสอบสิทธิ์: Admin, เจ้าของเกม, หรือผู้ดูแลร้าน
  const canEdit = isAdmin || (user && game && (
    game.createdBy === user.uid || 
    (currentShopOwnerId && game.createdBy === currentShopOwnerId)
  ));

  // โหลดข้อมูล
  const loadData = async () => {
    if (!id) {
      toast.error("ไม่พบรหัสเกม");
      navigate("/games");
      return;
    }

    console.log("🔄 GameDetail: กำลังโหลดข้อมูล gameId:", id);
    setLoading(true);
    try {
      // โหลดข้อมูลเกมก่อน
      const gameData = await getGameById(id);
      console.log("🔵 GameDetail: ข้อมูลเกม:", gameData);

      if (!gameData) {
        toast.error("ไม่พบเกมที่ต้องการ กรุณาเพิ่มเกมก่อน");
        navigate("/games");
        return;
      }

      // ตรวจสอบสิทธิ์ (ข้าม Admin)
      if (!isAdmin && user && gameData.createdBy !== user.uid && 
          !(currentShopOwnerId && gameData.createdBy === currentShopOwnerId)) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงเกมนี้");
        navigate("/games");
        return;
      }

      setGame(gameData);

      // โหลดรายการเติม (ถ้าไม่มีก็ไม่เป็นไร)
      console.log("🔄 GameDetail: กำลังโหลดรายการเติม...");
      const itemsData = await getGameItems(id);
      console.log("✅ GameDetail: พบรายการเติม", itemsData.length, "รายการ:", itemsData);
      setItems(itemsData);

    } catch (error) {
      console.error("❌ GameDetail: Error loading game data:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      toast.error(errorMessage);
      // ไม่ navigate กลับ ให้โชว์หน้าว่างแทน
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user, isAdmin]);

  // แก้ไขรายการ
  const handleEditItem = (item: GameItem) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  // ลบรายการ
  const handleDeleteClick = (item: GameItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleExport = () => {
    if (!game || items.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const result = exportGameItemsToCSV(items, game.name);
    if (result.success) {
      toast.success(`ส่งออกข้อมูล ${items.length} รายการสำเร็จ`);
    } else {
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleImport = async (file: File) => {
    if (!id || !user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return { success: false, imported: 0, errors: ["กรุณาเข้าสู่ระบบก่อน"] };
    }

    const result = await importGameItemsFromExcel(
      file,
      id,
      user.uid,
      user.email || ""
    );

    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteGameItem(itemToDelete.id);

      if (result.success) {
        toast.success("ลบรายการเติมสำเร็จ");
        loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการลบรายการเติม");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบรายการเติม");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // คำนวณสถิติ
  const calculateStats = () => {
    if (items.length === 0) return null;

    const totalProfit = items.reduce((sum, item) => sum + (item.sellPrice - item.costPrice), 0);
    const avgProfit = totalProfit / items.length;
    const maxProfit = Math.max(...items.map((item) => item.sellPrice - item.costPrice));
    const minProfit = Math.min(...items.map((item) => item.sellPrice - item.costPrice));

    return { totalProfit, avgProfit, maxProfit, minProfit };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/games")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{game.name}</h1>
              <Badge variant="secondary">{game.category}</Badge>
            </div>
            {game.description && (
              <p className="text-muted-foreground mt-1">{game.description}</p>
            )}
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-primary shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มรายการเติม
              </Button>
            </div>
          )}
        </div>

        {/* Game Info Card */}
        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-6">
            <div className="flex gap-6">
              <img
                src={game.imageUrl}
                alt={game.name}
                className="w-48 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนรายการ</p>
                    <p className="text-2xl font-bold">{items.length}</p>
                  </div>
                  {stats && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">กำไรเฉลี่ย</p>
                        <p className="text-2xl font-bold text-success">
                          ฿{stats.avgProfit.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">กำไรสูงสุด</p>
                        <p className="text-2xl font-bold text-success">
                          ฿{stats.maxProfit.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">กำไรต่ำสุด</p>
                        <p className={`text-2xl font-bold ${stats.minProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          ฿{stats.minProfit.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>รายการเติมเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  ยังไม่มีรายการเติมเงิน คลิก "เพิ่มรายการเติม" เพื่อเริ่มต้น
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อรายการ</TableHead>
                      <TableHead className="text-right">ราคาทุน</TableHead>
                      <TableHead className="text-right">ราคาขาย</TableHead>
                      <TableHead className="text-right">กำไร</TableHead>
                      <TableHead className="text-right">% กำไร</TableHead>
                      {canEdit && <TableHead className="text-right">จัดการ</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const profit = item.sellPrice - item.costPrice;
                      const profitPercent = ((profit / item.costPrice) * 100).toFixed(1);

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              )}
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{item.costPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{item.sellPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            ฿{profit.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profitPercent}%
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    แก้ไข
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(item)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    ลบ
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Item Dialog */}
      {canEdit && (
        <CreateGameItemDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          gameId={game.id}
          onSuccess={loadData}
        />
      )}

      {/* Edit Item Dialog */}
      {canEdit && (
        <EditGameItemDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          item={selectedItem}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canEdit && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบรายการเติม</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการลบรายการ <strong>{itemToDelete?.name}</strong> ใช่หรือไม่?
                <br />
                <br />
                การดำเนินการนี้ไม่สามารถยกเลิกได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  "ลบรายการ"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="นำเข้ารายการเกมจาก Excel"
        description="อัปโหลดไฟล์ Excel เพื่อนำเข้ารายการเติมหลายรายการพร้อมกัน"
        templateHeaders={["ชื่อรายการ", "ราคาทุน", "ราคาขาย", "รูปภาพ"]}
        onImport={handleImport}
        onSuccess={loadData}
      />
    </Layout>
  );
};

export default GameDetail;

