import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage: any;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {
      return {
        folder: 'brightstore',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      };
    },
  });
  console.log('Cloudinary CDN storage engine initialized successfully.');
} else {
  // Local Upload Fallback
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  console.log('Cloudinary credentials missing. Falling back to local disk storage uploads.');
}

export const upload = multer({ storage: storage });

export const getFileUrl = (req: any, file: any): string => {
  if (isCloudinaryConfigured) {
    return file.path || (file as any).secure_url;
  } else {
    const port = process.env.PORT || 5001;
    const protocol = req.protocol;
    const host = req.get('host') || `localhost:${port}`;
    return `${protocol}://${host}/uploads/${file.filename}`;
  }
};
