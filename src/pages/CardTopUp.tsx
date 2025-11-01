import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard,
  Smartphone,
  History,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPeamsubUserInfo,
  getPeamsubMobileProducts,
  purchasePeamsubMobile,
  getPeamsubMobileHistory,
  getPeamsubCashCardProducts,
  purchasePeamsubCashCard,
  getPeamsubCashCardHistory,
  PeamsubUserData,
  PeamsubMobileProduct,
  PeamsubMobileHistory,
  PeamsubCashCardProduct,
  PeamsubCashCardHistory,
} from "@/lib/peamsubUtils";
import { addUserPurchaseReference, recordPurchaseWithSellPrice } from "@/lib/purchaseHistoryUtils";
import { getProductSellPrice } from "@/lib/peamsubPriceUtils";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CardTopUp = () => {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  
  // User Info
  const [userInfo, setUserInfo] = useState<PeamsubUserData | null>(null);

  // Mobile Products
  const [mobileProducts, setMobileProducts] = useState<PeamsubMobileProduct[]>([]);
  const [mobileHistory, setMobileHistory] = useState<PeamsubMobileHistory[]>([]);
  const [selectedMobileCategory, setSelectedMobileCategory] = useState<string | null>(null);

  // Cash Card Products
  const [cashCardProducts, setCashCardProducts] = useState<PeamsubCashCardProduct[]>([]);
  const [cashCardHistory, setCashCardHistory] = useState<PeamsubCashCardHistory[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile Purchase States
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<PeamsubMobileProduct | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileProductName, setMobileProductName] = useState("");
  const [mobileReference, setMobileReference] = useState("");
  const [mobilePurchasing, setMobilePurchasing] = useState(false);

  // Cash Card Purchase States
  const [cashCardDialogOpen, setCashCardDialogOpen] = useState(false);
  const [selectedCashCardProduct, setSelectedCashCardProduct] = useState<PeamsubCashCardProduct | null>(null);
  const [cashCardReference, setCashCardReference] = useState("");
  const [cashCardPurchasing, setCashCardPurchasing] = useState(false);

  // Price Management States
  const [editingPrice, setEditingPrice] = useState<{ product: PeamsubMobileProduct | PeamsubCashCardProduct | null; field: 'price' | 'recommendedPrice'; type: 'mobile' | 'cashcard' }>({ product: null, field: 'price', type: 'mobile' });
  const [tempPrice, setTempPrice] = useState("");
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      // Helper function to add delay between API calls
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Load data sequentially with delays to prevent rate limiting
      await loadUserInfo();
      await delay(500);
      
      await loadMobileProducts();
      await delay(500);
      
      await loadCashCardProducts();
      await delay(500);
      
      await loadMobileHistory();
      await delay(500);
      
      await loadCashCardHistory();
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const user = await getPeamsubUserInfo();
      setUserInfo(user);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadMobileProducts = async () => {
    try {
      const products = await getPeamsubMobileProducts();
      setMobileProducts(products);
    } catch (error) {
      console.error("Error loading mobile products:", error);
    }
  };

  const loadCashCardProducts = async () => {
    try {
      const products = await getPeamsubCashCardProducts();
      setCashCardProducts(products);
    } catch (error) {
      console.error("Error loading cash card products:", error);
    }
  };

  const loadMobileHistory = async () => {
    try {
      const history = await getPeamsubMobileHistory();
      setMobileHistory(history);
    } catch (error) {
      console.error("Error loading mobile history:", error);
    }
  };

  const loadCashCardHistory = async () => {
    try {
      const history = await getPeamsubCashCardHistory();
      setCashCardHistory(history);
    } catch (error) {
      console.error("Error loading cash card history:", error);
    }
  };

  const handleRefresh = () => {
    initializeData();
  };

  // Mobile Purchase Functions
  const openMobileDialog = (product: PeamsubMobileProduct) => {
    setSelectedMobileProduct(product);
    setMobileDialogOpen(true);
    setMobileNumber("");
    setMobileProductName(product.category || "");
    setMobileReference("");
  };

  const handleMobilePurchase = async () => {
    if (!selectedMobileProduct || !mobileNumber.trim()) {
      toast.error("กรุณากรอกหมายเลขโทรศัพท์");
      return;
    }

    // ตรวจสอบยอดเงิน
    if (!userInfo) {
      toast.error("ไม่สามารถตรวจสอบยอดเงินได้");
      return;
    }
    
    const userBalance = parseFloat(userInfo.balance) || 0;
    
    // ดึงราคาขาย (จาก admin price หรือ recommended price หรือ API price)
    const apiPrice = parseFloat(selectedMobileProduct.price) || 0; // ราคา API (ราคาทุน)
    const recommendedPrice = parseFloat(selectedMobileProduct.recommendedPrice) || 0; // ราคาแนะนำ (ราคาขายเริ่มต้น)
    const sellPrice = await getProductSellPrice(selectedMobileProduct.id, 'mobile', apiPrice, recommendedPrice);
    
    if (userBalance < sellPrice) {
      toast.error("ไม่สามารถเติมเงินได้ กรุณาเติมเงินเข้าสู่ระบบ");
      return;
    }

    setMobilePurchasing(true);
    try {
      const reference = `MOBILE_${Date.now()}`;
      const result = await purchasePeamsubMobile(selectedMobileProduct.id, mobileNumber, reference);
      
      // หักเงินจาก balance ในฐานข้อมูล
      if (user) {
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
        
        // บันทึกการซื้อพร้อมราคาขาย
        try {
          await recordPurchaseWithSellPrice(
            user.uid,
            'mobile',
            reference,
            selectedMobileProduct.id,
            sellPrice,
            apiPrice,
            selectedMobileProduct.name,
            selectedMobileProduct.id.toString(),
            selectedMobileProduct.info
          );
        } catch (recordError) {
          console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
          // Fallback: บันทึก reference ธรรมดา
          const fallbackSellPrice = parseFloat(selectedMobileProduct.recommendedPrice) || 0;
          await addUserPurchaseReference(user.uid, 'mobile', reference, fallbackSellPrice);
        }
      }
      
      toast.success("ซื้อบัตรเติมเงินมือถือสำเร็จ!");
      setMobileDialogOpen(false);
      setMobileNumber("");
      setMobileProductName("");
      setMobileReference("");
      
      // Refresh data
      await initializeData();
    } catch (error) {
      console.error("Error purchasing mobile:", error);
      toast.error("เกิดข้อผิดพลาดในการซื้อบัตรเติมเงินมือถือ");
    } finally {
      setMobilePurchasing(false);
    }
  };

  // Cash Card Purchase Functions
  const openCashCardDialog = (product: PeamsubCashCardProduct) => {
    setSelectedCashCardProduct(product);
    setCashCardDialogOpen(true);
    setCashCardReference("");
  };

  const handleCashCardPurchase = async () => {
    if (!selectedCashCardProduct || !user) {
      toast.error("กรุณาเลือกสินค้า");
      return;
    }

    // ตรวจสอบยอดเงิน
    if (!userInfo) {
      toast.error("ไม่สามารถตรวจสอบยอดเงินได้");
      return;
    }
    
    // ดึงราคาขาย (จาก admin price หรือ recommended price หรือ API price)
    const apiPrice = parseFloat(selectedCashCardProduct.price) || 0; // ราคา API (ราคาทุน)
    const recommendedPrice = parseFloat(selectedCashCardProduct.recommendedPrice) || 0; // ราคาแนะนำ (ราคาขายเริ่มต้น)
    const sellPrice = await getProductSellPrice(selectedCashCardProduct.id, 'cashcard', apiPrice, recommendedPrice);
    const userBalance = parseFloat(userInfo.balance) || 0;
    
    if (userBalance < sellPrice) {
      toast.error("ไม่สามารถซื้อสินค้าได้ กรุณาเติมเงินเข้าสู่ระบบ");
      return;
    }

    setCashCardPurchasing(true);
    try {
      const reference = `CASH_${Date.now()}`;
      const result = await purchasePeamsubCashCard(selectedCashCardProduct.id, reference);
      
      // หักเงินจาก balance ในฐานข้อมูล
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            balance: increment(-sellPrice) // หักเงิน
          });
          console.log(`✅ หักเงิน ${sellPrice} บาทจาก balance สำเร็จ`);
          
          // รีเฟรชข้อมูลผู้ใช้เพื่ออัปเดต balance
          await loadCashCardHistory();
          await initializeData();
        } catch (balanceError) {
          console.error('❌ ไม่สามารถหักเงินได้:', balanceError);
          toast.error("เงินหักจาก API แล้วแต่ไม่สามารถหักเงินจากระบบได้ กรุณาติดต่อผู้ดูแล");
        }
        
        // บันทึกการซื้อพร้อมราคาขาย
        try {
          await recordPurchaseWithSellPrice(
            user.uid,
            'cashcard',
            reference,
            selectedCashCardProduct.id,
            sellPrice,
            apiPrice,
            selectedCashCardProduct.category,
            selectedCashCardProduct.id.toString(),
            selectedCashCardProduct.info
          );
        } catch (recordError) {
          console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
          // Fallback: บันทึก reference ธรรมดา
          const fallbackSellPrice = parseFloat(selectedCashCardProduct.recommendedPrice) || 0;
          await addUserPurchaseReference(user.uid, 'cashcard', reference, fallbackSellPrice);
        }
      }
      
      toast.success("ซื้อบัตรเงินสดสำเร็จ!");
      setCashCardDialogOpen(false);
      setCashCardReference("");
      
      // Refresh data
      await loadCashCardHistory();
    } catch (error) {
      console.error("Error purchasing cash card:", error);
      toast.error("เกิดข้อผิดพลาดในการซื้อบัตรเงินสด");
    } finally {
      setCashCardPurchasing(false);
    }
  };

  // Price Management Functions
  const openPriceEditDialog = (product: PeamsubMobileProduct | PeamsubCashCardProduct, field: 'price' | 'recommendedPrice', type: 'mobile' | 'cashcard') => {
    setEditingPrice({ product, field, type });
    setTempPrice(product[field]);
    setPriceDialogOpen(true);
  };

  const savePriceChange = () => {
    if (!editingPrice.product) return;

    // Update local state (in real app, this would call API)
    if (editingPrice.type === 'mobile') {
      setMobileProducts(prev => prev.map(p => 
        p.id === editingPrice.product!.id 
          ? { ...p, [editingPrice.field]: tempPrice }
          : p
      ));
    } else {
      setCashCardProducts(prev => prev.map(p => 
        p.id === editingPrice.product!.id 
          ? { ...p, [editingPrice.field]: tempPrice }
          : p
      ));
    }

    toast.success("บันทึกราคาสำเร็จ");
    setPriceDialogOpen(false);
    setEditingPrice({ product: null, field: 'price', type: 'mobile' });
    setTempPrice("");
  };

  const cancelPriceEdit = () => {
    setPriceDialogOpen(false);
    setEditingPrice({ product: null, field: 'price', type: 'mobile' });
    setTempPrice("");
  };

  // Filter functions
  const filteredMobileProducts = mobileProducts.filter(product =>
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.info.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCashCardProducts = cashCardProducts.filter(product =>
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.info.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helpers: format HTML-ish info to plain text
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<\/(div|p|br)>/gi, '\n')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+\n/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();
  };

  // Derive mobile categories from API
  const mobileCategories = (() => {
    const map = new Map<string, { name: string; img?: string; count: number }>();
    for (const p of filteredMobileProducts) {
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
  })();

  // Group mobile variants by same product (category + info)
  const groupedMobileByCategory = (categoryName: string) => {
    const items = filteredMobileProducts.filter(p => p.category === categoryName);
    const map = new Map<string, { key: string; category: string; info: string; img?: string; variants: PeamsubMobileProduct[] }>();
    for (const p of items) {
      const key = `${(p.category || '').trim().toLowerCase()}::${(p.info || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { key, category: p.category, info: p.info, img: p.img, variants: [p] });
      } else {
        const g = map.get(key)!;
        g.variants.push(p);
        if (!g.img && p.img) g.img = p.img;
      }
    }
    const groups = Array.from(map.values());
    groups.forEach(g => g.variants.sort((a, b) => (parseFloat(a.recommendedPrice || a.price) || 0) - (parseFloat(b.recommendedPrice || b.price) || 0)));
    return groups;
  };

  return (
    <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">บัตรเติมเงินมือถือ</h1>
              <p className="text-muted-foreground">จัดการบัตรเติมเงินมือถือ</p>
            </div>
            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
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
                    <p className="text-sm text-muted-foreground">อีเมล</p>
                    <p className="font-semibold">{userInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">สถานะ</p>
                    <Badge variant={userInfo.status === 'active' ? 'default' : 'destructive'}>
                      {userInfo.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Products */}
          <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    บัตรเติมเงินมือถือ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedMobileCategory ? (
                    mobileCategories.length === 0 ? (
                      <div className="text-center py-8">
                        <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">ไม่พบสินค้าบัตรเติมเงินมือถือ</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mobileCategories.map((cat) => (
                          <Card key={cat.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedMobileCategory(cat.name)}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                                  <Badge variant="outline">{cat.count} รายการ</Badge>
                                </div>
                                {cat.img && (
                                  <div className="w-full h-36 rounded border overflow-hidden bg-white flex items-center justify-center">
                                    <img src={cat.img} alt={cat.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                                  </div>
                                )}
                                <Button className="w-full">ดูสินค้า</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )
                  ) : (
                    (() => {
                      const groups = groupedMobileByCategory(selectedMobileCategory!);
                      if (groups.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">ไม่พบสินค้าในหมวดหมู่ที่เลือก</p>
                            <Button variant="outline" className="mt-4" onClick={() => setSelectedMobileCategory(null)}>กลับไปเลือกหมวดหมู่</Button>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 -mb-2 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">หมวดหมู่: <span className="font-medium text-foreground">{selectedMobileCategory}</span></p>
                            <Button variant="outline" size="sm" onClick={() => setSelectedMobileCategory(null)}>กลับไปเลือกหมวดหมู่</Button>
                          </div>
                          {groups.map(group => (
                            <Card key={group.key} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg whitespace-pre-line">{stripHtmlTags(group.info)}</h3>
                                    <Badge variant="outline">{group.category}</Badge>
                                  </div>
                                  {group.img && (
                                    <div className="w-full h-36 rounded border overflow-hidden bg-white flex items-center justify-center">
                                      <img src={group.img} alt={group.info} className="max-h-full max-w-full object-contain" loading="lazy" />
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">เลือกราคา</p>
                                    <div className="space-y-2">
                                      {group.variants.map(variant => (
                                        <div key={variant.id} className="flex items-center justify-between rounded border p-2">
                                          <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">ราคาขาย</span>
                                            <span className="font-semibold text-green-600">{variant.recommendedPrice || variant.price} บาท</span>
                                            {isAdmin && (
                                              <span className="text-xs text-blue-600">ต้นทุน: {variant.price} บาท</span>
                                            )}
                                          </div>
                                          <Button size="sm" onClick={() => openMobileDialog(variant)}>เลือก</Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
          </div>

          {/* Mobile Purchase Dialog */}
          <AlertDialog open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  ซื้อบัตรเติมเงินมือถือ
                </AlertDialogTitle>
                <AlertDialogDescription>
                  กรอกข้อมูลเพื่อซื้อบัตรเติมเงินมือถือ
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                {selectedMobileProduct && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold">{selectedMobileProduct.category}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {stripHtmlTags(selectedMobileProduct.info)}
                    </p>
                    <p className="text-lg font-bold text-green-600">{selectedMobileProduct.recommendedPrice} บาท</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="mobileProductName">ชื่อสินค้า</Label>
                  <Input
                    id="mobileProductName"
                    placeholder="ชื่อสินค้า"
                    value={mobileProductName}
                    onChange={(e) => setMobileProductName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">หมายเลขโทรศัพท์ *</Label>
                  <Input
                    id="mobileNumber"
                    placeholder="กรอกหมายเลขโทรศัพท์"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMobilePurchase}
                  disabled={mobilePurchasing || !mobileNumber.trim()}
                >
                  {mobilePurchasing ? "กำลังซื้อบัตรเติมเงินมือถือ..." : "ซื้อบัตรเติมเงินมือถือ"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Price Edit Dialog */}
          <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  แก้ไขราคา
                </DialogTitle>
                <DialogDescription>
                  แก้ไข{editingPrice.field === 'price' ? 'ราคาสินค้า' : 'ราคาแนะนำ'}ของ{editingPrice.type === 'mobile' ? 'บัตรเติมเงินมือถือ' : 'บัตรเงินสด'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tempPrice">ราคาใหม่</Label>
                  <Input
                    id="tempPrice"
                    type="number"
                    min="0"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    placeholder="กรอกราคาใหม่"
                  />
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>ราคาปัจจุบัน:</strong> {editingPrice.product?.[editingPrice.field]} บาท
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={cancelPriceEdit}>
                  <X className="mr-2 h-4 w-4" />
                  ยกเลิก
                </Button>
                <Button onClick={savePriceChange}>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึก
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
  );
};

export default CardTopUp;


