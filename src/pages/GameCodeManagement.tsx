import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  Package,
  Loader2,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllGames,
  createGame,
  updateGame,
  deleteGame,
  Game,
} from "@/lib/gameCodeUtils";
import { uploadImage } from "@/lib/storageUtils";

const GameCodeManagement = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/home");
      return;
    }
    loadGames();
  }, [userData, navigate]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const gamesData = await getAllGames();
      setGames(gamesData);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดเกม");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    setUploading(true);
    try {
      await createGame({
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        price,
      });

      toast.success("สร้างเกมสำเร็จ");
      setCreateDialogOpen(false);
      resetForm();
      loadGames();
    } catch (error: any) {
      console.error("Error creating game:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการสร้างเกม");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (game: Game) => {
    setSelectedGame(game);
    setFormData({
      name: game.name,
      description: game.description,
      imageUrl: game.imageUrl || "",
      price: game.price.toString(),
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedGame) return;

    if (!formData.name || !formData.description || !formData.price) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    setUploading(true);
    try {
      await updateGame(selectedGame.id, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        price,
      });

      toast.success("อัปเดตเกมสำเร็จ");
      setEditDialogOpen(false);
      resetForm();
      setSelectedGame(null);
      loadGames();
    } catch (error: any) {
      console.error("Error updating game:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตเกม");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGame) return;

    try {
      await deleteGame(selectedGame.id);
      toast.success("ลบเกมสำเร็จ");
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      loadGames();
    } catch (error: any) {
      console.error("Error deleting game:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบเกม");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      price: "",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, `games/${Date.now()}_${file.name}`);
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url! }));
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploading(false);
    }
  };

  if (userData?.role !== "admin") {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gamepad2 className="h-8 w-8" />
              จัดการเกม
            </h1>
            <p className="text-muted-foreground mt-2">
              เพิ่ม แก้ไข หรือลบเกม
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มเกม
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>เพิ่มเกมใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลเกมที่ต้องการเพิ่ม
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อเกม *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="เช่น PUBG Mobile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียด *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="รายละเอียดเกม"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">ราคา (บาท) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="150"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">รูปภาพ</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">หรือใส่ URL รูปภาพ</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    "สร้างเกม"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Games Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>รายการเกม</CardTitle>
              <CardDescription>
                จำนวนเกมทั้งหมด: {games.length} เกม
              </CardDescription>
            </CardHeader>
            <CardContent>
              {games.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ยังไม่มีเกม
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รูปภาพ</TableHead>
                      <TableHead>ชื่อเกม</TableHead>
                      <TableHead>ราคา</TableHead>
                      <TableHead>สต็อก</TableHead>
                      <TableHead>รหัสทั้งหมด</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          {game.imageUrl ? (
                            <img
                              src={game.imageUrl}
                              alt={game.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{game.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {game.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            ฿{(game.price || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={(game.stock || 0) > 0 ? "default" : "destructive"}
                          >
                            <Package className="h-3 w-3 mr-1" />
                            {game.stock || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>{game.totalCodes || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/game-codes/${game.id}`)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              จัดการรหัส
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(game)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedGame(game);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>แก้ไขเกม</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลเกม
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">ชื่อเกม *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">รายละเอียด *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">ราคา (บาท) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">รูปภาพ</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-imageUrl">หรือใส่ URL รูปภาพ</Label>
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUpdate}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังอัปเดต...
                  </>
                ) : (
                  "อัปเดตเกม"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการลบเกม "{selectedGame?.name}"?
                การกระทำนี้ไม่สามารถยกเลิกได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default GameCodeManagement;

