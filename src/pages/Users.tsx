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
import { Plus, Search, MoreVertical, Edit, Trash2, Shield, CheckCircle, XCircle, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { getAllUsers, deleteUser } from "@/lib/adminUtils";
import { UserData } from "@/contexts/AuthContext";
import CreateUserDialog from "@/components/CreateUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import SuspendUserDialog from "@/components/SuspendUserDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
      setUserToDelete(null);
    }
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
              placeholder="ค้นหาผู้ใช้ (อีเมล, ชื่อร้าน)..."
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
                        <TableHead>ชื่อร้าน</TableHead>
                        <TableHead>บทบาท</TableHead>
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
                              <Badge variant="secondary">Seller</Badge>
                            )}
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
                            {format(user.createdAt, "d MMM yyyy", { locale: th })}
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
      </Layout>
    </RoleProtectedRoute>
  );
};

export default Users;
