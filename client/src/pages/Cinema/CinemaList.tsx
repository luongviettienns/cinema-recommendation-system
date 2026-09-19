import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Star, Film, Sparkles, Navigation, ArrowRight, HelpCircle, Building2 } from 'lucide-react';
import { ICinema } from '../../types/cinema';
import { cinemaService } from '../../services/cinemaService';
import { TagGlossaryModal } from '../../components/common/TagGlossaryModal';

export const CinemaList: React.FC = () => {
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('Tất cả');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cinemaService.getAllCinemas().then((data) => {
      setCinemas(data);
      setIsLoading(false);
    });
  }, []);

  const regions = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];

  const filteredCinemas = selectedRegion === 'Tất cả'
    ? cinemas
    : cinemas.filter((c) => c.region === selectedRegion);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tải danh sách cụm rạp CineLight...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-rose-600 text-xs font-black tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Hệ Thống Rạp Toàn Quốc
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-rose-600" />
            <span>Danh Sách Cụm Rạp CineLight</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Không gian rạp chiếu chuẩn quốc tế, máy chiếu Laser 4K và âm thanh vòm Dolby Atmos đa chiều
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGlossaryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer w-fit shadow-xs"
        >
          <HelpCircle className="w-4 h-4 text-rose-600" />
          <span>Giải Thích Ký Hiệu & Tag Rạp</span>
        </button>
      </div>

      {/* Region Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => setSelectedRegion(reg)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              selectedRegion === reg
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Cinema Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCinemas.map((cinema) => (
          <div
            key={cinema.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Cinema Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img
                  src={cinema.imageUrl}
                  alt={cinema.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-rose-600 border border-slate-100 shadow-xs">
                  {cinema.region}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-black text-slate-900 flex items-center gap-1 border border-slate-100 shadow-xs">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{cinema.rating}</span>
                </div>
              </div>

              {/* Cinema Info */}
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">
                  {cinema.name}
                </h3>
                <div className="flex items-start gap-2 text-xs text-slate-500 mb-4 line-clamp-2">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{cinema.address}</span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Quy mô</span>
                    <span className="font-extrabold text-slate-800">{cinema.totalRooms} phòng • {cinema.totalSeats} ghế</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Định dạng</span>
                    <span className="font-extrabold text-rose-600">{cinema.formats.join(', ')}</span>
                  </div>
                </div>

                {/* Amenities pills */}
                <div className="flex flex-wrap gap-1.5">
                  {cinema.amenities.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 sm:p-6 pt-0 flex items-center justify-between gap-2">
              <Link
                to={`/cinema/${cinema.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Xem Lịch Chiếu & Giá Vé</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Tag Glossary Modal */}
      <TagGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
};
