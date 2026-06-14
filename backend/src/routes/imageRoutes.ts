import { Router, Response } from 'express';
import { upload, getFileUrl } from '../config/cloudinaryConfig';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/upload', protect as any, upload.single('image'), (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const url = getFileUrl(req, req.file);
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
