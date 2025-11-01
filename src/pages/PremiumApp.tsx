import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { 
  ShoppingBag, 
  History, 
  AlertTriangle, 
  Search, 
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  Calendar,
  Eye,
  ShoppingCart,
  RefreshCw,
  Wifi,
  WifiOff,
  CreditCard,
  FileText,
  Clock,
  CheckSquare,
  XSquare,
  Gamepad2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addUserPurchaseReference, recordPurchaseWithSellPrice } from "@/lib/purchaseHistoryUtils";
import { getProductSellPrice } from "@/lib/peamsubPriceUtils";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getPeamsubUserInfo,
  getPeamsubProducts,
  getPeamsubPreorderProducts,
  getPeamsubGameProducts,
  purchasePeamsubProduct,
  getPeamsubPurchaseHistory,
  claimPeamsubProduct,
  purchasePeamsubPreorder,
  getPeamsubPreorderHistory,
  testPeamsubConnection,
  formatPeamsubUserInfo,
  formatPeamsubProduct,
  formatPeamsubPreorderProduct,
  formatPeamsubGameProduct,
  formatPeamsubPurchaseHistory,
  formatPeamsubPreorderHistory,
  filterProductsByPrice,
  filterProductsByStock,
  filterPreorderProductsByCategory,
  filterPreorderProductsByPrice,
  filterGameProductsByCategory,
  filterGameProductsByPrice,
  filterPurchaseHistoryByStatus,
  filterPreorderHistoryByStatus,
  searchProducts,
  searchPreorderProducts,
  searchGameProducts,
  sortProductsByPrice,
  sortProductsByStock,
  sortPreorderProductsByPrice,
  sortGameProductsByPrice,
  getProductPriceByRank,
  getPreorderProductPriceByRank,
  isProductInStock,
  isPreorderProductInStock,
  calculateTotalPurchaseAmount,
  calculateTotalPreorderAmount,
  generateReferenceId,
  getClaimStatusText,
  canPurchaseProduct,
  canPurchasePreorderProduct,
  getPreorderProductSummary,
  getGameProductSummary,
  PeamsubUserData,
  PeamsubProduct,
  PeamsubPreorderProduct,
  PeamsubGameProduct,
  PeamsubPurchaseHistory,
  PeamsubPreorderHistory
} from "@/lib/peamsubUtils";

