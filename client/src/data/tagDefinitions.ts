export interface ITagDefinition {
  code: string;
  label: string;
  category: 'age' | 'format' | 'language' | 'seat';
  badgeBg: string;
  badgeText: string;
  borderColor?: string;
  summary: string;
  description: string;
  recommendation?: string;
}

export const TAG_DEFINITIONS: ITagDefinition[] = [
  // 1. Phân loại độ tuổi khán giả (Chuẩn Cục Điện Ảnh Việt Nam)
  {
    code: 'P',
    label: 'Phổ biến',
    category: 'age',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    summary: 'Mọi đối tượng',
    description: 'Phim phù hợp cho mọi lứa tuổi, trẻ em và gia đình.',
    recommendation: 'Mọi lứa tuổi'
  },
  {
    code: 'K',
    label: 'Khán giả nhí',
    category: 'age',
    badgeBg: 'bg-teal-500',
    badgeText: 'text-white',
    summary: 'Dưới 13 tuổi',
    description: 'Người xem dưới 13 tuổi cần có cha mẹ hoặc người giám hộ đi cùng.',
    recommendation: 'Cần người lớn đi kèm'
  },
  {
    code: 'T13',
    label: 'Khán giả 13+',
    category: 'age',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-slate-950',
    summary: 'Từ 13 tuổi trở lên',
    description: 'Phim chỉ dành cho khán giả từ đủ 13 tuổi trở lên.',
    recommendation: 'Xuất trình CCCD/Thẻ HS'
  },
  {
    code: 'T16',
    label: 'Khán giả 16+',
    category: 'age',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-white',
    summary: 'Từ 16 tuổi trở lên',
    description: 'Phim chỉ dành cho khán giả từ đủ 16 tuổi trở lên.',
    recommendation: 'Yêu cầu CCCD'
  },
  {
    code: 'T18',
    label: 'Khán giả 18+',
    category: 'age',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    summary: 'Từ 18 tuổi trở lên',
    description: 'Phim chỉ dành cho khán giả từ đủ 18 tuổi. Nghiêm cấm dưới 18 tuổi.',
    recommendation: 'Bắt buộc CCCD'
  },

  // 2. Định dạng & Công nghệ trình chiếu
  {
    code: '2D',
    label: '2D Tiêu Chuẩn',
    category: 'format',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    summary: 'Hình ảnh 2D phẳng sắc nét',
    description: 'Định dạng 2D tiêu chuẩn, âm thanh vòm Dolby 7.1 dễ chịu cho mắt.',
    recommendation: 'Tiêu chuẩn & Phổ biến'
  },
  {
    code: '3D',
    label: '3D RealD',
    category: 'format',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-300',
    summary: 'Hình ảnh nổi 3 chiều',
    description: 'Kính 3D nổi đa chiều sống động, mượn kính miễn phí khi vào phòng chiếu.',
    recommendation: 'Phim bom tấn & phiêu lưu'
  },
  {
    code: 'IMAX',
    label: 'IMAX Laser 4K',
    category: 'format',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    summary: 'Màn cong cực đại & Laser 4K',
    description: 'Màn hình vòm khổng lồ, máy chiếu Laser 4K và âm thanh vòm 12.1 đỉnh cao.',
    recommendation: 'Trải nghiệm đỉnh cao'
  },
  {
    code: 'Atmos',
    label: 'Dolby Atmos',
    category: 'format',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-amber-400',
    summary: 'Âm thanh 360° đa chiều',
    description: 'Hệ thống loa vòm 360 độ từ trần và xung quanh định vị âm thanh chính xác.',
    recommendation: 'Âm thanh vòm sống động'
  },

  // 3. Phiên bản ngôn ngữ
  {
    code: 'Sub',
    label: 'Phụ đề tiếng Việt',
    category: 'language',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    summary: 'Giọng gốc + Phụ đề Việt',
    description: 'Âm thanh gốc của diễn viên, phụ đề tiếng Việt hiển thị chân khung hình.',
    recommendation: 'Giọng thoại gốc'
  },
  {
    code: 'Dub',
    label: 'Lồng tiếng Việt',
    category: 'language',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    summary: 'Lồng tiếng Việt 100%',
    description: 'Lồng tiếng Việt bởi diễn viên chuyên nghiệp, dễ theo dõi cho trẻ em.',
    recommendation: 'Trẻ em & Gia đình'
  },

  // 4. Hạng ghế & Phòng chiếu
  {
    code: 'Standard',
    label: 'Ghế Tiêu Chuẩn',
    category: 'seat',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    summary: 'Ghế đơn phổ thông',
    description: 'Ghế bọc nỉ êm ái tại các hàng ghế đầu và cuối phòng chiếu.',
    recommendation: 'Tiết kiệm nhất'
  },
  {
    code: 'VIP',
    label: 'Ghế VIP',
    category: 'seat',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    summary: 'Khu vực trung tâm',
    description: 'Tọa lạc ở trung tâm rạp, góc nhìn màn ảnh và âm thanh tối ưu nhất.',
    recommendation: 'Góc nhìn vàng đẹp nhất'
  },
  {
    code: 'Sweetbox',
    label: 'Ghế Đôi (Couple)',
    category: 'seat',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    borderColor: 'border-pink-300',
    summary: 'Ghế đôi riêng tư',
    description: 'Băng ghế đôi hàng cuối có vách ngăn riêng tư, ấm cúng cho 2 người.',
    recommendation: 'Trọn gói 2 người'
  }
];

export const getTagByCode = (code: string): ITagDefinition | undefined => {
  return TAG_DEFINITIONS.find((t) => t.code.toLowerCase() === code.toLowerCase());
};
