import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.shopName.trim()) {
      toast.error("กรุณากรอกชื่อแสดงในเว็บไซต์");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("กรุณากรอกอีเมล");
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
      await signUp(formData.email, formData.password, formData.shopName);
      toast.success("สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลของคุณ", {
        duration: 5000,
      });
      navigate("/verify-email");
    } catch (error: any) {
      console.error("Register error:", error);
      
      // แปลข้อความ error
      if (error.code === "auth/email-already-in-use") {
        toast.error("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (error.code === "auth/invalid-email") {
        toast.error("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/weak-password") {
        toast.error("รหัสผ่านไม่ปลอดภัยเพียงพอ");
      } else {
        toast.error(error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/Logo CoinZone.png" 
              alt="CoinZone Logo" 
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              CoinZone
            </h1>
          </div>
          <p className="text-muted-foreground">สมัครสมาชิกเพื่อเริ่มต้นใช้งาน</p>
        </div>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>สมัครสมาชิก</CardTitle>
            <CardDescription>
              กรอกข้อมูลเพื่อสร้างบัญชีของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">ชื่อแสดงในเว็บไซต์ *</Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="ชื่อผู้ใช้ของคุณ"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ต้องมีอย่างน้อย 6 ตัวอักษร
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              {/* Terms Agreement */}
              <div className="text-sm text-center text-muted-foreground pt-2">
                เมื่อคลิกสมัครสมาชิก ถือว่าคุณยอมรับ
                <Link 
                  to="/terms" 
                  className="text-primary hover:underline ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ข้อกำหนดและเงื่อนไขการใช้งาน
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary shadow-glow"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    สมัครสมาชิก
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  มีบัญชีอยู่แล้ว?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          การสมัครสมาชิกถือว่าคุณยอมรับ
          <br />
          <a href="#" className="underline hover:text-foreground">
            เงื่อนไขการใช้งาน
          </a>{" "}
          และ{" "}
          <a href="#" className="underline hover:text-foreground">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;

