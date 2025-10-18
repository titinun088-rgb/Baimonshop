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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateGame, Game } from "@/lib/gameUtils";

interface EditGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  "FPS",
  "MOBA",
  "Battle Royale",
  "RPG",
  "MMORPG",
  "Strategy",
  "Sports",
  "Racing",
  "Adventure",
  "Puzzle",
  "Casual",
  "Other",
];

const EditGameDialog = ({ open, onOpenChange, game, onSuccess }: EditGameDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name,
        category: game.category,
        description: game.description || "",
        imageUrl: game.imageUrl,
      });
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!game) return;

    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อเกม");
      return;
    }

    if (!formData.category) {
      toast.error("กรุณาเลือกหมวดหมู่");
      return;
    }

    if (!formData.imageUrl.trim()) {
      toast.error("กรุณากรอก URL รูปภาพ");
      return;
    }

    setLoading(true);

    try {
      // อัปเดตเกม
      const result = await updateGame(game.id, {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
      });

      if (result.success) {
        toast.success("อัปเดตเกมสำเร็จ!");
        
        // โหลดข้อมูลใหม่ก่อน
        await onSuccess();
        
        // รอเล็กน้อยแล้วค่อยปิด Dialog
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการอัปเดตเกม");
      }
    } catch (error) {
      console.error("Update game error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตเกม");
    } finally {
      setLoading(false);
    }
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            แก้ไขเกม
          </DialogTitle>
          <DialogDescription>แก้ไขข้อมูลของ {game.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL รูปภาพ *</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              วาง URL รูปภาพจากอินเทอร์เน็ต
            </p>
            {formData.imageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x225?text=Invalid+Image+URL";
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">ชื่อเกม *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่ *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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

export default EditGameDialog;

