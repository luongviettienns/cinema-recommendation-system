import { ICinema } from '../types/cinema';
import { INITIAL_CINEMAS } from '../data/mockCinemas';
import { delay, USE_MOCK, apiRequest } from './api';

function mapBackendCinema(c: any, mockFallback?: ICinema): ICinema {
  const roomsCount = c.rooms?.length || mockFallback?.totalRooms || 3;
  const totalSeats = c.rooms?.reduce((acc: number, r: any) => acc + (r.seats?.length || 80), 0) || mockFallback?.totalSeats || 240;

  return {
    id: c.id,
    name: c.name,
    slug: mockFallback?.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    region: (c.city?.includes('Hà Nội') ? 'Hà Nội' : (c.city?.includes('Đà Nẵng') ? 'Đà Nẵng' : 'TP. Hồ Chí Minh')) as any,
    address: c.address,
    phone: c.phone || mockFallback?.phone || '1900 1234',
    imageUrl: mockFallback?.imageUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    rating: mockFallback?.rating || 4.9,
    reviewCount: mockFallback?.reviewCount || 1280,
    totalRooms: roomsCount,
    totalSeats,
    formats: mockFallback?.formats || ['2D', '3D', 'IMAX'],
    amenities: mockFallback?.amenities || [
      'Phòng chiếu IMAX Laser thế hệ mới',
      'Âm thanh vòm Dolby Atmos 64 kênh',
      'Ghế bọc da công thái học',
      'Bãi đỗ xe rộng rãi tầng hầm',
    ],
    transportationGuide: mockFallback?.transportationGuide || {
      motorbike: 'Gửi xe tại hầm B2-B3, nhận thẻ xe tự động 5.000đ/lượt.',
      car: 'Bãi đỗ ô tô hầm B1, giá 30.000đ/2 giờ đầu.',
      elevator: 'Sử dụng thang máy số 03 hoặc 05 lên thẳng tầng rạp chiếu.',
    },
    pricingTable: mockFallback?.pricingTable || [
      { ticketType: 'Vé Tiêu Chuẩn (Standard)', description: 'Ghế tiêu chuẩn các hàng đầu', weekdayPrice: 85000, weekendPrice: 105000, u22Price: 65000 },
      { ticketType: 'Vé VIP (Ghế VIP Trung Tâm)', description: 'Khu vực góc nhìn đẹp nhất', weekdayPrice: 105000, weekendPrice: 125000, u22Price: 85000 },
      { ticketType: 'Vé Ghế Đôi (Sweetbox / Couple)', description: 'Ghế đôi dành cho 2 người', weekdayPrice: 200000, weekendPrice: 240000 },
    ],
  };
}

export const cinemaService = {
  async getAllCinemas(): Promise<ICinema[]> {
    if (!USE_MOCK) {
      try {
        const cinemas = await apiRequest<any[]>('/v1/cinemas');
        if (Array.isArray(cinemas) && cinemas.length > 0) {
          return cinemas.map((c, index) => mapBackendCinema(c, INITIAL_CINEMAS[index % INITIAL_CINEMAS.length]));
        }
      } catch (err) {
        console.warn('Backend API getAllCinemas failed, fallback to mock', err);
      }
    }
    await delay(150);
    return INITIAL_CINEMAS;
  },

  async getCinemas(): Promise<ICinema[]> {
    return this.getAllCinemas();
  },

  async getCinemaById(idOrSlug: string): Promise<ICinema | undefined> {
    if (!USE_MOCK) {
      try {
        const cinema = await apiRequest<any>(`/v1/cinemas/${idOrSlug}`);
        if (cinema) {
          const fallback = INITIAL_CINEMAS.find((m) => m.id === idOrSlug || m.slug === idOrSlug || m.name === cinema.name);
          return mapBackendCinema(cinema, fallback);
        }
      } catch (err) {
        console.warn(`Backend API getCinemaById(${idOrSlug}) failed, fallback to mock`, err);
      }
    }
    await delay(150);
    return INITIAL_CINEMAS.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  },

  async getCinemasByRegion(region: string): Promise<ICinema[]> {
    const all = await this.getAllCinemas();
    if (!region || region === 'Tất cả') return all;
    return all.filter((c) => c.region === region);
  },
};
