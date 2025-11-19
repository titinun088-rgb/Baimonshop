import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Component สำหรับตรวจสอบและ redirect ไปหน้า maintenance
 * ถ้า VITE_MAINTENANCE_MODE เป็น "true" หรือ "1"
 */
const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true" || 
                            import.meta.env.VITE_MAINTENANCE_MODE === "1";

  useEffect(() => {
    // ถ้าเปิด maintenance mode และไม่ได้อยู่ที่หน้า maintenance
    if (isMaintenanceMode && location.pathname !== "/maintenance") {
      navigate("/maintenance", { replace: true });
    }
    // ถ้าปิด maintenance mode และอยู่ที่หน้า maintenance ให้ redirect ไปหน้าแรก
    else if (!isMaintenanceMode && location.pathname === "/maintenance") {
      navigate("/", { replace: true });
    }
  }, [isMaintenanceMode, location.pathname, navigate]);

  // ถ้าเปิด maintenance mode และไม่ได้อยู่ที่หน้า maintenance ให้ return null
  if (isMaintenanceMode && location.pathname !== "/maintenance") {
    return null;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;



