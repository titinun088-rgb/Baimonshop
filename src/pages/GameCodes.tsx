import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Gamepad2,
  ShoppingCart,
  Package,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllGames,
  purchaseGameCode,
  getPurchasedCodeDetails,
  Game,
  GameCodePurchase,
} from "@/lib/gameCodeUtils";

const GameCodes = () => {
  const navigate = useNavigate();
  const { user, userData, refreshUser } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchasedCode, setPurchasedCode] = useState<GameCodePurchase | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const gamesData = await getAllGames();
      // แสดงเฉพาะเกมที่มีสต็อก
      setGames(gamesData.filter((game) => game.stock > 0));
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดเกม");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (gameId: string) => {
    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      navigate("/login");
      return;
    }

    // แสดง confirmation dialog
    const game = games.find(g => g.id === gameId);
    if (game) {
      setSelectedGame(game);
      setConfirmDialogOpen(true);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedGame || !user || !userData) return;

    // ตรวจสอบยอดเงินก่อนซื้อ
    console.log("🎮 กำลังซื้อเกม:", {
      gameName: selectedGame.name,
      gamePrice: selectedGame.price,
      userBalance: userData.balance || 0,
      sufficient: (userData.balance || 0) >= selectedGame.price
    });

    setConfirmDialogOpen(false);
    setPurchasing(selectedGame.id);
    try {
      const purchase = await purchaseGameCode(user.uid, selectedGame.id);
      setPurchasedCode(purchase);
      setPurchaseDialogOpen(true);
      toast.success("ซื้อสำเร็จ!");
      
      // รีโหลดเกมเพื่ออัปเดตสต็อก และอัปเดต balance
      await Promise.all([loadGames(), refreshUser()]);
    } catch (error: any) {
      console.error("Error purchasing:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการซื้อ");
    } finally {
      setPurchasing(null);
      setSelectedGame(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("คัดลอกแล้ว");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const copyAll = async () => {
    if (!purchasedCode) return;

    const allText = `Email: ${purchasedCode.email}\nPassword: ${purchasedCode.password}\n${purchasedCode.details ? `Details: ${purchasedCode.details}` : ""}`;
    await copyToClipboard(allText, "all");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gamepad2 className="h-8 w-8" />
              รหัสเกม
            </h1>
            <p className="text-muted-foreground mt-2">
              เลือกเกมที่ต้องการซื้อรหัส
            </p>
          </div>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ยังไม่มีเกมที่พร้อมขาย
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const canPurchase =
                user &&
                userData &&
                game.stock > 0 &&
                (userData.balance || 0) >= game.price;

              return (
                <Card key={game.id} className="overflow-hidden">
                  {game.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{game.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {game.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">ราคา</p>
                        <p className="text-2xl font-bold text-primary">
                          ฿{game.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">สต็อกคงเหลือ</p>
                        <Badge
                          variant={game.stock > 10 ? "default" : "destructive"}
                          className="text-sm"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          เหลือ {game.stock} ชิ้น
                        </Badge>
                      </div>
                    </div>

                    {!user ? (
                      <Button
                        className="w-full"
                        onClick={() => navigate("/login")}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        เข้าสู่ระบบเพื่อซื้อ
                      </Button>
                    ) : game.stock === 0 ? (
                      <Button className="w-full" disabled>
                        <Package className="h-4 w-4 mr-2" />
                        สินค้าหมด
                      </Button>
                    ) : (userData?.balance || 0) < game.price ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => navigate("/top-up")}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        ยอดเงินไม่เพียงพอ
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(game.id)}
                        disabled={purchasing === game.id}
                      >
                        {purchasing === game.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            กำลังซื้อ...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            ซื้อทันที
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Purchase Success Dialog */}
        <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                ซื้อสำเร็จ!
              </DialogTitle>
              <DialogDescription>
                รหัสเกมของคุณพร้อมใช้งานแล้ว
              </DialogDescription>
            </DialogHeader>

            {purchasedCode && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex gap-2">
                    <Input
                      value={purchasedCode.email}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(purchasedCode.email, "email")
                      }
                    >
                      {copiedField === "email" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="flex gap-2">
                    <Input
                      value={purchasedCode.password}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(purchasedCode.password, "password")
                      }
                    >
                      {copiedField === "password" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {purchasedCode.details && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">รายละเอียด</label>
                    <div className="flex gap-2">
                      <Input
                        value={purchasedCode.details}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(purchasedCode.details || "", "details")
                        }
                      >
                        {copiedField === "details" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={copyAll}
                >
                  {copiedField === "all" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอกทั้งหมด
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setPurchaseDialogOpen(false);
                      navigate("/purchase-history");
                    }}
                  >
                    ดูประวัติการซื้อ
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                ยืนยันการซื้อ
              </DialogTitle>
              <DialogDescription>
                กรุณาตรวจสอบข้อมูลก่อนทำการซื้อ
              </DialogDescription>
            </DialogHeader>

            {selectedGame && (
              <div className="space-y-4 mt-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedGame.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedGame.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">ราคา:</span>
                      <span className="text-lg font-bold text-primary">
                        ฿{selectedGame.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ยอดเงินคงเหลือ:</span>
                      <span className="text-lg font-semibold">
                        ฿{(userData?.balance || 0).toLocaleString()}
                      </span>
                    </div>
                    {userData && (userData.balance || 0) >= selectedGame.price && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">ยอดเงินหลังซื้อ:</span>
                        <span className="text-lg font-semibold text-green-600">
                          ฿{((userData.balance || 0) - selectedGame.price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    คุณแน่ใจหรือไม่ว่าต้องการซื้อรหัสเกมนี้?
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setConfirmDialogOpen(false);
                      setSelectedGame(null);
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmPurchase}
                    disabled={!userData || (userData.balance || 0) < selectedGame.price}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    ยืนยันการซื้อ
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GameCodes;

