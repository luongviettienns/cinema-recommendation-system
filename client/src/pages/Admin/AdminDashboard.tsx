import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Ticket, 
  Film, 
  Calendar, 
  MapPin, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Play,
  Plus,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DashboardOverview } from './DashboardOverview';
import { MovieManagement } from './MovieManagement';
import { ShowtimeManagement } from './ShowtimeManagement';
import { StaffManagement } from './StaffManagement';
import { RefundManagement } from './RefundManagement';
import { apiRequest, USE_MOCK } from '../../services/api';
import { cinemaService } from '../../services/cinemaService';
import { ICinema } from '../../types/cinema';

interface IRecentBooking {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  showtime: string;
  seats: string[];
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CHECKED_IN' | 'CANCELLED';
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'movies' | 'showtimes' | 'bookings' | 'cinemas' | 'staff' | 'refunds'
  >('overview');
  const [bookingFilter, setBookingFilter] = useState('');

  // Recent bookings list for Bookings tab
  const [recentBookings, setRecentBookings] = useState<IRecentBooking[]>([
    {
      id: 'b-1',
      code: 'CL-839210',
      customerName: 'Nguyễn Văn A',
      customerEmail: 'demo@cinema.vn',
      movieTitle: 'Coyote vs. Acme',
      cinemaName: 'CineLight Quận 1',
      roomName: 'Phòng 01 - IMAX Laser',
      showtime: '19:30 - 19/09/2026',
      seats: ['E5', 'E6'],
      totalAmount: 190000,
      status: 'PAID',
      createdAt: '10 phút trước',
    },
    {
      id: 'b-2',
      code: 'CL-624109',
      customerName: 'Trần Thị Mai',
      customerEmail: 'mai.tran@gmail.com',
      movieTitle: 'Bầy Xác Sống',
      cinemaName: 'CineLight Landmark 81',
      roomName: 'Phòng 02 - Dolby Atmos',
      showtime: '20:15 - 19/09/2026',
      seats: ['F7', 'F8', 'F9'],
      totalAmount: 345000,
      status: 'CHECKED_IN',
      createdAt: '35 phút trước',
    },
    {
      id: 'b-3',
      code: 'CL-492150',
      customerName: 'Lê Hoàng Nam',
      customerEmail: 'nam.le@gmail.com',
      movieTitle: 'Ma Tù',
      cinemaName: 'CineLight Cầu Giấy',
      roomName: 'Phòng 03 - 2D Digital',
      showtime: '21:00 - 19/09/2026',
      seats: ['D4'],
      totalAmount: 85000,
      status: 'PAID',
      createdAt: '1 giờ trước',
    },
    {
      id: 'b-4',
      code: 'CL-310948',
      customerName: 'Phạm Minh Quân',
      customerEmail: 'quan.pm@fpt.edu.vn',
      movieTitle: 'Ngày Tàn Của Phố Oak',
      cinemaName: 'CineLight Landmark 81',
      roomName: 'Phòng 01 - IMAX Laser',
      showtime: '18:00 - 19/09/2026',
      seats: ['G4', 'G5'],
      totalAmount: 230000,
      status: 'CHECKED_IN',
      createdAt: '2 giờ trước',
    },
    {
      id: 'b-5',
      code: 'CL-195820',
      customerName: 'Đặng Thảo Vy',
      customerEmail: 'vy.dang@outlook.com',
      movieTitle: 'Coyote vs. Acme',
      cinemaName: 'CineLight Quận 1',
      roomName: 'Phòng 02 - Dolby Atmos',
      showtime: '17:30 - 19/09/2026',
      seats: ['E1', 'E2'],
      totalAmount: 190000,
      status: 'PAID',
      createdAt: '3 giờ trước',
    },
  ]);

  const [realCinemas, setRealCinemas] = useState<ICinema[]>([]);

