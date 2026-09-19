import React from 'react';
import { Film, Phone, Mail, MapPin, ShieldCheck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Cine<span className="text-rose-600">Light</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Hệ thống rạp chiếu phim chuẩn quốc tế với trải nghiệm âm thanh Dolby Atmos đỉnh cao và công nghệ trình chiếu Laser hiện đại nhất.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-200 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Thanh toán bảo mật & tiện lợi</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/#now-showing" className="hover:text-rose-600 transition-colors">Phim đang chiếu</Link></li>
              <li><Link to="/#upcoming" className="hover:text-rose-600 transition-colors">Phim sắp khởi chiếu</Link></li>
              <li><Link to="/#showtimes" className="hover:text-rose-600 transition-colors">Lịch chiếu toàn quốc</Link></li>
              <li><Link to="/receipts" className="hover:text-rose-600 transition-colors">Tra cứu vé đã đặt</Link></li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#faq" className="hover:text-rose-600 transition-colors">Câu hỏi thường gặp (FAQ)</a></li>
              <li><a href="#terms" className="hover:text-rose-600 transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#privacy" className="hover:text-rose-600 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#refund" className="hover:text-rose-600 transition-colors">Chính sách hoàn/đổi vé</a></li>
            </ul>
          </div>

          {/* Col 4: Contact & Payments */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Liên Hệ & Thanh Toán
            </h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-slate-800">1900 6868 (8:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>support@cinelight.vn</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Tầng 5, Vincom Landmark 81, TP. Hồ Chí Minh</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Chấp nhận thanh toán</span>
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">VietQR</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">MoMo</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Visa / Master</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Napas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 CineLight Vietnam. All rights reserved. Đồ Án 4 Cinema System.</p>
          <p>Thiết kế theo chuẩn Thẩm mỹ Vibe Sáng (Light Clean Luxury).</p>
        </div>
      </div>
    </footer>
  );
};
