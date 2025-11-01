import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShoppingCart, 
  RefreshCw,
  Search,
  Filter,
  Info,
  AlertTriangle,
  Calendar,
  CreditCard,
  Package
} from "lucide-react";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getPeamsubPurchaseHistory, getPeamsubGameHistory, getPeamsubCashCardHistory, getPeamsubMobileHistory, PeamsubPurchaseHistory, PeamsubGameHistory, PeamsubCashCardHistory, PeamsubMobileHistory, ClaimRequest, ClaimStatus } from "@/lib/peamsubUtils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { syncPurchaseHistoryFromAPI, getUserPurchaseHistory, convertFirestoreToAPI, addUserPurchaseReference, getUserPurchaseReferences, FirestorePurchaseHistory } from "@/lib/purchaseHistoryUtils";

const PurchaseHistory = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [purchaseHistory, setPurchaseHistory] = useState<PeamsubPurchaseHistory[]>([]);
  const [gameHistory, setGameHistory] = useState<PeamsubGameHistory[]>([]);
  const [cardHistory, setCardHistory] = useState<PeamsubCashCardHistory[]>([]);
  const [mobileHistory, setMobileHistory] = useState<PeamsubMobileHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<(PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubCashCardHistory | PeamsubMobileHistory)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // เพิ่ม filter สำหรับประเภท
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState<PeamsubPurchaseHistory | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // ตรวจสอบว่าเป็นแอดมินหรือไม่
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    loadPurchaseHistory();
  }, [user]);

  useEffect(() => {
    filterHistory();
  }, [purchaseHistory, gameHistory, cardHistory, mobileHistory, searchTerm, statusFilter, typeFilter]);

  const loadPurchaseHistory = async () => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const userId = user.uid;
      
      // ดึงประวัติจาก Firestore ก่อน (เพราะมีราคาขายที่ถูกต้อง)
      const firestoreHistory = await getUserPurchaseHistory(userId);
      
      console.log('📊 ประวัติจาก Firestore:', firestoreHistory.length, 'รายการ');
      
      // แยกตาม type และแปลงเป็น API format เพื่อใช้ร่วมกับ state เดิม
      const premiumHistory: PeamsubPurchaseHistory[] = [];
      const gameHistoryData: PeamsubGameHistory[] = [];
      const mobileHistoryData: PeamsubMobileHistory[] = [];
      const cardHistoryData: PeamsubCashCardHistory[] = [];
      
      firestoreHistory.forEach(history => {
        const converted = convertFirestoreToAPI(history);
        
        // เพิ่ม sellPrice ลงใน converted object
        if (history.type === 'premium') {
          (converted as any).sellPrice = history.sellPrice;
          premiumHistory.push(converted as PeamsubPurchaseHistory);
        } else if (history.type === 'game') {
          (converted as any).sellPrice = history.sellPrice;
          gameHistoryData.push(converted as PeamsubGameHistory);
        } else if (history.type === 'mobile') {
          (converted as any).sellPrice = history.sellPrice;
          mobileHistoryData.push(converted as PeamsubMobileHistory);
        } else if (history.type === 'cashcard') {
          (converted as any).sellPrice = history.sellPrice;
          cardHistoryData.push(converted as PeamsubCashCardHistory);
        }
      });
      
      // ดึง references เพื่อ sync ข้อมูลใหม่จาก API (ถ้ามี)
      const [premiumRefs, gameRefs, mobileRefs, cashCardRefs] = await Promise.all([
        getUserPurchaseReferences(userId, 'premium'),
        getUserPurchaseReferences(userId, 'game'),
        getUserPurchaseReferences(userId, 'mobile'),
        getUserPurchaseReferences(userId, 'cashcard')
      ]);
      
      // Sync ประวัติใหม่จาก API (เพื่ออัปเดตข้อมูลล่าสุด)
      try {
        const [premiumHistoryAPI, gameHistoryAPI, mobileHistoryAPI, cardHistoryAPI] = await Promise.all([
          getPeamsubPurchaseHistory(premiumRefs.length > 0 ? premiumRefs : []).catch(() => []),
          getPeamsubGameHistory(gameRefs.length > 0 ? gameRefs : []).catch(() => []),
          getPeamsubMobileHistory(mobileRefs.length > 0 ? mobileRefs : []).catch(() => []),
          getPeamsubCashCardHistory(cashCardRefs.length > 0 ? cashCardRefs : []).catch(() => [])
        ]);
        
        // Sync ลง Firestore (จะรักษา sellPrice ไว้)
        await Promise.all([
          syncPurchaseHistoryFromAPI(userId, 'premium', premiumHistoryAPI),
          syncPurchaseHistoryFromAPI(userId, 'game', gameHistoryAPI),
          syncPurchaseHistoryFromAPI(userId, 'mobile', mobileHistoryAPI),
          syncPurchaseHistoryFromAPI(userId, 'cashcard', cardHistoryAPI)
        ]);
        
        // อัปเดต state ด้วยข้อมูลจาก Firestore อีกครั้ง (หลัง sync)
        const updatedHistory = await getUserPurchaseHistory(userId);
        const updatedPremium: PeamsubPurchaseHistory[] = [];
        const updatedGame: PeamsubGameHistory[] = [];
        const updatedMobile: PeamsubMobileHistory[] = [];
        const updatedCard: PeamsubCashCardHistory[] = [];
        
        updatedHistory.forEach(history => {
          const converted = convertFirestoreToAPI(history);
          if (history.type === 'premium') {
            (converted as any).sellPrice = history.sellPrice;
            updatedPremium.push(converted as PeamsubPurchaseHistory);
          } else if (history.type === 'game') {
            (converted as any).sellPrice = history.sellPrice;
            updatedGame.push(converted as PeamsubGameHistory);
          } else if (history.type === 'mobile') {
            (converted as any).sellPrice = history.sellPrice;
            updatedMobile.push(converted as PeamsubMobileHistory);
          } else if (history.type === 'cashcard') {
            (converted as any).sellPrice = history.sellPrice;
            updatedCard.push(converted as PeamsubCashCardHistory);
          }
        });
        
        setPurchaseHistory(updatedPremium);
        setGameHistory(updatedGame);
        setMobileHistory(updatedMobile);
        setCardHistory(updatedCard);
      } catch (error) {
        console.warn('⚠️ บางส่วนของ sync ล้มเหลว:', error);
        // แสดงข้อมูลจาก Firestore ที่มีอยู่แล้ว
        setPurchaseHistory(premiumHistory);
        setGameHistory(gameHistoryData);
        setMobileHistory(mobileHistoryData);
        setCardHistory(cardHistoryData);
      }
    } catch (error) {
      console.error("Error loading purchase history:", error);
      toast.error("ไม่สามารถโหลดประวัติการซื้อได้");
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    // รวมข้อมูลทั้งสี่ประเภท (แอพพรีเมียม, เติมเกม, เติมเน็ต-เงินมือถือ, บัตรเงินสด)
    const allHistory = [
      ...purchaseHistory.map(item => ({ ...item, type: 'premium' as const })),
      ...gameHistory.map(item => ({ ...item, type: 'game' as const })),
      ...mobileHistory.map(item => ({ ...item, type: 'mobile' as const })),
      ...cardHistory.map(item => ({ ...item, type: 'cashcard' as const }))
    ];
    
    let filtered = [...allHistory];

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const productName = 'productName' in item ? item.productName : item.info;
        const reference = 'refId' in item ? item.refId : item.reference;
        
        return productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               reference?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        switch (statusFilter) {
          case "success":
            return item.status === "success" || item.status === "completed";
          case "pending":
            return item.status === "pending" || item.status === "processing";
          case "failed":
            return item.status === "failed" || item.status === "error";
          default:
            return true;
        }
      });
    }

    // เรียงตามวันที่ใหม่สุดไปเก่าสุด
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA; // ใหม่สุดก่อน
    });

    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">สำเร็จ</Badge>;
      case "pending":
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">รอดำเนินการ</Badge>;
      case "failed":
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">ล้มเหลว</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status || "ไม่ทราบ"}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  // ฟังก์ชันสำหรับแสดงราคา - แสดงราคาที่จ่ายให้เว็บไซต์
  const getDisplayPrice = (item: PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubCashCardHistory | PeamsubMobileHistory) => {
    // ใช้ราคาขายที่จ่ายให้เว็บไซต์ (sellPrice) ถ้ามี, ถ้าไม่มีให้ใช้ราคาจาก API
    const sellPrice = (item as any).sellPrice;
    const apiPrice = getItemPrice(item);
    
    const finalPrice = sellPrice && sellPrice > 0 ? sellPrice : apiPrice;
    
    return {
      price: formatAmount(finalPrice),
      label: "ราคาที่จ่ายให้เว็บไซต์",
      color: "text-green-600"
    };
  };

  const getItemPrice = (item: PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubCashCardHistory | PeamsubMobileHistory) => {
    return 'price' in item ? item.price : item.price;
  };

  const getItemName = (item: PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubCashCardHistory | PeamsubMobileHistory) => {
    return 'productName' in item ? item.productName : item.info;
  };

  const getItemReference = (item: PeamsubPurchaseHistory | PeamsubGameHistory | PeamsubCashCardHistory | PeamsubMobileHistory) => {
    return 'refId' in item ? item.refId : item.reference;
  };

  const handleClaimProduct = async (item: PeamsubPurchaseHistory) => {
    try {
      // TODO: Implement claim product functionality with proper UI
      // For now, show a placeholder message
      toast.info("ฟีเจอร์เคลมสินค้าจะเปิดใช้งานเร็วๆ นี้");
      
      // Example of how to use the new claim API:
      // const claimRequest: ClaimRequest = {
      //   reference: item.refId,
      //   status: 'wrong_password' as ClaimStatus,
      //   description: 'รหัสผ่านไม่ถูกต้อง',
      //   callbackUrl: 'https://your-domain.com/api/claim-callback'
      // };
      // const result = await claimPeamsubProduct(claimRequest);
      // toast.success(`เคลมสินค้าสำเร็จ Ticket ID: ${result.ticketId}`);
    } catch (error) {
      console.error("Error claiming product:", error);
      toast.error("ไม่สามารถเคลมสินค้าได้");
    }
  };

  const handleViewDetails = (item: PeamsubPurchaseHistory) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const stats = {
    totalPurchases: purchaseHistory.length + gameHistory.length + mobileHistory.length + cardHistory.length,
    successfulPurchases: [...purchaseHistory, ...gameHistory, ...mobileHistory, ...cardHistory].filter(item => 
      item.status === "success" || item.status === "completed"
    ).length,
    pendingPurchases: [...purchaseHistory, ...gameHistory, ...mobileHistory, ...cardHistory].filter(item => 
      item.status === "pending" || item.status === "processing"
    ).length,
    failedPurchases: [...purchaseHistory, ...gameHistory, ...mobileHistory, ...cardHistory].filter(item => 
      item.status === "failed" || item.status === "error"
    ).length,
    totalAmount: [...purchaseHistory, ...gameHistory, ...mobileHistory, ...cardHistory].reduce((sum, item) => {
      // ใช้ราคาที่จ่ายให้เว็บไซต์ (sellPrice) ถ้ามี
      const sellPrice = (item as any).sellPrice;
      const apiPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const amount = sellPrice && sellPrice > 0 ? sellPrice : apiPrice;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0)
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">กำลังโหลดประวัติการซื้อ...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">ประวัติการซื้อสินค้า</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              ดูประวัติการซื้อสินค้าทั้งหมดของคุณ
            </p>
          </div>
          <Button onClick={loadPurchaseHistory} disabled={loading} size="sm" className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">การซื้อทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.totalPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">สำเร็จ</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successfulPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">ยอดรวม</p>
                  <p className="text-2xl font-bold text-purple-600">{formatAmount(stats.totalAmount)} บาท</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาสินค้าหรือรหัสอ้างอิง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="สถานะทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                    <SelectItem value="success">สำเร็จ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="failed">ล้มเหลว</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ประเภททั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ประเภททั้งหมด</SelectItem>
                    <SelectItem value="premium">แอพพรีเมียม</SelectItem>
                    <SelectItem value="game">เติมเกม</SelectItem>
                    <SelectItem value="mobile">เติมเน็ต-เติมเงินมือถือ</SelectItem>
                    <SelectItem value="cashcard">บัตรเงินสด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase History - Mobile Card View / Desktop Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
              รายการซื้อสินค้า
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              แสดงผลรายการที่ {startIndex + 1} ถึง {Math.min(endIndex, filteredHistory.length)} จาก {filteredHistory.length} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">ไม่พบประวัติการซื้อสินค้า</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {currentItems.map((item, index) => (
                    <Card key={item.id || index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{getItemName(item)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.createdAt || item.date || new Date().toISOString())}
                            </div>
                          </div>
                          <Badge variant={
                            item.type === 'premium' ? 'default' : 
                            item.type === 'game' ? 'secondary' : 
                            item.type === 'mobile' ? 'destructive' :
                            'outline'
                          } className="text-xs">
                            {item.type === 'premium' ? 'แอพพรีเมียม' : 
                             item.type === 'game' ? 'เติมเกม' : 
                             item.type === 'mobile' ? 'เติมเน็ต' :
                             'บัตรเงินสด'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">ราคา</p>
                            <p className={`font-semibold ${getDisplayPrice(item).color}`}>
                              {getDisplayPrice(item).price} บาท
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">สถานะ</p>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            รายละเอียด
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleClaimProduct(item)}
                            disabled={item.status !== "success" && item.status !== "completed"}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            เคลม
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">#</th>
                        <th className="text-left p-3 font-medium text-sm">วันที่</th>
                        <th className="text-left p-3 font-medium text-sm">ประเภท</th>
                        <th className="text-left p-3 font-medium text-sm">สินค้า</th>
                        <th className="text-left p-3 font-medium text-sm">จำนวน</th>
                        <th className="text-left p-3 font-medium text-sm">สถานะ</th>
                        <th className="text-left p-3 font-medium text-sm">รายละเอียด</th>
                        <th className="text-left p-3 font-medium text-sm">เคลมสินค้า</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item, index) => (
                        <tr key={item.id || index} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{startIndex + index + 1}</td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(item.createdAt || item.date || new Date().toISOString())}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={
                              item.type === 'premium' ? 'default' : 
                              item.type === 'game' ? 'secondary' : 
                              item.type === 'mobile' ? 'destructive' :
                              'outline'
                            } className="text-xs">
                              {item.type === 'premium' ? 'แอพพรีเมียม' : 
                               item.type === 'game' ? 'เติมเกม' : 
                               item.type === 'mobile' ? 'เติมเน็ต-เติมเงินมือถือ' :
                               'บัตรเงินสด'}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-sm">{getItemName(item)}</td>
                          <td className="p-3 text-sm">
                            <div className="flex flex-col">
                              <span className={`font-semibold ${getDisplayPrice(item).color}`}>
                                {getDisplayPrice(item).price} บาท
                              </span>
                              <span className="text-xs text-gray-500">
                                {getDisplayPrice(item).label}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">{getStatusBadge(item.status)}</td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClaimProduct(item)}
                              disabled={item.status !== "success" && item.status !== "completed"}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  แสดงผลรายการที่ {startIndex + 1} ถึง {Math.min(endIndex, filteredHistory.length)} จาก {filteredHistory.length} รายการ
                </div>
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-xs"
                  >
                    ←
                  </Button>
                  
                  {/* Mobile: Show less pages */}
                  <div className="hidden sm:flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Mobile: Show current page only */}
                  <div className="flex sm:hidden items-center gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs"
                      disabled
                    >
                      {currentPage} / {totalPages}
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-xs"
                  >
                    →
                  </Button>
                  
                  {/* Desktop: Page input */}
                  <div className="hidden lg:flex items-center gap-2 ml-2">
                    <span className="text-xs text-muted-foreground">ไปหน้า:</span>
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          goToPage(page);
                        }
                      }}
                      className="w-16 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedItem(null);
        }}
        purchaseItem={selectedItem}
      />
    </Layout>
  );
};

export default PurchaseHistory;