  useEffect(() => {
    if (activeTab === 'bookings' && !USE_MOCK) {
      apiRequest<any[]>('/v1/admin/bookings?limit=50')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setRecentBookings(
              data.map((b) => ({
                id: b.id,
                code: b.bookingCode,
                customerName: b.user?.name || 'Khách Vãng Lai',
                customerEmail: b.user?.email || 'N/A',
                movieTitle: b.showtime?.movie?.title || 'Phim Chiếu Rạp',
                cinemaName: b.showtime?.room?.cinema?.name || 'CineLight Cinema',
                roomName: b.showtime?.room?.name || 'Phòng chiếu',
                showtime: b.showtime?.startTime
                  ? `${new Date(b.showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.showtime.startTime).toLocaleDateString('vi-VN')}`
                  : 'N/A',
                seats: Array.isArray(b.bookingSeats) ? b.bookingSeats.map((bs: any) => bs.seat?.seatNumber || '') : [],
                totalAmount: b.totalAmount,
                status: b.ticket?.isUsed ? 'CHECKED_IN' : (b.status === 'PAID' ? 'PAID' : (b.status === 'HOLDING' ? 'PENDING' : 'CANCELLED')),
                createdAt: new Date(b.createdAt).toLocaleDateString('vi-VN'),
              }))
            );
          }
        })
        .catch((err) => console.warn('Fetch admin bookings failed, using fallback', err));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'cinemas') {
      cinemaService.getCinemas().then((list) => {
        if (list && list.length > 0) {
          setRealCinemas(list);
        }
      });
    }
  }, [activeTab]);

  const filteredBookings = recentBookings.filter(
    (b) =>
      b.code.toLowerCase().includes(bookingFilter.toLowerCase()) ||
      b.customerName.toLowerCase().includes(bookingFilter.toLowerCase()) ||
      b.movieTitle.toLowerCase().includes(bookingFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Khu Vực Quản Trị Hệ Thống Toàn Quyền</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Bảng Điều Khiển Quản Trị
              <span className="text-rose-400 font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10">
                Admin
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Theo dõi doanh thu thời gian thực, quản lý danh mục phim, giám sát suất chiếu và hệ thống cụm rạp toàn quốc.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('movies')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold backdrop-blur-md cursor-pointer"
              leftIcon={<Film className="w-3.5 h-3.5 text-rose-300" />}
            >
              Quản Lý Phim
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('showtimes')}
              className="font-bold shadow-md shadow-rose-900/40 cursor-pointer"
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Lên Lịch Chiếu
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Tổng Quan & Doanh Thu</span>
        </button>

        <button
          onClick={() => setActiveTab('movies')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'movies'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Quản Lý Phim</span>
        </button>

        <button
          onClick={() => setActiveTab('showtimes')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'showtimes'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Chiếu & Phòng</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Quản Lý Đặt Vé ({recentBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cinemas')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cinemas'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Cụm Rạp & Sơ Đồ Ghế</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Quản lý nhân viên</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'refunds'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Duyệt Hoàn Tiền</span>
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'overview' && (
        <DashboardOverview onNavigateToTab={(tab) => setActiveTab(tab as any)} />
      )}

      {/* Tab 2: Movie Management */}
      {activeTab === 'movies' && (
        <MovieManagement />
      )}

      {/* Tab 3: Showtime Management */}
      {activeTab === 'showtimes' && (
        <ShowtimeManagement />
      )}

      {/* Tab 4: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Danh Sách Đặt Vé Gần Đây</h3>
              <p className="text-xs text-slate-500">Tất cả giao dịch giữ ghế và thanh toán thành công trên hệ thống</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo mã vé, tên, phim..."
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Mã Vé</th>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Bộ Phim</th>
                  <th className="py-3.5 px-4">Suất Chiếu & Ghế</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{b.customerName}</div>
                      <div className="text-[11px] text-slate-400">{b.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {b.movieTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-500">{b.roomName}</div>
                      <div className="font-bold text-rose-600 mt-0.5">
                        Ghế: {b.seats.join(', ')} ({b.showtime})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {b.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4">
                      {b.status === 'CHECKED_IN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Đã Soát Vé
                        </span>
                      )}
                      {b.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <CheckCircle2 className="w-3 h-3" /> Đã Thanh Toán
                        </span>
                      )}
                      {b.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Đang Giữ Ghế (7p)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {b.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Cinemas & Rooms */}
      {activeTab === 'cinemas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(realCinemas.length > 0
            ? realCinemas.map((c) => ({
                name: c.name,
                city: c.region,
                address: c.address,
                rooms: ['Phòng 01 - IMAX Laser (80 ghế)', 'Phòng 02 - Dolby Atmos (80 ghế)', 'Phòng 03 - 2D Digital (80 ghế)'],
                totalSeats: c.totalSeats || 240,
              }))
            : [
                {
                  name: 'CineLight Landmark 81',
                  city: 'TP. Hồ Chí Minh',
                  address: 'Tầng B1, Vincom Landmark 81, P. 22, Q. Bình Thạnh',
                  rooms: ['Phòng 01 - IMAX Laser (80 ghế)', 'Phòng 02 - Dolby Atmos (80 ghế)', 'Phòng 03 - 2D Digital (80 ghế)'],
                  totalSeats: 240,
                },
                {
                  name: 'CineLight Quận 1',
                  city: 'TP. Hồ Chí Minh',
                  address: 'Tầng 3, Vincom Center Đồng Khởi, Q. 1',
                  rooms: ['Phòng 01 - IMAX Laser (80 ghế)', 'Phòng 02 - Dolby Atmos (80 ghế)', 'Phòng 03 - 2D Digital (80 ghế)'],
                  totalSeats: 240,
                },
                {
                  name: 'CineLight Cầu Giấy',
                  city: 'Hà Nội',
                  address: 'Tầng 4, Vincom Center Trần Duy Hưng, Cầu Giấy',
                  rooms: ['Phòng 01 - IMAX Laser (80 ghế)', 'Phòng 02 - Dolby Atmos (80 ghế)', 'Phòng 03 - 2D Digital (80 ghế)'],
                  totalSeats: 240,
                },
              ]
          ).map((cinema) => (
            <div key={cinema.name} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">{cinema.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {cinema.city}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Hoạt Động
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{cinema.address}</p>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Danh sách phòng chiếu:</span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {cinema.rooms.map((r) => (
                    <li key={r} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                      <Play className="w-3 h-3 text-rose-500" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 text-xs font-bold text-slate-500 flex justify-between">
                <span>Tổng sức chứa:</span>
                <span className="text-slate-900 font-black">{cinema.totalSeats} ghế</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'staff' && <StaffManagement />}
      {activeTab === 'refunds' && <RefundManagement />}
    </div>
  );
};
