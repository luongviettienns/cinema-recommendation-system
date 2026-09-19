import { Router } from 'express';
import { showtimeController } from '../controllers/showtimeController';
import { authGuard, roleGuard } from '../middlewares/authGuard';

const router = Router();

// Public routes
router.get('/', (req, res, next) => showtimeController.getShowtimes(req, res, next));
router.get('/:id', (req, res, next) => showtimeController.getShowtimeById(req, res, next));

// Admin-only management routes
router.post(
  '/',
  authGuard,
  roleGuard(['ADMIN']),
  (req, res, next) => showtimeController.createShowtime(req, res, next)
);

router.delete(
  '/:id',
  authGuard,
  roleGuard(['ADMIN']),
  (req, res, next) => showtimeController.deleteShowtime(req, res, next)
);

export default router;
