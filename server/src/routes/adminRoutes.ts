import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authGuard, roleGuard } from '../middlewares/authGuard';

const router = Router();

// All admin routes strictly guarded by authGuard and roleGuard(['ADMIN'])
router.use(authGuard, roleGuard(['ADMIN']));

router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/recent-bookings', (req, res, next) => adminController.getRecentBookings(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id/role', (req, res, next) => adminController.updateUserRole(req, res, next));

export default router;
