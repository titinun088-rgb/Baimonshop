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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Ban } from "lucide-react";
import { suspendUser, unsuspendUser } from "@/lib/userManagementUtils";

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    uid: string;
    email: string;
    shopName?: string;
    suspended: boolean;
    suspendedUntil?: Date;
    suspendReason?: string;
  } | null;
  onSuccess: () => Promise<void>;
}

const SuspendUserDialog = ({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: SuspendUserDialogProps) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [suspendType, setSuspendType] = useState<"permanent" | "temporary">("temporary");
  const [suspendUntil, setSuspendUntil] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData || !targetUser) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!reason.trim()) {
      toast.error("กรุณากรอกเหตุผลในการพักบัญชี");
      return;
    }

    if (suspendType === "temporary" && !suspendUntil) {
      toast.error("กรุณาเลือกวันที่สิ้นสุดการพัก");
      return;
    }

    setLoading(true);
    try {
      const suspendDate = suspendType === "temporary" ? new Date(suspendUntil) : null;

      const result = await suspendUser(
        targetUser.uid,
        reason.trim(),
        suspendDate,
        {
          userId: user.uid,
          email: user.email || "",
          shopName: userData.shopName,
          targetEmail: targetUser.email,
        }
      );

      if (result.success) {
        toast.success("พักบัญชีสำเร็จ!");
        setReason("");
        setSuspendUntil("");
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการพักบัญชี");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!user || !userData || !targetUser) return;

    if (!confirm("คุณต้องการปลดพักบัญชีนี้หรือไม่?")) return;

    setLoading(true);
    try {
      const result = await unsuspendUser(
        targetUser.uid,
        {
          userId: user.uid,
          email: user.email || "",
          shopName: userData.shopName,
          targetEmail: targetUser.email,
        }
      );

      if (result.success) {
        toast.success("ปลดพักบัญชีสำเร็จ!");
        await onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // วันขั้นต่ำ = พรุ่งนี้
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-orange-500" />
            {targetUser?.suspended ? "จัดการบัญชีที่ถูกพัก" : "พักบัญชีผู้ใช้"}
          </DialogTitle>
          <DialogDescription>
            {targetUser?.suspended ? "ดูข้อมูลและปลดพักบัญชี" : "พักบัญชีชั่วคราวหรือถาวร"}
          </DialogDescription>
        </DialogHeader>
        {targetUser && (
          <>
            {/* ข้อมูลผู้ใช้ */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 mt-4">
              <p className="text-sm font-medium">ข้อมูลผู้ใช้</p>
              <p className="text-sm text-muted-foreground">
                อีเมล: {targetUser.email}
              </p>
              {targetUser.shopName && (
                <p className="text-sm text-muted-foreground">
                  ร้าน: {targetUser.shopName}
                </p>
              )}
            </div>

            {/* ถ้าถูกพักอยู่แล้ว */}
            {targetUser.suspended ? (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                    🚫 บัญชีนี้ถูกพักอยู่
                  </p>
                  {targetUser.suspendedUntil ? (
                    <p className="text-sm text-muted-foreground">
                      พักถึง: {targetUser.suspendedUntil.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      พักถาวร (จนกว่าจะปลดพัก)
                    </p>
                  )}
                  {targetUser.suspendReason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      เหตุผล: {targetUser.suspendReason}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleUnsuspend}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ปลดพักบัญชี
                </Button>
              </div>
            ) : (
              /* ฟอร์มพักบัญชี */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ประเภทการพัก */}
                <div className="space-y-2">
                  <Label>ประเภทการพัก</Label>
                  <RadioGroup
                    value={suspendType}
                    onValueChange={(value: "permanent" | "temporary") => setSuspendType(value)}
                    disabled={loading}
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="temporary" id="temporary" />
                      <div className="grid gap-0.5">
                        <Label
                          htmlFor="temporary"
                          className="font-medium cursor-pointer"
                        >
                          พักชั่วคราว
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          กำหนดวันที่สิ้นสุด จะปลดพักอัตโนมัติเมื่อถึงกำหนด
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="permanent" id="permanent" />
                      <div className="grid gap-0.5">
                        <Label
                          htmlFor="permanent"
                          className="font-medium cursor-pointer"
                        >
                          พักถาวร
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          พักจนกว่าจะมาปลดพักด้วยตัวเอง
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* วันที่สิ้นสุด (ถ้าเลือกชั่วคราว) */}
                {suspendType === "temporary" && (
                  <div className="space-y-2">
                    <Label htmlFor="suspendUntil">พักถึงวันที่ *</Label>
                    <Input
                      id="suspendUntil"
                      type="date"
                      min={minDateStr}
                      value={suspendUntil}
                      onChange={(e) => setSuspendUntil(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      บัญชีจะปลดพักอัตโนมัติเมื่อถึงวันที่กำหนด
                    </p>
                  </div>
                )}

                {/* เหตุผล */}
                <div className="space-y-2">
                  <Label htmlFor="reason">เหตุผลในการพักบัญชี *</Label>
                  <Textarea
                    id="reason"
                    placeholder="เช่น: ละเมิดกฎกติกา, ทำรายการผิดปกติ, ฯลฯ"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    rows={4}
                    required
                  />
                </div>

                {/* คำเตือน */}
                <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/10 p-3">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    ⚠️ คำเตือน
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    เมื่อพักบัญชี ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะปลดพัก
                  </p>
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
                  <Button type="submit" disabled={loading} variant="destructive">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    พักบัญชี
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuspendUserDialog;

