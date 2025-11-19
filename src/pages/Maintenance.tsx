import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, AlertCircle } from "lucide-react";

const Maintenance = () => {
  // ข้อความที่สามารถปรับแต่งได้
  const maintenanceMessage = import.meta.env.VITE_MAINTENANCE_MESSAGE || "เว็บไซต์กำลังปิดปรับปรุงชั่วคราว";
  const estimatedTime = import.meta.env.VITE_MAINTENANCE_TIME || "ประมาณ 1-2 ชั่วโมง";
  const contactInfo = import.meta.env.VITE_MAINTENANCE_CONTACT || "กรุณาติดต่อทีมงานผู้ดูแลระบบ";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl border-orange-500/50 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 animate-pulse">
            <Wrench className="h-10 w-10 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-orange-600">
              กำลังปิดปรับปรุงชั่วคราว
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {maintenanceMessage}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ข้อมูลการปิดปรับปรุง */}
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 mt-0.5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">เวลาที่คาดการณ์</p>
                <p className="text-sm text-muted-foreground">
                  {estimatedTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-3 border-t border-orange-500/20">
              <AlertCircle className="h-5 w-5 mt-0.5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">ข้อมูลเพิ่มเติม</p>
                <p className="text-sm text-muted-foreground">
                  {contactInfo}
                </p>
              </div>
            </div>
          </div>

          {/* คำอธิบาย */}
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              ขออภัยในความไม่สะดวก เรากำลังทำงานอย่างหนักเพื่อปรับปรุงระบบให้ดีขึ้น
            </p>
            <p className="text-xs text-muted-foreground">
              กรุณาลองใหม่อีกครั้งในภายหลัง
            </p>
          </div>

          {/* ข้อความเพิ่มเติม */}
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              🛠️ ระบบจะกลับมาใช้งานได้ตามปกติในเร็วๆ นี้
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;

