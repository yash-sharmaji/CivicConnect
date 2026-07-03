import express from 'express';
import { body, query } from 'express-validator';
import { 
  createReport, 
  getReports, 
  getReportById, 
  deleteReport, 
  upvoteReport, 
  verifyReport, 
  addComment 
} from '../controllers/reportController.js';
import { authenticateUser } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// 1. Fetch reports (supports filtering & nearby query coordinates)
router.get(
  '/',
  [
    query('nearby').optional().isBoolean(),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 }),
    query('radius').optional().isFloat({ min: 0.1 }),
    validateRequest
  ],
  getReports
);

// 2. Fetch specific report
router.get('/:id', getReportById);

// 3. File report (accepts multipart file + text body)
router.post(
  '/',
  authenticateUser,
  uploadImage.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('categoryName').trim().notEmpty().withMessage('Category name is required'),
    body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity rating'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude coordinate is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude coordinate is required'),
    body('address').optional().trim(),
    validateRequest
  ],
  createReport
);

// 4. Vote on report
router.post('/:id/vote', authenticateUser, upvoteReport);

// 5. Verify report
router.post(
  '/:id/verify',
  authenticateUser,
  [
    body('comments').optional().trim(),
    validateRequest
  ],
  verifyReport
);

// 6. Comment on report
router.post(
  '/:id/comments',
  authenticateUser,
  [
    body('content').trim().notEmpty().withMessage('Comment content cannot be empty'),
    validateRequest
  ],
  addComment
);

// 7. Delete report
router.delete('/:id', authenticateUser, deleteReport);

export default router;
