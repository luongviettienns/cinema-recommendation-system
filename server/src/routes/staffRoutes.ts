import { Router } from 'express';
import { staffController } from '../controllers/staffController';
import { authGuard, roleGuard } from '../middlewares/authGuard';
import { Role } from '@prisma/client';

const router = Router();

// Strict security: Only STAFF and ADMIN roles are authorized to access Staff Console APIs
router.use(authGuard, roleGuard([Role.STAFF, Role.ADMIN]));

// 1. Soát vé QR / Check-in
router.post('/tickets/scan', (req, res, next) => staffController.scanTicket(req, res, next));

// 2. Bán vé tại quầy (Box Office Walk-in)
router.post('/box-office/sell', (req, res, next) => staffController.sellBoxOffice(req, res, next));

// 3. Xử lý sự cố đổi ghế tại chỗ
router.post('/seats/swap', (req, res, next) => staffController.swapSeat(req, res, next));

// 4. Đối chiếu sĩ số điểm danh của 1 suất chiếu
router.get('/showtimes/:id/attendance', (req, res, next) => staffController.getShowtimeAttendance(req, res, next));

// 5. Suất chiếu hôm nay phục vụ tác nghiệp quầy
router.get('/showtimes/today', (req, res, next) => staffController.getTodayShowtimes(req, res, next));

export default router;
