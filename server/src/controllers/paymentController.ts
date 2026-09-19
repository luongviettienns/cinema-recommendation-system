import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId, paymentMethod } = req.body;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp bookingId',
          },
        });
      }

      const result = await paymentService.createPaymentIntent(userId, bookingId, paymentMethod);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const result = await paymentService.handleWebhook(payload);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const { bookingId } = req.params;

      const result = await paymentService.getPaymentStatus(bookingId, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
