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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createGame } from "@/lib/gameUtils";
import { useAuth } from "@/contexts/AuthContext";

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const CreateGameDialog = ({ open, onOpenChange, onSuccess }: CreateGameDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    imageUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    // Validation
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
      // สร้างเกม
      const result = await createGame({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        createdBy: user.uid,
      });

      if (result.success) {
        toast.success("เพิ่มเกมสำเร็จ!");

        // Reset form
        setFormData({ name: "", category: "", description: "", imageUrl: "" });

        // โหลดข้อมูลใหม่ก่อน
        await onSuccess();
        
        // รอเล็กน้อยแล้วค่อยปิด Dialog
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเพิ่มเกม");
      }
    } catch (error) {
      console.error("Create game error:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มเกม");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            เพิ่มเกมใหม่
          </DialogTitle>
          <DialogDescription>
            เพิ่มเกมใหม่เข้าระบบ พร้อมรูปภาพและรายละเอียด
          </DialogDescription>
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
              วาง URL รูปภาพจากอินเทอร์เน็ต (เช่น จาก Unsplash, Imgur)
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
              placeholder="เช่น Valorant, Genshin Impact"
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
                <SelectValue placeholder="เลือกหมวดหมู่" />
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
              placeholder="รายละเอียดเกม (ถ้ามี)"
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
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มเกม
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGameDialog;

