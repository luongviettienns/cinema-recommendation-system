import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// Create payment intent (requires auth)
router.post('/create-intent', authGuard, (req, res, next) =>
  paymentController.createPaymentIntent(req, res, next)
);

// Webhook endpoint (public with HMAC signature validation)
router.post('/webhook', (req, res, next) =>
  paymentController.handleWebhook(req, res, next)
);

// Payment status check
router.get('/:bookingId/status', authGuard, (req, res, next) =>
  paymentController.getPaymentStatus(req, res, next)
);

// Sandbox confirm for demo/testing
router.post('/sandbox-confirm', authGuard, (req, res, next) =>
  paymentController.sandboxConfirm(req, res, next)
);

export default router;
