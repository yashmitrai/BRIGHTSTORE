import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect as any, getNotifications as any);
router.put('/read-all', protect as any, markAllAsRead as any);
router.put('/:id/read', protect as any, markAsRead as any);

export default router;
