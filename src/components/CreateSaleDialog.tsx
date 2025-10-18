import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2 } from "lucide-react";
import { Game, GameItem } from "@/lib/gameUtils";
import { createSale } from "@/lib/salesUtils";

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  games: Game[]; // รับ games จาก parent
  gameItems: GameItem[]; // รับ all game items จาก parent
}

const CreateSaleDialog = ({
  open,
  onOpenChange,
  onSuccess,
  games,
  gameItems,
}: CreateSaleDialogProps) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    gameId: "",
    gameItemId: "",
    quantity: "",
    discount: "",
  });

  // State สำหรับรายการที่ถูกกรอง
  const [filteredItems, setFilteredItems] = useState<GameItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  // กรอง game items เมื่อเลือกเกม
  useEffect(() => {
    if (formData.gameId) {
      const items = gameItems.filter((item) => item.gameId === formData.gameId);
      setFilteredItems(items);
      // Reset item selection
      setFormData((prev) => ({ ...prev, gameItemId: "" }));
      setSelectedItem(null);
    } else {
      setFilteredItems([]);
      setSelectedItem(null);
    }
  }, [formData.gameId, gameItems]);

  // อัปเดต selectedItem เมื่อเลือก game item
  useEffect(() => {
    if (formData.gameItemId) {
      const item = gameItems.find((item) => item.id === formData.gameItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [formData.gameItemId, gameItems]);

  // คำนวณราคาแบบ real-time
  const quantity = parseInt(formData.quantity) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const totalCost = selectedItem ? selectedItem.costPrice * quantity : 0;
  const totalSell = selectedItem ? selectedItem.sellPrice * quantity : 0;
  const netAmount = totalSell - discount;
  const profit = netAmount - totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!formData.gameId || !formData.gameItemId) {
      toast.error("กรุณาเลือกเกมและรายการ");
      return;
    }

    if (quantity <= 0) {
      toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
      return;
    }

    if (discount < 0) {
      toast.error("ส่วนลดต้องไม่ติดลบ");
      return;
    }

    if (netAmount < 0) {
      toast.error("ส่วนลดมากเกินไป ราคาขายสุทธิติดลบ");
      return;
    }

    setLoading(true);
    try {
      const result = await createSale(
        user.uid,
        user.email || "",
        userData.shopName,
        {
          gameId: formData.gameId,
          gameItemId: formData.gameItemId,
          quantity,
          discount,
        }
      );

      if (result.success) {
        toast.success("บันทึกยอดขายสำเร็จ!");
        setFormData({ gameId: "", gameItemId: "", quantity: "", discount: "" });
        console.log("🔄 กำลังโหลดข้อมูลใหม่...");
        await onSuccess(); // Load new data first
        console.log("✅ โหลดข้อมูลเสร็จแล้ว");
        setTimeout(() => {
          console.log("🔵 ปิด Dialog");
          onOpenChange(false); // Then close dialog
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกยอดขาย");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มยอดขายใหม่</DialogTitle>
          <DialogDescription>
            เลือกเกม รายการ และกรอกจำนวนเพื่อบันทึกยอดขาย
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* เลือกเกม */}
          <div className="space-y-2">
            <Label htmlFor="gameId">เกม *</Label>
            <Select
              value={formData.gameId}
              onValueChange={(value) =>
                setFormData({ ...formData, gameId: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกเกม" />
              </SelectTrigger>
              <SelectContent>
                {games.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    ไม่มีเกม กรุณาเพิ่มเกมก่อน
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

          {/* เลือกรายการ */}
          <div className="space-y-2">
            <Label htmlFor="gameItemId">รายการ *</Label>
            <Select
              value={formData.gameItemId}
              onValueChange={(value) =>
                setFormData({ ...formData, gameItemId: value })
              }
              disabled={loading || !formData.gameId}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกรายการ" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {formData.gameId
                      ? "ไม่มีรายการในเกมนี้"
                      : "กรุณาเลือกเกมก่อน"}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ฿{item.sellPrice}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* แสดงราคาต่อหน่วย */}
          {selectedItem && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ราคาทุน:</span>
                <span className="font-medium">฿{selectedItem.costPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ราคาขาย:</span>
                <span className="font-medium">฿{selectedItem.sellPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">กำไรต่อหน่วย:</span>
                <span className={`font-medium ${selectedItem.sellPrice - selectedItem.costPrice >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ฿{selectedItem.sellPrice - selectedItem.costPrice}
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
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              disabled={loading || !formData.gameItemId}
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
              value={formData.discount}
              onChange={(e) =>
                setFormData({ ...formData, discount: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* สรุปราคา */}
          {quantity > 0 && selectedItem && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
              <h3 className="font-semibold text-sm text-primary mb-2">
                สรุปยอดขาย
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">จำนวน:</span>
                  <span className="font-medium">{quantity} รายการ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ต้นทุนรวม:</span>
                  <span className="font-medium">฿{totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ราคาขายรวม:</span>
                  <span className="font-medium">฿{totalSell.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ส่วนลด:</span>
                    <span className="font-medium text-orange-500">
                      -฿{discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">ราคาขายสุทธิ:</span>
                    <span className="font-bold text-primary">
                      ฿{netAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-semibold">กำไร:</span>
                    <span
                      className={`font-bold ${
                        profit >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {profit >= 0 ? "+" : ""}฿{profit.toFixed(2)}
                    </span>
                  </div>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึกยอดขาย
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSaleDialog;

