import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, changePassword, isValidImageUrl, checkProblematicImageSource } from "@/lib/profileUtils";
import { User, Store, Shield, Mail, Calendar, Loader2, Lock, Image as ImageIcon, UserPlus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import InviteShopManagerDialog from "@/components/InviteShopManagerDialog";
import { getShopMembers, removeShopMember } from "@/lib/shopInvitationUtils";
import { ShopMember } from "@/types/shopInvitation";

const Profile = () => {
  const { user, userData, refreshUser } = useAuth();
  
  // Profile Update
  const [displayName, setDisplayName] = useState("");
  const [shopName, setShopName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [imageSourceWarnings, setImageSourceWarnings] = useState<string[]>([]);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Shop Members Management
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shopMembers, setShopMembers] = useState<ShopMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Load user data
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setShopName(userData.shopName || "");
      setPhotoURL(userData.photoURL || "");
    }
  }, [userData]);

  // Load shop members (เฉพาะ shop owner/admin)
  useEffect(() => {
    if (user && userData && (userData.role === "seller" || userData.role === "admin")) {
      loadShopMembers();
    }
  }, [user, userData]);

  const loadShopMembers = async () => {
    if (!user) return;
    
    setMembersLoading(true);
    try {
      const members = await getShopMembers(user.uid);
      setShopMembers(members);
    } catch (error) {
      console.error("Error loading shop members:", error);
    } finally {
      setMembersLoading(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!displayName.trim() || !shopName.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // ตรวจสอบ URL รูปภาพ
    if (photoURL && !isValidImageUrl(photoURL)) {
      toast.error("URL รูปภาพไม่ถูกต้อง กรุณาใช้ URL ที่ขึ้นต้นด้วย http:// หรือ https://");
      return;
    }

    // ตรวจสอบว่า URL มาจากแหล่งที่อาจเกิด CORS issues
    if (photoURL) {
      const sourceCheck = checkProblematicImageSource(photoURL);
      if (sourceCheck.blocked) {
        toast.error(sourceCheck.reason || "URL รูปภาพไม่ถูกต้อง");
        return;
      }
      if (sourceCheck.reason) {
        // เตือน แต่อนุญาตให้ดำเนินการต่อ
        console.warn(sourceCheck.reason);
      }
    }

    setProfileLoading(true);
    try {
      const result = await updateUserProfile({
        userId: user.uid,
        displayName: displayName.trim(),
        shopName: shopName.trim(),
        photoURL: photoURL.trim() || undefined,
        email: user.email || undefined,
      });

      if (result.success) {
        toast.success("อัปเดตโปรไฟล์สำเร็จ!");
        await refreshUser(); // รีเฟรชข้อมูล
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
      console.error(error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePassword(
        currentPassword,
        newPassword,
        user.email || ""
      );

      if (result.success) {
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      console.error(error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!user) return;

    if (!confirm(`คุณต้องการลบ ${memberEmail} ออกจากผู้ดูแลร้านใช่หรือไม่?`)) {
      return;
    }

    try {
      const result = await removeShopMember(user.uid, memberId);
      if (result.success) {
        toast.success("ลบผู้ดูแลสำเร็จ");
        await loadShopMembers();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("เกิดข้อผิดพลาดในการลบผู้ดูแล");
    }
  };

  return (
    <ProtectedRoute requireEmailVerification={true}>
      <Layout>
        {!user || !userData ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">โปรไฟล์ของฉัน</h1>
            <p className="text-muted-foreground">
              จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Summary - Left Column */}
            <div className="md:col-span-1">
              <Card className="border-border bg-card shadow-card">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoURL || undefined} alt={displayName} />
                      <AvatarFallback className="text-2xl">
                        {displayName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle>{userData.displayName}</CardTitle>
                  <CardDescription>{userData.shopName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  
                  {/* Role Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">บทบาท</span>
                    {userData.role === "admin" ? (
                      <Badge variant="default" className="bg-primary">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Seller</Badge>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userData.email}</span>
                  </div>

                  {/* Created Date */}
                  {userData.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        สมัครเมื่อ {format(
                          userData.createdAt instanceof Date 
                            ? userData.createdAt 
                            : new Date(userData.createdAt),
                          "d MMM yyyy", 
                          { locale: th }
                        )}
                      </span>
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ยืนยันอีเมล</span>
                      {userData.emailVerified ? (
                        <Badge variant="outline" className="text-success border-success">
                          ยืนยันแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning">
                          ยังไม่ยืนยัน
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">สถานะบัญชี</span>
                      {userData.verified ? (
                        <Badge variant="outline" className="text-success border-success">
                          อนุมัติแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive">
                          รออนุมัติ
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Settings - Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Update Profile Card */}
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    แก้ไขข้อมูลโปรไฟล์
                  </CardTitle>
                  <CardDescription>
                    อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName">
                        <User className="inline h-4 w-4 mr-1" />
                        ชื่อที่แสดง
                      </Label>
                      <Input
                        id="displayName"
                        placeholder="ชื่อที่ต้องการแสดง"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={profileLoading}
                        required
                      />
                    </div>

                    {/* Shop Name */}
                    <div className="space-y-2">
                      <Label htmlFor="shopName">
                        <Store className="inline h-4 w-4 mr-1" />
                        ชื่อร้าน
                      </Label>
                      <Input
                        id="shopName"
                        placeholder="ชื่อผู้ใช้ของคุณ"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        disabled={profileLoading}
                        required
                      />
                    </div>

                    {/* Photo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="photoURL">
                        <ImageIcon className="inline h-4 w-4 mr-1" />
                        URL รูปโปรไฟล์
                      </Label>
                      <Input
                        id="photoURL"
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={photoURL}
                        onChange={(e) => {
                          const url = e.target.value;
                          setPhotoURL(url);
                          // ตรวจสอบเงื่อนไขของ URL แบบ real-time
                          const warnings: string[] = [];
                          if (url) {
                            const sourceCheck = checkProblematicImageSource(url);
                            if (sourceCheck.blocked || sourceCheck.reason) {
                              warnings.push(sourceCheck.reason || "");
                            }
                          }
                          setImageSourceWarnings(warnings);
                        }}
                        disabled={profileLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        ใส่ URL รูปภาพจากอินเทอร์เน็ต (เช่น จาก Imgur, Cloudinary, หรือ Firebase Storage)
                      </p>
                      
                      {/* แสดงคำเตือน */}
                      {imageSourceWarnings.length > 0 && (
                        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
                          {imageSourceWarnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-orange-600 dark:text-orange-400">
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {photoURL && isValidImageUrl(photoURL) && (
                      <div className="space-y-2">
                        <Label>ตัวอย่าง</Label>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={photoURL} alt="Preview" />
                            <AvatarFallback>
                              {displayName?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{displayName || "ชื่อผู้ใช้"}</p>
                            <p className="text-sm text-muted-foreground">{shopName || "ชื่อร้าน"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full"
                    >
                      {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      บันทึกการเปลี่ยนแปลง
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Shop Members Management (เฉพาะ shop owner และ admin) */}
              {userData && (userData.role === "seller" || userData.role === "admin") && (
                <Card className="border-border bg-card shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          ผู้ดูแลผู้ใช้
                        </CardTitle>
                        <CardDescription>
                          เชิญผู้ใช้อื่นเป็นผู้ดูแลผู้ใช้ของคุณ
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setInviteDialogOpen(true)}
                        className="bg-gradient-primary shadow-glow"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        เพิ่มผู้ดูแล
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : shopMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีผู้ดูแลผู้ใช้</p>
                        <p className="text-sm">คลิก "เพิ่มผู้ดูแล" เพื่อเชิญผู้ใช้อื่น</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {shopMembers.map((member) => (
                          <div
                            key={member.memberId}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {member.memberEmail.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.memberEmail}</p>
                                <p className="text-xs text-muted-foreground">
                                  เพิ่มเมื่อ {format(member.addedAt, "d MMM yyyy", { locale: th })}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.memberId, member.memberEmail)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Change Password Card */}
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    เปลี่ยนรหัสผ่าน
                  </CardTitle>
                  <CardDescription>
                    อัปเดตรหัสผ่านเพื่อความปลอดภัย
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={passwordLoading}
                        required
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={passwordLoading}
                        required
                        minLength={6}
                      />
                    </div>

                    {/* Warning */}
                    <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/10 p-3">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        ⚠️ คำเตือน
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        หลังจากเปลี่ยนรหัสผ่าน คุณจะต้องล็อกอินใหม่อีกครั้ง
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        )}

        {/* Invite Shop Manager Dialog */}
        {user && userData && (
          <InviteShopManagerDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            shopOwnerId={user.uid}
            shopOwnerEmail={user.email || ""}
            shopName={userData.shopName}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default Profile;

