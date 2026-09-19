export interface ICinemaPricing {
  ticketType: string;
  description: string;
  weekdayPrice: number; // T2 - T5
  weekendPrice: number; // T6 - CN & Lễ
  u22Price?: number;    // Học sinh / Sinh viên / U22
}

export interface ICinemaTransportation {
  motorbike: string;
  car: string;
  elevator: string;
}

export interface ICinema {
  id: string;
  name: string;
  slug: string;
  region: 'TP. Hồ Chí Minh' | 'Hà Nội' | 'Đà Nẵng' | 'Khác';
  address: string;
  phone: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  totalRooms: number;
  totalSeats: number;
  formats: ('2D' | '3D' | 'IMAX')[];
  amenities: string[];
  transportationGuide: ICinemaTransportation;
  pricingTable: ICinemaPricing[];
}
