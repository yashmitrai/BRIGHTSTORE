import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect as any, getMe as any);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/profile', protect as any, updateProfile as any);
router.put('/change-password', protect as any, changePassword as any);

export default router;
