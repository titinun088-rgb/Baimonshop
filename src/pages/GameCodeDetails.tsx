import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Upload,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGameById,
  getGameCodesByGameId,
  addGameCode,
  addGameCodesBulk,
  updateGameCode,
  deleteGameCode,
  Game,
  GameCode,
} from "@/lib/gameCodeUtils";
import * as XLSX from "xlsx";
import { getUserById } from "@/lib/adminUtils";

const GameCodeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [codes, setCodes] = useState<GameCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<GameCode | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    price: "",
    details: "",
  });
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [buyerNames, setBuyerNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/home");
      return;
    }
    if (id) {
      loadData();
    }
  }, [id, userData, navigate]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [gameData, codesData] = await Promise.all([
        getGameById(id),
        getGameCodesByGameId(id),
      ]);

      if (!gameData) {
        toast.error("ไม่พบเกม");
        navigate("/game-code-management");
        return;
      }

      setGame(gameData);
      setCodes(codesData);

      // โหลดชื่อผู้ซื้อสำหรับรหัสที่ขายแล้ว
      const soldCodes = codesData.filter((code) => code.status === "sold" && code.buyerUid);
      const buyerPromises = soldCodes.map(async (code) => {
        if (code.buyerUid) {
          try {
            const buyer = await getUserById(code.buyerUid);
            return { codeId: code.id, name: buyer?.displayName || buyer?.email || "ไม่พบข้อมูล" };
          } catch {
            return { codeId: code.id, name: "ไม่พบข้อมูล" };
          }
        }
        return null;
      });

      const buyerResults = await Promise.all(buyerPromises);
      const buyerMap: { [key: string]: string } = {};
      buyerResults.forEach((result) => {
        if (result) {
          buyerMap[result.codeId] = result.name;
        }
      });
      setBuyerNames(buyerMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!id || !game) return;

    if (!formData.email || !formData.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // ใช้ราคาจากเกม
    const price = game.price;

    try {
      await addGameCode({
        gameId: id,
        email: formData.email,
        password: formData.password,
        price,
        details: formData.details || undefined,
      });

      toast.success("เพิ่มรหัสสำเร็จ");
      setAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error adding code:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่มรหัส");
    }
  };

  const handleImport = async (file: File) => {
    if (!id) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast.error("ไฟล์ Excel ไม่มีข้อมูล");
        return;
      }

      // แปลงข้อมูลจาก Excel
      const codes = jsonData.map((row) => {
        const email = row["Email"] || row["email"] || row["EMAIL"] || "";
        const password = row["Password"] || row["password"] || row["PASSWORD"] || "";
        const price = row["Price"] || row["price"] || row["PRICE"] || game?.price || 0;
        const details = row["Details"] || row["details"] || row["DETAILS"] || row["Note"] || row["note"] || "";

        return {
          email: String(email).trim(),
          password: String(password).trim(),
          price: typeof price === "number" ? price : parseFloat(String(price)) || game?.price || 0,
          details: String(details).trim() || undefined,
        };
      }).filter((code) => code.email && code.password);

      if (codes.length === 0) {
        toast.error("ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel");
        return;
      }

      const result = await addGameCodesBulk(id, codes);

      if (result.success > 0) {
        toast.success(`เพิ่มรหัสสำเร็จ ${result.success} รายการ`);
      }
      if (result.failed > 0) {
        toast.warning(`เพิ่มไม่สำเร็จ ${result.failed} รายการ`);
      }
      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
        toast.error(`พบข้อผิดพลาด: ${result.errors.slice(0, 3).join(", ")}`);
      }

      setImportDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error importing codes:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    }
  };

  const handleEdit = (code: GameCode) => {
    setSelectedCode(code);
    setFormData({
      email: code.email,
      password: code.password,
      price: code.price.toString(),
      details: code.details || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedCode) return;

    if (!formData.email || !formData.password || !formData.price) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    try {
      await updateGameCode(selectedCode.id, {
        email: formData.email,
        password: formData.password,
        price,
        details: formData.details || undefined,
      });

      toast.success("อัปเดตรหัสสำเร็จ");
      setEditDialogOpen(false);
      resetForm();
      setSelectedCode(null);
      loadData();
    } catch (error: any) {
      console.error("Error updating code:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตรหัส");
    }
  };

  const handleStatusChange = async (codeId: string, newStatus: "active" | "sold" | "hidden") => {
    try {
      await updateGameCode(codeId, { status: newStatus });
      toast.success("เปลี่ยนสถานะสำเร็จ");
      loadData();
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleDelete = async (codeId: string) => {
    try {
      await deleteGameCode(codeId);
      toast.success("ลบรหัสสำเร็จ");
      loadData();
    } catch (error: any) {
      console.error("Error deleting code:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบรหัส");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      price: game?.price.toString() || "",
      details: "",
    });
  };

  const togglePasswordVisibility = (codeId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [codeId]: !prev[codeId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">active</Badge>;
      case "sold":
        return <Badge className="bg-blue-500">sold</Badge>;
      case "hidden":
        return <Badge variant="secondary">hidden</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (userData?.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ไม่พบเกม</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/game-code-management")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{game.name}</h1>
              <p className="text-muted-foreground mt-2">{game.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import รหัสจาก Excel</DialogTitle>
                  <DialogDescription>
                    ไฟล์ Excel ต้องมีคอลัมน์: Email, Password, Price (optional), Details (optional)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImport(file);
                      }
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มรหัส
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>เพิ่มรหัสเกม</DialogTitle>
                  <DialogDescription>
                    เพิ่มรหัสเกมทีละชิ้น (ราคาจากเกม: ฿{game?.price.toLocaleString() || 0})
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="password123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">รายละเอียด/Note</Label>
                    <Textarea
                      id="details"
                      value={formData.details}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, details: e.target.value }))
                      }
                      placeholder="รายละเอียดเพิ่มเติม"
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAdd}>
                    เพิ่มรหัส
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>รหัสทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>พร้อมขาย (active)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {codes.filter((c) => c.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ขายแล้ว (sold)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {codes.filter((c) => c.status === "sold").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการรหัส</CardTitle>
            <CardDescription>
              จัดการรหัสเกมทั้งหมด {codes.length} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีรหัส
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>ราคา</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ผู้ซื้อ</TableHead>
                      <TableHead>วันที่ขาย</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono text-sm">
                          {code.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {showPasswords[code.id]
                                ? code.password
                                : "******"}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => togglePasswordVisibility(code.id)}
                            >
                              {showPasswords[code.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>฿{code.price.toLocaleString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {code.details || "–"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={code.status}
                            onValueChange={(value: "active" | "sold" | "hidden") =>
                              handleStatusChange(code.id, value)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">active</SelectItem>
                              <SelectItem value="sold">sold</SelectItem>
                              <SelectItem value="hidden">hidden</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {code.status === "sold" && code.buyerUid ? (
                            <span className="text-sm">
                              {buyerNames[code.id] || code.buyerUid}
                            </span>
                          ) : (
                            "–"
                          )}
                        </TableCell>
                        <TableCell>
                          {code.soldAt
                            ? new Date(code.soldAt).toLocaleDateString("th-TH")
                            : "–"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {code.status !== "sold" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(code)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(code.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>แก้ไขรหัสเกม</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลรหัสเกม
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password *</Label>
                <Input
                  id="edit-password"
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">ราคา (บาท) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-details">รายละเอียด/Note</Label>
                <Textarea
                  id="edit-details"
                  value={formData.details}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, details: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <Button className="w-full" onClick={handleUpdate}>
                อัปเดตรหัส
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GameCodeDetails;

