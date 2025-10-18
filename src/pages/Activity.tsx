import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Activity as ActivityIcon, Calendar } from "lucide-react";
import { ActivityLog, ActivityFilter } from "@/types/activity";
import {
  getAllActivityLogs,
  getActivityLogsByUser,
  filterActivityLogs,
  calculateActivityStats,
  getActionLabel,
  getActionColor,
  getActionIcon,
} from "@/lib/activityUtils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Activity = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; shopName?: string }>>([]);
  
  const [filter, setFilter] = useState<ActivityFilter>({});
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูล
  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("🔄 Activity: กำลังโหลดข้อมูล...");

      // โหลด activity logs
      const logsData = isAdmin
        ? await getAllActivityLogs()
        : await getActivityLogsByUser(user.uid);
      setLogs(logsData);
      setFilteredLogs(logsData);

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

      console.log("✅ Activity: โหลดข้อมูลเสร็จสิ้น");
    } catch (error) {
      console.error("❌ Activity: Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userData]);

  // กรองข้อมูล
  useEffect(() => {
    const currentFilter: ActivityFilter = {
      userId: filter.userId,
      action: filter.action,
      startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
      endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    };

    const filtered = filterActivityLogs(logs, currentFilter);
    setFilteredLogs(filtered);
  }, [logs, filter, dateRange]);

  // ล้าง filter
  const clearFilters = () => {
    setFilter({});
    setDateRange({ startDate: "", endDate: "" });
  };

  // คำนวณสถิติ
  const stats = calculateActivityStats(filteredLogs);

  // รายการประเภทกิจกรรม
  const actionTypes = [
    { value: "game_created", label: "สร้างเกม" },
    { value: "game_updated", label: "แก้ไขเกม" },
    { value: "game_deleted", label: "ลบเกม" },
    { value: "game_item_created", label: "เพิ่มรายการเติม" },
    { value: "game_item_updated", label: "แก้ไขรายการเติม" },
    { value: "game_item_deleted", label: "ลบรายการเติม" },
    { value: "sale_created", label: "บันทึกยอดขาย" },
    { value: "sale_deleted", label: "ลบยอดขาย" },
    { value: "user_login", label: "เข้าสู่ระบบ" },
    { value: "user_logout", label: "ออกจากระบบ" },
    { value: "report_created", label: "แจ้งปัญหา" },
    { value: "notification_created", label: "สร้างประกาศ" },
  ];

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
            <h1 className="text-3xl font-bold">กิจกรรม</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "ติดตามกิจกรรมและการเคลื่อนไหวทั้งระบบ"
                : "ติดตามกิจกรรมของคุณ"}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">วันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLogs}</div>
              <p className="text-xs text-muted-foreground">กิจกรรม</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">7 วันล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekLogs}</div>
              <p className="text-xs text-muted-foreground">กิจกรรม</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">เดือนนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthLogs}</div>
              <p className="text-xs text-muted-foreground">กิจกรรม</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">กิจกรรม</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>กรองข้อมูล</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                ล้างตัวกรอง
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* กรองตามผู้ใช้ (Admin only) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label>ผู้ใช้</Label>
                  <Select
                    value={filter.userId || "all"}
                    onValueChange={(value) =>
                      setFilter({ ...filter, userId: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.shopName || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* กรองตามประเภท */}
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select
                  value={filter.action || "all"}
                  onValueChange={(value) =>
                    setFilter({ ...filter, action: value === "all" ? undefined : (value as any) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* วันที่เริ่มต้น */}
              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>

              {/* วันที่สิ้นสุด */}
              <div className="space-y-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              แสดง {filteredLogs.length} จาก {logs.length} กิจกรรม
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">ไม่มีกิจกรรม</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            {log.shopName || log.email}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {log.timestamp.toLocaleString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users (Admin only) */}
        {isAdmin && stats.topUsers.length > 0 && (
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>ผู้ใช้ที่มีกิจกรรมมากที่สุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topUsers.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{user.shopName || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{user.count} กิจกรรม</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Activity;
