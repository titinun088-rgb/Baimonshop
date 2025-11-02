import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  CreditCard, 
  Search, 
  Calendar, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getPeamsubCashCardProducts, 
  getPeamsubCashCardHistory, 
  purchasePeamsubCashCard,
  getPeamsubUserInfo,
  PeamsubCashCardProduct, 
  PeamsubCashCardHistory,
  PeamsubUserData
} from "@/lib/peamsubUtils";
import { addUserPurchaseReference } from "@/lib/purchaseHistoryUtils";

const CashCard = () => {
  const { user, userData } = useAuth();
  const [products, setProducts] = useState<PeamsubCashCardProduct[]>([]);
  const [history, setHistory] = useState<PeamsubCashCardHistory[]>([]);
  const [userInfo, setUserInfo] = useState<PeamsubUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ตรวจสอบว่าเป็นแอดมินหรือไม่
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [productsData, historyData, userInfoData] = await Promise.all([
        getPeamsubCashCardProducts(),
        getPeamsubCashCardHistory(),
        getPeamsubUserInfo()
      ]);
      
      setProducts(productsData);
      setHistory(historyData);
      setUserInfo(userInfoData);
    } catch (error) {
      console.error("Error loading cash card data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลบัตรเงินสดได้");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: PeamsubCashCardProduct) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    // ตรวจสอบยอดเงิน
    if (!userInfo) {
      toast.error("ไม่สามารถตรวจสอบยอดเงินได้");
      return;
    }
    
    // ตรวจสอบ balance จากฐานข้อมูลเว็บ (Firebase)
    const webBalance = userData?.balance || 0;
    const userBalance = parseFloat(userInfo.balance) || 0;
    
    // ดึงราคาขายจากราคาแนะนำหรือราคาปกติ
    const apiPrice = parseFloat(product.price) || 0;
    const sellPrice = parseFloat(product.recommendedPrice) || apiPrice;
    
    // ตรวจสอบ balance จากฐานข้อมูลเว็บก่อน
    if (webBalance < sellPrice) {
      toast.error(`ยอดเงินในระบบไม่พอ (ยอดเงิน: ${webBalance.toLocaleString()} บาท, ราคา: ${sellPrice.toLocaleString()} บาท) กรุณาเติมเงินก่อน`);
      return;
    }
    
    // ตรวจสอบ balance จาก Peamsub API
    if (userBalance < apiPrice) {
      toast.error(`ยอดเงินใน Peamsub ไม่พอ (ยอดเงิน: ${userBalance.toLocaleString()} บาท, ราคา: ${apiPrice.toLocaleString()} บาท) กรุณาเติมเงินก่อน`);
      return;
    }

    setPurchasing(true);
    try {
      const reference = `CASH_CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // เรียก API ซื้อบัตรเงินสด
      const result = await purchasePeamsubCashCard(product.id, reference);
      
      // หักเงินจาก balance ในฐานข้อมูล
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          balance: increment(-sellPrice) // หักเงิน
        });
        console.log(`✅ หักเงิน ${sellPrice} บาทจาก balance สำเร็จ`);
        
        // รีเฟรชข้อมูลผู้ใช้เพื่ออัปเดต balance
        await loadData();
      } catch (balanceError) {
        console.error('❌ ไม่สามารถหักเงินได้:', balanceError);
        toast.error("เงินหักจาก API แล้วแต่ไม่สามารถหักเงินจากระบบได้ กรุณาติดต่อผู้ดูแล");
      }
      
      // บันทึกการซื้อพร้อมราคาขายที่จ่ายจริง
      try {
        await recordPurchaseWithSellPrice(
          user.uid,
          'cashcard',
          reference,
          product.id,
          sellPrice, // ราคาที่จ่ายให้เว็บไซต์
          apiPrice, // ราคาจาก API
          product.info || product.category || 'บัตรเงินสด',
          product.id.toString()
        );
      } catch (recordError) {
        console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
        // Fallback: บันทึก reference ธรรมดา
        await addUserPurchaseReference(user.uid, 'cashcard', reference);
      }
      
      toast.success(`ซื้อบัตรเงินสดสำเร็จ! ${result || ''}`);
      
    } catch (error: any) {
      console.error("Error purchasing cash card:", error);
      if (error.message === "Insufficient balance") {
        toast.error("ยอดเงินคงเหลือไม่เพียงพอ กรุณาเติมเงิน");
      } else {
        toast.error("ไม่สามารถซื้อบัตรเงินสดได้");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            สำเร็จ
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            รอดำเนินการ
          </Badge>
        );
      case "failed":
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            ล้มเหลว
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status || "ไม่ระบุ"}
          </Badge>
        );
    }
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  // ฟังก์ชันสำหรับแสดงราคา
  const getDisplayPrice = (product: PeamsubCashCardProduct) => {
    if (isAdmin) {
      // แอดมินเห็นราคาแนะนำเป็นหลัก
      return {
        price: formatAmount(product.recommendedPrice || product.price),
        label: "ราคาแนะนำ",
        color: "text-green-600"
      };
    } else {
      // ลูกค้าเห็นราคาแนะนำ
      return {
        price: formatAmount(product.recommendedPrice || product.price),
        label: "ราคาแนะนำ",
        color: "text-green-600"
      };
    }
  };

  // จัดกลุ่มสินค้าเดียวกันต่างกันที่ราคา (ใช้ key จาก category + info)
  const groupedProducts = useMemo(() => {
    const map = new Map<string, { key: string; category: string; info: string; img?: string; variants: PeamsubCashCardProduct[] }>();
    for (const p of products) {
      const key = `${(p.category || '').trim().toLowerCase()}::${(p.info || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          category: p.category,
          info: p.info,
          img: p.img,
          variants: [p]
        });
      } else {
        const group = map.get(key)!;
        group.variants.push(p);
        // เก็บรูปแรกที่เจอเป็นภาพหลัก
        if (!group.img && p.img) group.img = p.img;
      }
    }
    // เรียงราคาในแต่ละกลุ่มจากถูกไปแพง (ตามราคาขาย/แนะนำ)
    const groups = Array.from(map.values());
    groups.forEach(g => {
      g.variants.sort((a, b) => {
        const pa = parseFloat(a.recommendedPrice || a.price || '0');
        const pb = parseFloat(b.recommendedPrice || b.price || '0');
        return (isNaN(pa) ? 0 : pa) - (isNaN(pb) ? 0 : pb);
      });
    });
    return groups;
  }, [products]);

  // สร้างรายการหมวดหมู่จากสินค้า
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; img?: string; count: number }>();
    for (const p of products) {
      const name = p.category || "อื่นๆ";
      if (!map.has(name)) {
        map.set(name, { name, img: p.img, count: 1 });
      } else {
        const c = map.get(name)!;
        c.count += 1;
        if (!c.img && p.img) c.img = p.img;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

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

  // Filter history
  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchTerm || 
      item.info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    totalPurchases: history.length,
    successfulPurchases: history.filter(item => 
      item.status === "success" || item.status === "completed"
    ).length,
    pendingPurchases: history.filter(item => 
      item.status === "pending" || item.status === "processing"
    ).length,
    failedPurchases: history.filter(item => 
      item.status === "failed" || item.status === "error"
    ).length,
    totalAmount: history.reduce((sum, item) => {
      const amount = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0)
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลบัตรเงินสด...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">บัตรเงินสด</h1>
            <p className="text-gray-600 mt-1">ซื้อและจัดการบัตรเงินสด</p>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">จำนวนการซื้อทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">สำเร็จ</p>
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
                  <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ยอดรวม</p>
                  <p className="text-2xl font-bold text-purple-600">{formatAmount(stats.totalAmount)} บาท</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              รายการบัตรเงินสด
            </CardTitle>
            <CardDescription>
              เลือกบัตรเงินสดที่ต้องการซื้อ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              // แสดงหมวดหมู่ก่อน
              categories.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ไม่พบรายการบัตรเงินสด
                  </AlertDescription>
                </Alert>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {categories.map((cat) => (
                    <Card key={cat.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory(cat.name)}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{cat.name}</h3>
                            <Badge variant="outline">{cat.count} รายการ</Badge>
                          </div>
                          {cat.img && (
                            <div className="w-full h-36 rounded border overflow-hidden bg-white flex items-center justify-center">
                              <img
                                src={cat.img}
                                alt={cat.name}
                                className="max-h-full max-w-full object-contain"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <Button className="w-full">ดูสินค้า</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : groupedProducts.filter(g => g.category === selectedCategory).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ไม่พบรายการในหมวดหมู่ที่เลือก
                </AlertDescription>
              </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                {/* ปุ่มย้อนกลับไปหน้าหมวดหมู่ */}
                <div className="-mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">หมวดหมู่: <span className="font-medium">{selectedCategory}</span></p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>กลับไปเลือกหมวดหมู่</Button>
                  </div>
                </div>
                {groupedProducts
                  .filter((group) => group.category === selectedCategory)
                  .map((group) => (
                  <Card key={group.key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{group.category}</h3>
                          <Badge variant="outline">{group.category}</Badge>
                        </div>

                        {group.img && (
                          <div className="w-full h-36 rounded border overflow-hidden bg-white flex items-center justify-center">
                            <img
                              src={group.img}
                              alt={group.info || "Cash Card"}
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                        
                        {group.info && (
                          <div className="text-sm text-gray-700 whitespace-pre-line">{group.info}</div>
                        )}
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">เลือกราคา</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.variants.map((variant) => (
                              <div key={variant.id} className="flex items-center justify-between gap-3 rounded border p-3">
                                <div className="min-w-0">
                                  <div className="text-xs text-gray-600">ราคาขาย</div>
                                  <div className="font-semibold text-green-600 truncate">
                                    {formatAmount(variant.recommendedPrice)} บาท
                                  </div>
                                  {isAdmin && (
                                    <div className="text-xs text-blue-600">ต้นทุน: {formatAmount(variant.price)} บาท</div>
                                  )}
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => handlePurchase(variant)}
                                  disabled={purchasing}
                                >
                                  {purchasing ? "กำลังซื้อ..." : "ซื้อ"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ประวัติการซื้อบัตรเงินสด
            </CardTitle>
            <CardDescription>
              ดูประวัติการซื้อบัตรเงินสดทั้งหมด
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาบัตรเงินสด..."
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
            </div>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ไม่พบประวัติการซื้อบัตรเงินสด
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">#</th>
                      <th className="text-left p-3 font-medium">วันที่</th>
                      <th className="text-left p-3 font-medium">บัตรเงินสด</th>
                      <th className="text-left p-3 font-medium">จำนวน</th>
                      <th className="text-left p-3 font-medium">สถานะ</th>
                      <th className="text-left p-3 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={item.id || index} className="border-b hover:bg-muted/50">
                        <td className="p-3">{startIndex + index + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(item.date)}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{item.info || "ไม่ระบุ"}</td>
                        <td className="p-3">{formatAmount(item.price)} บาท</td>
                        <td className="p-3">{getStatusBadge(item.status)}</td>
                        <td className="p-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {item.reference || "ไม่ระบุ"}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredHistory.length)} จาก {filteredHistory.length} รายการ
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ก่อนหน้า
                  </Button>
                  <span className="flex items-center px-3 py-2 text-sm">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CashCard;
