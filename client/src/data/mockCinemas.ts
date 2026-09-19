import { ICinema } from '../types/cinema';

export const INITIAL_CINEMAS: ICinema[] = [
  {
    id: 'cinema-landmark-81',
    name: 'CineLight Landmark 81',
    slug: 'cinelight-landmark-81',
    region: 'TP. Hồ Chí Minh',
    address: 'Tầng B1, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM',
    phone: '1900 1234 (Nhánh 1)',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 1240,
    totalRooms: 7,
    totalSeats: 1120,
    formats: ['2D', '3D', 'IMAX'],
    amenities: [
      'Phòng chiếu IMAX Laser 4K cực đại',
      'Phòng VIP CineComfort da ngả lưng',
      'Hệ thống âm thanh Dolby Atmos 64 kênh',
      'Quầy Bắp Rang Gourmet & Trà Sữa',
      'Lối đi & chỗ ngồi cho người đi xe lăn',
      'Hầm đỗ ô tô & trạm sạc xe điện',
      'Thanh toán không tiền mặt VietQR / Thẻ'
    ],
    transportationGuide: {
      motorbike: 'Gửi xe máy tại hầm B2 (Lối vào cổng số 1 đường Trần Trọng Kim). Nhận vé điện tử thông minh, phí 5.000đ/4h.',
      car: 'Gửi xe ô tô tại tầng hầm B3 (Khu vực cột màu Xanh Lá). Tích hợp trạm sạc siêu nhanh cho xe điện.',
      elevator: 'Đi thang máy tại Sảnh A (gần Highlands Coffee) bấm tầng B1, bước ra rẽ trái 20m là tới sảnh vé CineLight.'
    },
    pricingTable: [
      {
        ticketType: 'Ghế Thường (Standard 2D)',
        description: 'Áp dụng cho mọi vị trí ghế tiêu chuẩn trong phòng chiếu 2D',
        weekdayPrice: 90000,
        weekendPrice: 110000,
        u22Price: 70000
      },
      {
        ticketType: 'Ghế VIP (Sweet Spot 2D)',
        description: 'Khu vực trung tâm hàng D-E-F góc nhìn 36° tiêu chuẩn điện ảnh',
        weekdayPrice: 105000,
        weekendPrice: 125000,
        u22Price: 85000
      },
      {
        ticketType: 'Ghế Đôi (Sweetbox / Couple)',
        description: 'Băng ghế đôi nệm da êm ái có vách ngăn riêng tư ở hàng cuối (Giá cho 2 người)',
        weekdayPrice: 210000,
        weekendPrice: 250000,
      },
      {
        ticketType: 'Định dạng IMAX Laser 4K',
        description: 'Màn hình cực đại, hình ảnh Laser 4K sắc nét và âm thanh đa chiều 12.1 kênh',
        weekdayPrice: 150000,
        weekendPrice: 180000,
        u22Price: 130000
      },
      {
        ticketType: 'Định dạng 3D Kính Phân Cực',
        description: 'Bao gồm kính 3D khử trùng chống lóa được mượn miễn phí tại cửa phòng chiếu',
        weekdayPrice: 120000,
        weekendPrice: 140000,
        u22Price: 100000
      }
    ]
  },
  {
    id: 'cinema-thu-duc',
    name: 'CineLight Thủ Đức',
    slug: 'cinelight-thu-duc',
    region: 'TP. Hồ Chí Minh',
    address: 'Tầng 4, TTTM Vincom Plaza Thủ Đức, 216 Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM',
    phone: '1900 1234 (Nhánh 2)',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 890,
    totalRooms: 6,
    totalSeats: 890,
    formats: ['2D', '3D'],
    amenities: [
      'Cụm rạp hiện đại dành cho giới trẻ & HSSV',
      'Ghế đôi Sweetbox riêng tư cho cặp đôi',
      'Quầy bắp rang Caramel & Phô mai nóng giòn',
      'Bãi đỗ xe máy & ô tô rộng rãi',
      'Thanh toán 1 chạm VietQR / Thẻ'
    ],
    transportationGuide: {
      motorbike: 'Gửi xe máy tại bãi giữ xe cổng đường Võ Văn Ngân hoặc hầm B1. Giữ vé cẩn thận khi ra về.',
      car: 'Bãi đỗ xe ô tô phía sau tòa nhà Vincom Plaza, có nhân viên hướng dẫn vị trí đỗ.',
      elevator: 'Sử dụng thang máy trung tâm TTTM lên thẳng Tầng 4, cụm rạp đối diện khu ẩm thực.'
    },
    pricingTable: [
      {
        ticketType: 'Ghế Thường (Standard 2D)',
        description: 'Áp dụng cho mọi vị trí ghế tiêu chuẩn phòng chiếu 2D',
        weekdayPrice: 80000,
        weekendPrice: 95000,
        u22Price: 60000
      },
      {
        ticketType: 'Ghế VIP (Sweet Spot 2D)',
        description: 'Khu vực trung tâm hàng D-E-F góc nhìn tối ưu',
        weekdayPrice: 95000,
        weekendPrice: 110000,
        u22Price: 75000
      },
      {
        ticketType: 'Ghế Đôi (Sweetbox / Couple)',
        description: 'Ghế đôi dành cho 2 người hàng cuối cùng',
        weekdayPrice: 190000,
        weekendPrice: 220000,
      },
      {
        ticketType: 'Định dạng 3D Kính Phân Cực',
        description: 'Đã bao gồm kính 3D khử trùng mượn xem tại rạp',
        weekdayPrice: 105000,
        weekendPrice: 125000,
        u22Price: 85000
      }
    ]
  },
  {
    id: 'cinema-quan-1',
    name: 'CineLight Quận 1',
    slug: 'cinelight-quan-1',
    region: 'TP. Hồ Chí Minh',
    address: 'Tầng 3, Vincom Center Đồng Khởi, 72 Lê Thánh Tôn & 45A Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '1900 1234 (Nhánh 3)',
    imageUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 1560,
    totalRooms: 5,
    totalSeats: 750,
    formats: ['2D', '3D'],
    amenities: [
      'Không gian điện ảnh boutique sang trọng giữa trung tâm Sài Gòn',
      'Hệ thống âm thanh vòm Dolby Atmos',
      'Sảnh chờ Lounge cao cấp kèm quầy cafe',
      'Ghế bọc nỉ êm ái nhập khẩu châu Âu',
      'Dịch vụ đặt vé trực tuyến không cần in vé giấy'
    ],
    transportationGuide: {
      motorbike: 'Gửi xe máy tại hầm B2 lối vào đường Lý Tự Trọng, quẹt thẻ từ tự động.',
      car: 'Hầm B3 & B4 Vincom Center Đồng Khởi, thanh toán phí gửi xe bằng thẻ hoặc mã QR.',
      elevator: 'Đi thang máy trung tâm từ sảnh Lê Thánh Tôn lên thẳng Tầng 3, rạp nằm ngay cạnh thang cuốn.'
    },
    pricingTable: [
      {
        ticketType: 'Ghế Thường (Standard 2D)',
        description: 'Áp dụng cho vị trí ghế tiêu chuẩn phòng chiếu 2D',
        weekdayPrice: 95000,
        weekendPrice: 115000,
        u22Price: 75000
      },
      {
        ticketType: 'Ghế VIP (Sweet Spot 2D)',
        description: 'Khu vực trung tâm hàng D-E-F tầm nhìn hoàn mỹ',
        weekdayPrice: 110000,
        weekendPrice: 130000,
        u22Price: 90000
      },
      {
        ticketType: 'Ghế Đôi (Sweetbox / Couple)',
        description: 'Băng ghế đôi tình nhân bọc nệm riêng tư (Giá cho 2 người)',
        weekdayPrice: 220000,
        weekendPrice: 260000,
      },
      {
        ticketType: 'Định dạng 3D Kính Phân Cực',
        description: 'Bao gồm kính 3D công nghệ RealD chống mỏi mắt',
        weekdayPrice: 125000,
        weekendPrice: 145000,
        u22Price: 105000
      }
    ]
  }
];
