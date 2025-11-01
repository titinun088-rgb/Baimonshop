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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createUserByAdmin } from "@/lib/adminUtils";
import { UserRole } from "@/contexts/AuthContext";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateUserDialog = ({ open, onOpenChange, onSuccess }: CreateUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    displayName: "",
    role: "seller" as UserRole,
    verified: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.shopName || !formData.displayName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const result = await createUserByAdmin({
        email: formData.email,
        password: formData.password,
        shopName: formData.shopName,
        displayName: formData.displayName,
        role: formData.role,
        verified: formData.verified,
      });

      if (result.success) {
        toast.success("สร้างผู้ใช้สำเร็จ! ส่งอีเมลยืนยันเรียบร้อยแล้ว", {
          duration: 5000,
        });
        
        // Reset form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          shopName: "",
          displayName: "",
          role: "seller",
          verified: false,
        });
        
        onOpenChange(false);
        onSuccess();
      } else {
        // แปล error messages
        if (result.error?.includes("email-already-in-use")) {
          toast.error("อีเมลนี้ถูกใช้งานแล้ว");
        } else if (result.error?.includes("invalid-email")) {
          toast.error("รูปแบบอีเมลไม่ถูกต้อง");
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาดในการสร้างผู้ใช้");
        }
      }
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            สร้างผู้ใช้ใหม่
          </DialogTitle>
          <DialogDescription>
            สร้างบัญชีผู้ใช้ใหม่ในระบบ ระบบจะส่งอีเมลยืนยันให้ผู้ใช้โดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล *</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopName">ชื่อร้าน *</Label>
            <Input
              id="shopName"
              type="text"
              placeholder="ชื่อผู้ใช้"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
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
                <SelectItem value="seller">ผู้ใช้ (Seller)</SelectItem>
                <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="verified">อนุมัติการใช้งานทันที</Label>
              <p className="text-xs text-muted-foreground">
                ถ้าเปิดใช้งาน ผู้ใช้จะสามารถเข้าระบบได้ทันทีหลังยืนยันอีเมล
              </p>
            </div>
            <Switch
              id="verified"
              checked={formData.verified}
              onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  สร้างผู้ใช้
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;



