import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateGameItem, GameItem } from "@/lib/gameUtils";

interface EditGameItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GameItem | null;
  onSuccess: () => void;
}

const EditGameItemDialog = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditGameItemDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    costPrice: "",
    sellPrice: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        costPrice: item.costPrice.toString(),
        sellPrice: item.sellPrice.toString(),
        imageUrl: item.imageUrl || "",
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อรายการ");
      return;
    }

    const costPrice = parseFloat(formData.costPrice);
    const sellPrice = parseFloat(formData.sellPrice);

    if (isNaN(costPrice) || costPrice < 0) {
      toast.error("กรุณากรอกราคาทุนที่ถูกต้อง");
      return;
    }

    if (isNaN(sellPrice) || sellPrice < 0) {
      toast.error("กรุณากรอกราคาขายที่ถูกต้อง");
      return;
    }

    if (sellPrice < costPrice) {
      toast.warning("ราคาขายต่ำกว่าราคาทุน คุณจะขาดทุน!");
    }

    setLoading(true);

    try {
      const result = await updateGameItem(item.id, {
        name: formData.name.trim(),
        costPrice,
        sellPrice,
        imageUrl: formData.imageUrl.trim() || undefined,
      });

      if (result.success) {
        toast.success("อัปเดตรายการเติมสำเร็จ!");
        
        // โหลดข้อมูลใหม่ก่อน
        await onSuccess();
        
        // รอเล็กน้อยแล้วค่อยปิด Dialog
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการอัปเดตรายการเติม");
      }
    } catch (error) {
      console.error("Update game item error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตรายการเติม");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.costPrice);
    const sell = parseFloat(formData.sellPrice);

    if (!isNaN(cost) && !isNaN(sell)) {
      const profit = sell - cost;
      const percentage = ((profit / cost) * 100).toFixed(1);
      return { profit, percentage };
    }
    return null;
  };

  const profitInfo = calculateProfit();

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            แก้ไขรายการเติม
          </DialogTitle>
          <DialogDescription>แก้ไขข้อมูลของ {item.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อรายการ *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">ราคาทุน (฿) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="ระบุราคาทุน"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellPrice">ราคาขาย (฿) *</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="ระบุราคาขาย"
                value={formData.sellPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellPrice: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Profit Calculator */}
          {profitInfo && (
            <div
              className={`rounded-lg p-3 ${
                profitInfo.profit >= 0
                  ? "bg-success/10 border border-success/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">กำไร:</span>
                <span
                  className={`font-semibold ${
                    profitInfo.profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  ฿{profitInfo.profit.toFixed(2)} ({profitInfo.percentage}%)
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL รูปภาพ (ไม่จำเป็น)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary shadow-glow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGameItemDialog;