const PremiumApp = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  // ตรวจสอบว่าเป็นแอดมินหรือไม่
  const isAdmin = userData?.role === 'admin';
  
  // Debug: แสดงข้อมูล role และ isAdmin
  console.log('🔍 PremiumApp Debug:', {
    userRole: userData?.role,
    isAdmin: isAdmin,
    userData: userData
  });
  
  // States
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [preorderApiStatus, setPreorderApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [userInfo, setUserInfo] = useState<PeamsubUserData | null>(null);
  const [products, setProducts] = useState<PeamsubProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PeamsubProduct[]>([]);
  const [preorderProducts, setPreorderProducts] = useState<PeamsubPreorderProduct[]>([]);
  const [filteredPreorderProducts, setFilteredPreorderProducts] = useState<PeamsubPreorderProduct[]>([]);
  const [gameProducts, setGameProducts] = useState<PeamsubGameProduct[]>([]);
  const [filteredGameProducts, setFilteredGameProducts] = useState<PeamsubGameProduct[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PeamsubPurchaseHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PeamsubPurchaseHistory[]>([]);
  const [preorderHistory, setPreorderHistory] = useState<PeamsubPreorderHistory[]>([]);
  const [filteredPreorderHistory, setFilteredPreorderHistory] = useState<PeamsubPreorderHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minStock, setMinStock] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'price' | 'stock' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Purchase Dialog
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PeamsubProduct | null>(null);
  const [customReference, setCustomReference] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  
  // Preorder Dialog
  const [preorderDialogOpen, setPreorderDialogOpen] = useState(false);
  const [selectedPreorderProduct, setSelectedPreorderProduct] = useState<PeamsubPreorderProduct | null>(null);
  const [preorderReference, setPreorderReference] = useState("");
  const [preorderCallbackUrl, setPreorderCallbackUrl] = useState("");
  const [preordering, setPreordering] = useState(false);
  
  // Claim Dialog
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<PeamsubPurchaseHistory | null>(null);
  const [claimStatus, setClaimStatus] = useState<'wrong_password' | 'incorrect_pin' | 'youtube_premium_disconnect' | 'netflix_screen_disconnect' | 'others'>('others');
  const [claimDescription, setClaimDescription] = useState("");
  const [claiming, setClaiming] = useState(false);
  
  // History Filters
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
  // Preorder History Filters
  const [preorderStatusFilter, setPreorderStatusFilter] = useState<string>("all");
  const [preorderSearchQuery, setPreorderSearchQuery] = useState("");
  
  // Product Details Dialog
  const [productDetailsDialogOpen, setProductDetailsDialogOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    initializeData();
  }, []);

  // กรองและเรียงลำดับสินค้า
  useEffect(() => {
    let filtered = [...products];

    // ค้นหา
    if (searchQuery) {
      filtered = searchProducts(filtered, searchQuery);
    }

    // กรองตามราคา
    if (maxPrice) {
      filtered = filterProductsByPrice(filtered, maxPrice);
    }

    // กรองตามสต็อก
    filtered = filterProductsByStock(filtered, minStock);

    // เรียงลำดับ
    if (sortBy === 'price') {
      filtered = sortProductsByPrice(filtered, sortOrder === 'asc');
    } else if (sortBy === 'stock') {
      filtered = sortProductsByStock(filtered, sortOrder === 'asc');
    } else {
      filtered = filtered.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, maxPrice, minStock, sortBy, sortOrder]);

  // กรองและเรียงลำดับสินค้าพรีออเดอร์
  useEffect(() => {
    let filtered = [...preorderProducts];

    // ค้นหา
    if (searchQuery) {
      filtered = searchPreorderProducts(filtered, searchQuery);
    }

    // กรองตามราคา
    if (maxPrice) {
      filtered = filterPreorderProductsByPrice(filtered, maxPrice);
    }

    // กรองตามสต็อก
    filtered = filtered.filter(product => product.stock >= minStock);

    // เรียงลำดับ
    if (sortBy === 'price') {
      filtered = sortPreorderProductsByPrice(filtered, sortOrder === 'asc');
    } else if (sortBy === 'stock') {
      filtered = filtered.sort((a, b) => {
        return sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
      });
    } else {
      filtered = filtered.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredPreorderProducts(filtered);
  }, [preorderProducts, searchQuery, maxPrice, minStock, sortBy, sortOrder]);

  // กรองและเรียงลำดับสินค้าเติมเกม
  useEffect(() => {
    let filtered = [...gameProducts];

    // ค้นหา
    if (searchQuery) {
      filtered = searchGameProducts(filtered, searchQuery);
    }

    // กรองตามราคา
    if (maxPrice) {
      filtered = filterGameProductsByPrice(filtered, maxPrice);
    }

    // เรียงลำดับ
    if (sortBy === 'price') {
      filtered = sortGameProductsByPrice(filtered, sortOrder === 'asc');
    } else {
      filtered = filtered.sort((a, b) => {
        const comparison = a.category.localeCompare(b.category);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredGameProducts(filtered);
  }, [gameProducts, searchQuery, maxPrice, sortBy, sortOrder]);

  // กรองประวัติการซื้อ
  useEffect(() => {
    let filtered = [...purchaseHistory];

    // กรองตามสถานะ
    if (historyStatusFilter !== "all") {
      filtered = filterPurchaseHistoryByStatus(filtered, historyStatusFilter);
    }

    // ค้นหา
    if (historySearchQuery) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.refId.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.prize.toLowerCase().includes(historySearchQuery.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  }, [purchaseHistory, historyStatusFilter, historySearchQuery]);

  // กรองประวัติการซื้อพรีออเดอร์
  useEffect(() => {
    let filtered = [...preorderHistory];

    // กรองตามสถานะ
    if (preorderStatusFilter !== "all") {
      filtered = filterPreorderHistoryByStatus(filtered, preorderStatusFilter);
    }

    // ค้นหา
    if (preorderSearchQuery) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(preorderSearchQuery.toLowerCase()) ||
        item.refId.toLowerCase().includes(preorderSearchQuery.toLowerCase()) ||
        item.prize.toLowerCase().includes(preorderSearchQuery.toLowerCase())
      );
    }

    setFilteredPreorderHistory(filtered);
  }, [preorderHistory, preorderStatusFilter, preorderSearchQuery]);

  // เริ่มต้นข้อมูล
  const initializeData = async () => {
    setLoading(true);
    try {
      // ทดสอบการเชื่อมต่อ
      const isConnected = await testPeamsubConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');

      if (isConnected) {
        // Helper function to add delay between API calls
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // โหลดข้อมูลผู้ใช้
        try {
          const user = await getPeamsubUserInfo();
          setUserInfo(user);
        } catch (error) {
          console.error("Error loading user info:", error);
        }

        // เพิ่ม delay เพื่อป้องกัน rate limiting
        await delay(500);

        // โหลดรายการสินค้า
        try {
          const productList = await getPeamsubProducts();
          setProducts(productList);
        } catch (error) {
          console.error("Error loading products:", error);
        }

        // เพิ่ม delay เพื่อป้องกัน rate limiting
        await delay(500);

        // โหลดรายการสินค้าพรีออเดอร์ (ไม่บังคับ)
        try {
          const preorderProductList = await getPeamsubPreorderProducts();
          setPreorderProducts(preorderProductList);
          setPreorderApiStatus('available');
        } catch (error) {
          // Set empty array for graceful degradation
          setPreorderProducts([]);
          setPreorderApiStatus('unavailable');
          
          // Only log and show warning for non-418 errors
          if (error instanceof Error && !error.message.includes('418')) {
            console.error("Error loading preorder products:", error);
            toast.warning("ไม่สามารถโหลดสินค้าพรีออเดอร์ได้");
          }
        }

        // เพิ่ม delay เพื่อป้องกัน rate limiting
        await delay(500);

        // โหลดรายการสินค้าเติมเกม
        try {
          const gameProductList = await getPeamsubGameProducts();
          setGameProducts(gameProductList);
        } catch (error) {
          console.error("Error loading game products:", error);
          // Set empty array for graceful degradation
          setGameProducts([]);
          
          // Show warning toast only for non-418 errors
          if (error instanceof Error && !error.message.includes('418')) {
            toast.warning("ไม่สามารถโหลดสินค้าเติมเกมได้");
          }
        }

        // เพิ่ม delay เพื่อป้องกัน rate limiting
        await delay(500);

        // โหลดประวัติการซื้อ
        try {
          const history = await getPeamsubPurchaseHistory();
          setPurchaseHistory(history);
        } catch (error) {
          // Set empty array for graceful degradation
          setPurchaseHistory([]);
          
          // Only log and show warning for non-418 errors
          if (error instanceof Error && !error.message.includes('418')) {
            console.error("Error loading purchase history:", error);
            toast.warning("ไม่สามารถโหลดประวัติการซื้อได้");
          }
        }

        // เพิ่ม delay เพื่อป้องกัน rate limiting
        await delay(500);

        // โหลดประวัติการซื้อพรีออเดอร์ (ไม่บังคับ)
        try {
          const preorderHistoryData = await getPeamsubPreorderHistory();
          setPreorderHistory(preorderHistoryData);
        } catch (error) {
          // Set empty array for graceful degradation
          setPreorderHistory([]);
          
          // Only log and show warning for non-418 errors
          if (error instanceof Error && !error.message.includes('418')) {
            console.error("Error loading preorder history:", error);
            toast.warning("ไม่สามารถโหลดประวัติพรีออเดอร์ได้");
          }
        }
      }
    } catch (error) {
      console.error("Error initializing data:", error);
      setConnectionStatus('disconnected');
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    } finally {
      setLoading(false);
    }
  };

  // รีเฟรชข้อมูล
  const handleRefresh = async () => {
    await initializeData();
    toast.success("รีเฟรชข้อมูลสำเร็จ");
  };

  // เปิด dialog ซื้อสินค้า
  const openPurchaseDialog = (product: PeamsubProduct) => {
    setSelectedProduct(product);
    setCustomReference(generateReferenceId('PURCHASE'));
    setPurchaseDialogOpen(true);
  };

  // เปิด dialog ซื้อพรีออเดอร์
  const openPreorderDialog = (product: PeamsubPreorderProduct) => {
    setSelectedPreorderProduct(product);
    setPreorderReference(generateReferenceId('PREORDER'));
    setPreorderCallbackUrl('');
    setPreorderDialogOpen(true);
  };

  // ซื้อสินค้า
  const handlePurchase = async () => {
    if (!selectedProduct || !customReference || !user) return;

    // ตรวจสอบยอดเงิน
    if (!userInfo) {
      toast.error("ไม่สามารถตรวจสอบยอดเงินได้");
      return;
    }
    const userBalance = parseFloat(userInfo.balance) || 0;
    const userRank = userInfo.rank || 0;
    
    // ดึงราคาขาย (จาก admin price หรือ recommended price หรือ API price)
    // Premium App ไม่มี recommendedPrice ใช้ราคาตาม rank
    const apiPrice = getProductPriceByRank(selectedProduct, userRank);
    const sellPrice = await getProductSellPrice(selectedProduct.id, 'premium', apiPrice);
    
    if (userBalance < sellPrice) {
      toast.error("ไม่สามารถซื้อสินค้าได้ กรุณาเติมเงินเข้าสู่ระบบ");
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchasePeamsubProduct(selectedProduct.id, customReference);
      
      // หักเงินจาก balance ในฐานข้อมูล
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          balance: increment(-sellPrice) // หักเงิน
        });
        console.log(`✅ หักเงิน ${sellPrice} บาทจาก balance สำเร็จ`);
        
        // รีเฟรชข้อมูลผู้ใช้เพื่ออัปเดต balance
        await initializeData();
      } catch (balanceError) {
        console.error('❌ ไม่สามารถหักเงินได้:', balanceError);
        toast.error("เงินหักจาก API แล้วแต่ไม่สามารถหักเงินจากระบบได้ กรุณาติดต่อผู้ดูแล");
      }
      
      // บันทึกการซื้อพร้อมราคาขายที่จ่ายจริง
      try {
        await recordPurchaseWithSellPrice(
          user.uid,
          'premium',
          customReference,
          selectedProduct.id,
          sellPrice, // ราคาที่จ่ายให้เว็บไซต์
          apiPrice, // ราคาจาก API
          selectedProduct.name,
          selectedProduct.id.toString()
        );
      } catch (recordError) {
        console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
        // Fallback: บันทึก reference ธรรมดา
        await addUserPurchaseReference(user.uid, 'premium', customReference, sellPrice);
      }
      
      toast.success(`ซื้อสินค้า "${result}" สำเร็จ!`);
      
      // รีเซ็ต form
      setPurchaseDialogOpen(false);
      setSelectedProduct(null);
      setCustomReference("");
      
      // โหลดข้อมูลใหม่
      await initializeData();
      
      // นำทางไปหน้าประวัติการซื้อ
      navigate('/purchase-history');
    } catch (error) {
      console.error("Error purchasing product:", error);
      toast.error("เกิดข้อผิดพลาดในการซื้อสินค้า");
    } finally {
      setPurchasing(false);
    }
  };

  // ซื้อพรีออเดอร์
  const handlePreorder = async () => {
    if (!selectedPreorderProduct || !preorderReference) return;

    // ตรวจสอบยอดเงิน
    if (!userInfo) {
      toast.error("ไม่สามารถตรวจสอบยอดเงินได้");
      return;
    }
    const userBalance = parseFloat(userInfo.balance) || 0;
    const userRank = userInfo.rank || 0;
    const productPrice = getPreorderProductPriceByRank(selectedPreorderProduct, userRank);
    if (userBalance < productPrice) {
      toast.error("ไม่สามารถซื้อสินค้าได้ กรุณาเติมเงินเข้าสู่ระบบ");
      return;
    }

    setPreordering(true);
    try {
      await purchasePeamsubPreorder(
        selectedPreorderProduct.id, 
        preorderReference,
        preorderCallbackUrl || undefined
      );
      
      toast.success(`ซื้อพรีออเดอร์ "${selectedPreorderProduct.name}" สำเร็จ!`);
      
      // รีเซ็ต form
      setPreorderDialogOpen(false);
      setSelectedPreorderProduct(null);
      setPreorderReference("");
      setPreorderCallbackUrl("");
      
      // โหลดข้อมูลใหม่
      await initializeData();
    } catch (error) {
      console.error("Error purchasing preorder:", error);
      toast.error("เกิดข้อผิดพลาดในการซื้อพรีออเดอร์");
    } finally {
      setPreordering(false);
    }
  };

  // เปิด dialog เคลม
  const openClaimDialog = (history: PeamsubPurchaseHistory) => {
    setSelectedHistory(history);
    setClaimStatus('others');
    setClaimDescription("");
    setClaimDialogOpen(true);
  };

  // เปิดเคลม
  const handleClaim = async () => {
    if (!selectedHistory) return;

    setClaiming(true);
    try {
      const result = await claimPeamsubProduct(
        selectedHistory.refId,
        claimStatus,
        claimDescription
      );
      
      toast.success(`เปิดเคลมสำเร็จ! Ticket ID: ${result.ticketId}`);
      
      // รีเซ็ต form
      setClaimDialogOpen(false);
      setSelectedHistory(null);
      setClaimStatus('others');
      setClaimDescription("");
      
      // โหลดข้อมูลใหม่
      await initializeData();
    } catch (error) {
      console.error("Error claiming product:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดเคลม");
    } finally {
      setClaiming(false);
    }
  };

  // รีเซ็ตตัวกรองสินค้า
  const handleResetFilters = () => {
    setSearchQuery("");
    setMaxPrice(null);
    setMinStock(1);
    setSortBy('name');
    setSortOrder('asc');
  };

  // รีเซ็ตตัวกรองประวัติ
  const handleResetHistoryFilters = () => {
    setHistoryStatusFilter("all");
    setHistorySearchQuery("");
  };

  // รีเซ็ตตัวกรองประวัติพรีออเดอร์
  const handleResetPreorderFilters = () => {
    setPreorderStatusFilter("all");
    setPreorderSearchQuery("");
  };

  // เปิด dialog รายละเอียดสินค้า
  const setShowProductDetails = (product: any) => {
    setSelectedProductDetails(product);
    setProductDetailsDialogOpen(true);
  };

  // สถานะการเชื่อมต่อ
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'กำลังตรวจสอบ...';
      case 'connected':
        return 'เชื่อมต่อสำเร็จ';
      case 'disconnected':
        return 'เชื่อมต่อล้มเหลว';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  // คำนวณยอดเงินรวม
  const totalPurchaseAmount = calculateTotalPurchaseAmount(purchaseHistory);
  const totalPreorderAmount = calculateTotalPreorderAmount(preorderHistory);
  
  // สรุปข้อมูลสินค้า
  const preorderProductSummary = getPreorderProductSummary(preorderProducts);
  const gameProductSummary = getGameProductSummary(gameProducts || []);

  return (
    <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">แอปพรีเมียม</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                จัดการสินค้าแอปพรีเมียมและประวัติการซื้อ
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              รีเฟรช
            </Button>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <Alert className={getConnectionStatusColor()}>
              <div className="flex items-center gap-2">
                {getConnectionStatusIcon()}
                <AlertDescription>
                  <strong>สถานะการเชื่อมต่อ:</strong> {getConnectionStatusText()}
                </AlertDescription>
              </div>
            </Alert>
            
            {/* Preorder API Status */}
            {preorderApiStatus === 'unavailable' && (
              <Alert className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <AlertDescription>
                    <strong>หมายเหตุ:</strong> ระบบพรีออเดอร์ไม่พร้อมใช้งานในขณะนี้ (API ส่งคืนสถานะ 418)
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* User Info - Admin Only */}
          {isAdmin && userInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  ข้อมูลผู้ใช้
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ชื่อผู้ใช้</p>
                    <p className="font-semibold">{userInfo.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ยอดเงินคงเหลือ</p>
                    <p className="font-semibold text-green-600">
                      {parseFloat(userInfo.balance).toLocaleString()} บาท
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ยศ</p>
                    <Badge variant={userInfo.rank === 3 ? "default" : "secondary"}>
                      {userInfo.rank === 1 ? 'ตัวแทนจำหน่าย' : 
                       userInfo.rank === 3 ? 'ตัวแทน VIP' : 
                       'ไม่ทราบยศ'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Summary - Admin Only */}
          {isAdmin && purchaseHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  สรุปการซื้อ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{purchaseHistory.length}</p>
                    <p className="text-sm text-muted-foreground">จำนวนการซื้อ</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{totalPurchaseAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">ยอดเงินรวม (บาท)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {purchaseHistory.filter(item => item.status === 'success').length}
                    </p>
                    <p className="text-sm text-muted-foreground">การซื้อสำเร็จ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preorder Summary - Admin Only */}
          {isAdmin && preorderHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  สรุปพรีออเดอร์
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{preorderHistory.length}</p>
                    <p className="text-sm text-muted-foreground">จำนวนพรีออเดอร์</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{totalPreorderAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">ยอดเงินรวม (บาท)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      {preorderHistory.filter(item => item.status === 'success').length}
                    </p>
                    <p className="text-sm text-muted-foreground">พรีออเดอร์สำเร็จ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preorder Products Summary - Admin Only */}
          {isAdmin && preorderProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  สรุปสินค้าพรีออเดอร์
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{preorderProductSummary.totalProducts}</p>
                    <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{preorderProductSummary.totalStock}</p>
                    <p className="text-sm text-muted-foreground">สต็อกทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">{preorderProductSummary.averagePrice}</p>
                    <p className="text-sm text-muted-foreground">ราคาเฉลี่ย (บาท)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-600">{preorderProductSummary.categories.length}</p>
                    <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Products Summary - Admin Only */}
          {isAdmin && gameProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  สรุปสินค้าเติมเกม
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{gameProductSummary.totalProducts}</p>
                    <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{gameProductSummary.averagePrice}</p>
                    <p className="text-sm text-muted-foreground">ราคาเฉลี่ย (บาท)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-600">{gameProductSummary.categories.length}</p>
                    <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">
                      {gameProductSummary.cheapestProduct ? 
                        (() => {
                          const price = parseFloat(gameProductSummary.cheapestProduct.price);
                          return isNaN(price) ? 0 : price;
                        })() : 0
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">ราคาต่ำสุด (บาท)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs defaultValue="products" className="space-y-4">
            <TabsList>
              <TabsTrigger value="products">สินค้าแอพ</TabsTrigger>
              <TabsTrigger value="preorder-products">สินค้าพรีออเดอร์</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    รายการสินค้า ({filteredProducts.length} รายการ)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium">ค้นหาสินค้า</label>
                        <Input
                          placeholder="ค้นหาตามชื่อหรือคำอธิบาย"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">ราคาสูงสุด (บาท)</label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={maxPrice || ""}
                          onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">สต็อกขั้นต่ำ</label>
                        <Input
                          type="number"
                          value={minStock}
                          onChange={(e) => setMinStock(Number(e.target.value))}
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleResetFilters}
                          variant="outline"
                          className="w-full"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          รีเซ็ตตัวกรอง
                        </Button>
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">เรียงตาม:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'price' | 'stock' | 'name')}
                          className="px-3 py-1 border rounded-md"
                        >
                          <option value="name">ชื่อสินค้า</option>
                          <option value="price">ราคา</option>
                          <option value="stock">สต็อก</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">ลำดับ:</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-3 py-1 border rounded-md"
                        >
                          <option value="asc">น้อยไปมาก</option>
                          <option value="desc">มากไปน้อย</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery || maxPrice || minStock > 1 ? 
                        "ไม่พบสินค้าตามเงื่อนไขที่กำหนด" : 
                        "ยังไม่มีข้อมูลสินค้า"
                      }
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => {
                        const canPurchase = userInfo ? canPurchaseProduct(product, parseFloat(userInfo.balance), userInfo.rank) : { canPurchase: false, price: product.price };
                        
                        return (
                          <Card key={product.id} className="overflow-hidden">
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={product.img}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-2">{product.name}</h3>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">ราคา:</span>
                                  <span className="font-semibold text-lg">
                                    {canPurchase.canPurchase ? `${canPurchase.price} บาท` : 'ไม่สามารถซื้อได้'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">สต็อก:</span>
                                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                                    {product.stock} ชิ้น
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Button
                                  onClick={() => openPurchaseDialog(product)}
                                  disabled={!canPurchase.canPurchase}
                                  className="w-full"
                                >
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  ซื้อสินค้า
                                </Button>
                                <Button
                                  onClick={() => setShowProductDetails(product)}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  ดูรายละเอียด
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preorder Products Tab */}
            <TabsContent value="preorder-products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    รายการสินค้าพรีออเดอร์ ({filteredPreorderProducts.length} รายการ)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium">ค้นหาสินค้าพรีออเดอร์</label>
                        <Input
                          placeholder="ค้นหาตามชื่อหรือคำอธิบาย"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">ราคาสูงสุด (บาท)</label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={maxPrice || ""}
                          onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">สต็อกขั้นต่ำ</label>
                        <Input
                          type="number"
                          value={minStock}
                          onChange={(e) => setMinStock(Number(e.target.value))}
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleResetFilters}
                          variant="outline"
                          className="w-full"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          รีเซ็ตตัวกรอง
                        </Button>
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">เรียงตาม:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'price' | 'stock' | 'name')}
                          className="px-3 py-1 border rounded-md"
                        >
                          <option value="name">ชื่อสินค้า</option>
                          <option value="price">ราคา</option>
                          <option value="stock">สต็อก</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">ลำดับ:</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-3 py-1 border rounded-md"
                        >
                          <option value="asc">น้อยไปมาก</option>
                          <option value="desc">มากไปน้อย</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preorder Products Grid */}
                  {filteredPreorderProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {preorderApiStatus === 'unavailable' ? (
                        <div className="space-y-2">
                          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
                          <p className="font-semibold">ระบบพรีออเดอร์ไม่พร้อมใช้งาน</p>
                          <p className="text-sm">API ส่งคืนสถานะ 418 (I'm a teapot) - อาจเป็นการจำกัดการเข้าถึงหรือการบำรุงรักษา</p>
                        </div>
                      ) : searchQuery || maxPrice || minStock > 1 ? (
                        "ไม่พบสินค้าพรีออเดอร์ตามเงื่อนไขที่กำหนด"
                      ) : (
                        "ยังไม่มีข้อมูลสินค้าพรีออเดอร์"
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPreorderProducts.map((product) => {
                        const canPurchase = userInfo ? canPurchasePreorderProduct(product, parseFloat(userInfo.balance), userInfo.rank) : { canPurchase: false, price: product.price };
                        
                        return (
                          <Card key={product.id} className="overflow-hidden">
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={product.img}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-2">{product.name}</h3>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">ราคา:</span>
                                  <span className="font-semibold text-lg">
                                    {canPurchase.canPurchase ? `${canPurchase.price} บาท` : 'ไม่สามารถซื้อได้'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">สต็อก:</span>
                                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                                    {product.stock} ชิ้น
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Button
                                  onClick={() => openPreorderDialog(product)}
                                  disabled={!canPurchase.canPurchase}
                                  className="w-full"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  พรีออเดอร์
                                </Button>
                                <Button
                                  onClick={() => setShowProductDetails(product)}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  ดูรายละเอียด
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* Purchase Dialog */}
          <AlertDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ซื้อสินค้า</AlertDialogTitle>
                <AlertDialogDescription>
                  ยืนยันการซื้อสินค้า "{selectedProduct?.name}"
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedProduct && userInfo && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedProduct.img}
                      alt={selectedProduct.name}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{selectedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{selectedProduct.des}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">ราคา:</span> 
                          <span className="font-semibold ml-2">
                            {getProductPriceByRank(selectedProduct, userInfo.rank)} บาท
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">ยอดเงินคงเหลือ:</span> 
                          <span className="font-semibold ml-2 text-green-600">
                            {parseFloat(userInfo.balance).toLocaleString()} บาท
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reference">รหัสอ้างอิง</Label>
                    <Input
                      id="reference"
                      value={customReference}
                      onChange={(e) => setCustomReference(e.target.value)}
                      placeholder="กรอกรหัสอ้างอิง"
                    />
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={purchasing}>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePurchase}
                  disabled={purchasing || !customReference}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังซื้อ...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      ซื้อสินค้า
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Claim Dialog */}
          <AlertDialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>เปิดเคลมสินค้า</AlertDialogTitle>
                <AlertDialogDescription>
                  แจ้งปัญหาสินค้า "{selectedHistory?.productName}"
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedHistory && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedHistory.img}
                      alt={selectedHistory.productName}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{selectedHistory.productName}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{selectedHistory.prize}</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">รหัสอ้างอิง:</span> 
                        <span className="font-semibold ml-2">{selectedHistory.refId}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="claim-status">สถานะปัญหา</Label>
                    <Select value={claimStatus} onValueChange={(value: any) => setClaimStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะปัญหา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wrong_password">รหัสผ่านผิด</SelectItem>
                        <SelectItem value="incorrect_pin">PIN ไม่ถูกต้อง</SelectItem>
                        <SelectItem value="youtube_premium_disconnect">Youtube Premium หลุด</SelectItem>
                        <SelectItem value="netflix_screen_disconnect">โดนมั่วจอ Netflix</SelectItem>
                        <SelectItem value="others">ปัญหาอื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="claim-description">คำอธิบายปัญหา</Label>
                    <Textarea
                      id="claim-description"
                      value={claimDescription}
                      onChange={(e) => setClaimDescription(e.target.value)}
                      placeholder="อธิบายปัญหาที่พบ (ไม่บังคับ)"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={claiming}>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClaim}
                  disabled={claiming}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังเปิดเคลม...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      เปิดเคลม
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Preorder Dialog */}
          <AlertDialog open={preorderDialogOpen} onOpenChange={setPreorderDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ซื้อพรีออเดอร์</AlertDialogTitle>
                <AlertDialogDescription>
                  ยืนยันการซื้อพรีออเดอร์ "{selectedPreorderProduct?.name}"
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedPreorderProduct && userInfo && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedPreorderProduct.img}
                      alt={selectedPreorderProduct.name}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{selectedPreorderProduct.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{selectedPreorderProduct.des}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">ราคา:</span> 
                          <span className="font-semibold ml-2">
                            {getPreorderProductPriceByRank(selectedPreorderProduct, userInfo.rank)} บาท
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">ยอดเงินคงเหลือ:</span> 
                          <span className="font-semibold ml-2 text-green-600">
                            {parseFloat(userInfo.balance).toLocaleString()} บาท
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="preorder-reference">รหัสอ้างอิง</Label>
                    <Input
                      id="preorder-reference"
                      value={preorderReference}
                      onChange={(e) => setPreorderReference(e.target.value)}
                      placeholder="กรอกรหัสอ้างอิง"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preorder-callback">Callback URL (ไม่บังคับ)</Label>
                    <Input
                      id="preorder-callback"
                      value={preorderCallbackUrl}
                      onChange={(e) => setPreorderCallbackUrl(e.target.value)}
                      placeholder="https://your-website.com/callback"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL สำหรับรับการอัปเดตสถานะสินค้า
                    </p>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={preordering}>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePreorder}
                  disabled={preordering || !preorderReference}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {preordering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังซื้อพรีออเดอร์...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      ซื้อพรีออเดอร์
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Product Details Dialog */}
          <AlertDialog open={productDetailsDialogOpen} onOpenChange={setProductDetailsDialogOpen}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>รายละเอียดสินค้า</AlertDialogTitle>
                <AlertDialogDescription>
                  ข้อมูลครบถ้วนของสินค้า
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedProductDetails && (
                <div className="space-y-6">
                  <div className="flex gap-6">
                    <img
                      src={selectedProductDetails.img}
                      alt={selectedProductDetails.name || selectedProductDetails.category}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {selectedProductDetails.name || selectedProductDetails.category}
                      </h3>
                      {selectedProductDetails.des && (
                        <p className="text-muted-foreground mb-4">{selectedProductDetails.des}</p>
                      )}
                      {selectedProductDetails.info && (
                        <p className="text-muted-foreground mb-4">{selectedProductDetails.info}</p>
                      )}
                    </div>
                  </div>

                  {/* รายละเอียดราคา */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProductDetails.price && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">ราคา</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>ราคาปกติ:</span>
                            <span className="font-semibold">{selectedProductDetails.price} บาท</span>
                          </div>
                          {selectedProductDetails.pricevip && (
                            <div className="flex justify-between">
                              <span>ราคา VIP:</span>
                              <span className="font-semibold text-green-600">{selectedProductDetails.pricevip} บาท</span>
                            </div>
                          )}
                          {selectedProductDetails.agent_price && (
                            <div className="flex justify-between">
                              <span>ราคา Agent:</span>
                              <span className="font-semibold text-blue-600">{selectedProductDetails.agent_price} บาท</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedProductDetails.recommendedPrice && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">ราคาแนะนำ</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>ราคาแนะนำ:</span>
                            <span className="font-semibold text-green-600">{selectedProductDetails.recommendedPrice} บาท</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ราคาสินค้า:</span>
                            <span className="font-semibold">{selectedProductDetails.price} บาท</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ส่วนลด:</span>
                            <span className="font-semibold text-red-600">{selectedProductDetails.discount} บาท</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ข้อมูลเพิ่มเติม */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProductDetails.stock !== undefined && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">สต็อก</h4>
                        <Badge variant={selectedProductDetails.stock > 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
                          {selectedProductDetails.stock} ชิ้น
                        </Badge>
                      </div>
                    )}

                    {selectedProductDetails.type_app && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">หมวดหมู่</h4>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {selectedProductDetails.type_app}
                        </Badge>
                      </div>
                    )}

                    {selectedProductDetails.format_id && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">Format ID</h4>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {selectedProductDetails.format_id}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* ปุ่มดำเนินการ */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedProductDetails.price && userInfo && (
                      <>
                        <Button
                          onClick={() => {
                            setProductDetailsDialogOpen(false);
                            openPurchaseDialog(selectedProductDetails);
                          }}
                          className="flex-1"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          ซื้อสินค้า
                        </Button>
                        <Button
                          onClick={() => {
                            setProductDetailsDialogOpen(false);
                            openPreorderDialog(selectedProductDetails);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          พรีออเดอร์
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>ปิด</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Layout>
  );
};

export default PremiumApp;
