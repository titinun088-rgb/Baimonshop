import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gamepad2,
  ShoppingCart,
  Users,
  Settings,
  Bell,
  Activity,
  LogOut,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "เกม", href: "/games", icon: Gamepad2 },
    { name: "ยอดขาย", href: "/sales", icon: ShoppingCart },
    { name: "ผู้ใช้", href: "/users", icon: Users },
    { name: "กิจกรรม", href: "/activity", icon: Activity },
    { name: "แจ้งเตือน", href: "/notifications", icon: Bell },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card shadow-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
              <span className="text-xl font-bold">Game Shop</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 rounded-full bg-gradient-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium">ชื่อร้าน</p>
                <p className="text-xs text-muted-foreground">Seller</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
