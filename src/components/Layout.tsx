import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  LayoutDashboard,
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
  Wallet,
  History,
  Receipt,
  Building2,
  Wifi,
  Package,
  CreditCard,
  Gamepad2,
  Smartphone,
  Home,
  DollarSign,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: number;
}

interface NavCategory {
  name: string;
  icon: any;
  items: NavItem[];
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData, signOut, invitationCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // เมนูทั้งหมด
  const allNavigation: NavItem[] = [
    // หลัก
    {
      name: "หน้าหลัก",
      href: "/home",
      icon: Home,
      roles: ['admin', 'seller']
    },

    // ซื้อ/เติม
    {
      name: "เติมเกม",
      href: "/game-topup",
      icon: Gamepad2,
      roles: ['admin', 'seller']
    },
    {
      name: "แอปพรีเมียม",
      href: "/premium-app",
      icon: Package,
      roles: ['admin', 'seller']
    },
    {
      name: "บัตรเติมเงิน",
      href: "/card-topup",
      icon: CreditCard,
      roles: ['admin', 'seller']
    },
    {
      name: "บัตรเงินสด",
      href: "/cash-card",
      icon: CreditCard,
      roles: ['admin', 'seller']
    },
    {
      name: "รหัสเกม",
      href: "/game-codes",
      icon: Gamepad2,
      roles: ['admin', 'seller']
    },

    // ประวัติ
    {
      name: "ประวัติการซื้อสินค้า",
      href: "/purchase-history",
      icon: Package,
      roles: ['admin', 'seller']
    },
    {
      name: "ประวัติการเติมเงิน",
      href: "/top-up-history",
      icon: History,
      roles: ['admin', 'seller']
    },
    {
      name: "ประวัติสลิป",
      href: "/slip-history",
      icon: Receipt,
      roles: ['admin', 'seller']
    },

    // การเงิน
    {
      name: "เติมเงิน",
      href: "/top-up",
      icon: Wallet,
      roles: ['admin', 'seller']
    },
    {
      name: "ข้อมูลบัญชี",
      href: "/account-info",
      icon: Building2,
      roles: ['admin', 'seller']
    },

    // แจ้งเตือน
    {
      name: "แจ้งเตือน",
      href: "/notifications",
      icon: Bell,
      roles: ['admin', 'seller']
    },
    {
      name: "แจ้งปัญหา",
      href: "/my-reports",
      icon: MessageSquare,
      roles: ['seller']
    },

    // จัดการ (Admin)
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ['admin']
    },
    {
      name: "เกม",
      href: "/games",
      icon: Gamepad2,
      roles: ['admin']
    },
    {
      name: "ยอดขาย",
      href: "/sales",
      icon: ShoppingCart,
      roles: ['admin']
    },
    {
      name: "ผู้ใช้",
      href: "/users",
      icon: Users,
      roles: ['admin']
    },
    {
      name: "รายงานปัญหา",
      href: "/reports",
      icon: AlertCircle,
      roles: ['admin']
    },
    {
      name: "Peamsub API",
      href: "/peamsub-api",
      icon: Wifi,
      roles: ['admin']
    },
    {
      name: "จัดการขายไอดีเกม",
      href: "/game-code-management",
      icon: Gamepad2,
      roles: ['admin']
    },
    {
      name: "จัดการรูปเกม wePAY",
      href: "/game-image-management",
      icon: ImageIcon,
      roles: ['admin']
    },

