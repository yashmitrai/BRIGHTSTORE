import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { protect, softProtect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/', softProtect as any, getProducts as any);
router.post('/', protect as any, restrictTo('retailer', 'admin') as any, createProduct as any);
router.put('/:id', protect as any, restrictTo('retailer', 'admin') as any, updateProduct as any);
router.delete('/:id', protect as any, restrictTo('retailer', 'admin') as any, deleteProduct as any);

export default router;
