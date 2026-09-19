import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  QrCode, 
  Ticket, 
  RefreshCw, 
  Users, 
  LogOut, 
  Film, 
  MapPin, 
  ShieldAlert, 
  ArrowLeftRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const StaffLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất khỏi ca trực');
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Soát Vé',
      path: '/staff/scanner',
      icon: QrCode,
      badge: 'QR Scan',
    },
    {
      name: 'Bán Vé Quầy',
      path: '/staff/box-office',
      icon: Ticket,
      badge: 'Walk-in',
    },
    {
      name: 'Đổi Ghế',
      path: '/staff/seat-swap',
      icon: ArrowLeftRight,
      badge: 'Sự cố',
    },
    {
      name: 'Sĩ Số',
      path: '/staff/attendance',
      icon: Users,
      badge: 'Điểm danh',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-900 pb-20 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Left: Branding & Role */}
          <Link to="/staff" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">
                  Cine<span className="text-emerald-600">Light</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  Staff
                </span>
              </div>
              <span className="block text-[10px] text-slate-500 font-medium flex items-center gap-0.5 -mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                CineLight Quận 1 (Ca Trực 1)
              </span>
            </div>
          </Link>

          {/* Right: User / Switch role / Logout */}
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                👑 Sang Admin
              </Link>
            )}

            <div className="text-right hidden xs:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'Nhân Viên'}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Đang trực</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Đăng xuất ca trực"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom Floating Navigation (Mobile/Tablet Friendly) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/staff/scanner' && location.pathname === '/staff');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-[11px] mt-1 leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
