import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Film, 
  Armchair, 
  ShieldCheck, 
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface AttendeeTicket {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  seats: string[];
  seatType: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export const StaffAttendance: React.FC = () => {
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('st-1');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showtimes = [
    { id: 'st-1', movie: 'Coyote vs. Acme', time: '19:30', room: 'Phòng 01 - IMAX Laser', totalSeats: 40 },
    { id: 'st-2', movie: 'Bầy Xác Sống', time: '20:15', room: 'Phòng 02 - Dolby Atmos', totalSeats: 36 },
    { id: 'st-3', movie: 'Ngày Tàn Của Phố Oak', time: '21:15', room: 'Phòng 03 - Standard 2D', totalSeats: 32 },
  ];

  const [attendees, setAttendees] = useState<AttendeeTicket[]>([
    {
      id: 't-1',
      code: 'CL-839210',
      customerName: 'Nguyễn Văn A',
      phone: '0987***321',
      seats: ['E5', 'E6'],
      seatType: 'VIP',
      checkedIn: true,
      checkedInAt: '07:40',
    },
    {
      id: 't-2',
      code: 'CL-741928',
      customerName: 'Trần Minh Khang',
      phone: '0912***456',
      seats: ['E7', 'E8'],
      seatType: 'VIP',
      checkedIn: true,
      checkedInAt: '07:42',
    },
    {
      id: 't-3',
      code: 'CL-992103',
      customerName: 'Lê Hoàng Nam',
      phone: '0933***889',
      seats: ['D3', 'D4'],
      seatType: 'REGULAR',
      checkedIn: false,
    },
    {
      id: 't-4',
      code: 'BX-582910',
      customerName: 'Khách vãng lai (Quầy)',
      phone: 'Mua trực tiếp',
      seats: ['F5', 'F6'],
      seatType: 'VIP',
      checkedIn: true,
      checkedInAt: '07:45',
    },
    {
      id: 't-5',
      code: 'CL-441209',
      customerName: 'Phạm Quỳnh Anh',
      phone: '0978***112',
      seats: ['G1', 'G2'],
      seatType: 'COUPLE',
      checkedIn: false,
    },
    {
      id: 't-6',
      code: 'CL-339182',
      customerName: 'Vũ Đức Thịnh',
      phone: '0909***678',
      seats: ['C5'],
      seatType: 'REGULAR',
      checkedIn: false,
    },
  ]);

  const activeShowtime = showtimes.find((s) => s.id === selectedShowtimeId) || showtimes[0];

  // Stats calculations
  const totalTickets = attendees.length;
  const totalSeatsBooked = attendees.reduce((acc, curr) => acc + curr.seats.length, 0);
  const checkedInAttendees = attendees.filter((a) => a.checkedIn);
  const checkedInSeatsCount = checkedInAttendees.reduce((acc, curr) => acc + curr.seats.length, 0);
  const pendingCount = totalTickets - checkedInAttendees.length;
  const attendanceRate = totalTickets > 0 ? Math.round((checkedInAttendees.length / totalTickets) * 100) : 0;

  // Manual check-in action
  const handleManualCheckIn = (id: string, code: string) => {
    setAttendees((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              checkedIn: true,
              checkedInAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            }
          : item
      )
    );
    toast.success(`Đã check-in thủ công cho vé [${code}]!`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Đã cập nhật dữ liệu sĩ số mới nhất');
    }, 250);
  };

  // Filtered attendees
  const filteredAttendees = attendees.filter((attendee) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'CHECKED_IN'
        ? attendee.checkedIn
        : !attendee.checkedIn;

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      attendee.code.toLowerCase().includes(q) ||
      attendee.customerName.toLowerCase().includes(q) ||
      attendee.phone.toLowerCase().includes(q) ||
      attendee.seats.some((s) => s.toLowerCase().includes(q));

    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Đối Chiếu Sĩ Số Suất Chiếu
          </h1>
          <p className="text-xs text-slate-500">
            Điểm danh vé đã vào rạp & hỗ trợ check-in thủ công
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 shadow-xs transition-colors cursor-pointer"
          title="Làm mới sĩ số"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Select Showtime */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-emerald-600" />
          Chọn suất chiếu cần kiểm tra sĩ số:
        </label>
        <select
          value={selectedShowtimeId}
          onChange={(e) => setSelectedShowtimeId(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none"
        >
          {showtimes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.time} — {st.movie} ({st.room})
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Stats KPI Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Tiến độ vào phòng chiếu:</span>
          <span className="font-black text-emerald-700 text-sm">
            {checkedInAttendees.length}/{totalTickets} vé ({attendanceRate}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Vé đã bán</span>
            <span className="text-base font-black text-slate-900">{totalTickets}</span>
            <span className="text-[10px] text-slate-500 block">({totalSeatsBooked} ghế)</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] text-emerald-600 font-semibold block uppercase">Đã vào rạp</span>
            <span className="text-base font-black text-emerald-700">{checkedInAttendees.length}</span>
            <span className="text-[10px] text-emerald-600 block">({checkedInSeatsCount} ghế)</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
            <span className="text-[10px] text-amber-600 font-semibold block uppercase">Chưa đến</span>
            <span className="text-base font-black text-amber-700">{pendingCount}</span>
            <span className="text-[10px] text-amber-600 block">({totalSeatsBooked - checkedInSeatsCount} ghế)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2">
        <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({attendees.length})
          </button>
          <button
            onClick={() => setFilterStatus('CHECKED_IN')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'CHECKED_IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã vào ({checkedInAttendees.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa vào ({pendingCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách, SĐT, mã vé hoặc số ghế..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Attendee Ticket List */}
      <div className="space-y-2">
        {filteredAttendees.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Không tìm thấy vé nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredAttendees.map((item) => (
            <div
              key={item.id}
              className={`p-3 bg-white rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-3 ${
                item.checkedIn
                  ? 'border-emerald-200/90 bg-emerald-50/20'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Left: Info */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {item.code}
                  </span>
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {item.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-0.5 font-bold text-slate-700">
                    <Armchair className="w-3 h-3 text-emerald-600" />
                    {item.seats.join(', ')}
                  </span>
                  <span>•</span>
                  <span>{item.phone}</span>
                </div>
                <div className="text-[10px]">
                  {item.checkedIn ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã soát lúc {item.checkedInAt}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Chưa soát vé
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Action or Badge */}
              <div className="shrink-0">
                {item.checkedIn ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã Vào
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualCheckIn(item.id, item.code)}
                    className="bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Soát Ngay
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
