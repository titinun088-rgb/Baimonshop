import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Loader2,
    Gamepad2,
    Image as ImageIcon,
    Save,
    Trash2,
    ExternalLink,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { getWepayGameProducts, WepayGameProduct } from "@/lib/wepayGameUtils";
import { getAllCustomGameImages, saveCustomGameImage, deleteCustomGameImage } from "@/lib/gameImageUtils";

interface GameEntry {
    gameCode: string;
    name: string;
    currentImage: string;
    isCustom: boolean;
}

const GameImageManagement = () => {
    const [games, setGames] = useState<GameEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameEntry | null>(null);

    // Form states
    const [imageUrl, setImageUrl] = useState("");
    const [saving, setSaving] = useState(false);

    // โหลดข้อมูลเริ่มต้น
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (force = false) => {
        setLoading(true);
        try {
            const [wepayProducts, customImages] = await Promise.all([
                getWepayGameProducts(force),
                getAllCustomGameImages()
            ]);

            // จัดกลุ่มเกมตาม pay_to_company
            const gameMap = new Map<string, GameEntry>();

            wepayProducts.forEach(product => {
                if (!gameMap.has(product.pay_to_company)) {
                    const gameCode = product.pay_to_company;
                    const customUrl = customImages[gameCode];

                    gameMap.set(gameCode, {
                        gameCode,
                        name: product.category,
                        currentImage: customUrl || product.img || "",
                        isCustom: !!customUrl
                    });
                }
            });

            const gameList = Array.from(gameMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            setGames(gameList);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    // กรองเมนูค้นหา
    const filteredGames = games.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.gameCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // เปิด Dialog แก้ไข
    const openEditDialog = (game: GameEntry) => {
        setSelectedGame(game);
        // ถ้าเป็นรูปที่กำหนดเอง ให้ใส่ URL ลงในช่อง input
        setImageUrl(game.isCustom ? game.currentImage : "");
        setEditDialogOpen(true);
    };

    // บันทึกรูปภาพ
    const handleSaveImage = async () => {
        if (!selectedGame) return;
        if (!imageUrl.trim()) {
            toast.error("กรุณากรอก URL รูปภาพ");
            return;
        }

        setSaving(true);
        try {
            await saveCustomGameImage(selectedGame.gameCode, imageUrl.trim());
            toast.success("บันทึกรูปภาพเรียบร้อยแล้ว");
            setEditDialogOpen(false);
            loadData(false); // ใช้ข้อมูลเดิม + รูปใหม่จาก Firestore (ไม่ต้อง Scan wePAY ใหม่)
        } catch (error) {
            console.error("Error saving image:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    // ลบรูปภาพที่กำหนดเอง (กลับไปใช้รูปพื้นฐานจาก API)
    const handleDeleteCustomImage = async () => {
        if (!selectedGame) return;

        setSaving(true);
        try {
            await deleteCustomGameImage(selectedGame.gameCode);
            toast.success("ลบรูปภาพที่กำหนดเองแล้ว (กลับไปใช้รูปมาตรฐาน)");
            setEditDialogOpen(false);
            loadData(false);
        } catch (error) {
            console.error("Error deleting custom image:", error);
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    return (
        <RoleProtectedRoute allowedRoles={["admin"]}>
            <Layout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">จัดการรูปภาพเกม wePAY</h1>
                            <p className="text-muted-foreground">
                                กำหนดรูปภาพที่ต้องการให้แสดงในหน้าเติมเกม wePAY (แทนที่รูปมาตรฐานจาก API)
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => loadData(true)}
                                variant="outline"
                                disabled={loading}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                รีเฟรชข้อมูลล่าสุด (Full)
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหาชื่อเกมหรือรหัสเกม..."
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
                                <Gamepad2 className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                <p className="text-muted-foreground">
                                    ไม่พบข้อมูลเกม
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredGames.map((game) => (
                                <Card
                                    key={game.gameCode}
                                    className="group overflow-hidden border-border bg-card shadow-card transition-all hover:shadow-glow cursor-pointer"
                                    onClick={() => openEditDialog(game)}
                                >
                                    <div className="relative aspect-square overflow-hidden bg-zinc-900 flex items-center justify-center">
                                        {game.currentImage ? (
                                            <img
                                                src={game.currentImage}
                                                alt={game.name}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <Gamepad2 className="h-16 w-16 text-zinc-700" />
                                        )}

                                        {game.isCustom && (
                                            <div className="absolute top-2 right-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                                CUSTOM
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm">
                                                แก้ไขรูปภาพ
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-bold text-sm line-clamp-1">{game.name}</h3>
                                        <p className="text-[10px] text-muted-foreground font-mono">{game.gameCode}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                แก้ไขรูปภาพ: {selectedGame?.name}
                            </DialogTitle>
                            <DialogDescription>
                                รหัสเกม: {selectedGame?.gameCode}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">URL รูปภาพ *</Label>
                                <Input
                                    id="imageUrl"
                                    placeholder="https://example.com/logo.png"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    แนะนำขนาด 512x512 หรือสัดส่วน 1:1 เพื่อความสวยงาม
                                </p>
                            </div>

                            {/* Preview */}
                            {imageUrl && (
                                <div className="space-y-2 text-center">
                                    <Label>ตัวอย่างการแสดงผล</Label>
                                    <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border border-border bg-black/20 flex items-center justify-center">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Invalid+URL';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedGame?.isCustom && (
                                <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-200">
                                    ⚠️ ขณะนี้กำลังใช้รูปภาพที่กำหนดเอง ระบบจะให้ความสำคัญกับรูปภาพที่คุณตั้งค่าไว้มากกว่ารูปจาก API
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            {selectedGame?.isCustom && (
                                <Button
                                    variant="ghost"
                                    onClick={handleDeleteCustomImage}
                                    disabled={saving}
                                    className="text-destructive hover:bg-destructive/10 order-2 sm:order-1"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    ลบคืนค่ามาตรฐาน
                                </Button>
                            )}
                            <div className="flex gap-2 flex-1 justify-end order-1 sm:order-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditDialogOpen(false)}
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    onClick={handleSaveImage}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    บันทึก
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Layout>
        </RoleProtectedRoute>
    );
};

export default GameImageManagement;
