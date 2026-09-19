import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// All booking operations require authentication
router.post('/hold', authGuard, (req, res, next) => bookingController.holdSeats(req, res, next));
router.post('/:id/release', authGuard, (req, res, next) => bookingController.releaseBooking(req, res, next));
router.get('/my-bookings', authGuard, (req, res, next) => bookingController.getMyBookings(req, res, next));
router.get('/:id', authGuard, (req, res, next) => bookingController.getBookingById(req, res, next));

export default router;
