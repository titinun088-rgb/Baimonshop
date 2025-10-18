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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Shield, User } from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";
import { updateUserRole } from "@/lib/userManagementUtils";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    uid: string;
    email: string;
    role: UserRole;
    shopName?: string;
  } | null;
  onSuccess: () => Promise<void>;
}

const ChangeRoleDialog = ({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: ChangeRoleDialogProps) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("seller");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData || !targetUser) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (targetUser.role === newRole) {
      toast.error("บทบาทไม่เปลี่ยนแปลง");
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserRole(
        targetUser.uid,
        newRole,
        {
          userId: user.uid,
          email: user.email || "",
          shopName: userData.shopName,
          targetEmail: targetUser.email,
        }
      );

      if (result.success) {
        toast.success(`เปลี่ยนบทบาทเป็น ${newRole === 'admin' ? 'Admin' : 'Seller'} สำเร็จ!`);
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนบทบาท");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // เมื่อเปิด dialog ให้ set role เป็นค่าปัจจุบัน
  if (open && targetUser && newRole !== targetUser.role) {
    setNewRole(targetUser.role);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            เปลี่ยนบทบาทผู้ใช้
          </DialogTitle>
          <DialogDescription>
            เปลี่ยนบทบาทของ {targetUser?.email}
          </DialogDescription>
        </DialogHeader>
        {targetUser && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* ข้อมูลผู้ใช้ */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-sm font-medium">ข้อมูลผู้ใช้</p>
              <p className="text-sm text-muted-foreground">
                อีเมล: {targetUser.email}
              </p>
              {targetUser.shopName && (
                <p className="text-sm text-muted-foreground">
                  ร้าน: {targetUser.shopName}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                บทบาทปัจจุบัน: {targetUser.role === 'admin' ? 'Admin' : 'Seller'}
              </p>
            </div>

            {/* เลือกบทบาทใหม่ */}
            <div className="space-y-2">
              <Label>บทบาทใหม่</Label>
              <RadioGroup
                value={newRole}
                onValueChange={(value: UserRole) => setNewRole(value)}
                disabled={loading}
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="seller" id="seller" />
                  <div className="grid gap-0.5">
                    <Label
                      htmlFor="seller"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Seller (ร้านค้า)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      จัดการเกม, รายการเติม, ยอดขาย, แจ้งปัญหา
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <div className="grid gap-0.5">
                    <Label
                      htmlFor="admin"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Admin (ผู้ดูแลระบบ)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      สิทธิ์เต็ม: ดูทุกอย่าง, จัดการผู้ใช้, สร้างประกาศ, ดูกิจกรรม
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* คำเตือน */}
            {newRole !== targetUser.role && (
              <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/10 p-3">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  ⚠️ คำเตือน
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  การเปลี่ยนบทบาทจะมีผลทันที ผู้ใช้จะได้รับสิทธิ์ใหม่ตามบทบาทที่เลือก
                </p>
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
              <Button type="submit" disabled={loading || newRole === targetUser.role}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                เปลี่ยนบทบาท
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRoleDialog;

