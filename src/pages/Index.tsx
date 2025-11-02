import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Landing from "./Landing";
import Seo from '@/components/Seo';

const Index = () => {
  const { user, userData, loading } = useAuth();

  // ถ้ายังกำลังโหลด ให้แสดงหน้า Landing
  if (loading) {
    return <Landing />;
  }

  // ถ้าล็อกอินแล้ว redirect ไปหน้า Home
  if (user && userData && user.emailVerified && userData.verified) {
    return <Navigate to="/home" replace />;
  }

  // แสดงหน้า Landing สำหรับผู้ใช้ที่ไม่ล็อกอิน
  return (
    <>
      <Seo title="CoinZone" description="บริการเติมเงินเกมและแอปพรีเมียม รวดเร็ว ปลอดภัย" />
      <Landing />
    </>
  );
};

export default Index;
