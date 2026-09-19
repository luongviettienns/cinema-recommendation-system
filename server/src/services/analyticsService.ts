import { prisma } from '../prisma';
import { BookingStatus, Role } from '@prisma/client';

export class AnalyticsService {
  /**
   * Get aggregated dashboard summary metrics for Admin
   */
  async getDashboardSummary() {
    // 1. Overview counts
    const [
      paidBookingsAggregation,
      totalTickets,
      totalUsers,
      totalMovies,
      totalCinemas,
    ] = await Promise.all([
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: BookingStatus.PAID },
      }),
      prisma.ticket.count(),
      prisma.user.count(),
      prisma.movie.count(),
      prisma.cinema.count(),
    ]);

    const totalRevenue = paidBookingsAggregation._sum.totalAmount || 0;

    // 2. Revenue by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentPaidBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PAID,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { date: string; revenue: number; ordersCount: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, { date: dateStr, revenue: 0, ordersCount: 0 });
    }

    for (const b of recentPaidBookings) {
      const dateStr = b.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.revenue += b.totalAmount;
        entry.ordersCount += 1;
      }
    }

    const revenueByDay = Array.from(dailyMap.values());

    // 3. Top movies by sales
    const movies = await prisma.movie.findMany({
      include: {
        showtimes: {
          include: {
            bookings: {
              where: { status: BookingStatus.PAID },
              select: {
                totalAmount: true,
                bookingSeats: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const topMovies = movies
      .map((m) => {
        let revenue = 0;
        let ticketsSold = 0;
        for (const s of m.showtimes) {
          for (const b of s.bookings) {
            revenue += b.totalAmount;
            ticketsSold += b.bookingSeats.length;
          }
        }
        return {
          id: m.id,
          title: m.title,
          poster: m.poster,
          duration: m.duration,
          rating: m.rating,
          revenue,
          ticketsSold,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      overview: {
        totalRevenue,
        totalTickets,
        totalUsers,
        totalMovies,
        totalCinemas,
      },
      revenueByDay,
      topMovies,
    };
  }

  /**
   * Get recent bookings across the cinema network
   */
  async getRecentBookings(limit = 10) {
    const bookings = await prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                poster: true,
              },
            },
            room: {
              include: {
                cinema: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        payment: true,
        ticket: true,
      },
    });

    return bookings;
  }

  /**
   * Get all registered users with their booking stats
   */
  async getUsersList() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      totalBookings: u._count.bookings,
    }));
  }

  /**
   * Update a user's role (promote/demote: CUSTOMER, STAFF, ADMIN)
   */
  async updateUserRole(userId: string, role: Role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error('Không tìm thấy người dùng');
      (err as any).statusCode = 404;
      (err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}

export const analyticsService = new AnalyticsService();
