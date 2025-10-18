import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import CreateNotificationDialog from "@/components/CreateNotificationDialog";
import CreateReportDialog from "@/components/CreateReportDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bell, Plus, Trash2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Notification } from "@/types/notification";
import {
  getAllNotifications,
  getNotificationsForUser,
  deleteNotification,
  toggleNotificationActive,
} from "@/lib/notificationUtils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Notifications = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; shopName?: string }>>([]);

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูล
  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("🔄 Notifications: กำลังโหลดข้อมูล...");

      // โหลดแจ้งเตือน
      const notifsData = isAdmin
        ? await getAllNotifications()
        : await getNotificationsForUser(user.uid);
      setNotifications(notifsData);

      // โหลดรายชื่อผู้ใช้ทั้งหมด (สำหรับ Admin)
      if (isAdmin) {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || "",
          shopName: doc.data().shopName,
        }));
        setUsers(usersData);
      }

      console.log("✅ Notifications: โหลดข้อมูลเสร็จสิ้น");
    } catch (error) {
      console.error("❌ Notifications: Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userData]);

  // ลบแจ้งเตือน (Admin)
  const handleDelete = async (notificationId: string) => {
    if (!confirm("คุณต้องการลบแจ้งเตือนนี้หรือไม่?")) return;

    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        toast.success("ลบแจ้งเตือนสำเร็จ");
        await loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบแจ้งเตือน");
      console.error(error);
    }
  };

  // เปิด/ปิดแจ้งเตือน (Admin)
  const handleToggleActive = async (notificationId: string, currentActive: boolean) => {
    try {
      const result = await toggleNotificationActive(notificationId, !currentActive);
      if (result.success) {
        toast.success(`${!currentActive ? "เปิด" : "ปิด"}แจ้งเตือนสำเร็จ`);
        await loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.error(error);
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "success":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "";
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return "ข้อมูล";
      case "success":
        return "สำเร็จ";
      case "warning":
        return "คำเตือน";
      case "error":
        return "ข้อผิดพลาด";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">แจ้งเตือน</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "จัดการประกาศและแจ้งเตือนทั้งหมด"
                : "ดูประกาศและแจ้งเตือนของคุณ"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setReportDialogOpen(true)}
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              แจ้งปัญหา
            </Button>
            {isAdmin && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-primary shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                สร้างประกาศ
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="border-border bg-card shadow-card">
            <CardContent className="py-12">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">
                  {isAdmin
                    ? "ยังไม่มีประกาศ คลิก \"สร้างประกาศ\" เพื่อเริ่มต้น"
                    : "ยังไม่มีแจ้งเตือน"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`border-border shadow-card transition-all ${
                  !notif.active && isAdmin ? "opacity-50" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Bell
                        className={`h-5 w-5 mt-0.5 ${
                          notif.type === "info"
                            ? "text-blue-500"
                            : notif.type === "success"
                            ? "text-green-500"
                            : notif.type === "warning"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{notif.title}</CardTitle>
                          <Badge
                            variant="outline"
                            className={`${getTypeColor(notif.type)} text-xs`}
                          >
                            {getTypeLabel(notif.type)}
                          </Badge>
                          {notif.showMode === "always" && (
                            <Badge variant="secondary" className="text-xs">
                              แสดงทุกครั้ง
                            </Badge>
                          )}
                          {notif.targetType === "specific" && (
                            <Badge variant="outline" className="text-xs">
                              เฉพาะ: {notif.targetUserEmail || "ไม่ระบุ"}
                            </Badge>
                          )}
                          {!notif.active && isAdmin && (
                            <Badge variant="destructive" className="text-xs">
                              ปิดอยู่
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>
                            {notif.createdAt.toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isAdmin && notif.showMode === "once" && (
                            <span>อ่านแล้ว: {notif.readBy.length} คน</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          {notif.active ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={notif.active}
                            onCheckedChange={() =>
                              handleToggleActive(notif.id, notif.active)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Notification Dialog (Admin) */}
      {isAdmin && (
        <CreateNotificationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={loadData}
          users={users}
        />
      )}

      {/* Create Report Dialog */}
      <CreateReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSuccess={async () => {
          // Refresh ถ้าต้องการ
        }}
      />
    </Layout>
  );
};

export default Notifications;
