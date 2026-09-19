import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authGuard, authController.getMe);

export const authRoutes = router;
