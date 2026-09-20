import { Router } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { refundController } from '../controllers/refundController';

const router = Router();

// Khách hàng gửi yêu cầu hoàn tiền
router.post('/request', authGuard, refundController.requestRefund);

// Khách hàng xem danh sách yêu cầu hoàn tiền của mình
router.get('/my-requests', authGuard, refundController.getMyRefundRequests);

export default router;
