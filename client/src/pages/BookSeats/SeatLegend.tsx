import React from 'react';

export const SeatLegend: React.FC = () => {
  const items = [
    { label: 'Ghế Thường', className: 'bg-slate-100 border-slate-300 text-slate-700' },
    { label: 'Ghế VIP', className: 'bg-amber-100 border-amber-300 text-amber-900 font-bold' },
    { label: 'Ghế Đôi (Couple)', className: 'bg-pink-100 border-pink-300 text-pink-900 font-bold' },
    { label: 'Đang Chọn', className: 'bg-rose-600 border-rose-600 text-white font-bold' },
    { label: 'Đã Bán', className: 'bg-slate-200 border-transparent text-slate-400 line-through cursor-not-allowed' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto my-6">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] ${item.className}`}
          >
            •
          </span>
          <span className="text-xs font-semibold text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
