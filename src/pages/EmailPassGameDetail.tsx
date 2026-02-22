import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGameById,
  getGamePackages,
  createOrder,
  checkUserBalance
} from '@/lib/emailPassGameUtils';
import { sendNewOrderNotification } from '@/lib/telegramBotUtils';
import { updateOrderTelegram } from '@/lib/emailPassGameUtils';
import { storePurchaseHistory } from '@/lib/purchaseHistoryUtils';
import { EmailPassGame, GamePackage } from '@/types/emailPassGame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function EmailPassGameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState<EmailPassGame | null>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  
  const [gameEmail, setGameEmail] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [note, setNote] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGameData();
    }
  }, [gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const [gameData, packagesData] = await Promise.all([
        getGameById(gameId!),
        getGamePackages(gameId!, true)
      ]);
      
      if (!gameData) {
        toast({
          title: 'ไม่พบเกม',
          description: 'ไม่พบข้อมูลเกมที่เลือก',
          variant: 'destructive'
        });
        navigate('/email-pass-games');
        return;
      }

      setGame(gameData);
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading game data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !game || !selectedPackage) return;

    // ตรวจสอบข้อมูล
    if (!gameEmail.trim() || !gamePassword.trim()) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกอีเมลและพาสเวิร์ดของเกม',
        variant: 'destructive'
      });
      return;
    }

    // ตรวจสอบยอดเงิน
    const hasBalance = await checkUserBalance(user.uid, selectedPackage.price);
    if (!hasBalance) {
      toast({
        title: 'ยอดเงินไม่เพียงพอ',
        description: 'กรุณาเติมเงินก่อนทำรายการ',
        variant: 'destructive'
      });
      return;
    }

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    if (!user || !game || !selectedPackage) return;

    try {
      setSubmitting(true);

      // สร้างออเดอร์
      const orderId = await createOrder(
        user.uid,
        user.email || '',
        game,
        selectedPackage,
        gameEmail.trim(),
        gamePassword.trim(),
        note.trim() || undefined
      );

      // ดึงข้อมูลออเดอร์ที่สร้างเพื่อส่ง Telegram
      const orderRef = await import('@/lib/emailPassGameUtils').then(m => m.getOrderById(orderId));
      
      if (orderRef) {
        // ส่ง Telegram notification
        const messageId = await sendNewOrderNotification(orderRef);
        
        // บันทึก message ID
        if (messageId && orderRef.telegramChatId) {
          await updateOrderTelegram(orderId, messageId, orderRef.telegramChatId);
        }

        // บันทึกไปยังประวัติการซื้อสินค้า
        try {
          await storePurchaseHistory(user.uid, 'emailpass', {
            id: orderId,
            productName: `${game.name} - ${selectedPackage.name}`,
            productId: selectedPackage.id,
            prize: `${selectedPackage.value} ${selectedPackage.unit}`,
            price: selectedPackage.price.toString(),
            recommendedPrice: selectedPackage.price.toString(),
            refId: orderId,
            reference: orderId,
            resellerId: '',
            status: orderRef.status,
            date: new Date().toISOString(),
            sellPrice: selectedPackage.price
          });
          console.log('✅ บันทึกประวัติการซื้อสำเร็จ');
        } catch (historyError) {
          console.warn('⚠️ ไม่สามารถบันทึกประวัติการซื้อได้:', historyError);
        }
      }

      toast({
        title: 'สั่งซื้อสำเร็จ!',
        description: 'กรุณารอแอดมินดำเนินการเติมให้'
      });

      navigate('/email-pass-history');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างออเดอร์ได้',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
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

  if (!game) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>ไม่พบเกมที่เลือก</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/email-pass-games')}
        className="mb-4 md:mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับ
      </Button>

      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl md:text-5xl">{game.icon}</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
            <p className="text-muted-foreground">{game.description}</p>
          </div>
        </div>
      </div>

      {!showConfirmation ? (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Package Selection */}
          <Card>
            <CardHeader>
              <CardTitle>เลือกแพ็กเกจ</CardTitle>
              <CardDescription>เลือกแพ็กเกจที่ต้องการเติม</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>ยังไม่มีแพ็กเกจให้บริการ</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {packages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {pkg.value} {pkg.unit}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            ฿{pkg.price.toLocaleString()}
                          </p>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground">{pkg.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลบัญชีเกม</CardTitle>
              <CardDescription>
                กรุณากรอกอีเมลและพาสเวิร์ดของบัญชีเกมที่ต้องการเติม
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gameEmail">อีเมลบัญชีเกม *</Label>
                <Input
                  id="gameEmail"
                  type="email"
                  value={gameEmail}
                  onChange={(e) => setGameEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gamePassword">พาสเวิร์ดบัญชีเกม *</Label>
                <Input
                  id="gamePassword"
                  type="text"
                  value={gamePassword}
                  onChange={(e) => setGamePassword(e.target.value)}
                  placeholder="รหัสผ่านบัญชีเกม"
                  required
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ข้อมูลของคุณจะถูกเก็บไว้อย่างปลอดภัย และจะถูกใช้เพื่อการเติมเท่านั้น
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader>
              <CardTitle>หมายเหตุ (ไม่บังคับ)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ข้อความถึงแอดมิน..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedPackage && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>เกม:</span>
                    <span className="font-medium">{game.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>แพ็กเกจ:</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดรวม:</span>
                    <span className="text-primary">฿{selectedPackage.price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!selectedPackage || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังสั่งซื้อ...
              </>
            ) : (
              'ยืนยันสั่งซื้อ'
            )}
          </Button>
        </form>
      ) : (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
              ยืนยันคำสั่งซื้อ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-3 md:p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เกม:</span>
                  <span className="font-medium">{game.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">แพ็กเกจ:</span>
                  <span className="font-medium">{selectedPackage?.name}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-muted-foreground">อีเมลเกม:</span>
                  <span className="font-medium break-all text-right">{gameEmail}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">พาสเวิร์ด:</span>
                  <span className="font-medium">••••••••</span>
                </div>
                
                {note && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">หมายเหตุ:</span>
                    <span className="font-medium bg-background p-2 rounded">{note}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground font-medium">ยอดรวม:</span>
                  <span className="text-lg md:text-xl font-bold text-primary">
                    ฿{selectedPackage?.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
                disabled={submitting}
              >
                แก้ไข
              </Button>
              <Button
                onClick={confirmOrder}
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสั่งซื้อ...
                  </>
                ) : (
                  'ยืนยัน'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </Layout>
  );
}
