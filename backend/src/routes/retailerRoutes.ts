import { Router } from 'express';
import { getRetailers, getRetailerById, getNearbyRetailers, updateStoreSettings } from '../controllers/retailerController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getRetailers);
router.get('/nearby', getNearbyRetailers);
router.get('/:id', getRetailerById);
router.put('/profile', protect as any, updateStoreSettings as any);

export default router;
