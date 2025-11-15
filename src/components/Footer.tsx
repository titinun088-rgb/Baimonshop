import { Link } from "react-router-dom";
import { Facebook, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white py-16 border-t border-gray-800/50 overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center mb-12">
          {/* Logo Section */}
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="relative bg-gray-900 p-2 rounded-xl">
                <img 
                  src="/logo.png" 
                  alt="CoinZone Logo" 
                  className="h-12 w-12 object-contain transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <div>
              <span className="block text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                CoinZone
              </span>
              <span className="block text-xs text-gray-500 mt-1">รับเติมเกม</span>
            </div>
          </div>

          {/* Menu Links - Centered */}
          <div className="flex justify-center">
            <nav className="flex flex-col sm:flex-row gap-8">
              <Link
                to="/home"
                className="relative text-gray-300 hover:text-white transition-all duration-300 font-medium group"
              >
                <span className="relative z-10">หน้าหลัก</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/game-topup"
                className="relative text-gray-300 hover:text-white transition-all duration-300 font-medium group"
              >
                <span className="relative z-10">เติมเกม</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <a
                href="https://www.facebook.com/share/1WhehouoiD/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="relative text-gray-300 hover:text-white transition-all duration-300 font-medium group flex items-center gap-2"
              >
                <span className="relative z-10">ติดต่อ</span>
                <Facebook className="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>
          </div>

          {/* Facebook Link - Right */}
          <div className="flex justify-center md:justify-end">
            <a
              href="https://www.facebook.com/share/1WhehouoiD/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl font-medium overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/50"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
              <div className="relative z-10 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </div>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 my-8"></div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            ©2025 CoinZone. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>for you</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