    // โปรไฟล์
    {
      name: "โปรไฟล์",
      href: "/profile",
      icon: User,
      roles: ['admin', 'seller']
    },
  ];

  // กรองเมนูตาม role (ให้ role 'user' ได้เมนูเหมือน 'seller')
  const userRoleRaw = userData?.role || 'seller';
  const effectiveRole = String(userRoleRaw) === 'user' ? 'seller' : userRoleRaw;
  const navigation = allNavigation.filter(item =>
    item.roles.includes(effectiveRole)
  );

  // จัดหมวดหมู่เมนู
  const getCategorizedMenus = (): NavCategory[] => {
    const userRole = effectiveRole; // ใช้ role ที่แมปแล้ว (user -> seller)
    const categories: NavCategory[] = [
      {
        name: "หลัก",
        icon: Home,
        items: navigation.filter(item =>
          item.name === "หน้าหลัก" && item.roles.includes(userRole)
        )
      },
      {
        name: "ซื้อ/เติม",
        icon: ShoppingCart,
        items: navigation.filter(item =>
          ["เติมเกม", "แอปพรีเมียม", "บัตรเติมเงิน", "บัตรเงินสด", "รหัสเกม"].includes(item.name) &&
          item.roles.includes(userRole)
        )
      },
      {
        name: "ประวัติ",
        icon: History,
        items: navigation.filter(item =>
          ["ประวัติการซื้อสินค้า", "ประวัติการเติมเงิน", "ประวัติสลิป"].includes(item.name) &&
          item.roles.includes(userRole)
        )
      },
      {
        name: "การเงิน",
        icon: Wallet,
        items: navigation.filter(item =>
          ["เติมเงิน", "ข้อมูลบัญชี"].includes(item.name) &&
          item.roles.includes(userRole)
        )
      },
      {
        name: "แจ้งเตือน",
        icon: Bell,
        items: navigation.filter(item =>
          ["แจ้งเตือน", "แจ้งปัญหา"].includes(item.name) &&
          item.roles.includes(userRole)
        )
      },
    ];

    // เพิ่มหมวดจัดการสำหรับ Admin
    if (userRole === 'admin') {
      categories.push({
        name: "จัดการ",
        icon: LayoutDashboard,
        items: navigation.filter(item =>
          ["Dashboard", "เกม", "ยอดขาย", "ผู้ใช้", "รายงานปัญหา", "Peamsub API", "จัดการราคา Peamsub", "จัดการขายไอดีเกม", "จัดการรูปเกม wePAY"].includes(item.name) &&
          item.roles.includes('admin')
        )
      });
    }

    // เพิ่มโปรไฟล์
    categories.push({
      name: "โปรไฟล์",
      icon: User,
      items: navigation.filter(item => item.name === "โปรไฟล์")
    });

    // กรองหมวดหมู่ที่ไม่มี items
    return categories.filter(cat => cat.items.length > 0);
  };

  const categorizedMenus = getCategorizedMenus();

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

  // Sidebar content for mobile (with categories)
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-border px-6 bg-gradient-cute shadow-pink">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="/logo.png"
              alt="BaimonShop Logo"
              className="h-12 w-12 object-contain drop-shadow-lg"
            />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white drop-shadow-md">
              BaimonShop
            </span>
            <span className="text-xs text-blue-100 font-medium">
              เว็บเติมเกม #1
            </span>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      {userData && (
        <div className="border-b border-border px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs lg:text-sm text-gray-600">ยอดเงิน:</span>
            </div>
            <span className="font-semibold text-green-600 text-sm lg:text-base">
              ฿{(userData.balance || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Navigation with Categories */}
      <nav className="flex-1 space-y-2 px-2 lg:px-3 py-3 lg:py-4 overflow-y-auto">
        {categorizedMenus.map((category) => {
          // แสดงเฉพาะหมวดหมู่ที่มี items
          if (category.items && category.items.length > 0) {
            const CategoryIcon = category.icon;
            return (
              <div key={category.name} className="space-y-1">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-2 lg:px-3 py-1.5 text-sm font-bold text-white uppercase tracking-wider">
                  <CategoryIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span>{category.name}</span>
                </div>

                {/* Category Items */}
                <div className="space-y-0.5">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => {
                          if (onNavigate) onNavigate();
                        }}
                        className={cn(
                          "flex items-center gap-2 lg:gap-3 rounded-lg px-2 lg:px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-4 lg:h-5 min-w-4 lg:min-w-5 px-1 lg:px-1.5 text-[10px] lg:text-xs font-bold flex-shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null; // ไม่แสดงหมวดหมู่ที่ไม่มี items
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <Link
          to="/profile"
          onClick={() => {
            if (onNavigate) onNavigate();
          }}
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
              {user?.email || "ไม่มีอีเมล"}
            </p>
          </div>
        </Link>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gaming Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(147, 197, 253, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147, 197, 253, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'gridMove 25s linear infinite'
          }}
        />

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/40 rounded-full gaming-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Corner Glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-blue-500/10 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-purple-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      {/* Desktop Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/20 bg-transparent backdrop-blur-md shadow-sm overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          {/* Transparent Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/10 to-black/5 dark:from-white/5 dark:via-white/10 dark:to-white/5"></div>

          {/* Moving Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.8) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.8) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              animation: 'gridMove 15s linear infinite'
            }}
          />

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animation: `particleFloat ${4 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
                boxShadow: '0 0 6px currentColor'
              }}
            />
          ))}

          {/* Subtle Scanlines */}
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
            style={{
              top: '25%',
              animation: 'scanlineV 6s linear infinite'
            }}
          />
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
            style={{
              top: '75%',
              animation: 'scanlineV 8s linear infinite 2s'
            }}
          />

          {/* Corner Glow Effects */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-blue-500/10 to-transparent blur-xl"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-purple-500/10 to-transparent blur-xl"></div>
        </div>

        <div className="h-full px-4 relative z-10">
          <div className="flex items-center justify-between h-full px-6">
            {/* BaimonShop Brand Logo */}
            <Link to="/home" className="flex items-center gap-4 flex-shrink-0 group hover:scale-105 transition-transform duration-200">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="BaimonShop Logo"
                  className="h-10 w-10 object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-200"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gradient-pink animate-bounce-cute">
                  BaimonShop 🌸
                </span>
                <span className="text-xs text-pink-300 font-medium -mt-1">
                  เว็บเติมเกม #1 ✨
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="flex-1 flex items-center justify-center gap-1 h-full">
              {categorizedMenus.map((category) => {
                const CategoryIcon = category.icon;

                // ถ้ามีแค่ 1 item และเป็น "หน้าหลัก" ให้แสดงเป็น link ธรรมดา
                if (category.items.length === 1 && category.items[0].name === "หน้าหลัก") {
                  const item = category.items[0];
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={category.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors h-10",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <CategoryIcon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                }

                // ถ้ามีหลาย items ให้แสดงเป็น dropdown
                // แสดงเมนูเฉพาะเมื่อมี items
                if (category.items && category.items.length > 0) {
                  return (
                    <DropdownMenu key={category.name}>
                      <DropdownMenuTrigger
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors h-10 outline-none",
                          "text-muted-foreground hover:bg-muted hover:text-foreground",
                          "data-[state=open]:bg-muted data-[state=open]:text-foreground"
                        )}
                      >
                        <CategoryIcon className="h-4 w-4" />
                        <span>{category.name}</span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4" />
                          {category.name}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.href);
                          return (
                            <DropdownMenuItem key={item.name} asChild>
                              <Link
                                to={item.href}
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  active && "bg-muted"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs font-bold">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return null; // ไม่แสดงเมนูถ้าไม่มี items
              })}
            </nav>

            {/* Right Side: Balance & User */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Balance */}
              {userData && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-pink-500/10 border border-pink-500/20 hover-glow-pink">
                  <Wallet className="h-4 w-4 text-pink-400" />
                  <span className="text-sm font-semibold text-pink-400">
                    ฿{(userData.balance || 0).toLocaleString()}
                  </span>
                </div>
              )}

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-9 w-9">
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.displayName || "ผู้ใช้"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "ไม่มีอีเมล"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      โปรไฟล์
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/20 bg-transparent backdrop-blur-md shadow-sm overflow-hidden">
        {/* Animated Background for Mobile */}
        <div className="absolute inset-0 -z-10">
          {/* Transparent Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/10 to-black/5 dark:from-white/5 dark:via-white/10 dark:to-white/5"></div>

          {/* Moving Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.8) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.8) 1px, transparent 1px)
              `,
              backgroundSize: '15px 15px',
              animation: 'gridMove 12s linear infinite'
            }}
          />

          {/* Floating Particles - Less for mobile */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
              style={{
                left: `${20 + (i * 20)}%`,
                top: `${40 + Math.sin(i) * 20}%`,
                animation: `particleFloat ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
                boxShadow: '0 0 5px currentColor'
              }}
            />
          ))}

          {/* Subtle Scanline */}
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
            style={{
              top: '60%',
              animation: 'scanlineV 5s linear infinite'
            }}
          />

          {/* Corner Glow Effects */}
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-blue-500/10 to-transparent blur-lg"></div>
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-purple-500/10 to-transparent blur-lg"></div>
        </div>

        <div className="flex items-center justify-between h-full px-4 relative z-10">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="BaimonShop Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold text-gradient-pink animate-bounce-cute">
              BaimonShop 🌸
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
      <main className="flex-1 pt-16 lg:pt-16 pb-4 lg:pb-8">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">{children}</div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Contact Admin Button */}
      <a
        href="https://www.facebook.com/share/1CpnioY7kk/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          size="icon"
          className="lg:size-auto lg:px-4 lg:py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-full lg:rounded-md"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden lg:inline">ติดต่อแอดมิน</span>
        </Button>
      </a>
    </div>
  );
};

export default Layout;
