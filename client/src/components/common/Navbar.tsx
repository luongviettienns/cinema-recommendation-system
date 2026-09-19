import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Ticket, User as UserIcon, LogOut, Menu, X, Search, LayoutDashboard, ShieldCheck, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path.startsWith('/#')) {
      const targetId = path.slice(2);
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          const navOffset = 85;
          const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          window.history.pushState(null, '', path);
        }
      }
    }
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Phim đang chiếu', path: '/#now-showing' },
    { name: 'Cụm rạp & Giá vé', path: '/cinemas' },
    { name: 'Suất chiếu', path: '/schedule' },
    { name: 'Vé của tôi', path: '/receipts', protected: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center">
                Cine<span className="text-rose-600">Light</span>
              </span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase -mt-1">
                Cinema Experience
              </span>
            </div>
          </Link>

          {/* Search bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm phim, thể loại, đạo diễn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/80 hover:bg-slate-100 text-slate-900 placeholder:text-slate-400 text-xs rounded-full pl-9 pr-4 py-2 border border-transparent focus:border-rose-400 focus:bg-white focus:outline-none transition-all"
            />
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => handleNavClick(link.path, e)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-rose-600 bg-rose-50/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section (Desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-rose-200"
                  />
                  <span className="text-sm font-semibold text-slate-800 pr-1 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200">
                      ADMIN
                    </span>
                  )}
                  {user.role === 'staff' && (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      STAFF
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Đăng nhập với</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            👑 Toàn quyền Quản Trị Viên
                          </span>
                        )}
                        {user.role === 'staff' && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🎟️ Nhân Viên Ca Trực Rạp
                          </span>
                        )}
                      </div>

                      {/* Admin link inside dropdown */}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 font-bold transition-colors border-b border-slate-100"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Bảng Điều Khiển Quản Trị</span>
                        </Link>
                      )}

                      {/* Staff Console link inside dropdown (Staff Only) */}
                      {user.role === 'staff' && (
                        <Link
                          to="/staff"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 font-bold transition-colors border-b border-slate-100"
                        >
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>Staff Console (Quầy & Cổng)</span>
                        </Link>
                      )}

                      <Link
                        to="/receipts"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-rose-500" />
                        <span>Vé của tôi & Lịch sử</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSearch} className="flex items-center relative w-full mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-transparent focus:bg-white focus:border-rose-400 focus:outline-none"
            />
          </form>

          <div className="space-y-1">
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-bold text-purple-700 bg-purple-50 border border-purple-200 mb-2"
              >
                👑 Bảng Điều Khiển Quản Trị
              </Link>
            )}

            {/* Staff Console link mobile (Staff Only) */}
            {isAuthenticated && user?.role === 'staff' && (
              <Link
                to="/staff"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 mb-2"
              >
                🎟️ Staff Console (Quầy & Cổng)
              </Link>
            )}

            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    handleNavClick(link.path, e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
