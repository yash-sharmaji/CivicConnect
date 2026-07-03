import express from 'express';
import { analyzeImage } from '../controllers/aiController.js';
import { authenticateUser } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// Protected route to analyze images (uses multer middleware)
router.post('/analyze', authenticateUser, uploadImage.single('image'), analyzeImage);

export default router;
