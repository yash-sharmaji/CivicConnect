import { supabaseAdmin } from '../config/supabase.js';

/**
 * Fetch leaderboard standings (calculates user ranks, counts reports & verifications)
 */
export const getLeaderboard = async (req, res, next) => {
  console.log('[LEADERBOARD] Fetching leaderboard stats from Supabase...');
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        xp,
        reports:reports!reports_reporter_id_fkey(id),
        verifications:verifications(id)
      `);

    if (error) {
      console.error('[LEADERBOARD ERROR] Supabase query failed:', error);
      if (error.code === 'PGRST205') {
        return res.status(503).json({
          error: 'Database tables do not exist. Please apply the schema.sql script via the Supabase SQL Editor to initialize the database.',
          code: 'DB_SCHEMA_MISSING'
        });
      }
      throw error;
    }

    console.log(`[LEADERBOARD] Successfully fetched ${users?.length || 0} user records.`);

    // Map and calculate leaderboard standings
    const standings = (users || [])
      .map(u => ({
        name: u.full_name || 'Citizen',
        points: u.xp || 0,
        reports: u.reports?.length || 0,
        verifications: u.verifications?.length || 0,
        avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`
      }))
      // Sort by XP (points) descending
      .sort((a, b) => b.points - a.points)
      // Inject rank numbers
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    console.log('[LEADERBOARD] Ranks calculated successfully. Sending response.');
    res.status(200).json(standings);
  } catch (err) {
    console.error('[LEADERBOARD CRITICAL ERROR] Exception caught:', err.stack || err);
    next(err);
  }
};
