import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createGameItem } from "@/lib/gameUtils";

interface CreateGameItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  onSuccess: () => void;
}

const CreateGameItemDialog = ({
  open,
  onOpenChange,
  gameId,
  onSuccess,
}: CreateGameItemDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    costPrice: "",
    sellPrice: "",
    imageUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      console.log("🔵 กำลังบันทึก Game Item:", {
        gameId,
        name: formData.name.trim(),
        costPrice,
        sellPrice,
      });

      const result = await createGameItem({
        gameId,
        name: formData.name.trim(),
        costPrice,
        sellPrice,
        imageUrl: formData.imageUrl.trim() || undefined,
      });

      console.log("🔵 ผลการบันทึก:", result);

      if (result.success) {
        console.log("✅ บันทึกสำเร็จ! ID:", result.id);
        toast.success("เพิ่มรายการเติมสำเร็จ!");

        // Reset form
        setFormData({
          name: "",
          costPrice: "",
          sellPrice: "",
          imageUrl: "",
        });

        console.log("🔄 กำลังโหลดข้อมูลใหม่...");
        // โหลดข้อมูลใหม่ก่อน
        await onSuccess();
        console.log("✅ โหลดข้อมูลเสร็จแล้ว");
        
        // รอเล็กน้อยแล้วค่อยปิด Dialog
        setTimeout(() => {
          console.log("🔵 ปิด Dialog");
          onOpenChange(false);
        }, 500);
      } else {
        console.error("❌ บันทึกไม่สำเร็จ:", result.error);
        toast.error(result.error || "เกิดข้อผิดพลาดในการเพิ่มรายการเติม");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มรายการเติม");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            เพิ่มรายการเติม
          </DialogTitle>
          <DialogDescription>
            เพิ่มรายการเติมเงินใหม่สำหรับเกมนี้
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อรายการ *</Label>
            <Input
              id="name"
              placeholder="เช่น VP 1000, Diamond 500"
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
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              สามารถวาง URL รูปภาพจากภายนอกได้
            </p>
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
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มรายการ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGameItemDialog;

