import { Link } from "react-router-dom";
import { Facebook, Heart, Mail, Phone, MapPin, Gamepad2, CreditCard, Smartphone, Shield, Clock, Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-[#0f0f2d] via-[#1a0033] to-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-xl">
                  <img 
                    src="/logo.png" 
                    alt="BaimonShop - รับเติมเกม เว็บเติมเกมออนไลน์" 
                    className="h-10 w-10 object-contain transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <div>
                <span className="block text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  BaimonShop
                </span>
                <span className="block text-xs text-purple-300">รับเติมเกม เว็บเติมเกมออนไลน์</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              เว็บเติมเกมออนไลน์อันดับ 1 รับเติมเกม แอปพรีเมียม บัตรเงินสด เติมเงินมือถือ ราคาถูก รวดเร็ว ปลอดภัย บริการตลอด 24 ชั่วโมง
            </p>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 text-green-400" />
                <span>ปลอดภัย 100%</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>บริการ 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>เงินเข้าไว รวดเร็วทันใจ</span>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              บริการของเรา
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/game-topup" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Gamepad2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>เติมเกมออนไลน์</span>
                </Link>
              </li>
              <li>
                <Link to="/premium-app" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Smartphone className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>แอปพรีเมียม</span>
                </Link>
              </li>
              <li>
                <Link to="/cash-card" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <CreditCard className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <span>บัตรเงินสด</span>
                </Link>
              </li>
              <li>
                <Link to="/top-up" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  <span>เติมเงินมือถือ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              บริการยอดนิยม
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/game-topup" className="text-gray-400 hover:text-purple-300 transition-colors">
                  เติม ROV ราคาถูก
                </Link>
              </li>
              <li>
                <Link to="/game-topup" className="text-gray-400 hover:text-purple-300 transition-colors">
                  เติม Free Fire
                </Link>
              </li>
              <li>
                <Link to="/game-topup" className="text-gray-400 hover:text-purple-300 transition-colors">
                  เติม PUBG Mobile
                </Link>
              </li>
              <li>
                <Link to="/premium-app" className="text-gray-400 hover:text-purple-300 transition-colors">
                  Netflix Premium
                </Link>
              </li>
              <li>
                <Link to="/premium-app" className="text-gray-400 hover:text-purple-300 transition-colors">
                  Spotify Premium
                </Link>
              </li>
              <li>
                <Link to="/premium-app" className="text-gray-400 hover:text-purple-300 transition-colors">
                  YouTube Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ติดต่อเรา
            </h3>
            <ul className="space-y-4 mb-6">
              <li>
                <a href="https://www.facebook.com/share/1CpnioY7kk/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@baimonshop.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-sm">support@baimonshop.com</span>
                </a>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ช่องทางการชำระเงิน</p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-gray-300 backdrop-blur-sm">
                  TrueMoney
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-gray-300 backdrop-blur-sm">
                  พร้อมเพย์
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-gray-300 backdrop-blur-sm">
                  โอนธนาคาร
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Keywords Section */}
        <div className="border-t border-purple-500/20 pt-8 mb-8">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">BaimonShop - รับเติมเกม เว็บเติมเกมออนไลน์ ราคาถูก</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-purple-300">เติมเกมออนไลน์:</strong> รับเติมเกม เว็บเติมเกม เว็ปเติมเกม ร้านเติมเกม เติม ROV เติม Free Fire เติม PUBG เติม Mobile Legends เติม Genshin Impact เติม Honkai Star Rail เติม Valorant เติม Roblox เติมเกมราคาถูก เติมเกมรวดเร็ว เติมเกมปลอดภัย topup game
              {" • "}
              <strong className="text-blue-300">แอปพรีเมียม:</strong> Netflix Premium Spotify Premium YouTube Premium Disney Plus HBO Max Apple Music Canva Pro ChatGPT Plus Office 365 แอปพรีเมียมราคาถูก
              {" • "}
              <strong className="text-green-300">บัตรเงินสด:</strong> Steam Wallet Garena Shell Google Play Card iTunes Card PSN Card Xbox Gift Card บัตรเงินสดราคาถูก
              {" • "}
              <strong className="text-orange-300">เติมเงินมือถือ:</strong> เติมเงิน AIS เติมเงิน True เติมเงิน DTAC TrueMoney Wallet บัตรเติมเงินมือถือ
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-500/20 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © 2025 <span className="text-purple-400 font-semibold">BaimonShop</span> - เว็บเติมเกมออนไลน์อันดับ 1 | All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>in Thailand</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
