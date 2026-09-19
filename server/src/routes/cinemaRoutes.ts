import { Router } from 'express';
import { cinemaController } from '../controllers/cinemaController';
import { authGuard, roleGuard } from '../middlewares/authGuard';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', cinemaController.getAll);
router.get('/:id', cinemaController.getById);
router.get('/rooms/:roomId/seats', cinemaController.getRoomSeats);

// Admin only endpoints
router.post('/', authGuard, roleGuard(Role.ADMIN), cinemaController.createCinema);
router.post('/:cinemaId/rooms', authGuard, roleGuard(Role.ADMIN), cinemaController.createRoom);

export const cinemaRoutes = router;
