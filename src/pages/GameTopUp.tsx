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
import { getProductSellPrice } from "@/lib/peamsubPriceUtils";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GameTopUp = () => {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === "admin";

  // User Info (wePAY balance)
  const [wepayBalance, setWepayBalance] = useState<WepayBalance | null>(null);

  // Game Products
  const [gameProducts, setGameProducts] = useState<WepayGameProduct[]>([]);
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

  const loadGameProducts = async () => {
    try {
      const allProducts = await getWepayGameProducts();
      setGameProducts(allProducts);
      console.log("🎮 Loaded all wePAY game products:", allProducts.length);
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
  const openGameDetail = (game: WepayGameProduct) => {
    setSelectedGame(game);
    setShowGameDetail(true);
    setShowCategoryGames(false);

    console.log("🎮 GameTopUp: เปิดรายละเอียดเกม:", game.category);
    console.log("💰 GameTopUp: ราคาต้นทุน (price):", game.price);
    console.log("💎 GameTopUp: ราคาขาย (recommendedPrice):", game.recommendedPrice);

    // สร้างแพ็คเกจเดียวจากข้อมูล API โดยตรง
    const gamePackage = {
      id: game.id,
      name: game.category,
      amount: game.info,
      price: parseFloat(game.price) || 0,
      costPrice: parseFloat(game.recommendedPrice) || 0,
      discount: 0,
      description: game.info,
      details: '',
      icon: getGameIcon(game.category),
      color: getGameColor(game.category),
      popular: false,
      formatId: game.format_id
    };

    console.log("📦 แพ็คเกจที่แสดง:", gamePackage);
    setGamePackages([gamePackage]);
    setSelectedPackage(gamePackage); // เลือกแพ็คเกจเดียวทันที

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

    // ลบ HTML tags
    let cleanInfo = stripHtmlTags(info);

    // แทนที่ HTML entities
    cleanInfo = cleanInfo
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // ลบช่องว่างเกิน
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

  const openGameDialog = (game: WepayGameProduct) => {
    setSelectedGameProduct(game);
    setGameDialogOpen(true);
  };

  const handleRefresh = () => {
    loadData();
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

      <div className="relative bg-gradient-to-b from-[#0f0f2d] to-[#1a0033] text-white min-h-screen font-['Kanit',sans-serif] -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 overflow-hidden">
        {/* Gaming Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Circuit Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                  linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
                `,
              backgroundSize: '30px 30px',
              animation: 'gridMove 30s linear infinite'
            }}
          />

          {/* Gaming Particles */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/60 rounded-full gaming-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            />
          ))}

          {/* Energy Waves */}
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent gaming-scanline" />
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent gaming-scanline" style={{ animationDelay: '2s', animationDuration: '5s' }} />

          {/* Corner Effects */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-purple-600/20 to-transparent blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-blue-600/20 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                เติมเกม เว็บเติมเกม รับเติมเกมราคาถูก BaimonShop
              </h1>
              <h2 className="text-lg sm:text-xl text-purple-200 mt-2">
                เว็บเติมเกมออนไลน์อันดับ 1 | เติมเกม ROV Free Fire PUBG Mobile Legends Genshin Impact ราคาถูกที่สุด
              </h2>
              <p className="text-purple-300 mt-1 sm:mt-2 text-sm sm:text-base"><strong>รับเติมเกมออนไลน์</strong> • เว็ปเติมเกมราคาถูก • เติมเกมฟีฟาย เติมเพชร Free Fire คุ้มๆ • เติมเงิน ROV Garena • ร้านเติมเกมถูกๆ • บริการตลอด 24 ชั่วโมง</p>
              <div className="mt-2 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-purple-300">
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" />
                <Input
                  placeholder="ค้นหาเกม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-black/30 backdrop-blur-sm text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full border-purple-500/30 text-sm sm:text-base"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
                className="bg-black/30 backdrop-blur-sm border-purple-500/30 text-white hover:bg-purple-500/20 sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Game Detail Page */}
        {showGameDetail && selectedGame ? (
          <section className="p-3 sm:p-4 md:p-6">
            {/* Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={backToGameList}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับไปหน้ารวมเกม
              </button>
            </div>

            {/* Game Header */}
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                {selectedGame.img ? (
                  <img
                    src={selectedGame.img}
                    alt={`เติม ${selectedGame.category} - BaimonShop รับเติมเกมออนไลน์`}
                    title={`เติมเกม ${selectedGame.category} - BaimonShop`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const _sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (_sibling) _sibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center" style={{ display: selectedGame.img ? 'none' : 'flex' }}>
                  <Gamepad2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {selectedGame.category}
              </h2>
            </div>

            {/* Game Info */}
            <div className="mb-8">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-2xl font-bold text-center mb-4 text-white">ข้อมูลเกม</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Game Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">ชื่อเกม:</span>
                      <span className="text-white font-semibold">{selectedGame.category}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">รายละเอียด:</span>
                      <span className="text-purple-300 text-sm">{formatGameInfo(selectedGame.info)}</span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">ราคาต้นทุน:</span>
                        <span className="text-orange-400 font-semibold">฿{selectedGame.price} บาท</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">ราคาขาย:</span>
                      {(() => {
                        const { text, hasFraction } = formatPriceDisplay(selectedGame.recommendedPrice);
                        return (
                          <span className="text-green-400 font-bold text-lg">{text} บาท</span>
                        );
                      })()}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">กำไร:</span>
                        <span className="text-purple-400 font-semibold">
                          ฿{(parseFloat(selectedGame.recommendedPrice) - parseFloat(selectedGame.price)).toFixed(2)} บาท
                        </span>
                      </div>
                    )}

                    {selectedGame.format_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">รูปแบบ UID:</span>
                        <div className="text-right">
                          <span className="text-yellow-400 font-mono text-sm bg-black/20 px-2 py-1 rounded block">
                            {selectedGame.format_id}
                          </span>
                          <span className="text-green-400 text-xs">
                            {formatUIDPattern(selectedGame.format_id)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Game Image */}
                  <div className="flex justify-center">
                    <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center overflow-hidden">
                      {selectedGame.img ? (
                        <img
                          src={selectedGame.img}
                          alt={selectedGame.category}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const _sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (_sibling) _sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{ display: selectedGame.img ? 'none' : 'flex' }}>
                        <Gamepad2 className="h-20 w-20 text-white opacity-70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-2xl font-bold text-center mb-6 text-white">ฟอร์มสั่งซื้อ</h3>
              <div className="space-y-4">

                {/* ─── Heartopia: 2 ช่อง AID + UID ─── */}
                {isHeartopia(selectedGame) ? (
                  <>
                    <div className="bg-blue-900/30 border border-blue-500/40 rounded-xl p-3 text-sm text-blue-200">
                      💡 <strong>Heartopia</strong> ต้องกรอก <strong>AID</strong> (หมายเลขบัญชี 18 หลัก) และ <strong>UID</strong> (รหัส 6 ตัว) แยกกัน
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        AID (หมายเลขบัญชี) *
                        <span className="text-yellow-400 text-xs ml-2">(18 หลัก)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="กรอก AID 18 หลัก เช่น 123456789012345678"
                        value={gameAID}
                        onChange={(e) => setGameAID(e.target.value.trim())}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border-purple-500/30 font-mono tracking-wide"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        UID (รหัสผู้เล่น) *
                        <span className="text-yellow-400 text-xs ml-2">(รหัส 6 ตัว)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="กรอก UID เช่น ab12cd"
                        value={gameUID}
                        onChange={(e) => setGameUID(e.target.value.trim())}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border-purple-500/30 font-mono tracking-wide"
                        maxLength={20}
                      />
                    </div>
                  </>
                ) : (
                  /* ─── เกมทั่วไป: 1 ช่อง UID ─── */
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      UID / ID ผู้เล่น *
                      {selectedGame.format_id && (
                        <span className="text-yellow-400 text-xs ml-2">
                          (รูปแบบ: {formatUIDPattern(selectedGame.format_id)})
                        </span>
                      )}
                    </label>
                    <Input
                      type="text"
                      placeholder="กรอก UID หรือ ID ผู้เล่น"
                      value={gameUID}
                      onChange={(e) => setGameUID(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border-purple-500/30"
                    />
                    {selectedGame.format_id && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-yellow-400">
                          💡 รูปแบบที่ต้องการ: {formatUIDPattern(selectedGame.format_id)}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          Pattern: {selectedGame.format_id}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-purple-300 mb-2">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                  <Input
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={gameNotes}
                    onChange={(e) => setGameNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border-purple-500/30"
                  />
                </div>
                <button
                  onClick={proceedToPurchase}
                  disabled={isHeartopia(selectedGame) ? (!gameAID.trim() || !gameUID.trim()) : !gameUID.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  ดำเนินการต่อ
                </button>
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
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับไปหน้ารวมหมวดหมู่
              </button>
            </div>

            {/* Category Header */}
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                <Gamepad2 className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {selectedCategory}
              </h2>
              <p className="text-purple-300 mt-2">เลือกแพ็คเกจราคาในหมวดหมู่นี้</p>
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
              // เรียงแต่ละกลุ่มตามราคาขายจากถูกไปแพง
              groups.forEach(gr => gr.variants.sort((a, b) => (parseFloat(a.recommendedPrice || a.price) || 0) - (parseFloat(b.recommendedPrice || b.price) || 0)));

              if (groups.length === 0) {
                return (
                  <div className="text-center text-purple-300">ไม่พบเกมในหมวดหมู่นี้</div>
                );
              }

              return (
                <div className="grid grid-cols-1 gap-6">
                  {groups.map(group => (
                    <div
                      key={group.key}
                      className="group bg-black/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 transition-all duration-300 hover:bg-black/40 hover:shadow-purple-500/25 border border-purple-500/30"
                    >
                      {/* Game Image */}
                      <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
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
                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors text-center">
                          {group.category}
                        </h2>
                        {group.infoSample && (
                          <p className="text-purple-300 text-sm mb-3 whitespace-pre-line text-center">{formatGameInfo(group.infoSample)}</p>
                        )}
                      </div>

                      {/* Variants (prices) */}
                      <div className="space-y-2">
                        <p className="text-sm text-purple-300">เลือกราคา</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.variants.map(variant => (
                            <div key={variant.id} className="flex flex-col gap-2 rounded-xl border border-purple-500/30 bg-black/20 p-3 md:p-4">
                              <div className="min-w-0">
                                {isAdmin && (
                                  <div className="mb-2">
                                    <div className="text-xs text-orange-400">ราคาต้นทุน</div>
                                    <div className="text-sm text-orange-300 font-medium">฿{variant.price} บาท</div>
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">ราคาขาย</div>
                                <div className="relative">
                                  {(() => {
                                    const { text, hasFraction } = formatPriceDisplay(variant.recommendedPrice);
                                    return (
                                      <>
                                        <div className="font-semibold text-green-400 truncate">{text} บาท</div>
                                        {hasFraction && (
                                          <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-green-400 ring-2 ring-black" />
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                                {isAdmin && (
                                  <div className="mt-1">
                                    <div className="text-xs text-purple-300">
                                      กำไร: ฿{(parseFloat(variant.recommendedPrice) - parseFloat(variant.price)).toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {variant.info && (
                                <div className="text-xs text-gray-400 whitespace-pre-line">{formatGameInfo(variant.info)}</div>
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
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gamepad2 className="h-16 w-16 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">ยังไม่มีข้อมูลเกม</h3>
                    <p className="text-purple-300">โปรดลองรีเฟรชหรือกลับมาใหม่ภายหลัง</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {apiCategories.map((category) => (
                    <div
                      key={category.name}
                      onClick={() => openCategory(category.name)}
                      className="group bg-black/30 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-black/40 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/25 border border-purple-500/30"
                    >
                      {/* Category Image */}
                      <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg sm:rounded-xl mb-2 sm:mb-4 flex items-center justify-center overflow-hidden">
                        {category.img ? (
                          <img
                            src={category.img}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-white opacity-70" />
                        )}
                      </div>                        {/* Category Info */}
                      <div className="text-center">
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 md:mb-4 group-hover:text-purple-300 transition-colors line-clamp-2">
                          {category.name}
                        </h2>
                        <div className="flex items-center justify-center mb-2 sm:mb-0">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {category.count} รายการ
                          </Badge>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategory(category.name);
                        }}
                        className="w-full mt-2 sm:mt-4 py-2 sm:py-3 px-2 sm:px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
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
                {(() => {
                  const { text, hasFraction } = formatPriceDisplay(selectedGameProduct.recommendedPrice);
                  return (
                    <div className="relative">
                      <p className="text-lg font-bold text-green-600">{text} บาท</p>
                      {hasFraction && (
                        <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-green-400 ring-2 ring-black" />
                      )}
                    </div>
                  );
                })()}
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
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/40 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-200">
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
              onClick={async () => {
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
                        selectedGameProduct.info
                      );
                    } catch (recordError) {
                      console.warn('⚠️ ไม่สามารถบันทึกราคาขายได้:', recordError);
                      await addUserPurchaseReference(user.uid, 'game', dest_ref, sellPrice);
                    }
                  }

                  toast.success(`ส่งคำสั่งเติมเกมแล้ว! (Ref: ${result.transaction_id || dest_ref})`);
                  setGameDialogOpen(false);
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
              disabled={gamePurchasing}
            >
              {gamePurchasing ? "กำลังเติม..." : "เติมเกม"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default GameTopUp;