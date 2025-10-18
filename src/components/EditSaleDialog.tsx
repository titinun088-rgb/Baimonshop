import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Edit } from "lucide-react";
import { updateSale } from "@/lib/salesUtils";
import { Game, GameItem } from "@/lib/gameUtils";
import { Sale } from "@/types/sale";

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  games: Game[];
  gameItems: GameItem[];
  onSuccess: () => Promise<void>;
}

const EditSaleDialog = ({
  open,
  onOpenChange,
  sale,
  games,
  gameItems,
  onSuccess,
}: EditSaleDialogProps) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [gameId, setGameId] = useState("");
  const [gameItemId, setGameItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  // โหลดข้อมูล sale เข้า form
  useEffect(() => {
    if (sale && open) {
      setGameId(sale.gameId);
      setGameItemId(sale.gameItemId);
      setQuantity(sale.quantity);
      setDiscount(sale.discount);
    }
  }, [sale, open]);

  // กรอง game items ตามเกมที่เลือก
  const filteredGameItems = gameItems.filter((item) => item.gameId === gameId);

  // ดึงข้อมูล game item ที่เลือก
  const selectedGameItem = gameItems.find((item) => item.id === gameItemId);

  // คำนวณยอดรวม
  const totalSell = selectedGameItem ? selectedGameItem.sellPrice * quantity : 0;
  const netAmount = totalSell - discount;
  const totalCost = selectedGameItem ? selectedGameItem.costPrice * quantity : 0;
  const profit = netAmount - totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData || !sale) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!gameId || !gameItemId) {
      toast.error("กรุณาเลือกเกมและรายการเติม");
      return;
    }

    if (quantity < 1) {
      toast.error("จำนวนต้องมากกว่า 0");
      return;
    }

    if (discount < 0) {
      toast.error("ส่วนลดไม่สามารถติดลบได้");
      return;
    }

    if (discount > totalSell) {
      toast.error("ส่วนลดไม่สามารถมากกว่ายอดขายได้");
      return;
    }

    setLoading(true);
    try {
      const result = await updateSale(
        sale.id,
        {
          gameId,
          gameItemId,
          quantity,
          discount,
        },
        {
          userId: user.uid,
          email: user.email || "",
          shopName: userData.shopName,
        }
      );

      if (result.success) {
        toast.success("แก้ไขยอดขายสำเร็จ!");
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขยอดขาย");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            แก้ไขยอดขาย
          </DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลยอดขายและระบบจะคำนวณยอดรวมใหม่อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* เกม */}
          <div className="space-y-2">
            <Label htmlFor="game">เกม *</Label>
            <Select value={gameId} onValueChange={setGameId} disabled={loading}>
              <SelectTrigger id="game">
                <SelectValue placeholder="เลือกเกม" />
              </SelectTrigger>
              <SelectContent>
                {games.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    ไม่มีเกมในระบบ
                  </div>
                ) : (
                  games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* รายการเติม */}
          <div className="space-y-2">
            <Label htmlFor="gameItem">รายการเติม *</Label>
            <Select
              value={gameItemId}
              onValueChange={setGameItemId}
              disabled={loading || !gameId}
            >
              <SelectTrigger id="gameItem">
                <SelectValue placeholder="เลือกรายการเติม" />
              </SelectTrigger>
              <SelectContent>
                {filteredGameItems.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {gameId ? "ไม่มีรายการเติมในเกมนี้" : "กรุณาเลือกเกมก่อน"}
                  </div>
                ) : (
                  filteredGameItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ฿{item.sellPrice.toFixed(2)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* แสดงรายละเอียดรายการ */}
          {selectedGameItem && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ราคาขาย:</span>
                <span className="font-medium">฿{selectedGameItem.sellPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ราคาทุน:</span>
                <span className="font-medium">฿{selectedGameItem.costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">กำไรต่อหน่วย:</span>
                <span className="font-medium text-success">
                  ฿{(selectedGameItem.sellPrice - selectedGameItem.costPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* จำนวน */}
          <div className="space-y-2">
            <Label htmlFor="quantity">จำนวน *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="ระบุจำนวน"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={loading}
              required
            />
          </div>

          {/* ส่วนลด */}
          <div className="space-y-2">
            <Label htmlFor="discount">ส่วนลด (บาท)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              placeholder="ระบุส่วนลด (ถ้ามี)"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              disabled={loading}
            />
          </div>

          {/* สรุปยอด */}
          {selectedGameItem && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold">สรุปยอด</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ยอดขาย:</span>
                  <span>฿{totalSell.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ส่วนลด:</span>
                  <span className="text-destructive">-฿{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-1">
                  <span>ยอดสุทธิ:</span>
                  <span className="text-primary">฿{netAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ทุน:</span>
                  <span>฿{totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>กำไร:</span>
                  <span className={profit >= 0 ? "text-success" : "text-destructive"}>
                    ฿{profit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading || !selectedGameItem}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึกการแก้ไข
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaleDialog;

