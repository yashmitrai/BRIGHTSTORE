import { Router, Response } from 'express';
import { upload, getFileUrl } from '../config/cloudinaryConfig';
import { protect } from '../middleware/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const router = Router();

// Single image upload
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

// Multiple image upload (up to 5)
router.post('/upload-multiple', protect as any, upload.array('images', 5), (req: any, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No image files uploaded' });
    }

    const urls = files.map((file) => getFileUrl(req, file));
    return res.json({ urls });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
});

// Delete image
router.post('/delete', protect as any, (req: any, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    const isCloudinary = url.includes('cloudinary.com');

    if (isCloudinary) {
      // Extract public_id
      // Format: .../upload/v123456/brightstore/filename.jpg
      const parts = url.split('/upload/');
      if (parts.length > 1) {
        // e.g. v123456/brightstore/filename.jpg
        const subparts = parts[1].split('/');
        // Remove version (first element if it starts with 'v')
        if (subparts[0].startsWith('v')) {
          subparts.shift();
        }
        // Join the remaining parts, and strip the extension
        const rawPath = subparts.join('/');
        const publicId = rawPath.substring(0, rawPath.lastIndexOf('.'));

        cloudinary.uploader.destroy(publicId, (err: any, result: any) => {
          if (err) {
            console.error('Cloudinary destroy error:', err);
            return res.status(500).json({ message: 'Failed to delete from Cloudinary' });
          }
          return res.json({ message: 'Deleted from Cloudinary successfully', result });
        });
      } else {
        return res.status(400).json({ message: 'Invalid Cloudinary URL structure' });
      }
    } else {
      // Local file delete
      // Format: http://localhost:5001/uploads/filename.jpg
      const filename = url.substring(url.lastIndexOf('/') + 1);
      const filePath = path.join(__dirname, '../../uploads', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ message: 'Deleted local file successfully' });
      } else {
        return res.status(404).json({ message: 'Local file not found' });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
