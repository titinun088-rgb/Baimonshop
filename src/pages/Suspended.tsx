import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, LogOut, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Suspended = () => {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ถ้าไม่มี userData หรือไม่ได้ถูกพัก redirect กลับหน้าหลัก
  if (!userData || !userData.suspended) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-destructive/50 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Ban className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-destructive">
              บัญชีถูกพัก
            </CardTitle>
            <CardDescription className="mt-2">
              บัญชีของคุณถูกพักการใช้งานชั่วคราว
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ข้อมูลการพัก */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">อีเมล</p>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            
            {userData.shopName && (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">ผู้ใช้</p>
                  <p className="text-sm text-muted-foreground">{userData.shopName}</p>
                </div>
              </div>
            )}

            {/* วันที่สิ้นสุดการพัก */}
            {userData.suspendedUntil ? (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">พักถึงวันที่</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userData.suspendedUntil).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">ระยะเวลา</p>
                  <p className="text-sm text-muted-foreground">
                    พักถาวร (จนกว่าจะมีการปลดพัก)
                  </p>
                </div>
              </div>
            )}

            {/* เหตุผล */}
            {userData.suspendReason && (
              <div className="pt-3 border-t border-destructive/20">
                <p className="text-sm font-medium text-foreground mb-1">เหตุผล</p>
                <p className="text-sm text-muted-foreground">
                  {userData.suspendReason}
                </p>
              </div>
            )}
          </div>

          {/* คำอธิบาย */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              หากคุณคิดว่านี่เป็นความผิดพลาด หรือต้องการสอบถามข้อมูลเพิ่มเติม
              กรุณาติดต่อทีมงานผู้ดูแลระบบ
            </p>
          </div>

          {/* ปุ่มออกจากระบบ */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suspended;



