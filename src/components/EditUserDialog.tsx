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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/lib/adminUtils";
import { UserData, UserRole } from "@/contexts/AuthContext";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSuccess: () => void;
}

const EditUserDialog = ({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    displayName: "",
    role: "seller" as UserRole,
    verified: false,
  });

  // อัปเดตฟอร์มเมื่อ user เปลี่ยน
  useEffect(() => {
    if (user) {
      setFormData({
        shopName: user.shopName,
        displayName: user.displayName,
        role: user.role,
        verified: user.verified,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validation
    if (!formData.shopName || !formData.displayName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);

    try {
      const result = await updateUser(user.uid, {
        shopName: formData.shopName,
        displayName: formData.displayName,
        role: formData.role,
        verified: formData.verified,
      });

      if (result.success) {
        toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            แก้ไขข้อมูลผู้ใช้
          </DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลของ {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              ไม่สามารถแก้ไขอีเมลได้
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopName">ชื่อร้าน *</Label>
            <Input
              id="shopName"
              type="text"
              placeholder="ชื่อร้านค้า"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">ชื่อแสดง *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="ชื่อที่จะแสดงในระบบ"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">บทบาท</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller">ผู้ขาย (Seller)</SelectItem>
                <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="verified">อนุมัติการใช้งาน</Label>
              <p className="text-xs text-muted-foreground">
                {formData.verified 
                  ? "ผู้ใช้สามารถเข้าใช้งานระบบได้" 
                  : "ผู้ใช้ยังไม่สามารถเข้าใช้งานระบบได้"
                }
              </p>
            </div>
            <Switch
              id="verified"
              checked={formData.verified}
              onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
            />
          </div>

          {/* Email Verified Status */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">สถานะยืนยันอีเมล:</span>
              <span className={user.emailVerified ? "text-success font-medium" : "text-warning font-medium"}>
                {user.emailVerified ? "✓ ยืนยันแล้ว" : "⚠ ยังไม่ยืนยัน"}
              </span>
            </div>
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

export default EditUserDialog;

