import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import SchemaMarkup from "@/components/SchemaMarkup";
import {
  Gamepad2,
  ShoppingCart,
  History,
  RefreshCw,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  DollarSign,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";

import {
  getWepayBalance,
  getWepayGameProducts,
  purchaseWepayGame,
  wepayErrorText,
  WepayBalance,
  WepayGameProduct,
} from "@/lib/wepayGameUtils";
import { addUserPurchaseReference, recordPurchaseWithSellPrice } from "@/lib/purchaseHistoryUtils";
import { getProductSellPrice, getAllPeamsubProductPrices, PeamsubProductPrice } from "@/lib/peamsubPriceUtils";
import { getAllCustomGameImages } from "@/lib/gameImageUtils";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GameTopUp = () => {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === "admin";

  // User Info (wePAY balance)
  const [wepayBalance, setWepayBalance] = useState<WepayBalance | null>(null);

  // Game Products
  const [gameProducts, setGameProducts] = useState<WepayGameProduct[]>([]);
  const [adminPrices, setAdminPrices] = useState<Map<string, PeamsubProductPrice>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryGames, setShowCategoryGames] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Game Purchase States
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [selectedGameProduct, setSelectedGameProduct] = useState<WepayGameProduct | null>(null);
  const [gameUID, setGameUID] = useState("");
  const [gameAID, setGameAID] = useState(""); // AID (ref1) สำหรับ Heartopia
  const [gamePurchasing, setGamePurchasing] = useState(false);

  // Price Management States
  const [editingPrice, setEditingPrice] = useState<{ product: WepayGameProduct | null; field: 'price' | 'recommendedPrice' }>({ product: null, field: 'price' });
  const [tempPrice, setTempPrice] = useState("");
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  // Package Price Management States
  const [editingPackagePrice, setEditingPackagePrice] = useState<{ package: any | null; game: WepayGameProduct | null }>({ package: null, game: null });
  const [tempPackagePrice, setTempPackagePrice] = useState("");
  const [packagePriceDialogOpen, setPackagePriceDialogOpen] = useState(false);

  // Game Detail States
  const [showGameDetail, setShowGameDetail] = useState(false);
  const [selectedGame, setSelectedGame] = useState<WepayGameProduct | null>(null);
  const [gamePackages, setGamePackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [gameServer, setGameServer] = useState("");
  const [gameNotes, setGameNotes] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Helper: format price for display and detect fractional baht (.01)
  const formatPriceDisplay = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return { text: '0', hasFraction: false };
    const n = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(n)) return { text: String(value), hasFraction: false };

    const frac = Math.abs(n - Math.round(n));
    const hasFraction = frac > 1e-9 && Math.round(frac * 100) > 0; // detect non-zero cents (e.g., .01)

    if (hasFraction) {
      // ถ้ามีทศนิยม ให้ปัดเป็นจำนวนเต็ม
      return { text: new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n)), hasFraction: false };
    }

    // otherwise show as whole baht
    return { text: new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n), hasFraction: false };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBalance(),
        loadGameProducts(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await getWepayBalance();
      setWepayBalance(balance);
      console.log("💰 wePAY balance loaded:", balance);
    } catch (error) {
      console.error("Error loading wePAY balance:", error);
    }
  };

  const loadGameProducts = async (force = false) => {
    try {
      const [allProducts, customImages, allAdminPrices] = await Promise.all([
        getWepayGameProducts(force),
        getAllCustomGameImages(),
        getAllPeamsubProductPrices()
      ]);

      // Map admin prices for fast lookup
      const priceMap = new Map<string, PeamsubProductPrice>();
      allAdminPrices.forEach(p => {
        if (p.productType === 'wepay_game') {
          const productId = p.id.replace('wepay_game_', '');
          priceMap.set(productId, p);
        }
      });
      setAdminPrices(priceMap);

      // นำรูปภาพที่แอดมินกำหนดเองมาทับรูปมาตรฐาน
      const updatedProducts = allProducts.map(product => ({
        ...product,
        img: customImages[product.pay_to_company] || product.img
      }));

      setGameProducts(updatedProducts);
      console.log(`🎮 Loaded all wePAY game products with admin prices (Force: ${force}):`, updatedProducts.length);
    } catch (error) {
      console.error("Error loading game products:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดเกม");
    }
  };

  // Category Functions
  const openCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryGames(true);
    setShowGameDetail(false);
  };

  const backToCategories = () => {
    setShowCategoryGames(false);
    setSelectedCategory(null);
    setShowGameDetail(false);
  };

  // Game Detail Functions
  const openGameDetail = async (game: WepayGameProduct) => {
    setSelectedGame(game);
    setShowGameDetail(true);
    setShowCategoryGames(false);

    console.log("🎮 GameTopUp: เปิดรายละเอียดเกม:", game.category);

    // ดึงราคาขายที่ตั้งไว้ ถ้าไม่มีให้ใช้ราคาต้นทุนจาก API เลย (เลิกใช้ราคาแนะนำเดิม)
    const adminData = adminPrices.get(game.id);
    const apiCost = adminData && adminData.apiPrice !== undefined
      ? (typeof adminData.apiPrice === 'string' ? parseFloat(adminData.apiPrice) : adminData.apiPrice)
      : (parseFloat(game.price) || parseFloat(game.pay_to_amount) || 0);
    const sellPrice = adminData?.sellPrice || apiCost;

    console.log("💰 GameTopUp: ราคาต้นทุน (แอดมิน/API):", apiCost);
    console.log("💎 GameTopUp: ราคาขายหน้าร้าน:", sellPrice);

    // สร้างแพ็คเกจเดี่ยวจากข้อมูล API และราคาที่แอดมินตั้ง
    const gamePackage = {
      id: game.id,
      name: game.category,
      amount: game.info,
      price: apiCost, // ต้นทุน API
      costPrice: sellPrice, // ราคาขายให้ลูกค้า (ในหน้านี้ใช้ชื่อ costPrice ในคอมโพเนนต์)
      discount: 0,
      description: game.info,
      details: '',
      icon: getGameIcon(game.category),
      color: getGameColor(game.category),
      popular: false,
      formatId: game.format_id
    };

    setGamePackages([gamePackage]);
    setSelectedPackage(gamePackage);

    // Reset form
    setGameUID("");
    setGameAID("");
    setGameServer("");
    setGameNotes("");
  };

  const backToGameList = () => {
    setShowGameDetail(false);
    setSelectedGame(null);
    setGamePackages([]);
    setSelectedPackage(null);
  };

  const getGameIcon = (category: string) => {
    const name = category.toLowerCase();
    if (name.includes('rov') || name.includes('arena of valor')) return '⚔️';
    if (name.includes('free fire')) return '🔥';
    if (name.includes('genshin')) return '✨';
    if (name.includes('pubg')) return '🎯';
    if (name.includes('mobile legend')) return '🏆';
    return '💎';
  };

  const getGameColor = (category: string) => {
    const name = category.toLowerCase();
    if (name.includes('rov') || name.includes('arena of valor')) return 'from-blue-500 to-cyan-500';
    if (name.includes('free fire')) return 'from-red-500 to-orange-500';
    if (name.includes('genshin')) return 'from-blue-500 to-purple-500';
    if (name.includes('pubg')) return 'from-orange-500 to-red-500';
    if (name.includes('mobile legend')) return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-cyan-500';
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    // ลบ HTML tags ทั้งหมด
    return html.replace(/<[^>]*>/g, '');
  };

  const formatGameInfo = (info: string) => {
    if (!info) return '';

    // 1. แทนที่ HTML entities ก่อน เพื่อให้กลายเป็น < และ > จริงๆ
    let cleanInfo = info
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // 2. ลบ HTML tags ทั้งหมด (เรียกใช้ stripHtmlTags ทีหลัง)
    cleanInfo = stripHtmlTags(cleanInfo);

    // 3. ลบช่องว่างเกินและตัดช่องว่างหัวท้าย
    cleanInfo = cleanInfo.replace(/\s+/g, ' ').trim();

    return cleanInfo;
  };

  const formatUIDPattern = (formatId: string): string => {
    try {
      // แปลง regex pattern เป็นข้อความที่เข้าใจได้
      let pattern = formatId;

      // ลบ regex delimiters (^ และ $ และ /)
      pattern = pattern.replace(/^\/|\/$/g, '').replace(/^\^|\$$/g, '');

      // ลบ negative lookahead (?!...)
      pattern = pattern.replace(/\(\?![^)]+\)/g, '');

      // แปลง common patterns
      pattern = pattern.replace(/\[0-9\]/g, 'ตัวเลข');
      pattern = pattern.replace(/\[a-zA-Z\]/g, 'ตัวอักษร');
      pattern = pattern.replace(/\[a-zA-Z0-9\]/g, 'ตัวอักษรหรือตัวเลข');
      pattern = pattern.replace(/\[a-zA-Z0-9.\-_\]/g, 'ตัวอักษรตัวเลขหรือสัญลักษณ์ (. - _)');
      pattern = pattern.replace(/\{(\d+)\}/g, '$1 ตัว');
      pattern = pattern.replace(/\{(\d+),(\d+)\}/g, '$1-$2 ตัว');
      pattern = pattern.replace(/\+/g, '1 ตัวขึ้นไป');
      pattern = pattern.replace(/\*/g, '0 ตัวขึ้นไป');
      pattern = pattern.replace(/\?/g, '0 หรือ 1 ตัว');

      return pattern || formatId;
    } catch (error) {
      console.error('Error formatting UID pattern:', error);
      return formatId;
    }
  };

  /** ตรวจจับว่าเกมนี้คือ Heartopia หรือไม่ */
  const isHeartopia = (game: WepayGameProduct | null): boolean => {
    if (!game) return false;
    const name = (game.category || game.pay_to_company || '').toLowerCase();
    return name.includes('heartopia');
  };

  const validateUID = (uid: string, formatId: string): boolean => {
    try {
      console.log('🔍 Debug UID Validation:');
      console.log('  - UID:', uid);
      console.log('  - Format ID:', formatId);

      const regex = new RegExp(formatId);
      const isValid = regex.test(uid);

      console.log('  - Regex:', regex);
      console.log('  - Is Valid:', isValid);

      return isValid;
    } catch (error) {
      console.error('❌ Invalid format_id regex:', error);
      console.log('  - Format ID that caused error:', formatId);
      return true; // ถ้า regex ไม่ถูกต้องให้ผ่าน
    }
  };

  const proceedToPurchase = () => {
    if (!selectedGame) {
      toast.error("ไม่พบข้อมูลเกม");
      return;
    }

    if (isHeartopia(selectedGame)) {
      // Heartopia ต้องการ AID (ref1) และ UID (ref2) แยกกัน
      if (!gameAID.trim()) {
        toast.error("กรุณากรอก AID (หมายเลขบัญชี) ของ Heartopia");
        return;
      }
      if (!gameUID.trim()) {
        toast.error("กรุณากรอก UID ของ Heartopia");
        return;
      }
    } else {
      if (!gameUID.trim()) {
        toast.error("กรุณากรอก UID/ไอดีเกม");
        return;
      }
    }

    // เปิด dialog สำหรับการซื้อ โดยให้ API ตรวจสอบ UID
    openGameDialog(selectedGame);
  };

  const handlePurchase = () => {
    proceedToPurchase();
  };

  const openGameDialog = (game: WepayGameProduct) => {
    setSelectedGameProduct(game);
    setGameDialogOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBalance(),
        loadGameProducts(true),
      ]);
      toast.success("รีเฟรชข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("ไม่สามารถรีเฟรชข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>BaimonShop เติมเกม เว็บเติมเกม รับเติมเกมราคาถูก ROV Free Fire PUBG</title>
        <meta name="description" content="BaimonShop เว็บเติมเกมออนไลน์อันดับ 1 รับเติมเกมราคาถูกที่สุด เติมเกม ROV Free Fire PUBG Mobile Legends Genshin Impact เว็ปเติมเกมฟีฟาย เติมเพชร Free Fire คุ้มๆ เติมเงิน ROV Garena เติมเกมถูกๆ รวดเร็ว ปลอดภัย 100% ระบบอัตโนมัติ บริการตลอด 24 ชั่วโมง ร้านเติมเกมที่ดีที่สุด baimon shop baimon-shop" />
        <meta name="keywords" content="BaimonShop, baimonshop, baimon shop, baimon-shop, เติมเกม BaimonShop, BaimonShop เว็บเติมเกม, เว็บเติมเกม BaimonShop, BaimonShop ราคาถูก, เติมเกม, เว็บเติมเกม, เว็ปเติมเกม, รับเติมเกม, เติมเกมราคาถูก, เติม rov, เติม valorant, เติม robux, เติม pubg mobile, เติม mobile legends, เติม genshin, rov เติม, valorant เติม, เติม apex, genshin impact เติม, เติม roblox, เติม fortnite, เติม pubg, mobile legends เติม, เติม mobile, fortnite เติม, apex เติม, เติม mlbb, เติม pes, เติม efootball, เติม minecraft, เติม overwatch, เติม ow2, เติม blue archive, เติม hearthstone, เติม carx street, เติม clash royale, เติม fifa online 4, เติม warzone, เติม cookie run kingdom, เติมเกม freefire, เติม rov, rov เติม, garena rov เติม, เติม garena, เติม free, garena เติม, เติม garena rov, garena เติม rov, เติมเกม rov, เว็บเติมเกม free fire, เติมเพชร free fire, เติมเงิน rov, เติมเกมฟรี, เว็บเติมเกมฟีฟายราคาถูก, เติมเงิน free fire, เติม free fire, เติมเงินเกม, เว็บเติมเกมราคาถูก, เติมเพชร free fire คุ้มๆ, เติมเงินเกม free fire, เติมเกม garena, เติมเกม garena free fire, ที่เติมเกม, garena เติมเงิน, เติมเกม free fire ฟรี, เติมเกมถูกๆ, เติม rov ถูก, เติม rov คุ้ม, เติม valorant ถูก, เติม robux ถูก, เติม robux ราคาถูก, ซื้อ robux, ซื้อ robux ราคาถูก, เติม roblox ราคาถูก, เติม pubg mobile ราคาถูก, เติม uc pubg mobile, เติม genshin impact, เติม bp genshin impact, garena เติมเกม, เติม bp genshin impact, เติมเงิน garena free fire, เติม garena free fire, free fire เติม, free fire เติมเกม, free fire เติมเงิน, garena free fire เติม, garena free fire เติมเกม, garena free fire เติมเงิน, ร้านเติมเกม, ร้านเติมเกมราคาถูก, ร้านเติมเกมถูกๆ, ร้าน robux, ร้านเติม robux, ร้านเติม valorant, ร้านเติม roblox, บริการเติมเกม, บริการเติมเกมราคาถูก, บริการเติม robux, บริการเติม roblox, บัตรเติมเกม, บัตร robux, บัตรเติม robux, garena rov เติมเกม, garena rov เติมเงิน, garena เติม free fire, garena เติมเกม free fire, garena เติมเกม rov, garena เติมเงิน free fire, garena เติมเงิน rov, garena เติมเงินเกม, rov garena เติม, rov เติมเกม, rov เติมเงิน, www เติมเกม, ที่เติม free fire, ที่เติม garena, ที่เติม garena free fire, ที่เติมเกม free fire, ที่เติมเกม garena, ที่เติมเกม garena free fire, ที่เติมเกม rov, ที่เติมเกมใน free fire, เกม free fire เติม, เกม free fire เติมเกม, เกมเติม, เกมเติม free fire, เกมเติมเกม, เกมเติมเกม free fire, เกมเติมเงิน, เงินเติมเกมฟรี, เติม free fire garena, เติม game, เติม rov garena, เติมมเกม, เติมเกม free, เติมเกม free fire garena, เติมเกม free fire เติมเกม, เติมเกม free fire เติมเกม free fire, เติมเกม garena rov, เติมเกม rov garena, เติมเกม rov ฟรี, เติมเกมม, เติมเกมมม, เติมเกมเกม, เติมเกมเงิน, เติมเกมเติมเกม, เติมเกมเติมเกม free fire, เติมเกมเติมเกมเติมเกม, เติมเกมเติมเงิน, เติมเกมใน garena, เติมเงิน free fire garena, บัตรเติม robux, เติมเงิน garena, เติมเงิน garena rov, เติมเงิน rov garena, เติมเงินเกม garena, เติมเงินเกม garena free fire, เติมเงินเกม rov, เติมเงินเติมเกม, เว็บเติมเกมออนไลน์, แอปเติมเกม, แอพเติมเกม, app เติมเกม, web เติมเกม, เว็บไซต์เติมเกม, ลิ้งค์เติมเกม, ระบบเติมเกม, ตัวแทนเติมเกม, สมัครตัวแทนเติมเกม, สูตรเติมเกม, เติมเงินใน free fire, เติมเงินใน rov, เติมเงินในเกม free fire, เติมเติม free fire, เติมเติมเกม, เติมเติมเกม free fire, เว็บเติมเกมถูกๆ, free fire เติมเพชรฟรี, ที่เติมเกม free fire ฟรี, ที่เติมเพชรเกม free fire, บัตรเติม free fire, บัตรเติมเกม free fire, รหัสเติมเกม free fire, รหัสเติมเพชร free fire, ราคาเติมเกม free fire, หาเว็บเติมเกม free fire, เกม free fire เติมเกม free fire, เกมเติมเพชรใน free fire, เติม free fire ครับ, เติม free fire คุ้มๆ, เติม free fire เติม free fire, เติมบัตร free fire, เติมบัตรเกม free fire, เติมรหัส free fire, เติมเกม free fire free fire, เติมเกม free fire คุ้ม, เติมเกม free fire คุ้มๆ, เติมเกม free fire ง่ายๆ, เติมเกม free fire ถูกๆ, เติมเกม free fire ราคาถูก, เติมเกม free fire สุดคุ้ม, เติมเกม free fire แบบง่ายๆ, เติมเกม free fire แบบถูกๆ, เติมเกมฟรี free fire, เติมเกมเกม free fire, เติมเกมใน free fire, เติมเติมเพชร free fire, เติมเพชร free fire คุ้ม, เติมเพชร free fire ถูกๆ, เติมเพชร free fire ราคาถูก, เติมเพชร free fire เติมเพชร free fire, เติมเพชร free fire แบบคุ้มๆ, เติมเพชรเกม free fire, เติมเพชรเติมเพชร free fire, เติมเพชรใน free fire, เติมเพชรในเกม free fire ฟรี, เพชรเติมเกม free fire, เพชรเพชร free fire, เว็บเติม free fire, เว็บเติมเกม free fire คุ้ม, เว็บเติมเกม free fire คุ้มๆ, เว็บเติมเกม free fire ถูก, เว็บเติมเกม free fire ฟรี, เว็บเติมเกม free fire สุดคุ้ม, เว็บเติมเกม free fire แบบถูกๆ, เว็บเติมเกมเพชร free fire, เว็บเติมเกมใน free fire, เว็บเติมเกมในเกม free fire, เว็บเติมเพชร free fire คุ้มๆ, เว็บเติมเพชร free fire ถูกๆ, เว็บเติมเพชร free fire ฟรี, เว็บเติมเพชร free fire ราคาถูก, เว็บเติมเพชรใน free fire, เว็บเติมเพชรในเกม free fire, เว็บเพชร free fire, เว็บเว็บเติมเกม free fire, แอปเติมเกม free fire, แอปเติมเกมในเกม free fire, แอพเติม free fire, แอพเติมเกม free fire ฟรี, บริการเติมเกมราคาถูก, รับเติมเกมราคาถูก, ร้านรับเติมเกม, ร้านเติมเกมถูกๆ, ร้านเติมเกมราคาถูก, เติมเกมถูก, เติมเกมถูกที่สุด, เติมเกมถูกๆฟีฟาย, เติมเกมฟีฟายคุ้มๆราคาถูก, เติมเกมฟีฟายราคาถูกที่สุด, เติมเกมราคาถูกๆ, เติมเกมออนไลน์ราคาถูก, เติมเงินเกมราคาถูก, เว็ปเติมฟีฟาย, เว็ปเติมเกมคุ้มๆ, เว็ปเติมเกมฟีฟาย, เว็ปเติมเพชร, เว็ปเติมเพชรฟีฟาย, เว็ปเติมเพชรฟีฟายคุ้มๆ, เว็บเติมฟีฟายถูกๆ, เว็บเติมฟีฟายราคาถูก, เว็บเติมเกมฟีฟายถูกๆ, เว็บเติมเกมฟีฟายราคาถูกที่สุด, เว็บเติมเกมฟีฟายราคาถูกๆ, เว็บเติมเกมราคาถูกที่สุด, เว็บเติมเกมราคาถูกฟีฟาย, เว็บเติมเกมราคาถูกมาก, เว็บเติมเกมราคาถูกๆ, แอปเติมเกมราคาถูก, topup game, game topup, topup rov, topup free fire, garena topup, mobile game topup" />
        <meta property="og:title" content="BaimonShop เติมเกม เว็บเติมเกม รับเติมเกมราคาถูก ROV Free Fire PUBG" />
        <meta property="og:description" content="BaimonShop เว็บเติมเกมออนไลน์อันดับ 1 รับเติมเกมราคาถูกที่สุด เติมเกม ROV Free Fire PUBG เว็ปเติมเกมฟีฟาย เติมเพชร Free Fire คุ้มๆ เติมเงิน ROV Garena ร้านเติมเกมที่ดีที่สุด รวดเร็ว ปลอดภัย 100% บริการตลอด 24 ชั่วโมง" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.baimonshop.com/game-topup" />
        <meta property="og:image" content="https://www.baimonshop.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BaimonShop เติมเกม เว็บเติมเกม รับเติมเกมราคาถูก" />
        <meta name="twitter:description" content="BaimonShop เว็บเติมเกมอันดับ 1 รับเติมเกมราคาถูก เติม ROV Free Fire PUBG เว็ปเติมเกมฟีฟาย เติมเพชร Free Fire คุ้มๆ ร้านเติมเกมที่ดีที่สุด" />
        <link rel="canonical" href="https://www.baimonshop.com/game-topup" />
      </Helmet>

      <style dangerouslySetInnerHTML={{
        __html: `

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .game-card-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .game-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(236, 72, 153, 0.2);
          border-color: rgba(236, 72, 153, 0.5);
        }
        .text-glow {
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.3);
        }
      `}} />

      {/* Schema Markup for Game Topup Service */}
      <SchemaMarkup
        type="service"
        data={{
          name: "บริการเติมเกมออนไลน์ BaimonShop",
          description: "บริการเติมเกม ROV Free Fire PUBG Mobile Legends Valorant Roblox ราคาถูกที่สุด",
          price: "10",
          currency: "THB",
          rating: 4.8,
          reviewCount: 2500,
          url: "https://www.baimonshop.com/game-topup"
        }}
      />

      <div className="relative text-white min-h-screen font-['Kanit',sans-serif] -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 p-6 sm:p-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-widest mb-2 animate-pulse">
              Gaming Top-up Center
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight text-glow">
              <span className="bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">BAIMON SHOP</span>
            </h1>
            <h2 className="text-base sm:text-xl text-pink-200/80 max-w-2xl mx-auto font-light leading-relaxed px-4">
              สัมผัสประสบการณ์การเติมเกมที่เร็วที่สุด ปลอดภัยที่สุด และคุ้มค่าที่สุดในไทย
            </h2>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pink-400 group-focus-within:text-pink-300 transition-colors" />
                <Input
                  placeholder="ค้นหาเกมโปรดของคุณ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 rounded-2xl bg-white/5 backdrop-blur-md text-white placeholder:text-pink-300/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 w-full border-white/10 text-lg transition-all"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="py-6 rounded-2xl bg-pink-600/20 backdrop-blur-md border-pink-500/30 text-white hover:bg-pink-600/30 active:scale-95 transition-all px-8"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Status Bar / User Info */}
        <div className="relative z-20 px-4 sm:px-10 py-4 flex flex-col xs:flex-row items-center justify-between gap-4 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-4 w-full xs:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider"></span>
              <span className="text-sm font-medium text-white/90 truncate max-w-[150px] xs:max-w-none">{userData?.username || ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 w-full xs:w-auto justify-between xs:justify-end">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">ยอดเงินในบัญชี</span>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-white text-glow">฿{userData?.balance?.toLocaleString() || "0"}</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-3 w-3 text-green-400" />
                </div>
              </div>
            </div>

            {isAdmin && wepayBalance && (
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-end">
                <span className="text-[9px] sm:text-[10px] text-orange-400 font-bold uppercase tracking-wider line-clamp-1">wePAY</span>
                <span className="text-xs sm:text-sm font-bold text-orange-200">฿{parseFloat(wepayBalance.available_balance).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        {showGameDetail && selectedGame ? (
          <section className="p-4 sm:p-8 max-w-7xl mx-auto relative z-10">
            {/* Back Button */}
            <div className="mb-8">
              <button
                onClick={backToGameList}
                className="group flex items-center gap-3 text-pink-400 hover:text-white transition-all bg-white/5 pr-6 pl-4 py-2 rounded-full border border-white/10 hover:border-pink-500/50"
              >
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/40 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">กลับไปเลือกเกม</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Game Profile & Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Gamepad2 className="h-32 w-32" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="w-40 h-40 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-1 shadow-2xl">
                      <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-zinc-900 flex items-center justify-center">
                        {selectedGame.img ? (
                          <img
                            src={selectedGame.img}
                            alt={selectedGame.category}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Gamepad2 className="h-16 w-16 text-pink-500/50" />
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-5xl font-extrabold text-glow tracking-tight leading-tight">
                        {selectedGame.category}
                      </h2>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                          เปิดให้บริการ
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          ระบบอัตโนมัติ
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-xs font-bold text-pink-400 uppercase">รายละเอียดแพ็กเกจ</span>
                        <p className="text-white/80 leading-relaxed italic">
                          "{stripHtmlTags(selectedGame.info)}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-xs text-white/50 block mb-1">ราคาเริ่มต้น</span>
                          <span className="text-xl font-bold text-green-400">
                            ฿{formatPriceDisplay(selectedGame.recommendedPrice).text}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-xs text-white/50 block mb-1">ความเร็ว</span>
                          <span className="text-xl font-bold text-pink-400">1-3 นาที</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Form */}
              <div className="lg:col-span-7">
                <div className="glass-panel p-8 rounded-3xl space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <ShoppingCart className="h-6 w-6 text-pink-400" />
                      ข้อมูลการสั่งซื้อ
                    </h3>
                    <p className="text-white/50 text-sm mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการ</p>
                  </div>

                  <div className="space-y-6">
                    {isHeartopia(selectedGame) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-pink-300">AID (หมายเลขบัญชี)</label>
                          <Input
                            placeholder="18 หลัก"
                            value={gameAID}
                            onChange={(e) => setGameAID(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-2xl p-6 text-lg tracking-wider"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-pink-300">UID (6 หลัก)</label>
                          <Input
                            placeholder="กรอก UID"
                            value={gameUID}
                            onChange={(e) => setGameUID(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-2xl p-6 text-lg tracking-wider"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-pink-300">กรอก UID / Game ID</label>
                        <Input
                          placeholder="ตัวอย่าง: 123456789 หรือ UID|Server"
                          value={gameUID}
                          onChange={(e) => setGameUID(e.target.value)}
                          className="bg-white/5 border-white/10 rounded-2xl p-6 text-lg tracking-wider"
                        />
                        <p className="text-[10px] text-white/40 italic">* {formatUIDPattern(selectedGame.format_id || "")}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      {gamePackages.map(pkg => (
                        <div key={pkg.id} className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-center sm:text-left">
                              <span className="text-xs font-bold text-pink-300 uppercase block mb-1">แพ็กเกจที่คุณเลือก</span>
                              <h4 className="text-xl font-bold">{stripHtmlTags(pkg.amount)}</h4>
                            </div>
                            <div className="text-center sm:text-right">
                              <span className="text-xs text-white/50 block mb-1">ยอดเงินที่ต้องชำระ</span>
                              <span className="text-3xl font-black text-green-400">฿{formatPriceDisplay(pkg.costPrice).text}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={gamePurchasing}
                      className="w-full py-8 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xl font-bold shadow-lg shadow-pink-600/30 active:scale-95 transition-all"
                    >
                      {gamePurchasing ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>กำลังตรวจสอบรายการ...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-6 w-6" />
                          <span>ยืนยันการสั่งซื้อ</span>
                        </div>
                      )}
                    </Button>

                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <p className="text-[11px] text-yellow-200/80 leading-relaxed">
                        โปรดตรวจสอบ UID/Game ID ให้ถูกต้อง หากกรอกข้อมูลผิดพลาด ทางระบบจะไม่รับผิดชอบในทุกกรณีและไม่สามารถขอคืนเงินได้
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : showCategoryGames && selectedCategory ? (
          /* Category Games Page - แสดงเกมในหมวดหมู่ */
          <section className="p-3 sm:p-4 md:p-6">
            {/* Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={backToCategories}
                className="text-pink-400 hover:text-pink-300 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับไปหน้ารวมหมวดหมู่
              </button>
            </div>

            {/* Category Header */}
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                <Gamepad2 className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                {selectedCategory}
              </h2>
              <p className="text-pink-300 mt-2">เลือกแพ็คเกจราคาในหมวดหมู่นี้</p>
            </div>

            {/* Games Grid (Grouped variants per game) */}
            {(() => {
              // กรองเกมตามหมวดหมู่จาก API โดยตรง
              const filtered = gameProducts.filter(game => game.category === selectedCategory);

              // จัดกลุ่มสินค้าเดียวกัน ต่างกันที่ราคา (ใช้ key จากชื่อเกม category)
              const map = new Map<string, { key: string; category: string; img?: string; variants: WepayGameProduct[]; infoSample?: string }>();
              for (const g of filtered) {
                const key = (g.category || '').trim().toLowerCase();
                if (!map.has(key)) {
                  map.set(key, { key, category: g.category, img: g.img, variants: [g], infoSample: g.info });
                } else {
                  const group = map.get(key)!;
                  group.variants.push(g);
                  if (!group.img && g.img) group.img = g.img;
                  if (!group.infoSample && g.info) group.infoSample = g.info;
                }
              }
              const groups = Array.from(map.values());
              groups.forEach(gr => gr.variants.sort((a, b) => {
                const adminA = adminPrices.get(a.id);
                const adminB = adminPrices.get(b.id);
                const sellA = adminA?.sellPrice || (parseFloat(a.price) || parseFloat(a.pay_to_amount) || 0);
                const sellB = adminB?.sellPrice || (parseFloat(b.price) || parseFloat(b.pay_to_amount) || 0);
                return sellA - sellB;
              }));

              if (groups.length === 0) {
                return (
                  <div className="text-center text-pink-300">ไม่พบเกมในหมวดหมู่นี้</div>
                );
              }

              return (
                <div className="grid grid-cols-1 gap-6">
                  {groups.map(group => (
                    <div
                      key={group.key}
                      className="group bg-black/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 transition-all duration-300 hover:bg-black/40 hover:shadow-pink-500/25 border border-pink-500/30"
                    >
                      {/* Game Image */}
                      <div className="w-48 h-48 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                        {group.img ? (
                          <img
                            src={group.img}
                            alt={group.category}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const _sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (_sibling) _sibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center" style={{ display: group.img ? 'none' : 'flex' }}>
                          <Gamepad2 className="h-20 w-20 text-white opacity-70" />
                        </div>
                      </div>                        {/* Game Info */}
                      <div className="text-center">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors text-center line-clamp-2">
                          {group.category}
                        </h2>
                        {group.infoSample && (
                          <p className="text-pink-300 text-sm mb-3 whitespace-pre-line text-center">{formatGameInfo(group.infoSample)}</p>
                        )}
                      </div>

                      {/* Variants (prices) */}
                      <div className="space-y-2">
                        <p className="text-sm text-pink-300">เลือกราคา</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.variants.map(variant => (
                            <div key={variant.id} className="flex flex-col gap-2 rounded-xl border border-pink-500/30 bg-black/20 p-3 md:p-4">
                              <div className="min-w-0">
                                {(() => {
                                  // คำนวณราคาขายและต้นทุนที่แอดมินตั้งไว้
                                  const adminData = adminPrices.get(variant.id);
                                  const cost = adminData && adminData.apiPrice !== undefined
                                    ? (typeof adminData.apiPrice === 'string' ? parseFloat(adminData.apiPrice) : adminData.apiPrice)
                                    : (parseFloat(variant.price) || parseFloat(variant.pay_to_amount) || 0);
                                  const sellPrice = adminData?.sellPrice || cost;

                                  return (
                                    <>
                                      {isAdmin && (
                                        <div className="mb-2">
                                          <div className="text-xs text-orange-400 font-medium">ราคาต้นทุน wePAY</div>
                                          <div className="text-sm text-orange-300 font-bold">฿{cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</div>
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">ราคาขายหน้าเว็บ</div>
                                      <div className="relative">
                                        <div className="font-extrabold text-green-400 text-base sm:text-lg">
                                          ฿{sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท
                                        </div>
                                      </div>
                                      {isAdmin && (
                                        <div className="mt-1">
                                          <div className={`text-xs font-bold ${sellPrice - cost > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            กำไรจริง: ฿{(sellPrice - cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              {variant.info && (
                                <div className="text-xs text-gray-400 whitespace-pre-line mt-1">{formatGameInfo(variant.info)}</div>
                              )}
                              <Button
                                size="sm"
                                onClick={() => openGameDetail(variant)}
                                className="w-full"
                              >
                                เลือก
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        ) : (
          /* Categories Page - แสดงหมวดหมู่ทั้งหมด */
          <section className="p-6">
            {(() => {
              // สร้างหมวดหมู่จาก API (ชื่อเกม)
              const map = new Map<string, { name: string; img?: string; count: number }>();
              for (const g of gameProducts) {
                const name = g.category || "อื่นๆ";
                if (!map.has(name)) {
                  map.set(name, { name, img: g.img, count: 1 });
                } else {
                  const c = map.get(name)!;
                  c.count += 1;
                  if (!c.img && g.img) c.img = g.img;
                }
              }
              const apiCategories = Array.from(map.values())
                .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              if (apiCategories.length === 0) {
                return (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gamepad2 className="h-16 w-16 text-pink-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">ยังไม่มีข้อมูลเกม</h3>
                    <p className="text-pink-300">โปรดลองรีเฟรชหรือกลับมาใหม่ภายหลัง</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {apiCategories.map((category) => (
                    <div
                      key={category.name}
                      onClick={() => openCategory(category.name)}
                      className="group bg-black/30 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-black/40 transition-all duration-300 hover:scale-105 hover:shadow-pink-500/25 border border-pink-500/30"
                    >
                      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-panel border border-white/5 group-hover:border-pink-500/50 transition-colors">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-black/40 z-10" />

                        {/* Image */}
                        <div className="absolute inset-0">
                          {category.img ? (
                            <img
                              src={category.img}
                              alt={category.name}
                              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                              <Gamepad2 className="h-16 w-16 text-pink-500/50" />
                            </div>
                          )}
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-20">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                          <div className="relative">
                            <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white line-clamp-2 group-hover:text-pink-300 transition-colors leading-tight">
                              {category.name}
                            </h3>
                            <div className="flex items-center flex-nowrap gap-2 mt-1">
                              <Badge className="bg-pink-600/40 text-pink-200 border-none text-[10px] py-0 px-2 whitespace-nowrap">
                                {category.count} แพ็กเกจ
                              </Badge>
                              <div className="h-1 w-1 rounded-full bg-white/30 shrink-0" />
                              <span className="text-white/50 text-[10px] font-medium whitespace-nowrap">Auto</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Outer Glow */}
                      <div className="absolute -inset-2 bg-pink-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] -z-10" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategory(category.name);
                        }}
                        className="w-full mt-2 sm:mt-4 py-2 sm:py-3 px-2 sm:px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25"
                      >
                        <span className="hidden sm:inline">ดูแพ็คในเกม</span>
                        <span className="sm:hidden">ดูเกม</span>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}
      </div>

      {/* Game Purchase Dialog */}
      <AlertDialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              เติมเกม
            </AlertDialogTitle>
            <AlertDialogDescription>
              กรอกข้อมูลเพื่อเติมเกม
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedGameProduct && (
              <div className="bg-muted p-4 rounded-lg space-y-1">
                <h3 className="font-semibold">{selectedGameProduct.category}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {formatGameInfo(selectedGameProduct.info)}
                </p>
                {selectedPackage && (
                  <div className="relative">
                    <p className="text-lg font-bold text-green-600">
                      {selectedPackage.costPrice.toLocaleString()} บาท
                    </p>
                  </div>
                )}
                {/* ── debug: แสดง format_id จาก wePAY ── */}
                {selectedGameProduct.format_id && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-mono break-all">
                    ⚠️ format_id: {selectedGameProduct.format_id}
                  </p>
                )}
              </div>
            )}

            {selectedGameProduct && isHeartopia(selectedGameProduct) ? (
              /* ─── Heartopia: 2 ช่อง ─── */
              <>
                <div className="bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-500/40 rounded-lg p-3 text-sm text-pink-700 dark:text-pink-200">
                  💡 Heartopia ต้องกรอก <strong>AID</strong> และ <strong>UID</strong> แยกกัน
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameAID">AID (หมายเลขบัญชี 18 หลัก) *</Label>
                  <Input
                    id="gameAID"
                    placeholder="เช่น 123456789012345678"
                    value={gameAID}
                    onChange={(e) => setGameAID(e.target.value.trim())}
                    className="font-mono tracking-wide"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameUID">UID (รหัสผู้เล่น 6 ตัว) *</Label>
                  <Input
                    id="gameUID"
                    placeholder="เช่น ab12cd"
                    value={gameUID}
                    onChange={(e) => setGameUID(e.target.value.trim())}
                    className="font-mono tracking-wide"
                    maxLength={20}
                  />
                </div>
              </>
            ) : (
              /* ─── เกมทั่วไป: 1 ช่อง ─── */
              <div className="space-y-2">
                <Label htmlFor="gameUID">UID / ไอดีเกม *</Label>
                <Input
                  id="gameUID"
                  placeholder="กรอก UID หรือ ID ผู้เล่น"
                  value={gameUID}
                  onChange={(e) => setGameUID(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gameNotes">หมายเหตุเพิ่มเติม</Label>
              <Input
                id="gameNotes"
                placeholder="หมายเหตุเพิ่มเติม..."
                value={gameNotes}
                onChange={(e) => setGameNotes(e.target.value)}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              disabled={gamePurchasing}
              onClick={async (e) => {
                // ป้องกันการปิด Dialog ทันทีถ้ายังโหลดอยู่ และป้องกันการกดซ้ำ
                if (gamePurchasing) {
                  e.preventDefault();
                  return;
                }

                e.preventDefault(); // ปกติ AlertDialogAction จะปิดเอง เราต้องคุมเองถ้าต้องการรอมันหมุน 

                if (!selectedGameProduct) {
                  toast.error("ไม่พบข้อมูลเกม");
                  return;
                }
                if (isHeartopia(selectedGameProduct)) {
                  if (!gameAID.trim() || !gameUID.trim()) {
                    toast.error("กรุณากรอก AID และ UID ให้ครบถ้วน");
                    return;
                  }
                } else if (!gameUID.trim()) {
                  toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
                  return;
                }

                // ตรวจสอบ balance จากฐานข้อมูลเว็บ (Firebase)
                const webBalance = userData?.balance || 0;
                const apiPrice = parseFloat(selectedGameProduct.price) || 0;
                const recommendedPrice = parseFloat(selectedGameProduct.recommendedPrice) || 0;
                const rawSellPrice = await getProductSellPrice(selectedGameProduct.id as unknown as number, 'game', apiPrice, recommendedPrice);
                const sellPrice = Math.round(rawSellPrice);
                if (webBalance < sellPrice) {
                  toast.error(`ยอดเงินในระบบไม่พอ (ยอดเงิน: ${webBalance.toLocaleString()} บาท, ราคา: ${sellPrice.toLocaleString()} บาท) กรุณาเติมเงินก่อน`);
                  return;
                }

                // ตรวจสอบ wePAY balance
                const wepayAvailable = wepayBalance?.available_balance ?? Infinity;
                if (wepayAvailable < apiPrice) {
                  toast.error(`ยอดเงินใน wePAY ไม่พอ (คงเหลือ: ${wepayAvailable.toLocaleString()} บาท, ราคา: ${apiPrice.toLocaleString()} บาท)`);
                  return;
                }

                setGamePurchasing(true);
                try {
                  // สร้าง dest_ref ให้สั้นลง (ห้ามเกิน 20 ตัวอักษรตาม spec wePAY)
                  // ใช้ timestamp 10 หลักหลัง + สุ่ม 5 หลัก = 15 หลัก (ปลอดภัย)
                  const dest_ref = `G${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

                  // Heartopia: AID = ref1, UID = ref2
                  // เกมอื่น: split uid|server (ถ้ามี | )
                  let pay_to_ref1: string;
                  let pay_to_ref2: string | undefined;

                  if (isHeartopia(selectedGameProduct)) {
                    pay_to_ref1 = `${gameAID.trim()} ${gameUID.trim()}`;
                    pay_to_ref2 = undefined;
                    console.log(`🎮 Heartopia ref1 prepared.`);
                  } else {
                    // แยก server ID ถ้ากรอกมาในรูป uid|server
                    const parts = gameUID.trim().split('|');
                    pay_to_ref1 = parts[0].trim();
                    pay_to_ref2 = parts[1]?.trim();
                  }

                  const result = await purchaseWepayGame({
                    dest_ref,
                    pay_to_company: selectedGameProduct.pay_to_company,
                    pay_to_amount: selectedGameProduct.pay_to_amount || String(apiPrice),
                    pay_to_ref1,
                    pay_to_ref2,
                    type: selectedGameProduct.type,
                  });

                  console.log('✅ wePAY purchase result:', result);

                  // หักเงินจาก balance ในฐานข้อมูล
                  if (user) {
                    try {
                      const userRef = doc(db, "users", user.uid);
                      await updateDoc(userRef, { balance: increment(-sellPrice) });
                      console.log(`✅ หักเงิน ${sellPrice} บาทจาก balance สำเร็จ`);
                      await loadData();
                    } catch (balanceError) {
                      console.error('❌ ไม่สามารถหักเงินได้:', balanceError);
                      toast.error("ส่งคำสั่งซื้อแล้วแต่ไม่สามารถหักเงินจากระบบได้ กรุณาติดต่อผู้ดูแล");
                    }
                    try {
                      await recordPurchaseWithSellPrice(
                        user.uid,
                        'game',
                        dest_ref,
                        0,
                        sellPrice,
                        apiPrice,
                        selectedGameProduct.category,
                        selectedGameProduct.pay_to_company,
                        selectedGameProduct.info,
                        'success'
                      );
                    } catch (recordError) {
                      console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
                      await addUserPurchaseReference(user.uid, 'game', dest_ref, sellPrice);
                    }
                  }

                  // --- สำเร็จ: ปิดหน้าสั่งซื้อและเปิด Success Modal ---
                  setPurchaseDetails({
                    gameName: selectedGameProduct.category,
                    packageName: selectedGameProduct.info,
                    amount: sellPrice,
                    destRef: dest_ref
                  });

                  setGamePurchasing(false);
                  setGameDialogOpen(false);
                  setShowSuccessModal(true);

                  toast.success("ส่งคำสั่งซื้อสำเร็จ!");
                  setGameUID("");
                  setGameAID("");
                  setGameNotes("");
                  await loadData();
                } catch (error: any) {
                  console.error("Error purchasing game:", error);
                  const msg = error?.message || '';
                  // แปลง wePAY error code
                  const codeMatch = msg.match(/wePAY error (\d+)/);
                  if (codeMatch) {
                    toast.error(wepayErrorText(codeMatch[1]));
                  } else {
                    toast.error(`เกิดข้อผิดพลาด: ${msg || 'ไม่ทราบสาเหตุ'}`);
                  }
                } finally {
                  setGamePurchasing(false);
                }
              }}
            >
              {gamePurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังประมวลผล...
                </>
              ) : (
                "ยืนยันการสั่งซื้อ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent className="bg-slate-900 border-none text-white max-w-md">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-green-500">
              สั่งซื้อสำเร็จ!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              ระบบได้รับคำสั่งซื้อของคุณแล้วและกำลังดำเนินการเติมเข้าสู่ระบบเกม
            </AlertDialogDescription>
          </AlertDialogHeader>

          {purchaseDetails && (
            <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 my-4 space-y-4 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CheckCircle2 className="h-16 sm:h-24 w-16 sm:w-24" />
              </div>

              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">ข้อมูลเกม</span>
                <span className="font-bold text-white text-base">{stripHtmlTags(purchaseDetails.gameName)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">ชื่อแพ็กเกจ</span>
                <span className="font-bold text-pink-300 text-base">{formatGameInfo(purchaseDetails.packageName)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">ยอดชำระทั้งสิ้น</span>
                <span className="text-green-400 font-black text-2xl">฿{purchaseDetails.amount}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-slate-500 uppercase text-[9px] font-bold tracking-widest">หมายเลขอ้างอิง (Ref ID)</span>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="font-mono text-sm text-pink-200">{purchaseDetails.destRef}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/30 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(purchaseDetails.destRef);
                      toast.success("คัดลอกรหัสอ้างอิงแล้ว");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white"
              onClick={() => {
                setShowSuccessModal(false);
                // นำทางไปหน้าประวัติ (ถ้ามี path นี้)
                window.location.hash = "#history";
                // หรือถ้าใช้ react-router
                // navigate("/history");
              }}
            >
              <History className="mr-2 h-4 w-4" />
              ดูประวัติการสั่งซื้อ
            </Button>
            <AlertDialogAction
              className="w-full bg-green-600 hover:bg-green-700 text-white border-none"
              onClick={() => setShowSuccessModal(false)}
            >
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default GameTopUp;