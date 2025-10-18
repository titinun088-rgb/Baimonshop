import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, userData, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // ยังไม่ได้ล็อกอิน
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ยังไม่ได้ยืนยันอีเมล
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // ยังไม่ได้รับการอนุมัติจาก admin (verified)
  if (!userData?.verified) {
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
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>สถานะ:</strong> รอการอนุมัติ
              </p>
              <p className="mb-2">
                <strong>อีเมล:</strong> {user.email}
              </p>
              <p className="mb-2">
                <strong>ชื่อร้าน:</strong> {userData?.shopName}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              กรุณารอจนกว่าผู้ดูแลระบบจะอนุมัติบัญชีของคุณ
              <br />
              คุณจะได้รับอีเมลเมื่อบัญชีได้รับการอนุมัติแล้ว
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ตรวจสอบ role
  if (!allowedRoles.includes(userData.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-card">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-center">ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription className="text-center">
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="text-muted-foreground mb-2">
                หน้านี้สำหรับ:{" "}
                <strong className="text-foreground">
                  {allowedRoles.map(role => 
                    role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ขาย'
                  ).join(', ')}
                </strong>
              </p>
              <p className="text-muted-foreground">
                บทบาทของคุณ:{" "}
                <strong className="text-foreground">
                  {userData.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ขาย'}
                </strong>
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              กลับไปหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ผ่านทุกเงื่อนไข
  return <>{children}</>;
};

export default RoleProtectedRoute;

