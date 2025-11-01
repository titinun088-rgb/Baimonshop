import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Check, X, Inbox, Store } from "lucide-react";
import { toast } from "sonner";
import {
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from "@/lib/shopInvitationUtils";
import { ShopInvitation } from "@/types/shopInvitation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

const ShopInvitations = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<ShopInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getMyInvitations(user.uid);
      setInvitations(data);
    } catch (error) {
      console.error("Error loading invitations:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดคำขอ");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const result = await acceptInvitation(invitationId);

      if (result.success) {
        toast.success("ตอบรับคำขอสำเร็จ! กำลังโหลดข้อมูลร้าน...");
        
        // รอสักครู่เพื่อให้ Firestore sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // รีเฟรช user data เพื่อโหลด managed shops
        console.log("🔄 Refreshing user data after accepting invitation...");
        await refreshUser();
        
        // Navigate ไป Dashboard เพื่อแสดงข้อมูลร้าน
        console.log("✅ Navigating to dashboard...");
        toast.success("คุณเป็นผู้ดูแลผู้ใช้แล้ว!", { duration: 3000 });
        navigate("/");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการตอบรับคำขอ");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const result = await rejectInvitation(invitationId);

      if (result.success) {
        toast.success("ปฏิเสธคำขอสำเร็จ");
        await loadInvitations();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">คำขอเป็นผู้ดูแลผู้ใช้</h1>
          </div>
          <p className="text-muted-foreground">
            คำขอที่เจ้าของผู้ใช้ส่งมาให้คุณเป็นผู้ดูแลผู้ใช้
          </p>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">ไม่มีคำขอใหม่</h3>
                <p className="text-muted-foreground">
                  คุณไม่มีคำขอเป็นผู้ดูแลผู้ใช้ในขณะนี้
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                className="border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">
                          {invitation.shopName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          จาก: {invitation.shopOwnerEmail}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      รอการตอบรับ
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* รายละเอียด */}
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm mb-2">
                        <span className="font-medium">คำขอ:</span> เจ้าของผู้ใช้ "{invitation.shopName}" ต้องการเชิญคุณเป็นผู้ดูแลผู้ใช้
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ส่งเมื่อ:{" "}
                        {formatDistanceToNow(invitation.createdAt, {
                          addSuffix: true,
                          locale: th,
                        })}
                      </p>
                    </div>

                    {/* สิทธิ์ที่จะได้รับ */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold mb-2 text-primary">
                        สิทธิ์ที่คุณจะได้รับ:
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✓ เข้าถึงข้อมูลเกมและรายการเติมเงินทั้งหมด</li>
                        <li>✓ บันทึกและจัดการยอดขาย</li>
                        <li>✓ ดูสถิติและรายงานของร้าน</li>
                        <li>✓ จัดการกิจกรรมและการแจ้งเตือน</li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(invitation.id)}
                        disabled={actionLoading !== null}
                        className="border-destructive/50 hover:bg-destructive/10"
                      >
                        {actionLoading === invitation.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        ปฏิเสธ
                      </Button>
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={actionLoading !== null}
                        className="bg-gradient-primary shadow-glow"
                      >
                        {actionLoading === invitation.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        ตอบรับ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopInvitations;

