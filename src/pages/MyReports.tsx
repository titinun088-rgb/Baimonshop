import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { Report } from "@/types/notification";
import { getReportsByUser, getReportStats } from "@/lib/reportUtils";
import CreateReportDialog from "@/components/CreateReportDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const MyReports = () => {
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // ดึงรายงานของผู้ใช้
      const reportsData = await getReportsByUser(user.uid);
      setReports(reportsData);

      // คำนวณสถิติ
      const statsData = {
        pending: reportsData.filter((r) => r.status === "pending").length,
        inProgress: reportsData.filter((r) => r.status === "in-progress").length,
        resolved: reportsData.filter((r) => r.status === "resolved").length,
        rejected: reportsData.filter((r) => r.status === "rejected").length,
        total: reportsData.length,
      };
      setStats(statsData);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: Report["status"]) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "รอดำเนินการ" },
      "in-progress": { variant: "default" as const, text: "กำลังดำเนินการ" },
      resolved: { variant: "default" as const, text: "แก้ไขเสร็จสิ้น", className: "bg-green-500" },
      rejected: { variant: "destructive" as const, text: "ปฏิเสธ" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Report["priority"]) => {
    const config = {
      low: { variant: "outline" as const, text: "ต่ำ" },
      medium: { variant: "secondary" as const, text: "ปานกลาง" },
      high: { variant: "destructive" as const, text: "สูง" },
    };

    const selected = config[priority];
    return <Badge variant={selected.variant}>{selected.text}</Badge>;
  };

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      bug: "บั๊ก",
      feature: "ขอฟีเจอร์",
      payment: "การชำระเงิน",
      account: "บัญชี",
      other: "อื่นๆ",
    };
    return categories[category] || category;
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (statusFilter === "all") return true;
    return report.status === statusFilter;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold">รายงานปัญหาของฉัน</h1>
            <p className="text-muted-foreground">
              ติดตามและจัดการรายงานปัญหาของคุณ
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            แจ้งปัญหาใหม่
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">แก้ไขแล้ว</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ปฏิเสธ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายการรายงาน</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="กรองสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in-progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter === "all"
                    ? "คุณยังไม่มีรายงานปัญหา"
                    : "ไม่พบรายงานตามเงื่อนไขที่เลือก"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>หัวข้อ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>ความสำคัญ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่แจ้ง</TableHead>
                      <TableHead>การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.title}
                        </TableCell>
                        <TableCell>{getCategoryText(report.category)}</TableCell>
                        <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          {format(report.createdAt, "dd MMM yyyy HH:mm", {
                            locale: th,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>รายละเอียดรายงานปัญหา</DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">หัวข้อ</h3>
                  <p>{selectedReport.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">ประเภท</h3>
                    <p>{getCategoryText(selectedReport.category)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">ความสำคัญ</h3>
                    {getPriorityBadge(selectedReport.priority)}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">สถานะ</h3>
                  {getStatusBadge(selectedReport.status)}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">รายละเอียด</h3>
                  <p className="whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                {selectedReport.adminNote && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">หมายเหตุจาก Admin</h3>
                    <p className="whitespace-pre-wrap">{selectedReport.adminNote}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold">วันที่แจ้ง:</span>{" "}
                    {format(selectedReport.createdAt, "dd MMMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </div>
                  {selectedReport.updatedAt && (
                    <div>
                      <span className="font-semibold">อัปเดตล่าสุด:</span>{" "}
                      {format(selectedReport.updatedAt, "dd MMMM yyyy HH:mm", {
                        locale: th,
                      })}
                    </div>
                  )}
                  {selectedReport.resolvedAt && (
                    <div>
                      <span className="font-semibold">แก้ไขเมื่อ:</span>{" "}
                      {format(selectedReport.resolvedAt, "dd MMMM yyyy HH:mm", {
                        locale: th,
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Report Dialog */}
        <CreateReportDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={loadData}
        />
      </div>
    </Layout>
  );
};

export default MyReports;



