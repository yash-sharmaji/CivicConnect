import express from 'express';
import { body } from 'express-validator';
import { signup, login, logout, getProfile } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// Signup route
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty if provided'),
    body('role').optional().isIn(['citizen', 'staff', 'admin']).withMessage('Invalid user role'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL must be a valid URL'),
    validateRequest
  ],
  signup
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  login
);

// Logout route
router.post('/logout', logout);

// Profile route (Protected)
router.get('/profile', authenticateUser, getProfile);

export default router;
