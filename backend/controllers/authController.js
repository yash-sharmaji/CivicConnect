import { supabase, supabaseAdmin } from '../config/supabase.js';
import { uploadAvatarToStorage, getStoragePathFromUrl } from '../utils/storage.js';

/**
 * Citizen signup endpoint (triggers auto-creation in users profile table)
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, fullName, role, avatarUrl } = req.body;

    const superAdminEmail = process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL;
    const isSuperAdmin = email && superAdminEmail && email.toLowerCase() === superAdminEmail.toLowerCase();
    const signupRole = isSuperAdmin ? 'admin' : (role || 'citizen');
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
 * Helper function to ensure user profile exists in public.users.
 * If missing (e.g. signup occurred before database trigger setup), creates it dynamically using upsert.
 */
const ensureUserProfile = async (userId, authUser) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized');
  }

  // Check if profile exists (selecting role and email for verification)
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, avatar_url, full_name')
    .eq('id', userId)
    .maybeSingle();

  const email = authUser?.email || profile?.email || '';
  const superAdminEmail = process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL;
  const isSuperAdmin = email && superAdminEmail && email.toLowerCase() === superAdminEmail.toLowerCase();

  // If profile exists, check if they are the super admin and need a one-time migration
  if (profile) {
    if (isSuperAdmin && profile.role !== 'admin') {
      console.log(`[AUTH] Migrating super admin user ${userId} to admin role...`);
      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select('*')
        .single();
      
      // Keep auth metadata in sync
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { role: 'admin' }
        });
      } catch (authErr) {
        console.warn('[AUTH METADATA UPDATE FAILED]', authErr.message);
      }

      if (!updateErr && updatedProfile) {
        return updatedProfile;
      }
    }
    return profile;
  }

  // Profile does not exist, create it from auth user details
  console.log(`[AUTH] Profile row missing for user ${userId}. Automatically creating it...`);
  const metadata = authUser?.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || 'Citizen';
  const avatarUrl = metadata.avatar_url || metadata.picture || null;
  const resolvedRole = isSuperAdmin ? 'admin' : (metadata.role || 'citizen');

  const { data: newProfile, error: insertErr } = await supabaseAdmin
    .from('users')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      role: resolvedRole,
      avatar_url: avatarUrl,
      xp: 0
    }, { onConflict: 'id' })
    .select('avatar_url, full_name, role')
    .single();

  if (insertErr || !newProfile) {
    console.error(`[AUTH ERROR] Failed to auto-create user profile row via upsert:`, insertErr);
    throw new Error(`Profile auto-creation failed: ${insertErr?.message}`);
  }

  // If newly created super admin, sync metadata role
  if (isSuperAdmin) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: 'admin' }
      });
    } catch (authErr) {
      console.warn('[AUTH METADATA UPDATE FAILED]', authErr.message);
    }
  }

  return newProfile;
};

/**
 * Get current authenticated user profile (hydrated with stats and badges)
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Ensure profile row exists using request authenticated user context
    await ensureUserProfile(userId, req.authUser);

    const { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        reports:reports!reports_reporter_id_fkey(id, status),
        verifications:verifications(id),
        user_badges:user_badges(
          awarded_at,
          badges:badges(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[PROFILE SELECT ERROR] Supabase fetch failed:', error);
      throw error;
    }

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.status(200).json({ user: userProfile });
  } catch (err) {
    next(err);
  }
};

/**
 * Update authenticated user profile details and avatar picture
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, removeAvatar } = req.body;

    if (!supabaseAdmin) {
      throw new Error('Supabase Admin client not initialized');
    }

    // Ensure user profile exists, create it automatically if not
    const currentProfile = await ensureUserProfile(userId, req.authUser);

    let updatedAvatarUrl = currentProfile.avatar_url;

    // Handle avatar removal
    if (removeAvatar === 'true' || removeAvatar === true) {
      if (currentProfile.avatar_url) {
        const oldPath = getStoragePathFromUrl(currentProfile.avatar_url, 'avatars');
        if (oldPath) {
          try {
            await supabaseAdmin.storage.from('avatars').remove([oldPath]);
          } catch (err) {
            console.warn('Failed to delete old avatar on remove:', err.message);
          }
        }
      }
      updatedAvatarUrl = null;
    } 
    // Handle new avatar upload
    else if (req.file) {
      updatedAvatarUrl = await uploadAvatarToStorage(
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        currentProfile.avatar_url
      );
    }

    // Update profiles in db (users table)
    const { data: updatedUser, error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        full_name: fullName !== undefined ? fullName : currentProfile.full_name,
        avatar_url: updatedAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateErr || !updatedUser) {
      throw new Error(`Failed to update profile: ${updateErr?.message}`);
    }

    // Also update auth.users metadata for consistency
    const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          full_name: updatedUser.full_name,
          avatar_url: updatedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        }
      }
    );

    if (authUpdateErr) {
      console.warn('Failed to sync auth.users metadata:', authUpdateErr.message);
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        avatar: updatedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh expired user auth session using the Supabase refresh token
 */
export const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      console.warn('[REFRESH SESSION ERROR] Supabase token exchange failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    res.status(200).json({
      session: data.session,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};
