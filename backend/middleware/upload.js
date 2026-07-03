import multer from 'multer';
import { APIError } from './errorHandler.js';

// Use memory storage to store raw file buffer before uploading to Supabase Storage
const storage = multer.memoryStorage();

// File type filter to enforce image-only uploads
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new APIError('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.', 400), false);
  }
};

// Multer upload config
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum limit
  }
});
