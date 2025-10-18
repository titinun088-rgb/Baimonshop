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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";
import { createNotification } from "@/lib/notificationUtils";
import { NotificationType, NotificationShowMode } from "@/types/notification";

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  users?: Array<{ id: string; email: string; shopName?: string }>; // รายชื่อผู้ใช้ทั้งหมด
}

const CreateNotificationDialog = ({
  open,
  onOpenChange,
  onSuccess,
  users = [],
}: CreateNotificationDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType,
    showMode: "once" as NotificationShowMode,
    targetType: "all" as "all" | "specific",
    targetUserId: "",
  });

  const notificationTypes: Array<{
    value: NotificationType;
    label: string;
    description: string;
  }> = [
    { value: "info", label: "ข้อมูล", description: "ประกาศข้อมูลทั่วไป" },
    { value: "success", label: "สำเร็จ", description: "ข่าวดี/ความสำเร็จ" },
    { value: "warning", label: "คำเตือน", description: "แจ้งเตือนสิ่งสำคัญ" },
    { value: "error", label: "ข้อผิดพลาด", description: "แจ้งปัญหา/ข้อผิดพลาด" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("กรุณากรอกข้อความ");
      return;
    }

    if (formData.targetType === "specific" && !formData.targetUserId) {
      toast.error("กรุณาเลือกผู้ใช้");
      return;
    }

    setLoading(true);
    try {
      const targetUser = users.find((u) => u.id === formData.targetUserId);

      const result = await createNotification(
        user.uid,
        {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          showMode: formData.showMode,
          targetType: formData.targetType,
          targetUserId:
            formData.targetType === "specific" ? formData.targetUserId : undefined,
        },
        targetUser?.email
      );

      if (result.success) {
        toast.success("สร้างแจ้งเตือนสำเร็จ!");
        setFormData({
          title: "",
          message: "",
          type: "info",
          showMode: "once",
          targetType: "all",
          targetUserId: "",
        });
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้างแจ้งเตือน");
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
            <Bell className="h-5 w-5 text-primary" />
            สร้างประกาศ / แจ้งเตือน
          </DialogTitle>
          <DialogDescription>
            สร้างประกาศหรือแจ้งเตือนให้ผู้ใช้ในระบบ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* ประเภท */}
          <div className="space-y-2">
            <Label>ประเภทแจ้งเตือน *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: NotificationType) =>
                setFormData({ ...formData, type: value })
              }
              disabled={loading}
              className="grid grid-cols-2 gap-3"
            >
              {notificationTypes.map((type) => (
                <div key={type.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <div className="grid gap-0.5">
                    <Label
                      htmlFor={type.value}
                      className="font-medium cursor-pointer"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* หัวข้อ */}
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อ *</Label>
            <Input
              id="title"
              placeholder="เช่น: แจ้งปิดปรับปรุงระบบ"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* ข้อความ */}
          <div className="space-y-2">
            <Label htmlFor="message">ข้อความ *</Label>
            <Textarea
              id="message"
              placeholder="รายละเอียดประกาศ..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              disabled={loading}
              rows={4}
              required
            />
          </div>

          {/* เป้าหมาย */}
          <div className="space-y-2">
            <Label>เป้าหมาย *</Label>
            <RadioGroup
              value={formData.targetType}
              onValueChange={(value: "all" | "specific") =>
                setFormData({ ...formData, targetType: value, targetUserId: "" })
              }
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  ทั้งระบบ (แสดงให้ทุกคน)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="cursor-pointer">
                  ผู้ใช้เฉพาะราย
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* เลือกผู้ใช้ */}
          {formData.targetType === "specific" && (
            <div className="space-y-2">
              <Label htmlFor="targetUserId">เลือกผู้ใช้ *</Label>
              <Select
                value={formData.targetUserId}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetUserId: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้ใช้" />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      ไม่มีผู้ใช้
                    </div>
                  ) : (
                    users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.shopName || u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* โหมดการแสดง */}
          <div className="space-y-2">
            <Label>โหมดการแสดง *</Label>
            <RadioGroup
              value={formData.showMode}
              onValueChange={(value: NotificationShowMode) =>
                setFormData({ ...formData, showMode: value })
              }
              disabled={loading}
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="once" id="once" />
                <div className="grid gap-0.5">
                  <Label htmlFor="once" className="cursor-pointer font-medium">
                    แสดงครั้งเดียว
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ผู้ใช้เห็นครั้งเดียว หลังจากนั้นจะไม่แสดงอีก
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="always" id="always" />
                <div className="grid gap-0.5">
                  <Label htmlFor="always" className="cursor-pointer font-medium">
                    แสดงทุกครั้ง
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ผู้ใช้เห็นทุกครั้งที่เข้าเว็บ จนกว่า Admin จะปิด
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          {formData.title && formData.message && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                📄 ตัวอย่าง
              </p>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <Bell className={`h-5 w-5 mt-0.5 ${
                    formData.type === "info" ? "text-blue-500" :
                    formData.type === "success" ? "text-green-500" :
                    formData.type === "warning" ? "text-yellow-500" :
                    "text-red-500"
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">{formData.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.message}
                    </p>
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
              สร้างแจ้งเตือน
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;

