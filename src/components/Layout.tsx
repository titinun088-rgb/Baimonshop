import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  LayoutDashboard,
  Gamepad2,
  ShoppingCart,
  Users,
  User,
  Bell,
  Activity,
  LogOut,
  Shield,
  AlertCircle,
  MessageSquare,
  Menu,
  X,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData, signOut, invitationCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // เมนูทั้งหมด พร้อมระบุว่าใครเห็นได้บ้าง
  const allNavigation: Array<{
    name: string;
    href: string;
    icon: any;
    roles: string[];
    badge?: number;
  }> = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: LayoutDashboard,
      roles: ['admin', 'seller'] // ทุกคนเห็น
    },
    { 
      name: "เกม", 
      href: "/games", 
      icon: Gamepad2,
      roles: ['admin', 'seller'] // ทุกคนเห็น
    },
    { 
      name: "ยอดขาย", 
      href: "/sales", 
      icon: ShoppingCart,
      roles: ['admin', 'seller'] // ทุกคนเห็น
    },
    { 
      name: "ผู้ใช้", 
      href: "/users", 
      icon: Users,
      roles: ['admin'] // เฉพาะ Admin
    },
    { 
      name: "กิจกรรม", 
      href: "/activity", 
      icon: Activity,
      roles: ['admin'] // เฉพาะ Admin
    },
    { 
      name: "แจ้งเตือน", 
      href: "/notifications", 
      icon: Bell,
      roles: ['admin', 'seller'] // ทุกคนเห็น
    },
    { 
      name: "รายงานปัญหา", 
      href: "/reports", 
      icon: AlertCircle,
      roles: ['admin'] // เฉพาะ Admin
    },
    { 
      name: "แจ้งปัญหา", 
      href: "/my-reports", 
      icon: MessageSquare,
      roles: ['seller'] // เฉพาะ Seller
    },
    { 
      name: "คำขอผู้ดูแล", 
      href: "/invitations", 
      icon: UserPlus,
      roles: ['admin', 'seller'], // ทุกคนเห็น
      badge: invitationCount > 0 ? invitationCount : undefined // แสดง badge ถ้ามีคำขอ
    },
    { 
      name: "โปรไฟล์", 
      href: "/profile", 
      icon: User,
      roles: ['admin', 'seller'] // ทุกคนเห็น
    },
  ];

  // กรองเมนูตาม role ของ user
  const navigation = allNavigation.filter(item => 
    item.roles.includes(userData?.role || 'seller')
  );

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("ออกจากระบบสำเร็จ");
      navigate("/login");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  // Sidebar content component (ใช้ทั้ง desktop และ mobile)
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="CoinZone Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            CoinZone
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto h-5 min-w-5 px-1.5 text-xs font-bold"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <Link 
          to="/profile" 
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={userData?.photoURL || undefined} 
                alt={user?.displayName || "User"} 
              />
              <AvatarFallback className="bg-gradient-secondary text-primary-foreground">
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {userData?.role === 'admin' && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {user?.displayName || "ผู้ใช้"}
              </p>
              {userData?.role === 'admin' && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </Link>
        <button
          onClick={() => {
            handleSignOut();
            onNavigate?.();
          }}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - ซ่อนใน mobile และ tablet */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:flex lg:flex-col border-r border-border bg-card shadow-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="CoinZone Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              CoinZone
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <VisuallyHidden.Root>
                <SheetTitle>เมนูนำทาง</SheetTitle>
                <SheetDescription>เลือกเมนูเพื่อนำทางไปยังหน้าต่างๆ</SheetDescription>
              </VisuallyHidden.Root>
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
