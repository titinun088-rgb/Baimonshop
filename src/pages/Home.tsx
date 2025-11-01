import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Menu
} from "lucide-react";
import { getPeamsubProducts, PeamsubProduct } from "@/lib/peamsubUtils";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PeamsubProduct[]>([]);

  useEffect(() => {
    loadProducts();
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

  const menuItems = [
    {
      title: "เติมเกม",
      icon: Gamepad2,
      path: "/game-topup",
      gradient: "from-blue-500 to-cyan-500",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"
    }
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#0f0f2d] to-[#1a0033] text-white min-h-screen font-['Kanit',sans-serif] -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 -mt-16 lg:-mt-16">
        <div className="w-full py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
          {/* Quick Menu Icons */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="lg"
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{item.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              ระบบเติมเงินออนไลน์
            </h1>
            <p className="text-lg text-purple-300">
              รวดเร็ว ปลอดภัย ใช้ได้จริง
            </p>
          </div>

        {/* Menu Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">บริการของเรา</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.path}
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0"
                  onClick={() => navigate(item.path)}
                >
                  <div className="relative h-64">
                    {/* Background Image */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-20">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90`} />
                    
                    {/* Content */}
                    <CardContent className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <Button
                        variant="ghost"
                        className="text-white hover:text-gray-900 hover:bg-white mt-4 group-hover:translate-x-2 transition-transform"
                      >
                        ไปยังบริการ <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Premium Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">แอพพรีเมียม</h2>
            <Button
              variant="outline"
              onClick={() => navigate("/premium-app")}
              className="flex items-center gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white"
            >
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-purple-300">
              ยังไม่มีสินค้า
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {products.slice(0, 6).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden bg-black/30 backdrop-blur-sm border-purple-500/30"
                  onClick={() => navigate("/premium-app")}
                >
                  <div className="aspect-square relative overflow-hidden bg-black/20">
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
                        <Package className="w-16 h-16 text-purple-400/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 bg-black/20">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-400">
                        ฿{product.price}
                      </span>
                      {product.stock > 0 ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                          มีสินค้า
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                          สินค้าหมด
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;

