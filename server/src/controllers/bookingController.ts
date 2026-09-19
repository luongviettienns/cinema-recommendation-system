import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/bookingService';

export class BookingController {
  async holdSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { showtimeId, seatIds } = req.body;

      if (!showtimeId || !Array.isArray(seatIds)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp showtimeId và danh sách seatIds',
          },
        });
      }

      const result = await bookingService.holdSeats(userId, showtimeId, seatIds);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';
      const { id } = req.params;

      const result = await bookingService.releaseBooking(userId, id, isAdmin);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const bookings = await bookingService.getMyBookings(userId);

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const { id } = req.params;

      const booking = await bookingService.getBookingById(id, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
