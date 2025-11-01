import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Eye, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Report, ReportStatus } from "@/types/notification";
import {
  getAllReports,
  getReportsByUser,
  updateReportStatus,
  deleteReport,
  getReportStats,
} from "@/lib/reportUtils";

const Reports = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    total: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState<ReportStatus>("pending");

  const isAdmin = userData?.role === "admin";

  // โหลดข้อมูล
  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("🔄 Reports: กำลังโหลดข้อมูล...");

      // โหลดรายงาน
      const reportsData = isAdmin
        ? await getAllReports()
        : await getReportsByUser(user.uid);
      setReports(reportsData);

      // โหลดสถิติ (สำหรับ Admin)
      if (isAdmin) {
        const statsData = await getReportStats();
        setStats(statsData);
      }

      console.log("✅ Reports: โหลดข้อมูลเสร็จสิ้น");
    } catch (error) {
      console.error("❌ Reports: Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userData]);

  // ลบรายงาน (Admin)
  const handleDelete = async (reportId: string) => {
    if (!confirm("คุณต้องการลบรายงานนี้หรือไม่?")) return;

    try {
      const result = await deleteReport(reportId);
      if (result.success) {
        toast.success("ลบรายงานสำเร็จ");
        await loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบรายงาน");
      console.error(error);
    }
  };

  // อัปเดตสถานะ (Admin)
  const handleUpdateStatus = async () => {
    if (!selectedReport || !user) return;

    try {
      const result = await updateReportStatus(
        selectedReport.id,
        newStatus,
        user.uid,
        adminNote.trim() || undefined
      );

      if (result.success) {
        toast.success("อัปเดตสถานะสำเร็จ");
        setDetailDialogOpen(false);
        setSelectedReport(null);
        setAdminNote("");
        await loadData();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.error(error);
    }
  };

  // เปิด Dialog รายละเอียด
  const openDetailDialog = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNote(report.adminNote || "");
    setDetailDialogOpen(true);
  };

  const getPriorityColor = (priority: Report["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      default:
        return "";
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "in-progress":
        return "bg-blue-500/20 text-blue-500";
      case "resolved":
        return "bg-green-500/20 text-green-500";
      case "rejected":
        return "bg-red-500/20 text-red-500";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "in-progress":
        return "กำลังดำเนินการ";
      case "resolved":
        return "แก้ไขแล้ว";
      case "rejected":
        return "ปฏิเสธ";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: "ปัญหาทางเทคนิค",
      billing: "ปัญหาการเงิน/บิลลิ่ง",
      feature: "ขอฟีเจอร์ใหม่",
      bug: "พบ Bug/ข้อผิดพลาด",
      account: "ปัญหาบัญชีผู้ใช้",
      other: "อื่นๆ",
    };
    return labels[category] || category;
  };

  // กรองรายงานตามสถานะ
  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

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
            <h1 className="text-3xl font-bold">รายงานปัญหา</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "จัดการรายงานปัญหาทั้งหมด"
                : "ดูรายงานปัญหาของคุณ"}
            </p>
          </div>
        </div>

        {/* Stats Cards (Admin only) */}
        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-border bg-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {stats.inProgress}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">แก้ไขแล้ว</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {stats.resolved}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ปฏิเสธ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        {isAdmin && (
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>กรองตามสถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    ทั้งหมด ({reports.length})
                  </SelectItem>
                  <SelectItem value="pending">
                    รอดำเนินการ ({stats.pending})
                  </SelectItem>
                  <SelectItem value="in-progress">
                    กำลังดำเนินการ ({stats.inProgress})
                  </SelectItem>
                  <SelectItem value="resolved">
                    แก้ไขแล้ว ({stats.resolved})
                  </SelectItem>
                  <SelectItem value="rejected">
                    ปฏิเสธ ({stats.rejected})
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card className="border-border bg-card shadow-card">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">ไม่มีรายงานปัญหา</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="border-border shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle
                        className={`h-5 w-5 mt-0.5 ${
                          report.priority === "high"
                            ? "text-red-500"
                            : report.priority === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <Badge
                            variant="outline"
                            className={`${getPriorityColor(report.priority)} text-xs`}
                          >
                            {report.priority === "high"
                              ? "สูง"
                              : report.priority === "medium"
                              ? "ปานกลาง"
                              : "ต่ำ"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(report.status)} text-xs`}
                          >
                            {getStatusLabel(report.status)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(report.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {isAdmin && (
                            <span>
                              แจ้งโดย: {report.shopName || report.userEmail}
                            </span>
                          )}
                          <span>
                            {report.createdAt.toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {report.resolvedAt && (
                            <span>
                              แก้ไขเมื่อ:{" "}
                              {report.resolvedAt.toLocaleDateString("th-TH", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              รายละเอียดรายงานปัญหา
            </DialogTitle>
            <DialogDescription>
              รายการแจ้งปัญหาจากผู้ใช้
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-4">
              {/* ข้อมูลผู้แจ้ง */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">ข้อมูลผู้แจ้ง</p>
                <p className="text-sm text-muted-foreground">
                  อีเมล: {selectedReport.userEmail}
                </p>
                {selectedReport.shopName && (
                  <p className="text-sm text-muted-foreground">
                    ร้าน: {selectedReport.shopName}
                  </p>
                )}
              </div>

              {/* หัวข้อและหมวดหมู่ */}
              <div>
                <Label>หัวข้อ</Label>
                <p className="text-sm font-medium mt-1">{selectedReport.title}</p>
                <div className="flex gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(selectedReport.priority)}
                  >
                    ความสำคัญ:{" "}
                    {selectedReport.priority === "high"
                      ? "สูง"
                      : selectedReport.priority === "medium"
                      ? "ปานกลาง"
                      : "ต่ำ"}
                  </Badge>
                  <Badge variant="secondary">
                    {getCategoryLabel(selectedReport.category)}
                  </Badge>
                </div>
              </div>

              {/* รายละเอียด */}
              <div>
                <Label>รายละเอียด</Label>
                <div className="mt-1 p-3 rounded-md border border-border bg-muted/30 text-sm">
                  {selectedReport.description}
                </div>
              </div>

              {/* สถานะและบันทึกจาก Admin */}
              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newStatus">สถานะ</Label>
                    <Select
                      value={newStatus}
                      onValueChange={(value: ReportStatus) => setNewStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="in-progress">
                          กำลังดำเนินการ
                        </SelectItem>
                        <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                        <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminNote">บันทึกจาก Admin</Label>
                    <Textarea
                      id="adminNote"
                      placeholder="เพิ่มบันทึกหรือความคิดเห็น..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDetailDialogOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button onClick={handleUpdateStatus}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      อัปเดตสถานะ
                    </Button>
                  </div>
                </>
              )}

              {/* แสดงบันทึกจาก Admin (ถ้ามี) */}
              {selectedReport.adminNote && !isAdmin && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-medium text-primary mb-1">
                    💬 บันทึกจาก Admin
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.adminNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Reports;



