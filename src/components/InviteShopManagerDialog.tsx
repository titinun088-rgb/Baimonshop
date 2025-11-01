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
import { Loader2, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendShopInvitation } from "@/lib/shopInvitationUtils";

interface InviteShopManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopOwnerId: string;
  shopOwnerEmail: string;
  shopName: string;
}

const InviteShopManagerDialog = ({
  open,
  onOpenChange,
  shopOwnerId,
  shopOwnerEmail,
  shopName,
}: InviteShopManagerDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("กรุณากรอก email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("รูปแบบ email ไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const result = await sendShopInvitation(
        shopOwnerId,
        shopOwnerEmail,
        shopName,
        email.trim().toLowerCase()
      );

      if (result.success) {
        toast.success("ส่งคำขอเพิ่มผู้ดูแลสำเร็จ!");
        setEmail("");
        onOpenChange(false);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งคำขอ");
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
            เพิ่มผู้ดูแลผู้ใช้
          </DialogTitle>
          <DialogDescription>
            ค้นหาผู้ใช้ด้วย email เพื่อส่งคำขอเป็นผู้ดูแลผู้ใช้ของคุณ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email ของผู้ใช้ที่ต้องการเชิญ *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ผู้ใช้จะได้รับคำขอและสามารถเข้าถึงข้อมูลผู้ใช้ของคุณเมื่อตอบรับ
            </p>
          </div>

          {/* ข้อมูลผู้ใช้ */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">ผู้ใช้ของคุณ:</p>
            <p className="text-sm text-muted-foreground">{shopName}</p>
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
                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  ส่งคำขอ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteShopManagerDialog;

