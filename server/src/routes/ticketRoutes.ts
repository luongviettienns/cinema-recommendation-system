import { Router } from 'express';
import { ticketController } from '../controllers/ticketController';
import { authGuard, roleGuard } from '../middlewares/authGuard';

const router = Router();

// Customer: list my tickets
router.get('/my-tickets', authGuard, (req, res, next) =>
  ticketController.getMyTickets(req, res, next)
);

// Staff/Admin: check-in ticket by QR code or ticket code
router.post(
  '/checkin',
  authGuard,
  roleGuard(['STAFF', 'ADMIN']),
  (req, res, next) => ticketController.checkInTicket(req, res, next)
);

// Customer / Staff / Admin: get ticket details
router.get('/:ticketCode', authGuard, (req, res, next) =>
  ticketController.getTicketByCode(req, res, next)
);

export default router;
