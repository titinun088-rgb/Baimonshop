import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เคยให้ความยินยอมหรือไม่
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      // แสดงแบนเนอร์หลังจาก 1 วินาที
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // ถ้าเคยให้ความยินยอมแล้ว ให้อัปเดตสถานะ
      updateConsent(consentGiven === 'granted');
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    if (typeof window.gtag === 'function') {
      if (granted) {
        window.gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted',
          'analytics_storage': 'granted'
        });
      } else {
        window.gtag('consent', 'update', {
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied',
          'analytics_storage': 'denied'
        });
      }
    }
  };

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'granted');
    updateConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'denied');
    updateConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/95 to-black/90 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <Cookie className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                🍪 เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ
              </h3>
              <p className="text-gray-300 text-sm">
                เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงบริการ 
                คุณสามารถเลือกยอมรับหรือปฏิเสธการใช้คุกกี้ได้
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
