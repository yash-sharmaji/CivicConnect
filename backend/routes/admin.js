import express from 'express';
import { body } from 'express-validator';
import { 
  assignStaff, 
  updateStatus, 
  getAnalytics, 
  manageUsers, 
  updateUserRole 
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// Enforce auth & elevated roles for all admin endpoints
router.use(authenticateUser);
router.use(authorizeRoles('staff', 'admin'));

// 1. Fetch portal analytics
router.get('/analytics', getAnalytics);

// 2. Fetch users management list
router.get('/users', manageUsers);

// 3. Assign staff to report
router.post(
  '/reports/:id/assign',
  [
    body('staffId').isUUID().withMessage('Valid staff user ID is required'),
    validateRequest
  ],
  assignStaff
);

// 4. Update status of report
router.patch(
  '/reports/:id/status',
  [
    body('status').isIn(['submitted', 'verified', 'in_progress', 'resolved', 'rejected']).withMessage('Invalid status rating'),
    body('comments').optional().trim(),
    validateRequest
  ],
  updateStatus
);

// 5. Update user role (Admin only)
router.patch(
  '/users/:userId/role',
  authorizeRoles('admin'),
  [
    body('role').isIn(['citizen', 'staff', 'admin']).withMessage('Invalid role'),
    validateRequest
  ],
  updateUserRole
);

export default router;
