import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
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
import Payment from "./pages/Payment";
import SlipHistory from "./pages/SlipHistory";
import AccountInfo from "./pages/AccountInfo";
import TopUp from "./pages/TopUp";
import TopUpHistory from "./pages/TopUpHistory";
import CashCard from "./pages/CashCard";
import QRCodeManager from "./pages/QRCodeManager";
import PeamsubAPI from "./pages/PeamsubAPI";
import PremiumApp from "./pages/PremiumApp";
import GameTopUp from "./pages/GameTopUp";
import CardTopUp from "./pages/CardTopUp";
import GameImageManagement from "./pages/GameImageManagement";
import WepayPriceManagement from "./pages/WepayPriceManagement";
import CategoryManagement from "./pages/CategoryManagement";
import PurchaseHistory from "./pages/PurchaseHistory";
import PeamsubPriceManagement from "./pages/PeamsubPriceManagement";
import GameCodes from "./pages/GameCodes";
import GameCodeManagement from "./pages/GameCodeManagement";
import GameCodeDetails from "./pages/GameCodeDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { userData } = useAuth();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public Routes - ไม่ต้องล็อกอิน */}
        <Route path="/" element={<Index />} />
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
          path="/home"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
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
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/top-up"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <TopUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topup"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <TopUp />
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
        <Route
          path="/payment"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/slip-history"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <SlipHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-info"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <AccountInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-code-manager"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <QRCodeManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peamsub-api"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <PeamsubAPI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/premium-app"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <PremiumApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/top-up-history"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <TopUpHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cash-card"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <CashCard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-topup"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <GameTopUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/card-topup"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <CardTopUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-image-management"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <GameImageManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wepay-price-management"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <WepayPriceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category-management"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <CategoryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peamsub-price-management"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <PeamsubPriceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-history"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <PurchaseHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-codes"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <GameCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-code-management"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <GameCodeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-codes/:id"
          element={
            <ProtectedRoute requireEmailVerification={true} requireAdmin={true}>
              <GameCodeDetails />
            </ProtectedRoute>
          }
        />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsent />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
