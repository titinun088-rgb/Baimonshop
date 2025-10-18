import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import Dashboard from "./Dashboard";

const Index = () => {
  const location = useLocation();

  // แสดงข้อความเตือนเมื่อถูก redirect กลับเพราะไม่มีสิทธิ์
  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      toast.error(state.error);
      // ล้าง state เพื่อไม่ให้แสดง toast ซ้ำเมื่อ refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
