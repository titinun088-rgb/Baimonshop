import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPeamsubProducts,
  getPeamsubGameProducts,
  PeamsubProduct,
  PeamsubGameProduct,
} from "@/lib/peamsubUtils";
import {
  getPeamsubProductPrice,
  setPeamsubProductPrice,
  deletePeamsubProductPrice,
  getAllPeamsubProductPrices,
  PeamsubProductPrice,
} from "@/lib/peamsubPriceUtils";

const PeamsubPriceManagement = () => {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === 'admin';

  // Premium Products
  const [premiumProducts, setPremiumProducts] = useState<PeamsubProduct[]>([]);
  const [premiumPrices, setPremiumPrices] = useState<Map<number, PeamsubProductPrice>>(new Map());
  
  // Game Products
  const [gameProducts, setGameProducts] = useState<PeamsubGameProduct[]>([]);
  const [gamePrices, setGamePrices] = useState<Map<number, PeamsubProductPrice>>(new Map());

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'premium' | 'game' | 'mobile' | 'cashcard'>('premium');

  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{
    id: number;
    type: 'premium' | 'game' | 'mobile' | 'cashcard';
    name: string;
    apiPrice: number;
    recommendedPrice?: number;
    currentSellPrice?: number;
  } | null>(null);
  const [editSellPrice, setEditSellPrice] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      // โหลดราคาที่ตั้งไว้แล้วทั้งหมด
      const allPrices = await getAllPeamsubProductPrices();
      const priceMap = new Map<number, PeamsubProductPrice>();
      
      allPrices.forEach(price => {
        const productId = parseInt(price.id.split('_')[1]);
        priceMap.set(productId, price);
      });

      if (activeTab === 'premium') {
        const products = await getPeamsubProducts();
        setPremiumProducts(products);
        const premiumPriceMap = new Map<number, PeamsubProductPrice>();
        products.forEach(product => {
          const price = priceMap.get(product.id);
          if (price && price.productType === 'premium') {
            premiumPriceMap.set(product.id, price);
          }
        });
        setPremiumPrices(premiumPriceMap);
      } else if (activeTab === 'game') {
        const products = await getPeamsubGameProducts();
        setGameProducts(products);
        const gamePriceMap = new Map<number, PeamsubProductPrice>();
        products.forEach(product => {
          const price = priceMap.get(product.id);
          if (price && price.productType === 'game') {
            gamePriceMap.set(product.id, price);
          }
        });
        setGamePrices(gamePriceMap);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (
    productId: number,
    type: 'premium' | 'game' | 'mobile' | 'cashcard',
    name: string,
    apiPrice: number,
    recommendedPrice?: number,
    currentSellPrice?: number
  ) => {
    setEditingProduct({ id: productId, type, name, apiPrice, recommendedPrice, currentSellPrice });
    // ใช้ราคาขายที่แอดมินตั้งไว้ ถ้าไม่มีให้ใช้ราคาแนะนำ
    const defaultPrice = currentSellPrice || recommendedPrice || apiPrice;
    setEditSellPrice(defaultPrice.toString());
    setEditDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (!editingProduct || !user) return;

    const sellPrice = parseFloat(editSellPrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      toast.error("กรุณากรอกราคาขายที่ถูกต้อง");
      return;
    }

    try {
      await setPeamsubProductPrice(
        editingProduct.id,
        editingProduct.type,
        sellPrice,
        editingProduct.apiPrice,
        editingProduct.name,
        undefined,
        user.uid
      );

      toast.success("บันทึกราคาสำเร็จ");
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditSellPrice("");
      
      // รีโหลดข้อมูล
      await loadData();
    } catch (error) {
      console.error("Error saving price:", error);
      toast.error("ไม่สามารถบันทึกราคาได้");
    }
  };

  const handleDeletePrice = async (
    productId: number,
    type: 'premium' | 'game' | 'mobile' | 'cashcard'
  ) => {
    if (!confirm("คุณต้องการลบราคานี้หรือไม่?")) return;

    try {
      await deletePeamsubProductPrice(productId, type);
      toast.success("ลบราคาสำเร็จ");
      await loadData();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast.error("ไม่สามารถลบราคาได้");
    }
  };

  const getFilteredPremiumProducts = () => {
    if (!searchQuery) return premiumProducts;
    return premiumProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredGameProducts = () => {
    if (!searchQuery) return gameProducts;
    return gameProducts.filter(p =>
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.info.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">ไม่ได้รับอนุญาต</h2>
              <p className="text-muted-foreground">
                เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้
              </p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">จัดการราคาสินค้า Peamsub</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              ตั้งราคาขายสำหรับสินค้า Peamsub ทุกประเภท
            </p>
          </div>
          <Button onClick={loadData} disabled={loading} size="sm" className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="premium">แอพพรีเมียม</TabsTrigger>
            <TabsTrigger value="game">เติมเกม</TabsTrigger>
            <TabsTrigger value="mobile">เติมเน็ต-เงินมือถือ</TabsTrigger>
            <TabsTrigger value="cashcard">บัตรเงินสด</TabsTrigger>
          </TabsList>

          {/* Premium Products */}
          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle>แอพพรีเมียม</CardTitle>
                <CardDescription>
                  จัดการราคาขายสินค้าแอพพรีเมียม
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3">
                      {getFilteredPremiumProducts().map((product) => {
                        const priceInfo = premiumPrices.get(product.id);
                        const apiPrice = product.price || 0;
                        const recommendedPrice = apiPrice;
                        const sellPrice = priceInfo?.sellPrice || recommendedPrice;
                        const profit = sellPrice - apiPrice;

                        return (
                          <Card key={product.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm mb-1">{product.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>สต็อก: {product.stock}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      openEditDialog(
                                        product.id,
                                        'premium',
                                        product.name,
                                        apiPrice,
                                        recommendedPrice,
                                        priceInfo?.sellPrice
                                      )
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {priceInfo && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleDeletePrice(product.id, 'premium')}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                <div>
                                  <p className="text-muted-foreground">ราคา API</p>
                                  <p className="font-medium">฿{apiPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">ราคาแนะนำ</p>
                                  <p className="font-medium text-blue-600">฿{recommendedPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">ราคาขาย</p>
                                  {priceInfo ? (
                                    <p className="font-semibold text-green-600">฿{sellPrice.toFixed(2)}</p>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">ใช้ราคาแนะนำ</Badge>
                                  )}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">กำไร</p>
                                  <p className={profit >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                                    ฿{profit.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-sm">ชื่อสินค้า</TableHead>
                            <TableHead className="text-sm">ราคา API (ทุน)</TableHead>
                            <TableHead className="text-sm">ราคาแนะนำ</TableHead>
                            <TableHead className="text-sm">ราคาขายที่ตั้ง</TableHead>
                            <TableHead className="text-sm">กำไร</TableHead>
                            <TableHead className="text-sm">สต็อก</TableHead>
                            <TableHead className="text-sm">จัดการ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredPremiumProducts().map((product) => {
                            const priceInfo = premiumPrices.get(product.id);
                            const apiPrice = product.price || 0;
                            const recommendedPrice = apiPrice;
                            const sellPrice = priceInfo?.sellPrice || recommendedPrice;
                            const profit = sellPrice - apiPrice;

                            return (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium text-sm">{product.name}</TableCell>
                                <TableCell className="text-sm">฿{apiPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">
                                  <span className="text-blue-600">฿{recommendedPrice.toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {priceInfo ? (
                                    <span className="font-semibold text-green-600">
                                      ฿{sellPrice.toFixed(2)}
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">ใช้ราคาแนะนำ</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                    ฿{profit.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">{product.stock}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openEditDialog(
                                          product.id,
                                          'premium',
                                          product.name,
                                          apiPrice,
                                          recommendedPrice,
                                          priceInfo?.sellPrice
                                        )
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {priceInfo && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletePrice(product.id, 'premium')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Products */}
          <TabsContent value="game">
            <Card>
              <CardHeader>
                <CardTitle>เติมเกม</CardTitle>
                <CardDescription>
                  จัดการราคาขายสินค้าเติมเกม
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3">
                      {getFilteredGameProducts().map((product) => {
                        const priceInfo = gamePrices.get(product.id);
                        const apiPrice = parseFloat(product.price) || 0;
                        const recommendedPrice = parseFloat(product.recommendedPrice) || 0;
                        const sellPrice = priceInfo?.sellPrice || recommendedPrice;
                        const profit = sellPrice - apiPrice;

                        return (
                          <Card key={product.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm mb-1">{product.category}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{product.info}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0 ml-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      openEditDialog(
                                        product.id,
                                        'game',
                                        product.category,
                                        apiPrice,
                                        recommendedPrice,
                                        priceInfo?.sellPrice
                                      )
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {priceInfo && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleDeletePrice(product.id, 'game')}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                <div>
                                  <p className="text-muted-foreground">ราคา API</p>
                                  <p className="font-medium">฿{apiPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">ราคาแนะนำ</p>
                                  <p className="font-medium text-blue-600">฿{recommendedPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">ราคาขาย</p>
                                  {priceInfo ? (
                                    <p className="font-semibold text-green-600">฿{sellPrice.toFixed(2)}</p>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">ใช้ราคาแนะนำ</Badge>
                                  )}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">กำไร</p>
                                  <p className={profit >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                                    ฿{profit.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-sm">หมวดหมู่</TableHead>
                            <TableHead className="text-sm">ข้อมูล</TableHead>
                            <TableHead className="text-sm">ราคา API (ทุน)</TableHead>
                            <TableHead className="text-sm">ราคาแนะนำ</TableHead>
                            <TableHead className="text-sm">ราคาขายที่ตั้ง</TableHead>
                            <TableHead className="text-sm">กำไร</TableHead>
                            <TableHead className="text-sm">จัดการ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredGameProducts().map((product) => {
                            const priceInfo = gamePrices.get(product.id);
                            const apiPrice = parseFloat(product.price) || 0;
                            const recommendedPrice = parseFloat(product.recommendedPrice) || 0;
                            const sellPrice = priceInfo?.sellPrice || recommendedPrice;
                            const profit = sellPrice - apiPrice;

                            return (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium text-sm">{product.category}</TableCell>
                                <TableCell className="max-w-xs truncate text-sm">{product.info}</TableCell>
                                <TableCell className="text-sm">฿{apiPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">
                                  <span className="text-blue-600">฿{recommendedPrice.toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {priceInfo ? (
                                    <span className="font-semibold text-green-600">
                                      ฿{sellPrice.toFixed(2)}
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">ใช้ราคาแนะนำ</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                    ฿{profit.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openEditDialog(
                                          product.id,
                                          'game',
                                          product.category,
                                          apiPrice,
                                          recommendedPrice,
                                          priceInfo?.sellPrice
                                        )
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {priceInfo && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletePrice(product.id, 'game')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile & CashCard - TODO: Implement when needed */}
          <TabsContent value="mobile">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashcard">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Price Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {editingProduct ? `ตั้งราคาขาย - ${editingProduct.name}` : 'ตั้งราคาขาย'}
              </DialogTitle>
              <DialogDescription>
                ตั้งราคาขายสำหรับสินค้านี้ (ราคาที่ลูกค้าจะจ่ายให้เว็บไซต์)
              </DialogDescription>
            </DialogHeader>
            
            {editingProduct && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>ราคา API (ราคาทุน)</Label>
                  <Input
                    value={editingProduct.apiPrice.toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>ราคาแนะนำ (จาก API)</Label>
                  <Input
                    value={(editingProduct.recommendedPrice || editingProduct.apiPrice).toFixed(2)}
                    disabled
                    className="bg-blue-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ราคาขายเริ่มต้นที่ API แนะนำ (จะใช้เมื่อไม่ได้ตั้งราคาเอง)
                  </p>
                </div>
                <div>
                  <Label>ราคาขาย (บาท) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editSellPrice}
                    onChange={(e) => setEditSellPrice(e.target.value)}
                    placeholder="ระบุราคาขาย (ถ้าไม่ตั้งจะใช้ราคาแนะนำ)"
                  />
                  {editSellPrice && parseFloat(editSellPrice) > 0 && (
                    <div className="text-sm mt-1 space-y-1">
                      <p className="text-muted-foreground">
                        กำไร: <span className={parseFloat(editSellPrice) - editingProduct.apiPrice >= 0 ? "text-green-600" : "text-red-600"}>
                          ฿{(parseFloat(editSellPrice) - editingProduct.apiPrice).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ถ้าลบราคานี้ ระบบจะใช้ราคาแนะนำจาก API
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSavePrice}>
                <Save className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default PeamsubPriceManagement;

