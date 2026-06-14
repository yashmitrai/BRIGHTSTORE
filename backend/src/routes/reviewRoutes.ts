import { Router } from 'express';
import { createReview, getRetailerReviews, updateReview, deleteReview } from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect as any, createReview as any);
router.get('/retailer/:retailerId', getRetailerReviews);
router.put('/:id', protect as any, updateReview as any);
router.delete('/:id', protect as any, deleteReview as any);

export default router;
