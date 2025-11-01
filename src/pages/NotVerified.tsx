import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NotVerified = () => {
  const { user, userData, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  // ถ้าไม่มี user หรือ verified แล้ว redirect
  if (!user || userData?.verified) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-card">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
            <ShieldAlert className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-center">รอการอนุมัติ</CardTitle>
          <CardDescription className="text-center">
            บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">สถานะ:</span>
              <span className="font-medium text-warning">รอการอนุมัติ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">อีเมล:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ชื่อร้าน:</span>
              <span className="font-medium">{userData?.shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">บทบาท:</span>
              <span className="font-medium">
                {userData?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}
              </span>
            </div>
          </div>

          {/* Information */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-2">
            <h4 className="font-semibold text-sm">ข้อมูลเพิ่มเติม</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>บัญชีของคุณได้รับการสร้างเรียบร้อยแล้ว</li>
              <li>อีเมลของคุณได้รับการยืนยันแล้ว</li>
              <li>กำลังรอผู้ดูแลระบบอนุมัติให้เข้าใช้งาน</li>
              <li>คุณจะได้รับแจ้งเตือนทางอีเมลเมื่อได้รับการอนุมัติ</li>
            </ul>
          </div>

          {/* Note */}
          <p className="text-xs text-center text-muted-foreground">
            หากมีข้อสงสัยหรือต้องการความช่วยเหลือ
            <br />
            กรุณาติดต่อผู้ดูแลระบบ
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
          </div>

          {/* Sign Out Button */}
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

export default NotVerified;



