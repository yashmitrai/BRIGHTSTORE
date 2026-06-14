import { Router } from 'express';
import {
  createOrderRequest,
  getCustomerOrders,
  getOrderDetails,
  getOrderOffers,
  acceptOffer,
  getMarketplaceOrders,
  submitOffer,
  updateOrderStatus,
  getRetailerOrders,
  rejectOrder,
} from '../controllers/orderController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Customer Endpoints
router.post('/', protect as any, createOrderRequest as any);
router.get('/customer', protect as any, getCustomerOrders as any);
router.get('/retailer', protect as any, restrictTo('retailer') as any, getRetailerOrders as any);
router.get('/marketplace', protect as any, restrictTo('retailer') as any, getMarketplaceOrders as any);
router.get('/:id', protect as any, getOrderDetails as any);
router.get('/:id/offers', protect as any, getOrderOffers as any);
router.post('/:id/accept-offer', protect as any, acceptOffer as any);

// Retailer Endpoints
router.post('/:id/offers', protect as any, restrictTo('retailer') as any, submitOffer as any);
router.post('/:id/reject', protect as any, restrictTo('retailer') as any, rejectOrder as any);
router.put('/:id/status', protect as any, restrictTo('retailer', 'admin') as any, updateOrderStatus as any);

export default router;
