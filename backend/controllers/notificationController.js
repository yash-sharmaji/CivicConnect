import { supabase } from '../config/supabase.js';

// Helper to map DB notification types to frontend ones
const mapNotificationType = (dbType) => {
  if (dbType === 'new_comment') return 'comment';
  if (dbType === 'badge_unlocked') return 'badge_earned';
  return dbType; // 'status_change', 'verification'
};

/**
 * Get all notifications for authenticated user
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (notifications || []).map(n => ({
      id: n.id,
      type: mapNotificationType(n.type),
      title: n.title,
      message: n.message,
      issueId: n.type === 'status_change' || n.type === 'verification' || n.type === 'new_comment' ? n.related_id : undefined,
      createdAt: n.created_at,
      read: n.is_read
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Get count of unread notifications for authenticated user
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ unreadCount: count || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a specific notification as read, or mark all as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // If id is 'all', mark all as read

    if (id === 'all') {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) throw error;
      return res.status(200).json({ message: 'All notifications marked as read' });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};
