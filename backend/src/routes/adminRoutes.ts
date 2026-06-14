import { Router } from 'express';
import {
  getAdminOverview,
  getRetailers,
  verifyRetailer,
  getAllOrders,
  getAllUsers,
} from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/overview', protect as any, restrictTo('admin') as any, getAdminOverview as any);
router.get('/retailers', protect as any, restrictTo('admin') as any, getRetailers as any);
router.post('/retailers/:id/verify', protect as any, restrictTo('admin') as any, verifyRetailer as any);
router.get('/orders', protect as any, restrictTo('admin') as any, getAllOrders as any);
router.get('/users', protect as any, restrictTo('admin') as any, getAllUsers as any);

export default router;
