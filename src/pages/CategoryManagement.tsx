import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Gamepad2,
  Image,
  Save,
  X,
  Eye,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { getPeamsubGameProducts, PeamsubGameProduct } from "@/lib/peamsubUtils";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GameCategory {
  id: string;
  name: string;
  displayName: string;
  image: string;
  description: string;
  gameIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [gameProducts, setGameProducts] = useState<PeamsubGameProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDisplayName, setCategoryDisplayName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadGameProducts(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, "gameCategories");
      const q = query(categoriesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as GameCategory[];
      
      setCategories(categoriesData);
      console.log("📂 Loaded categories:", categoriesData.length);
      console.log("🔍 Category gameIds:", categoriesData.map(cat => ({ 
        name: cat.displayName, 
        gameIds: cat.gameIds, 
        gameIdsTypes: cat.gameIds.map(id => ({ id, type: typeof id }))
      })));
      
      // Debug: ตรวจสอบ gameIds ในแต่ละหมวดหมู่
      categoriesData.forEach(category => {
        console.log(`📂 Category "${category.displayName}":`, {
          gameIds: category.gameIds,
          gameIdsCount: category.gameIds.length,
          gameIdsTypes: category.gameIds.map(id => ({ id, type: typeof id }))
        });
      });
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดหมวดหมู่");
    }
  };

  const loadGameProducts = async () => {
    try {
      const products = await getPeamsubGameProducts();
      setGameProducts(products);
      console.log("🎮 Loaded game products:", products.length);
      console.log("🔍 Sample product IDs:", products.slice(0, 5).map(p => ({ id: p.id, type: typeof p.id })));
    } catch (error) {
      console.error("Error loading game products:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดเกม");
    }
  };

  // กรองหมวดหมู่
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // เปิด Dialog สร้างหมวดหมู่ใหม่
  const openCreateDialog = () => {
    setCategoryName("");
    setCategoryDisplayName("");
    setCategoryImage("");
    setCategoryDescription("");
    setSelectedGameIds([]);
    setCreateDialogOpen(true);
  };

  // เปิด Dialog แก้ไขหมวดหมู่
  const openEditDialog = (category: GameCategory) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryDisplayName(category.displayName);
    setCategoryImage(category.image);
    setCategoryDescription(category.description);
    setSelectedGameIds(category.gameIds);
    setEditDialogOpen(true);
  };

  // เปิด Dialog ลบหมวดหมู่
  const openDeleteDialog = (category: GameCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // บันทึกหมวดหมู่ใหม่
  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !categoryDisplayName.trim()) {
      toast.error("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    if (selectedGameIds.length === 0) {
      toast.error("กรุณาเลือกเกมอย่างน้อย 1 เกม");
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: categoryName.trim(),
        displayName: categoryDisplayName.trim(),
        image: categoryImage.trim(),
        description: categoryDescription.trim(),
        gameIds: selectedGameIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("💾 Saving category with gameIds:", selectedGameIds);
      console.log("🔍 GameIds types:", selectedGameIds.map(id => ({ id, type: typeof id })));
      console.log("🔍 Sample game products:", gameProducts.slice(0, 5).map(g => ({ id: g.id, type: typeof g.id, category: g.category })));

      await addDoc(collection(db, "gameCategories"), categoryData);
      
      toast.success("สร้างหมวดหมู่สำเร็จ");
      setCreateDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างหมวดหมู่");
    } finally {
      setSaving(false);
    }
  };

  // บันทึกการแก้ไขหมวดหมู่
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    if (!categoryName.trim() || !categoryDisplayName.trim()) {
      toast.error("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    if (selectedGameIds.length === 0) {
      toast.error("กรุณาเลือกเกมอย่างน้อย 1 เกม");
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: categoryName.trim(),
        displayName: categoryDisplayName.trim(),
        image: categoryImage.trim(),
        description: categoryDescription.trim(),
        gameIds: selectedGameIds,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "gameCategories", selectedCategory.id), categoryData);
      
      toast.success("แก้ไขหมวดหมู่สำเร็จ");
      setEditDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่");
    } finally {
      setSaving(false);
    }
  };

  // ลบหมวดหมู่
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "gameCategories", selectedCategory.id));
      
      toast.success("ลบหมวดหมู่สำเร็จ");
      setDeleteDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("เกิดข้อผิดพลาดในการลบหมวดหมู่");
    } finally {
      setDeleting(false);
    }
  };

  // เลือก/ยกเลิกเลือกเกม
  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  // ดูรายละเอียดหมวดหมู่
  const viewCategoryDetails = (category: GameCategory) => {
    const selectedGames = gameProducts.filter(game => category.gameIds.includes(game.id));
    console.log("📂 Category:", category.displayName);
    console.log("🎮 Games:", selectedGames.map(g => g.category));
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">จัดการหมวดหมู่เกม</h1>
              <p className="text-muted-foreground">
                จัดการหมวดหมู่เกมและเลือกเกมที่จะแสดงในหน้าเติมเกม
              </p>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>📂 รวม {categories.length} หมวดหมู่</span>
                <span>🔍 แสดง {filteredCategories.length} หมวดหมู่</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading}
              >
                <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
              <Button
                onClick={openCreateDialog}
                className="bg-gradient-primary shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหมวดหมู่ใหม่
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาหมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <Card className="border-border bg-card shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gamepad2 className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "ไม่พบหมวดหมู่ที่ค้นหา"
                    : "ยังไม่มีหมวดหมู่ในระบบ คลิก 'เพิ่มหมวดหมู่ใหม่' เพื่อเริ่มต้น"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group overflow-hidden border-border bg-card shadow-card transition-all hover:shadow-glow"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.displayName}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Gamepad2 className="h-12 w-12 text-white opacity-70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {category.gameIds.length} เกม
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1 mb-2">{category.displayName}</h3>
                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {category.gameIds.length} เกม
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewCategoryDetails(category)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(category)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Category Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                เพิ่มหมวดหมู่ใหม่
              </DialogTitle>
              <DialogDescription>
                สร้างหมวดหมู่ใหม่และเลือกเกมที่จะแสดงในหมวดหมู่นี้
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">ชื่อหมวดหมู่ (ภาษาอังกฤษ) *</Label>
                  <Input
                    id="categoryName"
                    placeholder="เช่น moba, fps, rpg"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryDisplayName">ชื่อแสดงผล (ภาษาไทย) *</Label>
                  <Input
                    id="categoryDisplayName"
                    placeholder="เช่น เกมต่อสู้, เกมยิง, เกมผจญภัย"
                    value={categoryDisplayName}
                    onChange={(e) => setCategoryDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryImage">URL รูปภาพ</Label>
                <Input
                  id="categoryImage"
                  placeholder="https://example.com/image.jpg"
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryDescription">คำอธิบาย</Label>
                <Textarea
                  id="categoryDescription"
                  placeholder="คำอธิบายหมวดหมู่นี้..."
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Game Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>เลือกเกม ({selectedGameIds.length} เกม)</Label>
                  <Badge variant="outline">
                    เลือกแล้ว {selectedGameIds.length} จาก {gameProducts.length} เกม
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {gameProducts.map((game) => (
                    <div
                      key={game.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedGameIds.includes(game.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleGameSelection(game.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGameIds.includes(game.id)}
                          onChange={() => toggleGameSelection(game.id)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{game.category}</p>
                          <p className="text-xs text-muted-foreground truncate">{game.info}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={saving}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={saving}
                className="bg-gradient-primary shadow-glow"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    บันทึกหมวดหมู่
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                แก้ไขหมวดหมู่
              </DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลหมวดหมู่และเลือกเกมที่จะแสดงในหมวดหมู่นี้
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategoryName">ชื่อหมวดหมู่ (ภาษาอังกฤษ) *</Label>
                  <Input
                    id="editCategoryName"
                    placeholder="เช่น moba, fps, rpg"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCategoryDisplayName">ชื่อแสดงผล (ภาษาไทย) *</Label>
                  <Input
                    id="editCategoryDisplayName"
                    placeholder="เช่น เกมต่อสู้, เกมยิง, เกมผจญภัย"
                    value={categoryDisplayName}
                    onChange={(e) => setCategoryDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCategoryImage">URL รูปภาพ</Label>
                <Input
                  id="editCategoryImage"
                  placeholder="https://example.com/image.jpg"
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">คำอธิบาย</Label>
                <Textarea
                  id="editCategoryDescription"
                  placeholder="คำอธิบายหมวดหมู่นี้..."
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Game Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>เลือกเกม ({selectedGameIds.length} เกม)</Label>
                  <Badge variant="outline">
                    เลือกแล้ว {selectedGameIds.length} จาก {gameProducts.length} เกม
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {gameProducts.map((game) => (
                    <div
                      key={game.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedGameIds.includes(game.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleGameSelection(game.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGameIds.includes(game.id)}
                          onChange={() => toggleGameSelection(game.id)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{game.category}</p>
                          <p className="text-xs text-muted-foreground truncate">{game.info}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={saving}
                className="bg-gradient-primary shadow-glow"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    บันทึกการแก้ไข
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบหมวดหมู่</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการลบหมวดหมู่ <strong>{selectedCategory?.displayName}</strong> ใช่หรือไม่?
                <br />
                <br />
                การดำเนินการนี้จะลบข้อมูลหมวดหมู่อย่างถาวร
                <br />
                <span className="text-destructive font-medium">
                  ⚠️ เกมในหมวดหมู่นี้จะไม่แสดงในหน้าเติมเกมอีกต่อไป
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  "ลบหมวดหมู่"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </RoleProtectedRoute>
  );
};

export default CategoryManagement;
