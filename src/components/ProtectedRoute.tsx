import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isUserSuspended } from "@/lib/userManagementUtils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
  requireAdmin?: boolean; // เพิ่ม prop สำหรับหน้าที่ต้องการสิทธิ์ Admin
}

const ProtectedRoute = ({ 
  children, 
  requireEmailVerification = true,
  requireAdmin = false
}: ProtectedRouteProps) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // ตรวจสอบและปลดพักอัตโนมัติถ้าหมดอายุ
  useEffect(() => {
    const checkAndAutoUnsuspend = async () => {
      if (!userData || !userData.suspended || !userData.suspendedUntil) return;

      const suspensionStatus = isUserSuspended(
        userData.suspended,
        userData.suspendedUntil
      );

      // ถ้าหมดอายุการพักแล้ว ทำการปลดพักอัตโนมัติ
      if (!suspensionStatus.isSuspended) {
        try {
          const userRef = doc(db, "users", userData.uid);
          await updateDoc(userRef, {
            suspended: false,
            suspendedUntil: null,
            suspendReason: null,
          });
          // รีโหลดหน้าเพื่ออัปเดตข้อมูล
          window.location.reload();
        } catch (error) {
          console.error("Error auto-unsuspending user:", error);
        }
      }
    };

    checkAndAutoUnsuspend();
  }, [userData]);

  // แสดง loading spinner ขณะตรวจสอบสถานะ authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // ถ้ายังไม่ได้ล็อกอิน redirect ไปหน้า login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ตรวจสอบว่าบัญชีถูกพักหรือไม่ (admin ยังคงเข้าได้)
  if (userData && userData.suspended && userData.role !== 'admin') {
    const suspensionStatus = isUserSuspended(
      userData.suspended,
      userData.suspendedUntil
    );
    
    // ถ้ายังถูกพักอยู่ redirect ไปหน้า suspended
    if (suspensionStatus.isSuspended) {
      return <Navigate to="/suspended" replace />;
    }
  }

  // ถ้าต้องการตรวจสอบอีเมลและยังไม่ได้ยืนยัน redirect ไปหน้ายืนยันอีเมล
  if (requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // ตรวจสอบว่าได้รับการอนุมัติจาก admin หรือยัง (verified)
  // ยกเว้น admin ที่สามารถเข้าถึงได้เสมอ
  if (userData && userData.role !== 'admin' && !userData.verified) {
    return <Navigate to="/not-verified" replace />;
  }

  // ตรวจสอบสิทธิ์ Admin (ถ้าหน้านั้นต้องการสิทธิ์ Admin)
  if (requireAdmin && userData?.role !== 'admin') {
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ 
          error: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น Admin เท่านั้น)" 
        }} 
      />
    );
  }

  // ถ้าผ่านทุกเงื่อนไข แสดงหน้าที่ต้องการ
  return <>{children}</>;
};

export default ProtectedRoute;

