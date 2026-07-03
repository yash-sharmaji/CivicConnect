import { supabase } from '../config/supabase.js';

/**
 * Middleware to authenticate requests using Supabase JWT
 */
export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or invalid. Use Bearer <token>' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Get user details from Supabase Auth service
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session' });
    }

    // 2. Fetch profile role & details from the database public.users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback in case Postgres sync triggers haven't fired or profile isn't queried yet
      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Citizen',
        role: 'citizen',
        xp: 0
      };
    } else {
      req.user = profile;
    }

    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(500).json({ error: 'Internal security authentication failure' });
  }
};

/**
 * Middleware to restrict access by roles
 * @param {...string} roles - Allowed roles (e.g. 'citizen', 'staff', 'admin')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access restricted to [${roles.join(', ')}] roles` });
    }

    next();
  };
};
