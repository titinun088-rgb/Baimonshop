import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, RefreshCw, LogOut } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, sendVerificationEmail, refreshUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // ถ้าไม่มี user redirect ไป login
    if (!user) {
      navigate("/login");
      return;
    }

    // ถ้ายืนยันอีเมลแล้ว redirect ไป dashboard
    if (user.emailVerified) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Countdown สำหรับปุ่มส่งอีเมลอีกครั้ง
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendVerificationEmail();
      toast.success("ส่งอีเมลยืนยันเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ", {
        duration: 5000,
      });
      setResendCooldown(60); // Cooldown 60 วินาที
    } catch (error: any) {
      console.error("Resend email error:", error);
      
      if (error.code === "auth/too-many-requests") {
        toast.error("ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่");
      } else {
        toast.error("เกิดข้อผิดพลาดในการส่งอีเมล");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
  console.log("� กำลังโหลด...");
      
      await refreshUser();
      
      // รอสักครู่เพื่อให้ state อัปเดต
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ดึง user ล่าสุดจาก auth
      const currentUser = auth.currentUser;
      
      console.log("✅ สถานะปัจจุบัน:", {
        emailVerified: currentUser?.emailVerified,
        email: currentUser?.email
      });
      
      // ตรวจสอบสถานะหลัง refresh
      if (currentUser?.emailVerified) {
        toast.success("ยืนยันอีเมลสำเร็จ! กำลังเข้าสู่ระบบ...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        toast.warning("ยังไม่ได้ยืนยันอีเมล กรุณาคลิกลิงก์ที่ส่งไปในอีเมลของคุณ", {
          description: "ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("❌ Check verification error:", error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ", {
        description: error.message || "กรุณาลองใหม่อีกครั้ง"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-center">ยืนยันอีเมลของคุณ</CardTitle>
            <CardDescription className="text-center">
              เราได้ส่งลิงก์ยืนยันไปที่อีเมล
              <br />
              <span className="font-semibold text-foreground">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instructions */}
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ขั้นตอนการยืนยัน:
              </p>
              <ol className="ml-6 list-decimal space-y-1 text-muted-foreground">
                <li>เปิดกล่องจดหมายอีเมลของคุณ</li>
                <li>ค้นหาอีเมลจาก CoinZone</li>
                <li>คลิกลิงก์ยืนยันในอีเมล</li>
                <li>กลับมาที่หน้านี้และคลิก "ตรวจสอบสถานะ"</li>
              </ol>
            </div>

            {/* Check Status Button */}
            <Button
              onClick={handleCheckVerification}
              className="w-full bg-gradient-primary shadow-glow"
              disabled={checking}
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  ตรวจสอบสถานะ
                </>
              )}
            </Button>

            {/* Resend Email Button */}
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={loading || resendCooldown > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : resendCooldown > 0 ? (
                `ส่งอีกครั้งได้ใน ${resendCooldown} วินาที`
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  ส่งอีเมลอีกครั้ง
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                ไม่พบอีเมล? ลองตรวจสอบในโฟลเดอร์ Spam หรือ Junk
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </Button>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          หากมีปัญหาในการยืนยันอีเมล กรุณาติดต่อฝ่ายสนับสนุน
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;

