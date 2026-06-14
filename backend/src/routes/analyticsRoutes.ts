import { Router } from 'express';
import {
  getRetailerAnalytics,
  getAdminAnalytics,
  getCustomerAnalytics,
} from '../controllers/analyticsController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/retailer', protect as any, restrictTo('retailer') as any, getRetailerAnalytics as any);
router.get('/admin', protect as any, restrictTo('admin') as any, getAdminAnalytics as any);
router.get('/customer', protect as any, restrictTo('customer') as any, getCustomerAnalytics as any);

export default router;
