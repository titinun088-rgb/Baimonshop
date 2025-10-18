import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Sales from "./pages/Sales";
import Users from "./pages/Users";
import Activity from "./pages/Activity";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import MyReports from "./pages/MyReports";
import Profile from "./pages/Profile";
import ShopInvitations from "./pages/ShopInvitations";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import NotVerified from "./pages/NotVerified";
import Suspended from "./pages/Suspended";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes - ไม่ต้องล็อกอิน */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Semi-Protected Routes - ต้องล็อกอินแต่ไม่ต้องยืนยันอีเมล */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/not-verified" element={<NotVerified />} />
            <Route path="/suspended" element={<Suspended />} />
            
            {/* Protected Routes - ต้องล็อกอินและยืนยันอีเมล */}
            <Route
              path="/"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <Games />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/:id"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <GameDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
                  <Activity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <MyReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invitations"
              element={
                <ProtectedRoute requireEmailVerification={true}>
                  <ShopInvitations />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
