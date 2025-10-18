import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว", {
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      // แปลข้อความ error
      if (error.code === "auth/user-not-found") {
        toast.error("ไม่พบผู้ใช้ที่มีอีเมลนี้");
      } else if (error.code === "auth/invalid-email") {
        toast.error("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("ส่งคำขอบ่อยเกินไป กรุณารอสักครู่");
      } else {
        toast.error(error.message || "เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-center">ลืมรหัสผ่าน</CardTitle>
            <CardDescription className="text-center">
              {emailSent
                ? "เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว"
                : "กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    กรอกอีเมลที่คุณใช้สมัครสมาชิก
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary shadow-glow"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="rounded-lg bg-success/10 border border-success/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-success font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    ส่งอีเมลสำเร็จ!
                  </div>
                  <p className="text-sm text-muted-foreground">
                    เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่
                    <br />
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                {/* Instructions */}
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <p className="font-semibold">ขั้นตอนถัดไป:</p>
                  <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
                    <li>เปิดกล่องจดหมายอีเมลของคุณ</li>
                    <li>ค้นหาอีเมลจาก CoinZone</li>
                    <li>คลิกลิงก์รีเซ็ตรหัสผ่าน</li>
                    <li>ตั้งรหัสผ่านใหม่</li>
                    <li>กลับมาเข้าสู่ระบบด้วยรหัสผ่านใหม่</li>
                  </ol>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-muted-foreground">
                  ไม่พบอีเมล? ลองตรวจสอบในโฟลเดอร์ Spam
                </p>

                {/* Resend Button */}
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  ส่งอีกครั้ง
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
            </div>

            {/* Back to Login */}
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          หากมีปัญหาในการรีเซ็ตรหัสผ่าน กรุณาติดต่อฝ่ายสนับสนุน
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

