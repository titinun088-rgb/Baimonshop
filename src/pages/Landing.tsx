import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Gamepad2, 
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
  Shield,
  Zap,
  CheckCircle,
  Smartphone,
  CreditCard,
  Sparkles
} from "lucide-react";
import { 
  getPeamsubGameProducts, 
  PeamsubGameProduct,
  getPeamsubProducts,
  PeamsubProduct,
  getPeamsubMobileProducts,
  PeamsubMobileProduct,
  getPeamsubCashCardProducts,
  PeamsubCashCardProduct
} from "@/lib/peamsubUtils";

const Landing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gameCategories, setGameCategories] = useState<Map<string, PeamsubGameProduct[]>>(new Map());
  const [premiumProducts, setPremiumProducts] = useState<PeamsubProduct[]>([]);
  const [mobileProducts, setMobileProducts] = useState<PeamsubMobileProduct[]>([]);
  const [cashCardProducts, setCashCardProducts] = useState<PeamsubCashCardProduct[]>([]);

  useEffect(() => {
    loadAllServices();
  }, []);

  const loadAllServices = async () => {
    setLoading(true);
    try {
      // โหลดเกม
      const gameProducts = await getPeamsubGameProducts();
      const categoryMap = new Map<string, PeamsubGameProduct[]>();
      gameProducts.forEach((product) => {
        const category = product.category || "อื่นๆ";
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(product);
      });
      setGameCategories(categoryMap);

      // โหลดแอปพรีเมียม
      try {
        const premium = await getPeamsubProducts();
        setPremiumProducts(premium.slice(0, 12)); // แสดงแค่ 12 รายการแรก
      } catch (error) {
        console.error("Error loading premium products:", error);
        setPremiumProducts([]);
      }

      // โหลดเติมเงินมือถือ
      try {
        const mobile = await getPeamsubMobileProducts();
        setMobileProducts(mobile.slice(0, 12)); // แสดงแค่ 12 รายการแรก
      } catch (error) {
        console.error("Error loading mobile products:", error);
        setMobileProducts([]);
      }

      // โหลดบัตรเงินสด
      try {
        const cashCard = await getPeamsubCashCardProducts();
        setCashCardProducts(cashCard.slice(0, 12)); // แสดงแค่ 12 รายการแรก
      } catch (error) {
        console.error("Error loading cash card products:", error);
        setCashCardProducts([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0d1a] via-[#2d1a3d] to-[#1a0d1a] text-white font-['Kanit',sans-serif]">
      {/* Header with Login/Register buttons */}
      <header className="bg-pink-900/20 backdrop-blur-sm border-b border-pink-400/30 sticky top-0 z-50 shadow-pink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="BaimonShop Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-gradient-pink animate-bounce-cute">
                BaimonShop
              </span>
            </div>
            
            {/* Login/Register Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                size="sm"
                className="border-pink-400/30 text-pink-300 hover:bg-pink-500/20 hover:text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-10 hover-glow-pink"
              >
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Button>
              <Button
                onClick={() => navigate("/register")}
                size="sm"
                className="bg-gradient-cute hover:shadow-pink-lg text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-10 hover-glow-pink transition-all duration-300"
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">สมัครสมาชิก</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient-pink mb-6 animate-bounce-cute">
            ระบบเติมเงินเกมออนไลน์ 🌸
          </h1>
          <p className="text-xl text-pink-200 mb-8 max-w-2xl mx-auto">
            น่ารัก รวดเร็ว ปลอดภัย ✨ พร้อมบริการเติมเกมยอดนิยม
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-gradient-cute hover:shadow-pink-lg text-white text-lg px-8 py-6 hover-glow-pink transition-all duration-300 border-gradient-pink"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              เริ่มต้นใช้งาน 💕
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-pink-400/50 text-pink-200 hover:bg-pink-500/20 hover:text-white text-lg px-8 py-6 hover-glow-pink"
            >
              <LogIn className="mr-2 h-5 w-5" />
              เข้าสู่ระบบ ✨
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-pink-900/30 backdrop-blur-sm border-pink-400/30 hover-glow-pink transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-pink-300 animate-bounce-cute" />
              <h3 className="text-xl font-bold mb-2 text-pink-100">รวดเร็ว ⚡</h3>
              <p className="text-pink-200">เติมเงินได้ทันทีภายในไม่กี่วินาที</p>
            </CardContent>
          </Card>
          <Card className="bg-pink-900/30 backdrop-blur-sm border-pink-400/30 hover-glow-pink transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-300 animate-bounce-cute" />
              <h3 className="text-xl font-bold mb-2 text-pink-100">ปลอดภัย 🛡️</h3>
              <p className="text-pink-200">ระบบรักษาความปลอดภัยขั้นสูง</p>
            </CardContent>
          </Card>
          <Card className="bg-pink-900/30 backdrop-blur-sm border-pink-400/30 hover-glow-pink transition-all duration-300">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-blue-300 animate-bounce-cute" />
              <h3 className="text-xl font-bold mb-2 text-pink-100">ใช้ได้จริง ✅</h3>
              <p className="text-pink-200">รองรับเกมและแอพพลิเคชั่นมากมาย</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              บริการของเรา
            </h2>
            <p className="text-purple-300 mb-6">
              ดูบริการเติมเงินทั้งหมดที่เรามี (ต้องเข้าสู่ระบบเพื่อเติมเงิน)
            </p>
            
            {/* Service Icons Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {/* เติมเกม */}
              <Card className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">เติมเกม</h3>
                  <p className="text-purple-300 text-xs mb-3">
                    รองรับเกมหลากหลาย
                  </p>
                  <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 inline-block">
                    ⚠️ ต้องล็อกอิน
                  </div>
                </CardContent>
              </Card>

              {/* แอปพรีเมียม */}
              <Card className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">แอปพรีเมียม</h3>
                  <p className="text-purple-300 text-xs mb-3">
                    สินค้าแอปพรีเมียม
                  </p>
                  <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 inline-block">
                    ⚠️ ต้องล็อกอิน
                  </div>
                </CardContent>
              </Card>

              {/* เติมเงินมือถือ */}
              <Card className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">เติมเงินมือถือ</h3>
                  <p className="text-purple-300 text-xs mb-3">
                    เติมเงินทุกเครือข่าย
                  </p>
                  <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 inline-block">
                    ⚠️ ต้องล็อกอิน
                  </div>
                </CardContent>
              </Card>

              {/* บัตรเงินสด */}
              <Card className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">บัตรเงินสด</h3>
                  <p className="text-purple-300 text-xs mb-3">
                    บัตรเติมเงินทุกประเภท
                  </p>
                  <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 inline-block">
                    ⚠️ ต้องล็อกอิน
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Game Categories Preview - View Only */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : gameCategories.size === 0 ? (
            <div className="text-center py-12 text-purple-300">
              กำลังโหลดข้อมูลเกม...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from(gameCategories.entries()).slice(0, 10).map(([category, products]) => (
                <Card
                  key={category}
                  className="group cursor-default transition-all duration-300 hover:scale-105 hover:shadow-xl bg-black/30 backdrop-blur-sm border-purple-500/30 overflow-hidden"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    {products[0]?.img ? (
                      <img
                        src={products[0].img}
                        alt={category}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-16 h-16 text-purple-400/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 bg-black/20">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1 text-white">
                      {category}
                    </h3>
                    <p className="text-xs text-purple-300">
                      {products.length} แพ็คเกจ
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Premium App Preview */}
        {premiumProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" />
                แอปพรีเมียม
              </h2>
              <p className="text-purple-300 mb-6">
                ดูสินค้าแอปพรีเมียมที่เรามีบริการ (ต้องเข้าสู่ระบบเพื่อซื้อ)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {premiumProducts.slice(0, 12).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30 overflow-hidden"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                    {product.img ? (
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-purple-400/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 bg-black/20">
                    <h3 className="font-semibold text-xs mb-1 line-clamp-2 text-white text-center">
                      {product.name}
                    </h3>
                    <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 text-center mt-2">
                      ⚠️ ต้องล็อกอิน
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mobile TopUp Preview */}
        {mobileProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
                <Smartphone className="w-8 h-8" />
                เติมเงินมือถือ
              </h2>
              <p className="text-purple-300 mb-6">
                ดูแพ็คเกจเติมเงินมือถือ (ต้องเข้าสู่ระบบเพื่อเติมเงิน)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mobileProducts.slice(0, 12).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30 overflow-hidden"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20">
                    {product.img ? (
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Smartphone className="w-12 h-12 text-green-400/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 bg-black/20">
                    <h3 className="font-semibold text-xs mb-1 line-clamp-2 text-white text-center">
                      {product.name}
                    </h3>
                    <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 text-center mt-2">
                      ⚠️ ต้องล็อกอิน
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cash Card Preview */}
        {cashCardProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
                <CreditCard className="w-8 h-8" />
                บัตรเงินสด
              </h2>
              <p className="text-purple-300 mb-6">
                ดูบัตรเติมเงินทุกประเภท (ต้องเข้าสู่ระบบเพื่อซื้อ)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cashCardProducts.slice(0, 12).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-default transition-all duration-300 hover:scale-105 bg-black/30 backdrop-blur-sm border-purple-500/30 overflow-hidden"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    {product.img ? (
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CreditCard className="w-12 h-12 text-orange-400/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 bg-black/20">
                    <h3 className="font-semibold text-xs mb-1 line-clamp-2 text-white text-center">
                      {product.name}
                    </h3>
                    <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1 text-center mt-2">
                      ⚠️ ต้องล็อกอิน
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">พร้อมเริ่มใช้งานแล้ว?</h3>
            <p className="text-purple-300 mb-6">
              สมัครสมาชิกเพื่อเข้าถึงบริการทั้งหมดและเริ่มเติมเงินเกมได้ทันที
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                สมัครสมาชิกฟรี
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white"
              >
                มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-purple-500/30 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-purple-300 text-sm">
            <p>© 2024 BaimonShop 🌸 สงวนลิขสิทธิ์. Made with 💕</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

