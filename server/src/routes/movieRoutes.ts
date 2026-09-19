import { Router } from 'express';
import { movieController } from '../controllers/movieController';
import { authGuard, roleGuard } from '../middlewares/authGuard';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', movieController.getAll);
router.get('/genres', movieController.getGenres);
router.get('/:id', movieController.getById);
router.get('/:id/reviews', movieController.getReviews);
router.post('/:id/reviews', authGuard, movieController.createReview);

// Admin only endpoints
router.post('/', authGuard, roleGuard(Role.ADMIN), movieController.create);
router.put('/:id', authGuard, roleGuard(Role.ADMIN), movieController.update);
router.patch('/:id/status', authGuard, roleGuard(Role.ADMIN), movieController.quickStatus);
router.delete('/:id', authGuard, roleGuard(Role.ADMIN), movieController.delete);

export const movieRoutes = router;
