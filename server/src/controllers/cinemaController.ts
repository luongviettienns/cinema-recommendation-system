import { Request, Response, NextFunction } from 'express';
import { cinemaService } from '../services/cinemaService';

export const cinemaController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cinemas = await cinemaService.getAllCinemas();
      res.status(200).json({
        success: true,
        data: cinemas,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const cinema = await cinemaService.getCinemaById(id);
      res.status(200).json({
        success: true,
        data: cinema,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await cinemaService.getRoomSeats(roomId);
      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  },

  async createCinema(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cinema = await cinemaService.createCinema(req.body);
      res.status(201).json({
        success: true,
        data: cinema,
      });
    } catch (error) {
      next(error);
    }
  },

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cinemaId } = req.params;
      const { name, roomType } = req.body;
      const room = await cinemaService.createRoomWithSeats(cinemaId, name, roomType);
      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  },
};
