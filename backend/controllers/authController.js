import { supabase } from '../config/supabase.js';

/**
 * Citizen signup endpoint (triggers auto-creation in users profile table)
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, fullName, role, avatarUrl } = req.body;

    const signupRole = role || 'citizen';
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Citizen',
          role: signupRole,
          avatar_url: finalAvatar
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Signup successful. Please verify your email if required.',
      session: data.session,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Citizen login endpoint (returns JWT session)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout endpoint
 */
export const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile (hydrated with stats and badges)
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: userProfile, error } = await supabase
      .from('users')
      .select(`
        *,
        reports:reports(id, status),
        verifications:verifications(id),
        user_badges:user_badges(
          awarded_at,
          badges:badges(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.status(200).json({ user: userProfile });
  } catch (err) {
    next(err);
  }
};
