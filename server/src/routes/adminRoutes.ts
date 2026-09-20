import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { refundController } from '../controllers/refundController';
import { authGuard, roleGuard } from '../middlewares/authGuard';

const router = Router();

// All admin routes strictly guarded by authGuard and roleGuard(['ADMIN'])
router.use(authGuard, roleGuard(['ADMIN']));

router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/analytics/export-excel', (req, res, next) => adminController.exportRevenueExcel(req, res, next));
router.get('/recent-bookings', (req, res, next) => adminController.getRecentBookings(req, res, next));
router.get('/bookings', (req, res, next) => adminController.getRecentBookings(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id/role', (req, res, next) => adminController.updateUserRole(req, res, next));
router.get('/staff', (req, res, next) => adminController.listStaff(req, res, next));
router.post('/staff', (req, res, next) => adminController.createStaff(req, res, next));
router.patch('/staff/:id', (req, res, next) => adminController.updateStaff(req, res, next));

// Refund management endpoints
router.get('/refunds', (req, res, next) => refundController.listAdminRefunds(req, res, next));
router.patch('/refunds/:id/process', (req, res, next) => refundController.processRefund(req, res, next));
router.post('/refunds/direct-cancel', (req, res, next) => refundController.directCancel(req, res, next));

export default router;

