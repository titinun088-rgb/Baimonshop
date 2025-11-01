import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Wifi, 
  WifiOff, 
  RefreshCw, 
  User, 
  ShoppingBag, 
  Search, 
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import {
  getPeamsubUserInfo,
  getPeamsubProducts,
  testPeamsubConnection,
  formatPeamsubUserInfo,
  formatPeamsubProduct,
  filterProductsByPrice,
  filterProductsByStock,
  searchProducts,
  sortProductsByPrice,
  sortProductsByStock,
  getProductPriceByRank,
  isProductInStock,
  getProductSummary,
  PeamsubUserData,
  PeamsubProduct
} from "@/lib/peamsubUtils";

const PeamsubAPI = () => {
  // States
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [userInfo, setUserInfo] = useState<PeamsubUserData | null>(null);
  const [products, setProducts] = useState<PeamsubProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PeamsubProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minStock, setMinStock] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'price' | 'stock' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<PeamsubProduct | null>(null);

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

  // เริ่มต้นข้อมูล
  const initializeData = async () => {
    setLoading(true);
    try {
      // ทดสอบการเชื่อมต่อ
      const isConnected = await testPeamsubConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');

      if (isConnected) {
        // โหลดข้อมูลผู้ใช้
        const user = await getPeamsubUserInfo();
        setUserInfo(user);

        // โหลดรายการสินค้า
        const productList = await getPeamsubProducts();
        setProducts(productList);
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

  // ทดสอบการเชื่อมต่อ
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await testPeamsubConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        toast.success("การเชื่อมต่อ API สำเร็จ");
      } else {
        toast.error("การเชื่อมต่อ API ล้มเหลว");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionStatus('disconnected');
      toast.error("เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  // รีเซ็ตตัวกรอง
  const handleResetFilters = () => {
    setSearchQuery("");
    setMaxPrice(null);
    setMinStock(1);
    setSortBy('name');
    setSortOrder('asc');
  };

  // แสดงข้อมูลสินค้า
  const handleShowProductDetails = (product: PeamsubProduct) => {
    setShowProductDetails(product);
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

  // สรุปข้อมูลสินค้า
  const productSummary = getProductSummary(products);

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Peamsub API Management</h1>
              <p className="text-muted-foreground">
                จัดการการเชื่อมต่อและข้อมูลจาก Peamsub API
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                ทดสอบการเชื่อมต่อ
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                รีเฟรช
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <Alert className={getConnectionStatusColor()}>
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <AlertDescription>
                <strong>สถานะการเชื่อมต่อ:</strong> {getConnectionStatusText()}
              </AlertDescription>
            </div>
          </Alert>

          {/* User Info */}
          {userInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลผู้ใช้
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserInfo(!showUserInfo)}
                  >
                    {showUserInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showUserInfo ? (
                  <div className="space-y-2">
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
                  </div>
                ) : (
                  <p className="text-muted-foreground">คลิกเพื่อดูข้อมูลผู้ใช้</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Summary */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  สรุปข้อมูลสินค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{productSummary.totalProducts}</p>
                    <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{productSummary.totalStock}</p>
                    <p className="text-sm text-muted-foreground">สต็อกทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{productSummary.averagePrice}</p>
                    <p className="text-sm text-muted-foreground">ราคาเฉลี่ย (บาท)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {productSummary.cheapestProduct?.price || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">ราคาต่ำสุด (บาท)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
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

              {/* Products Table */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || maxPrice || minStock > 1 ? 
                    "ไม่พบสินค้าตามเงื่อนไขที่กำหนด" : 
                    "ยังไม่มีข้อมูลสินค้า"
                  }
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รูปภาพ</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>ราคา</TableHead>
                        <TableHead>สต็อก</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <img
                              src={product.img}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.des}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold">{product.price} บาท</p>
                              <p className="text-sm text-muted-foreground">
                                VIP: {product.pricevip} บาท
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Agent: {product.agent_price} บาท
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                              {product.stock} ชิ้น
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isProductInStock(product) ? "default" : "destructive"}>
                              {isProductInStock(product) ? "มีสต็อก" : "หมดสต็อก"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowProductDetails(product)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              ดูรายละเอียด
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details Dialog */}
          <AlertDialog open={!!showProductDetails} onOpenChange={() => setShowProductDetails(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>รายละเอียดสินค้า</AlertDialogTitle>
                <AlertDialogDescription>
                  ข้อมูลครบถ้วนของสินค้า
                </AlertDialogDescription>
              </AlertDialogHeader>
              {showProductDetails && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={showProductDetails.img}
                      alt={showProductDetails.name}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{showProductDetails.name}</h3>
                      <p className="text-muted-foreground mb-4">{showProductDetails.des}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">ราคาขายปกติ</p>
                          <p className="text-lg font-semibold">{showProductDetails.price} บาท</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ราคาตัวแทนจำหน่าย</p>
                          <p className="text-lg font-semibold">{showProductDetails.pricevip} บาท</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ราคาตัวแทนสมาชิก</p>
                          <p className="text-lg font-semibold">{showProductDetails.agent_price} บาท</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">จำนวนคงเหลือ</p>
                          <p className="text-lg font-semibold">{showProductDetails.stock} ชิ้น</p>
                        </div>
                      </div>
                    </div>
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
    </RoleProtectedRoute>
  );
};

export default PeamsubAPI;
