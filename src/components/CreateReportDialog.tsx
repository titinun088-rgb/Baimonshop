import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { createReport } from "@/lib/reportUtils";

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

const CreateReportDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateReportDialogProps) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "technical",
  });

  const categories = [
    { value: "technical", label: "ปัญหาทางเทคนิค" },
    { value: "billing", label: "ปัญหาการเงิน/บิลลิ่ง" },
    { value: "feature", label: "ขอฟีเจอร์ใหม่" },
    { value: "bug", label: "พบ Bug/ข้อผิดพลาด" },
    { value: "account", label: "ปัญหาบัญชีผู้ใช้" },
    { value: "other", label: "อื่นๆ" },
  ];

  const priorities = [
    { value: "low", label: "ต่ำ", color: "text-green-500" },
    { value: "medium", label: "ปานกลาง", color: "text-yellow-500" },
    { value: "high", label: "สูง", color: "text-red-500" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("กรุณากรอกหัวข้อปัญหา");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("กรุณากรอกรายละเอียด");
      return;
    }

    setLoading(true);
    try {
      const result = await createReport(
        user.uid,
        user.email || "",
        userData.shopName,
        formData
      );

      if (result.success) {
        toast.success("แจ้งปัญหาสำเร็จ! ทีมงานจะดำเนินการโดยเร็วที่สุด");
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          category: "technical",
        });
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแจ้งปัญหา");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            แจ้งปัญหา / รายงานข้อผิดพลาด
          </DialogTitle>
          <DialogDescription>
            กรุณาอธิบายปัญหาที่พบให้ละเอียดเพื่อให้ทีมงานสามารถแก้ไขได้อย่างรวดเร็ว
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* หมวดหมู่ */}
          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่ *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* หัวข้อ */}
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อปัญหา *</Label>
            <Input
              id="title"
              placeholder="เช่น: ไม่สามารถเข้าสู่ระบบได้"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* รายละเอียด */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด *</Label>
            <Textarea
              id="description"
              placeholder="อธิบายปัญหาที่พบโดยละเอียด..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={loading}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              ควรระบุ: ขั้นตอนการทำงานที่เกิดปัญหา, ข้อความ error (ถ้ามี), เบราว์เซอร์ที่ใช้
            </p>
          </div>

          {/* ความสำคัญ */}
          <div className="space-y-2">
            <Label htmlFor="priority">ความสำคัญ *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) =>
                setFormData({ ...formData, priority: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((pri) => (
                  <SelectItem key={pri.value} value={pri.value}>
                    <span className={pri.color}>{pri.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              • <span className="text-red-500">สูง</span>: ไม่สามารถใช้งานได้เลย<br />
              • <span className="text-yellow-500">ปานกลาง</span>: ใช้งานได้แต่มีปัญหา<br />
              • <span className="text-green-500">ต่ำ</span>: ใช้งานได้ปกติแต่มีข้อเสนอแนะ
            </p>
          </div>

          {/* ข้อมูลผู้แจ้ง */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">ข้อมูลผู้แจ้ง</p>
            <p className="text-sm text-muted-foreground">
              อีเมล: {user?.email || "ไม่ระบุ"}
            </p>
            {userData?.shopName && (
              <p className="text-sm text-muted-foreground">
                ร้าน: {userData.shopName}
              </p>
            )}
          </div>

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
              แจ้งปัญหา
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportDialog;



