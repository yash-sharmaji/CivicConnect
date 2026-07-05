import express from 'express';
import { body } from 'express-validator';
import { 
  assignStaff, 
  updateStatus, 
  getAnalytics, 
  manageUsers, 
  updateUserRole,
  getAdminRequests,
  submitAdminRequest,
  updateAdminRequestStatus,
  promoteUser,
  demoteUser
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// Enforce authentication for all admin endpoints
router.use(authenticateUser);

// 6. Submit an admin request (Available to citizens)
router.post(
  '/requests',
  [
    body('reason').trim().isLength({ min: 10 }).withMessage('Request reason must be at least 10 characters long'),
    validateRequest
  ],
  submitAdminRequest
);

// Enforce elevated roles for the remaining admin operations
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

// 7. Fetch admin requests (Admin only)
router.get('/requests', authorizeRoles('admin'), getAdminRequests);

// 8. Update request status (Admin only)
router.patch(
  '/requests/:requestId',
  authorizeRoles('admin'),
  [
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid status update'),
    validateRequest
  ],
  updateAdminRequestStatus
);

// 9. Promote user (Admin only)
router.post('/users/:userId/promote', authorizeRoles('admin'), promoteUser);

// 10. Demote user (Admin only)
router.post('/users/:userId/demote', authorizeRoles('admin'), demoteUser);

export default router;
