import express from 'express';
import { getNotifications, getUnreadCount, markAsRead } from '../controllers/notificationController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);

export default router;
