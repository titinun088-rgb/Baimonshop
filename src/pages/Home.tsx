import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Gamepad2, 
  Smartphone, 
  ArrowRight,
  Loader2,
  Package,
  Shield,
  Clock,
  Zap,
  ThumbsUp,
  Star,
  Sparkles,
  Award,
  Phone
} from "lucide-react";
import { getPeamsubProducts, PeamsubProduct, getPeamsubGameProducts, PeamsubGameProduct } from "@/lib/peamsubUtils";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PeamsubProduct[]>([]);
  const [gameProducts, setGameProducts] = useState<PeamsubGameProduct[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadGameProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getPeamsubProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGameProducts = async () => {
    setGamesLoading(true);
    try {
      const data = await getPeamsubGameProducts();
      setGameProducts(data);
    } catch (error) {
      console.error("Error loading game products:", error);
      setGameProducts([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const menuItems = [
    {
      title: "เติมเกมออนไลน์",
      description: "ROV Free Fire PUBG Mobile Legends",
      icon: Gamepad2,
      path: "/game-topup",
      gradient: "from-purple-500 to-blue-500",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"
    },
    {
      title: "แอปพรีเมียม",
      description: "Netflix Spotify YouTube Premium",
      icon: Smartphone,
      path: "/premium-app",
      gradient: "from-blue-500 to-cyan-500",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400"
    },
    {
      title: "บัตรเงินสด",
      description: "Steam Garena iTunes PSN",
      icon: CreditCard,
      path: "/cash-card",
      gradient: "from-green-500 to-emerald-500",
      image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400"
    },
    {
      title: "เติมเงินมือถือ",
      description: "AIS True DTAC TrueMoney",
      icon: Phone,
      path: "/top-up",
      gradient: "from-orange-500 to-red-500",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400"
    }
  ];

  // จัดกลุ่มเกมตามหมวดหมู่จาก API
  const getPopularGames = () => {
    if (gameProducts.length === 0) return [];

    // จัดกลุ่มเกมตาม category (เอาเฉพาะเกมที่มีรูป)
    const uniqueGames: { name: string; img: string; category: string }[] = [];
    const seenCategories = new Set<string>();

    // กรองเอาเฉพาะเกมที่มีรูป
    const gamesWithImages = gameProducts.filter(product => product.img && product.img.trim() !== '');

    // ดึงเกมแต่ละ category ไม่ซ้ำกัน
    for (const product of gamesWithImages) {
      // สร้างชื่อเกมที่เรียบง่าย
      const categoryLower = product.category.toLowerCase();
      let simpleName = product.category;

      // จับคู่กับชื่อที่รู้จัก
      if (categoryLower.includes('rov')) simpleName = 'ROV';
      else if (categoryLower.includes('free fire') || categoryLower.includes('freefire')) simpleName = 'Free Fire';
      else if (categoryLower.includes('pubg')) simpleName = 'PUBG Mobile';
      else if (categoryLower.includes('mobile legend')) simpleName = 'Mobile Legends';
      else if (categoryLower.includes('genshin')) simpleName = 'Genshin Impact';
      else if (categoryLower.includes('honkai')) simpleName = 'Honkai Star Rail';
      else if (categoryLower.includes('valorant')) simpleName = 'Valorant';
      else if (categoryLower.includes('roblox')) simpleName = 'Roblox';
      else if (categoryLower.includes('ragnarok')) simpleName = 'Ragnarok';
      else if (categoryLower.includes('fifa') || categoryLower.includes('fc mobile')) simpleName = 'FIFA Mobile';
      else if (categoryLower.includes('call of duty') || categoryLower.includes('cod mobile')) simpleName = 'Call of Duty';
      else if (categoryLower.includes('standoff')) simpleName = 'Standoff 2';
      else if (categoryLower.includes('tower of fantasy') || categoryLower.includes('tof')) simpleName = 'Tower of Fantasy';
      else if (categoryLower.includes('apex')) simpleName = 'Apex Legends';
      else if (categoryLower.includes('arena')) simpleName = 'Arena of Valor';
      else if (categoryLower.includes('clash')) simpleName = 'Clash of Clans';
      else if (categoryLower.includes('subway')) simpleName = 'Subway Surfers';
      
      // ถ้ายังไม่เคยเพิ่ม category นี้
      if (!seenCategories.has(simpleName)) {
        uniqueGames.push({
          name: simpleName,
          img: product.img,
          category: product.category
        });
        seenCategories.add(simpleName);

        // ถ้าครบ 14 เกมแล้วให้หยุด
        if (uniqueGames.length >= 14) break;
      }
    }

    return uniqueGames;
  };

  const popularGames = getPopularGames();

  const features = [
    {
      icon: Shield,
      title: "ปลอดภัย 100%",
      description: "ระบบรักษาความปลอดภัยระดับสูง ข้อมูลเข้ารหัส SSL"
    },
    {
      icon: Zap,
      title: "เงินเข้าไว รวดเร็วทันใจ",
      description: "ระบบอัตโนมัติ ของเข้าภายใน 1-5 นาที"
    },
    {
      icon: Clock,
      title: "บริการ 24/7",
      description: "เปิดบริการตลอด 24 ชั่วโมง ทุกวัน"
    },
    {
      icon: Award,
      title: "ราคาถูกที่สุด",
      description: "ราคาถูกกว่าใคร รับประกันความคุ้มค่า"
    }
  ];


  return (
    <Layout>
      <Helmet>
        <title>🎮 CoinZone เว็บเติมเกม รับเติมเกมออนไลน์ราคาถูก เติม ROV Free Fire PUBG</title>
        <meta name="description" content="CoinZone เว็บเติมเกมออนไลน์อันดับ 1 รับเติมเกมราคาถูกที่สุด เติมเกม ROV Free Fire PUBG Mobile Legends Valorant Roblox Robux Genshin Impact Apex Fortnite แอพพรีเมียม Netflix Spotify บัตรเงินสด Steam เติมเงินมือถือ AIS True DTAC ร้านเติมเกมออนไลน์ ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% บริการ 24 ชั่วโมง" />
        <meta name="keywords" content="CoinZone, coinzone, coin zone, coin-zone, เว็บเติมเกม CoinZone, CoinZone เติมเกม, CoinZone ราคาถูก, เติมเกม, เว็บเติมเกม, รับเติมเกม, เติมเกมราคาถูก, เติมเกมออนไลน์, เว็บเติมเกมออนไลน์, ร้านเติมเกม, เติม ROV, เติม Free Fire, เติม PUBG, เติม Mobile Legends, เติมเพชร Free Fire, เติมเงิน ROV, แอพพรีเมียม, Netflix, Spotify, YouTube Premium, บัตรเงินสด, Steam, Garena, เติมเงินมือถือ, AIS, True, DTAC, TrueMoney, เว็บเติมเกมราคาถูก, เติมเกมถูกๆ, เติม rov ถูก, เติม valorant, เติม robux, valorant shop, roblox shop, เติม genshin, ซื้อ robux, robux shop, เติม apex, เติม fortnite, เติม roblox, เติม pubg, mobile legends เติม, fortnite เติม, เติม mlbb, เติมเกมถูกที่สุด, เติมเกมออนไลน์ราคาถูก, topup game, game topup, เติม, เติมเกมสุดคุ้ม" />
        <meta property="og:title" content="CoinZone เว็บเติมเกม รับเติมเกมออนไลน์ราคาถูก เติม ROV Free Fire PUBG" />
        <meta property="og:description" content="CoinZone เว็บเติมเกมออนไลน์อันดับ 1 รับเติมเกมราคาถูกที่สุด เติมเกม ROV Free Fire PUBG Mobile Legends แอพพรีเมียม Netflix Spotify บัตรเงินสด Steam เติมเงินมือถือ ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100%" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.coin-zone.shop/" />
        <meta property="og:image" content="https://www.coin-zone.shop/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CoinZone เว็บเติมเกม รับเติมเกมออนไลน์ราคาถูก" />
        <meta name="twitter:description" content="CoinZone เว็บเติมเกมอันดับ 1 รับเติมเกมราคาถูก เติม ROV Free Fire PUBG แอพพรีเมียม บัตรเงินสด เติมเงินมือถือ" />
        <link rel="canonical" href="https://www.coin-zone.shop/" />
        <meta name="description" content="รับเติมเกม CoinZone เว็บเติมเกมออนไลน์อันดับ 1 เติมเกม ROV Free Fire PUBG Mobile Legends Genshin Impact แอปพรีเมียม Netflix Spotify YouTube Premium บัตรเงินสด Steam Garena เติมเงินมือถือ AIS True DTAC ราคาถูกที่สุด รวดเร็วทันใจ ปลอดภัย 100% เว็ปเติมเกมที่ดีที่สุด บริการตลอด 24 ชั่วโมง ระบบอัตโนมัติ เงินเข้าไว" />
        <meta name="keywords" content="รับเติมเกม, เติมเกม, เว็บเติมเกม, เว็ปเติมเกม, coinzone, เว็บเติมเกมออนไลน์, เว็ปเติมเกมออนไลน์, รับเติมเกมออนไลน์, ร้านเติมเกม, เติมเงินเกม, เติม ROV, เติม Free Fire, เติม PUBG, เติม Mobile Legends, topup game, แอปพรีเมียม, Netflix, Spotify, YouTube Premium, บัตรเงินสด, Steam Wallet, Garena Shell, เติมเงินมือถือ, เติมเงิน AIS, เติมเงิน True, เติมเงิน DTAC" />
        <meta property="og:title" content="รับเติมเกม CoinZone | เว็บเติมเกมออนไลน์ ราคาถูก" />
        <meta property="og:description" content="รับเติมเกม CoinZone เว็บเติมเกมออนไลน์อันดับ 1 เติมเกม ROV Free Fire PUBG รวดเร็วทันใจ ปลอดภัย 100% ราคาถูกที่สุด บริการตลอด 24 ชั่วโมง" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.coin-zone.shop/logo.png" />
        <meta property="og:url" content="https://www.coin-zone.shop/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="รับเติมเกม CoinZone | เว็บเติมเกมออนไลน์" />
        <meta name="twitter:description" content="รับเติมเกม CoinZone เว็บเติมเกมออนไลน์ เติมเกม ROV Free Fire PUBG รวดเร็ว ปลอดภัย ราคาถูก 24 ชม." />
        <link rel="canonical" href="https://www.coin-zone.shop/" />
      </Helmet>
      
      <div className="relative bg-black text-white min-h-screen font-['Kanit',sans-serif] -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 overflow-hidden">
        
        {/* Gaming Animated Background */}
        <div className="absolute inset-0">
          {/* Matrix Grid Background */}
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
                 `,
                 backgroundSize: '50px 50px',
                 animation: 'gridMove 20s linear infinite'
               }}
          />
          
          {/* Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `particleFloat ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
                  boxShadow: '0 0 8px currentColor'
                }}
              />
            ))}
          </div>
          
          {/* Energy Waves */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" 
                 style={{animation: 'scanlineV 4s linear infinite'}} />
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" 
                 style={{animation: 'scanlineV 6s linear infinite 2s'}} />
            <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" 
                 style={{animation: 'scanlineH 8s linear infinite 1s'}} />
          </div>
          
          {/* Corner Glows */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-purple-600/30 via-purple-600/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-blue-600/30 via-blue-600/10 to-transparent blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-cyan-600/30 via-cyan-600/10 to-transparent blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
        </div>
        

        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Additional Hero Effects */}
          <div className="absolute inset-0">
            <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
            <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-48 -right-48 animate-pulse delay-1000"></div>
            <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <div className="text-center">
              {/* Logo Badge */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <img 
                    src="/logo.png" 
                    alt="CoinZone Logo - รับเติมเกม เว็บเติมเกมออนไลน์" 
                    className="relative h-20 w-20 rounded-full border-4 border-purple-500/30"
                  />
                </div>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  รับเติมเกม CoinZone
                </span>
                <span className="block text-2xl sm:text-3xl md:text-4xl mt-2 text-purple-300">
                  เว็บเติมเกมออนไลน์อันดับ 1
                </span>
              </h1>

              {/* Sub Heading */}
              <h2 className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 font-medium">
                เติมเกม <span className="text-purple-300">ROV • Free Fire • PUBG • Mobile Legends</span>
              </h2>

              <p className="text-base sm:text-lg text-gray-400 max-w-4xl mx-auto mb-8 leading-relaxed px-4">
                <strong className="text-purple-300">รับเติมเกมออนไลน์</strong> แอปพรีเมียม บัตรเงินสด เติมเงินมือถือ 
                Netflix Spotify YouTube Premium Steam Garena AIS True DTAC 
                <span className="text-cyan-300"> เว็ปเติมเกมที่ดีที่สุด</span> ราคาถูก รวดเร็วทันใจ ปลอดภัย 100% ระบบอัตโนมัติ เงินเข้าไว บริการตลอด 24 ชั่วโมง
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button
                  size="lg"
                  onClick={() => navigate("/game-topup")}
                  className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  เริ่มเติมเกมตอนนี้
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/premium-app")}
                  className="px-8 py-6 text-lg font-semibold border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500 transition-all duration-300"
                >
                  <Star className="w-5 h-5 mr-2" />
                  แอปพรีเมียม
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span>ปลอดภัย 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>เงินเข้าไว 1-5 นาที</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>บริการ 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
          
          {/* Services Grid */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                บริการของเรา
              </h2>
              <p className="text-gray-400">เลือกบริการที่คุณต้องการ รองรับทุกความต้องการ</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.path}
                    className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="relative h-72">
                      {/* Background Image */}
                      <div className="absolute inset-0 opacity-20">
                        <img
                          src={item.image}
                          alt={`${item.title} - CoinZone`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80 group-hover:opacity-90 transition-opacity`} />
                      
                      {/* Content */}
                      <CardContent className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                          <Icon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-center">{item.title}</h3>
                        <p className="text-sm text-white/80 text-center mb-4">{item.description}</p>
                        <div className="mt-auto flex items-center gap-2 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          <span>ดูบริการ</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Features Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-3xl p-8 md:p-12 border border-purple-500/20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  ทำไมต้องเลือก CoinZone?
                </h2>
                <p className="text-gray-400">เรามีทุกอย่างที่คุณต้องการ</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="group bg-black/30 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Popular Games Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                เกมยอดนิยม
              </h2>
              <p className="text-gray-400">รองรับเกมดังทุกค่าย เติมง่าย ได้ของไว</p>
            </div>

            {gamesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
              </div>
            ) : popularGames.length === 0 ? (
              <div className="text-center py-20">
                <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">ยังไม่มีข้อมูลเกม</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {popularGames.map((game, index) => (
                    <Card
                      key={index}
                      className="group cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/30 overflow-hidden bg-black/30 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/50"
                      onClick={() => navigate("/game-topup")}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={game.img}
                          alt={`เติม ${game.name} - CoinZone รับเติมเกม`}
                          title={`เติม ${game.name} ราคาถูก`}
                          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-xs font-bold text-white">{game.name}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Button
                    size="lg"
                    onClick={() => navigate("/game-topup")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    ดูเกมทั้งหมด
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </section>


          {/* Premium Products Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  แอปพรีเมียม
                </h2>
                <p className="text-gray-400">Netflix Spotify YouTube Premium และอื่นๆ อีกมากมาย</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/premium-app")}
                className="flex items-center gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500"
              >
                ดูทั้งหมด <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">ยังไม่มีสินค้า</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.slice(0, 12).map((product) => (
                  <Card
                    key={product.id}
                    className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 overflow-hidden bg-black/30 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/50"
                    onClick={() => navigate("/premium-app")}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                      {product.img ? (
                        <img
                          src={product.img}
                          alt={`${product.name} - แอปพรีเมียม CoinZone ราคา ${product.price} บาท`}
                          title={`${product.name} - CoinZone แอปพรีเมียม`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-purple-400/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                      <h3 className="font-semibold text-xs mb-2 line-clamp-2 text-white">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-400">
                          ฿{product.price}
                        </span>
                        {product.stock > 0 ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                            มีสินค้า
                          </span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                            หมด
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>


          {/* CTA Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 p-12 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <div className="relative">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-white" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                พร้อมเริ่มต้นแล้วหรือยัง?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                เติมเกมออนไลน์ แอปพรีเมียม บัตรเงินสด เติมเงินมือถือ ง่ายๆ เพียงไม่กี่คลิก
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/game-topup")}
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold"
                >
                  เริ่มเติมเกมเลย
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open("https://www.facebook.com/share/1WhehouoiD/?mibextid=wwXIfr", "_blank")}
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 font-semibold"
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  ติดต่อเรา
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Home;

