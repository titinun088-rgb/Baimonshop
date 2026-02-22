import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllGames,
  getGamePackages,
  createGame,
  updateGame,
  deleteGame,
  createPackage,
  updatePackage,
  deletePackage
} from '@/lib/emailPassGameUtils';
import { EmailPassGame, GamePackage } from '@/types/emailPassGame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function EmailPassGameManagement() {
  const { user } = useAuth();
  const [games, setGames] = useState<EmailPassGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<EmailPassGame | null>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<EmailPassGame | null>(null);
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'game' | 'package'; id: string} | null>(null);

  // Game form state
  const [gameName, setGameName] = useState('');
  const [gameIcon, setGameIcon] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [gameActive, setGameActive] = useState(true);

  // Package form state
  const [pkgName, setPkgName] = useState('');
  const [pkgValue, setPkgValue] = useState('');
  const [pkgUnit, setPkgUnit] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgActive, setPkgActive] = useState(true);
  const [pkgOrder, setPkgOrder] = useState('0');

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadPackages(selectedGame.id);
    }
  }, [selectedGame]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await getAllGames();
      setGames(data);
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

  const loadPackages = async (gameId: string) => {
    try {
      const data = await getGamePackages(gameId);
      setPackages(data);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดแพ็กเกจได้',
        variant: 'destructive'
      });
    }
  };

  // === GAME HANDLERS ===

  const openGameDialog = (game?: EmailPassGame) => {
    if (game) {
      setEditingGame(game);
      setGameName(game.name);
      setGameIcon(game.icon);
      setGameDescription(game.description);
      setGameActive(game.active);
    } else {
      setEditingGame(null);
      setGameName('');
      setGameIcon('');
      setGameDescription('');
      setGameActive(true);
    }
    setShowGameDialog(true);
  };

  const handleSaveGame = async () => {
    if (!user || !gameName.trim() || !gameIcon.trim()) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกชื่อและไอคอนเกม',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingGame) {
        await updateGame(editingGame.id, {
          name: gameName.trim(),
          icon: gameIcon.trim(),
          description: gameDescription.trim(),
          active: gameActive
        });
        toast({ title: 'อัปเดตเกมสำเร็จ' });
      } else {
        await createGame(
          gameName.trim(),
          gameIcon.trim(),
          gameDescription.trim(),
          user.uid
        );
        toast({ title: 'สร้างเกมสำเร็จ' });
      }

      setShowGameDialog(false);
      loadGames();
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      toast({ title: 'ลบเกมสำเร็จ' });
      loadGames();
      if (selectedGame?.id === gameId) {
        setSelectedGame(null);
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // === PACKAGE HANDLERS ===

  const openPackageDialog = (pkg?: GamePackage) => {
    if (!selectedGame) return;

    if (pkg) {
      setEditingPackage(pkg);
      setPkgName(pkg.name);
      setPkgValue(pkg.value.toString());
      setPkgUnit(pkg.unit);
      setPkgPrice(pkg.price.toString());
      setPkgDescription(pkg.description || '');
      setPkgActive(pkg.active);
      setPkgOrder(pkg.order.toString());
    } else {
      setEditingPackage(null);
      setPkgName('');
      setPkgValue('');
      setPkgUnit('');
      setPkgPrice('');
      setPkgDescription('');
      setPkgActive(true);
      setPkgOrder('0');
    }
    setShowPackageDialog(true);
  };

  const handleSavePackage = async () => {
    if (!selectedGame || !pkgName.trim() || !pkgValue || !pkgPrice) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive'
      });
      return;
    }

    try {
      const packageData = {
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        name: pkgName.trim(),
        value: pkgValue.trim(),
        unit: pkgUnit.trim(),
        price: parseFloat(pkgPrice),
        description: pkgDescription.trim(),
        active: pkgActive,
        order: parseInt(pkgOrder)
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
        toast({ title: 'อัปเดตแพ็กเกจสำเร็จ' });
      } else {
        await createPackage({
          ...packageData,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        });
        toast({ title: 'สร้างแพ็กเกจสำเร็จ' });
      }

      setShowPackageDialog(false);
      loadPackages(selectedGame.id);
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      await deletePackage(packageId);
      toast({ title: 'ลบแพ็กเกจสำเร็จ' });
      if (selectedGame) {
        loadPackages(selectedGame.id);
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
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
          <h1 className="text-3xl font-bold">จัดการเกม Email/Password</h1>
          <p className="text-muted-foreground">จัดการเกมและแพ็กเกจ</p>
        </div>
        <Button onClick={() => openGameDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเกม
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการเกม ({games.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedGame?.id === game.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{game.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{game.name}</p>
                          <Badge variant={game.active ? 'default' : 'secondary'}>
                            {game.active ? 'เปิด' : 'ปิด'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {game.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGameDialog(game);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ type: 'game', id: game.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Packages List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedGame ? `แพ็กเกจ ${selectedGame.name}` : 'เลือกเกม'}
              </CardTitle>
              {selectedGame && (
                <Button size="sm" onClick={() => openPackageDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มแพ็กเกจ
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGame ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>เลือกเกมเพื่อจัดการแพ็กเกจ</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>ยังไม่มีแพ็กเกจ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-lg border hover:bg-muted transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{pkg.name}</p>
                          <Badge variant={pkg.active ? 'default' : 'secondary'}>
                            {pkg.active ? 'เปิด' : 'ปิด'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pkg.value} {pkg.unit}
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pkg.description}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary mt-2">
                          ฿{pkg.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPackageDialog(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'package', id: pkg.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Dialog */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGame ? 'แก้ไขเกม' : 'เพิ่มเกม'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อเกม *</Label>
              <Input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Free Fire"
              />
            </div>
            <div>
              <Label>ไอคอน (Emoji) *</Label>
              <Input
                value={gameIcon}
                onChange={(e) => setGameIcon(e.target.value)}
                placeholder="🎮"
              />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
                placeholder="เติมเพชรและไอเทมในเกม"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>เปิดใช้งาน</Label>
              <Switch checked={gameActive} onCheckedChange={setGameActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGameDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveGame}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Dialog */}
      <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'แก้ไขแพ็กเกจ' : 'เพิ่มแพ็กเกจ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อแพ็กเกจ *</Label>
              <Input
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder="100 เพชร"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>มูลค่า *</Label>
                <Input
                  type="number"
                  value={pkgValue}
                  onChange={(e) => setPkgValue(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>หน่วย *</Label>
                <Input
                  value={pkgUnit}
                  onChange={(e) => setPkgUnit(e.target.value)}
                  placeholder="เพชร"
                />
              </div>
            </div>
            <div>
              <Label>ราคา (บาท) *</Label>
              <Input
                type="number"
                step="0.01"
                value={pkgPrice}
                onChange={(e) => setPkgPrice(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea
                value={pkgDescription}
                onChange={(e) => setPkgDescription(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>
            <div>
              <Label>ลำดับการแสดง</Label>
              <Input
                type="number"
                value={pkgOrder}
                onChange={(e) => setPkgOrder(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>เปิดใช้งาน</Label>
              <Switch checked={pkgActive} onCheckedChange={setPkgActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPackageDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSavePackage}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ{deleteConfirm?.type === 'game' ? 'เกม' : 'แพ็กเกจ'}นี้?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === 'game') {
                    handleDeleteGame(deleteConfirm.id);
                  } else {
                    handleDeletePackage(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }
              }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
}
