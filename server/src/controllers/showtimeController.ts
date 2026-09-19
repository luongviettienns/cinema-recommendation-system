import { Request, Response, NextFunction } from 'express';
import { showtimeService } from '../services/showtimeService';

export class ShowtimeController {
  async getShowtimes(req: Request, res: Response, next: NextFunction) {
    try {
      const { movieId, cinemaId, roomId, date } = req.query;
      const showtimes = await showtimeService.getShowtimes({
        movieId: movieId as string | undefined,
        cinemaId: cinemaId as string | undefined,
        roomId: roomId as string | undefined,
        date: date as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: showtimes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShowtimeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const showtime = await showtimeService.getShowtimeById(id);

      res.status(200).json({
        success: true,
        data: showtime,
      });
    } catch (error) {
      next(error);
    }
  }

  async createShowtime(req: Request, res: Response, next: NextFunction) {
    try {
      const { movieId, roomId, startTime, format, language, totalPrice, basePrice } = req.body;

      if (!movieId || !roomId || !startTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp movieId, roomId và startTime',
          },
        });
      }

      const showtime = await showtimeService.createShowtime({
        movieId,
        roomId,
        startTime,
        format,
        language,
        basePrice: basePrice || totalPrice,
      });

      res.status(201).json({
        success: true,
        data: showtime,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteShowtime(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await showtimeService.deleteShowtime(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const showtimeController = new ShowtimeController();
