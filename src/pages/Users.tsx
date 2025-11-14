import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Edit, Trash2, Shield, CheckCircle, XCircle, Loader2, Ban, ArrowUpCircle, History } from "lucide-react";
import { toast } from "sonner";
import { getAllUsers, deleteUser } from "@/lib/adminUtils";
import { createTopUpTransaction, completeTopUpTransaction, getUserTopUpHistory } from "@/lib/topupUtils";
import { UserData } from "@/contexts/AuthContext";
import CreateUserDialog from "@/components/CreateUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import SuspendUserDialog from "@/components/SuspendUserDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Component สำหรับแสดงประวัติการเติมเงิน
const TopUpHistoryContent = ({ userId }: { userId: string }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const history = await getUserTopUpHistory(userId);
        setTransactions(history);
      } catch (error) {
        console.error("Error loading top-up history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">กำลังโหลดประวัติ...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-8 w-8 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">ยังไม่มีประวัติการเติมเงิน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={
                  transaction.status === 'completed' ? 'bg-green-500' :
                  transaction.status === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }>
                  {transaction.status === 'completed' ? 'สำเร็จ' :
                   transaction.status === 'pending' ? 'รอดำเนินการ' :
                   'ล้มเหลว'}
                </Badge>
                <span className="text-sm text-gray-600">
                  {format(transaction.createdAt, "d MMM yyyy HH:mm", { locale: th })}
                </span>
              </div>
              <p className="font-semibold text-black">
                {transaction.paymentMethod === 'admin' ? 'เติมเงินโดยแอดมิน' :
                 transaction.paymentMethod === 'promptpay' ? 'PromptPay' :
                 transaction.paymentMethod === 'bank_transfer' ? 'โอนเงินธนาคาร' :
                 transaction.paymentMethod}
              </p>
              {transaction.slipData?.reason && (
                <p className="text-sm text-gray-600">{transaction.slipData.reason}</p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${
                transaction.status === 'completed' ? 'text-green-600' :
                transaction.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {transaction.status === 'completed' ? '+' : ''}
                {transaction.amount.toLocaleString()} บาท
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<UserData | null>(null);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Top-up dialog
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [userToTopUp, setUserToTopUp] = useState<UserData | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpReason, setTopUpReason] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  
  // Top-up history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [userHistory, setUserHistory] = useState<UserData | null>(null);

  // โหลดข้อมูลผู้ใช้
  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ค้นหา
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.shopName.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // แก้ไขผู้ใช้
  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  // พัก/ปลดพักผู้ใช้
  const handleSuspendClick = (user: UserData) => {
    setUserToSuspend(user);
    setSuspendDialogOpen(true);
  };

  // ลบผู้ใช้
  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteUser(userToDelete.uid);
      
      if (result.success) {
        toast.success("ลบผู้ใช้สำเร็จ");
        loadUsers(); // รีโหลดข้อมูล
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการลบผู้ใช้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // เติมเงินให้ผู้ใช้
  const handleTopUpUser = async () => {
    if (!userToTopUp || topUpAmount <= 0) return;

    setToppingUp(true);
    try {
      // สร้างธุรกรรมการเติมเงิน
      const transactionId = await createTopUpTransaction(
        userToTopUp.uid,
        topUpAmount,
        'admin', // payment method
        'manual', // verification method
        {
          adminTopUp: true,
          reason: topUpReason || 'เติมเงินโดยแอดมิน',
          adminId: 'admin' // ระบุว่าเป็นแอดมิน
        }
      );

      // อัปเดตยอดเงินและเปลี่ยนสถานะเป็น completed
      await completeTopUpTransaction(transactionId, userToTopUp.uid, topUpAmount);

      toast.success(`เติมเงิน ${topUpAmount.toLocaleString()} บาท ให้ ${userToTopUp.email} สำเร็จ`);
      
      // รีเซ็ต form
      setTopUpDialogOpen(false);
      setUserToTopUp(null);
      setTopUpAmount(0);
      setTopUpReason("");
      
      // โหลดข้อมูลใหม่
      await loadUsers();
    } catch (error) {
      console.error("Error topping up user:", error);
      toast.error("เกิดข้อผิดพลาดในการเติมเงิน");
    } finally {
      setToppingUp(false);
    }
  };

  // เปิด dialog เติมเงิน
  const openTopUpDialog = (user: UserData) => {
    setUserToTopUp(user);
    setTopUpAmount(0);
    setTopUpReason("");
    setTopUpDialogOpen(true);
  };

  // เปิด dialog ประวัติการเติมเงิน
  const openHistoryDialog = (user: UserData) => {
    setUserHistory(user);
    setHistoryDialogOpen(true);
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
              <p className="text-muted-foreground">
                จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-primary shadow-glow"
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มผู้ใช้
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาผู้ใช้ (อีเมล, ชื่อแสดงในเว็บไซต์)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>รายชื่อผู้ใช้ทั้งหมด</span>
                <Badge variant="secondary">{filteredUsers.length} คน</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "ไม่พบผู้ใช้ที่ค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>อีเมล</TableHead>
                        <TableHead>ชื่อแสดงในเว็บไซต์</TableHead>
                        <TableHead>บทบาท</TableHead>
                        <TableHead>ยอดเงิน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>สมัครเมื่อ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell className="font-medium">
                            {user.email}
                          </TableCell>
                          <TableCell>{user.shopName}</TableCell>
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge variant="default" className="bg-primary">
                                <Shield className="mr-1 h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">ผู้ใช้</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {(user.balance || 0).toLocaleString()} บาท
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {user.suspended ? (
                                <Badge variant="outline" className="text-destructive border-destructive w-fit">
                                  <Ban className="mr-1 h-3 w-3" />
                                  ถูกพัก
                                </Badge>
                              ) : (
                                <>
                                  {user.emailVerified ? (
                                    <Badge variant="outline" className="text-success border-success w-fit">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      ยืนยันอีเมล
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-warning border-warning w-fit">
                                      <XCircle className="mr-1 h-3 w-3" />
                                      ยังไม่ยืนยัน
                                    </Badge>
                                  )}
                                  {user.verified ? (
                                    <Badge variant="outline" className="text-success border-success w-fit">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      อนุมัติแล้ว
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-destructive border-destructive w-fit">
                                      <XCircle className="mr-1 h-3 w-3" />
                                      รออนุมัติ
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>
                              {format(user.createdAt, "d MMM yyyy", { locale: th })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(user.createdAt, "HH:mm:ss", { locale: th })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  แก้ไข
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openTopUpDialog(user)}>
                                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                                  เติมเงิน
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openHistoryDialog(user)}>
                                  <History className="mr-2 h-4 w-4" />
                                  ประวัติการเติมเงิน
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSuspendClick(user)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {user.suspended ? "จัดการการพัก" : "พักบัญชี"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  ลบ
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create User Dialog */}
        <CreateUserDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={loadUsers}
        />

        {/* Edit User Dialog */}
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onSuccess={loadUsers}
        />

        {/* Suspend User Dialog */}
        <SuspendUserDialog
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          targetUser={userToSuspend ? {
            uid: userToSuspend.uid,
            email: userToSuspend.email,
            shopName: userToSuspend.shopName,
            suspended: userToSuspend.suspended || false,
            suspendedUntil: userToSuspend.suspendedUntil,
            suspendReason: userToSuspend.suspendReason,
          } : null}
          onSuccess={loadUsers}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการลบผู้ใช้ <strong>{userToDelete?.email}</strong> ใช่หรือไม่?
                <br />
                <br />
                การดำเนินการนี้จะลบข้อมูลผู้ใช้ออกจากฐานข้อมูล Firestore
                แต่บัญชี Firebase Auth จะยังคงอยู่
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  "ลบผู้ใช้"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Top-up Dialog */}
        <AlertDialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>เติมเงินให้ผู้ใช้</AlertDialogTitle>
              <AlertDialogDescription>
                เติมเงินให้ผู้ใช้ <strong>{userToTopUp?.email}</strong>
                <br />
                ยอดเงินปัจจุบัน: <strong>{userToTopUp?.balance?.toLocaleString()} บาท</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">จำนวนเงิน (บาท)</label>
                <Input
                  type="number"
                  value={topUpAmount || ""}
                  onChange={(e) => setTopUpAmount(Number(e.target.value) || 0)}
                  placeholder="กรอกจำนวนเงิน"
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">เหตุผล (ไม่บังคับ)</label>
                <Input
                  value={topUpReason}
                  onChange={(e) => setTopUpReason(e.target.value)}
                  placeholder="เช่น เติมเงินทดแทน, โบนัสพิเศษ"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={toppingUp}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTopUpUser}
                disabled={toppingUp || !topUpAmount || topUpAmount <= 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {toppingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเติมเงิน...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    เติมเงิน
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Top-up History Dialog */}
        <AlertDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>ประวัติการเติมเงิน</AlertDialogTitle>
              <AlertDialogDescription>
                ประวัติการเติมเงินของ <strong>{userHistory?.email}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <TopUpHistoryContent userId={userHistory?.uid || ""} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>ปิด</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </RoleProtectedRoute>
  );
};

export default Users;
