import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress } from '../controllers/addressController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect as any, getAddresses as any);
router.post('/', protect as any, createAddress as any);
router.put('/:id', protect as any, updateAddress as any);
router.put('/:id/default', protect as any, setDefaultAddress as any);
router.delete('/:id', protect as any, deleteAddress as any);

export default router;
