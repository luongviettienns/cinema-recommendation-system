import React, { useState } from 'react';
import { 
  TrendingUp, 
  Ticket, 
  Film, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface IDailyRevenue {
  day: string;
  date: string;
  revenue: number;
  tickets: number;
}

interface ITopMovie {
  id: string;
  title: string;
  poster: string;
  ticketsSold: number;
  revenue: number;
  rating: number;
  percentage: number;
}

const REVENUE_7_DAYS: IDailyRevenue[] = [
  { day: 'T2', date: '13/09', revenue: 2150000, tickets: 24 },
  { day: 'T3', date: '14/09', revenue: 2400000, tickets: 28 },
  { day: 'T4', date: '15/09', revenue: 2200000, tickets: 25 },
  { day: 'T5', date: '16/09', revenue: 3100000, tickets: 36 },
  { day: 'T6', date: '17/09', revenue: 4850000, tickets: 55 },
  { day: 'T7', date: '18/09', revenue: 6400000, tickets: 74 },
  { day: 'CN', date: '19/09 (Hôm nay)', revenue: 5850000, tickets: 68 },
];

const TOP_MOVIES: ITopMovie[] = [
  {
    id: 'm1',
    title: 'Avatar: Dòng Chảy Của Nước',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80',
    ticketsSold: 142,
    revenue: 14200000,
    rating: 8.8,
    percentage: 38
  },
  {
    id: 'm2',
    title: 'Dune: Hành Tinh Cát - Phần 2',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80',
    ticketsSold: 98,
    revenue: 9800000,
    rating: 8.9,
    percentage: 26
  },
  {
    id: 'm3',
    title: 'Bầy Xác Sống',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
    ticketsSold: 64,
    revenue: 5760000,
    rating: 7.6,
    percentage: 16
  },
  {
    id: 'm4',
    title: 'Ma Tù',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    ticketsSold: 45,
    revenue: 4050000,
    rating: 7.2,
    percentage: 11
  },
  {
    id: 'm5',
    title: 'Coyote vs. Acme',
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&auto=format&fit=crop&q=80',
    ticketsSold: 35,
    revenue: 3150000,
    rating: 8.0,
    percentage: 9
  }
];

interface DashboardOverviewProps {
  onNavigateToTab: (tab: 'bookings' | 'movies' | 'showtimes') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateToTab }) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const maxRevenue = Math.max(...REVENUE_7_DAYS.map((d) => d.revenue));

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Đã đồng bộ số liệu thời gian thực từ Database!');
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Quick Controls & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phạm Vi Số Liệu:</span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === 'today' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm Nay
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === '7days' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Ngày Qua
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === '30days' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng Này (30 Ngày)
            </button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          className="font-bold border-slate-200 cursor-pointer"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Làm Mới Số Liệu
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh Thu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {timeRange === 'today' ? 'Doanh Thu Hôm Nay' : 'Doanh Thu Tuần Này'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ₫
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {timeRange === 'today' ? '5.850.000' : '26.950.000'} <span className="text-sm font-semibold text-slate-500">đ</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% so với kỳ trước</span>
            </div>
          </div>
        </div>

        {/* Vé đã bán */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {timeRange === 'today' ? 'Vé Bán Hôm Nay' : 'Vé Bán Tuần Này'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {timeRange === 'today' ? '68' : '309'} <span className="text-sm font-semibold text-slate-500">vé</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Đạt 112% chỉ tiêu tuần</span>
            </div>
          </div>
        </div>

        {/* Tỷ lệ lấp đầy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Lấp Đầy Ghế</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              74.8%
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-slate-500 text-xs font-medium">
              <span>Giờ vàng (19h-22h): <strong>89.5%</strong></span>
            </div>
          </div>
        </div>

        {/* Suất Chiếu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suất Chiếu Hôm Nay</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              28 <span className="text-sm font-semibold text-slate-500">suất</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-purple-600 text-xs font-bold">
              <span>Trên 9 phòng chiếu (3 rạp)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items Alert Row (Cần xử lý) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Yêu cầu hủy vé */}
        <div 
          onClick={() => onNavigateToTab('bookings')}
          className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between hover:bg-amber-100/70 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">2 Yêu Cầu Hoàn Vé / Hủy Vé Đang Chờ</h4>
              <p className="text-xs text-amber-800/80">Khách gửi yêu cầu hủy vé hợp lệ trước giờ chiếu &gt; 2 tiếng.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 group-hover:translate-x-0.5 transition-transform flex items-center">
            Xử lý ngay <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>

        {/* Lịch chiếu trống */}
        <div 
          onClick={() => onNavigateToTab('showtimes')}
          className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 flex items-center justify-between hover:bg-purple-100/70 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-200/60 text-purple-800 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-950">Lịch Chiếu Cuối Tuần Tới</h4>
              <p className="text-xs text-purple-800/80">Phòng IMAX Landmark 81 còn 4 khung giờ trống chưa lên lịch.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-900 group-hover:translate-x-0.5 transition-transform flex items-center">
            Lên lịch ngay <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</h3>
              <p className="text-xs text-slate-400">Doanh thu thời gian thực từ các giao dịch VietQR & Thanh toán Sandbox</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Đồng bộ tự động
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {REVENUE_7_DAYS.map((item) => {
              const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 whitespace-nowrap pointer-events-none shadow-lg font-mono">
                    {item.revenue.toLocaleString('vi-VN')} đ ({item.tickets} vé)
                  </div>
                  {/* Bar */}
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        item.day.includes('Hôm nay') || item.day === 'CN'
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:brightness-110'
                          : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-rose-500 group-hover:to-rose-400'
                      }`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-rose-600 transition-colors">
                    {item.day.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" /> Ngày cao điểm cuối tuần
            </span>
            <span className="font-semibold text-slate-700">
              Tổng 7 ngày: <strong>26.950.000 đ</strong>
            </span>
          </div>
        </div>

        {/* Top 5 Movies (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Top 5 Phim Bán Chạy</h3>
            <button 
              onClick={() => onNavigateToTab('movies')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {TOP_MOVIES.map((movie, index) => (
              <div key={movie.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                  index === 0 ? 'bg-amber-100 text-amber-800' :
                  index === 1 ? 'bg-slate-200 text-slate-700' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {index + 1}
                </span>

                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-10 h-14 object-cover rounded-lg shadow-2xs border border-slate-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{movie.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{movie.ticketsSold} vé</span>
                    <strong className="text-slate-800 font-mono">{(movie.revenue / 1000000).toFixed(1)}M</strong>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      style={{ width: `${movie.percentage}%` }}
                      className="bg-rose-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
