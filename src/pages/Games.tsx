import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Edit, Trash2, Loader2, Eye } from "lucide-react";
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
import { toast } from "sonner";
import { getAllGames, getGamesByUser, deleteGame, Game, countGameItems } from "@/lib/gameUtils";
import { useAuth } from "@/contexts/AuthContext";
import CreateGameDialog from "@/components/CreateGameDialog";
import EditGameDialog from "@/components/EditGameDialog";

const Games = () => {
  const navigate = useNavigate();
  const { user, userData, currentShopOwnerId } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูลเกม
  const loadGames = async () => {
    setLoading(true);
    try {
      console.log("🔄 Games: Loading games...");
      console.log("👤 Games: User ID:", user?.uid);
      console.log("🏪 Games: Current shop owner ID:", currentShopOwnerId);
      console.log("🔒 Games: Is admin:", isAdmin);
      
      let gamesData: Game[];

      if (isAdmin) {
        // Admin ดูทุกเกม
        console.log("✅ Games: Admin mode - loading all games");
        gamesData = await getAllGames();
      } else if (currentShopOwnerId) {
        // Seller หรือ Shop Manager ดูเกมของร้าน
        console.log("✅ Games: Loading games for shop owner:", currentShopOwnerId);
        gamesData = await getGamesByUser(currentShopOwnerId);
      } else if (user) {
        // Fallback กรณีไม่มี currentShopOwnerId
        console.log("⚠️ Games: Fallback - loading games for user:", user.uid);
        gamesData = await getGamesByUser(user.uid);
      } else {
        console.log("❌ Games: No user found");
        gamesData = [];
      }
      
      console.log("📊 Games: Loaded", gamesData.length, "games");

      setGames(gamesData);
      setFilteredGames(gamesData);

      // โหลดจำนวนรายการเติมของแต่ละเกม
      const counts: Record<string, number> = {};
      await Promise.all(
        gamesData.map(async (game) => {
          counts[game.id] = await countGameItems(game.id);
        })
      );
      setItemCounts(counts);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลเกม");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [user, isAdmin, currentShopOwnerId]); // เพิ่ม currentShopOwnerId เพื่อ reload เมื่อมีการเปลี่ยนแปลง

  // ค้นหา
  useEffect(() => {
    if (!searchQuery) {
      setFilteredGames(games);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query)
    );
    setFilteredGames(filtered);
  }, [searchQuery, games]);

  // เปิดหน้ารายละเอียดเกม
  const handleViewGame = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  // แก้ไขเกม
  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setEditDialogOpen(true);
  };

  // ลบเกม
  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;

    setDeleting(true);
    try {
      // ลบเกม
      const result = await deleteGame(gameToDelete.id);

      if (result.success) {
        toast.success("ลบเกมสำเร็จ");
        loadGames();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการลบเกม");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบเกม");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">จัดการเกม</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "จัดการเกมทั้งหมดในระบบ"
                : "เพิ่มและจัดการเกมและรายการเติมเงิน"}
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเกมใหม่
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเกม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredGames.length === 0 ? (
          <Card className="border-border bg-card shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "ไม่พบเกมที่ค้นหา"
                  : "ยังไม่มีเกมในระบบ คลิก 'เพิ่มเกมใหม่' เพื่อเริ่มต้น"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGames.map((game) => (
              <Card
                key={game.id}
                className="group overflow-hidden border-border bg-card shadow-card transition-all hover:shadow-glow cursor-pointer"
                onClick={() => handleViewGame(game.id)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    {game.category}
                  </Badge>
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{game.name}</h3>
                      {game.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {game.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewGame(game.id);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditGame(game);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          แก้ไข
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(game);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">รายการเติมเงิน</span>
                    <span className="font-semibold">
                      {itemCounts[game.id] || 0} รายการ
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Game Dialog */}
      <CreateGameDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadGames}
      />

      {/* Edit Game Dialog */}
      <EditGameDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        game={selectedGame}
        onSuccess={loadGames}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบเกม</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบเกม <strong>{gameToDelete?.name}</strong> ใช่หรือไม่?
              <br />
              <br />
              การดำเนินการนี้จะลบข้อมูลเกมอย่างถาวร
              <br />
              <span className="text-destructive font-medium">
                ⚠️ รายการเติมเงินทั้งหมดจะยังคงอยู่ในระบบ
              </span>
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
                "ลบเกม"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Games;
