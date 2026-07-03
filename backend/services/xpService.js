import { supabaseAdmin } from '../config/supabase.js';

/**
 * Award XP to a user and check for badge unlocks
 * @param {string} userId - UUID of the user
 * @param {number} amount - Amount of XP to award
 * @param {string} actionType - The action triggering the XP (e.g. 'report_submitted')
 * @param {string|null} relatedId - Optional UUID of the report, comment, or verification
 */
export const awardXP = async (userId, amount, actionType, relatedId = null) => {
  if (!supabaseAdmin) {
    console.error('Supabase Admin client not initialized');
    return;
  }

  try {
    // 1. Insert XP history record
    const { error: historyError } = await supabaseAdmin
      .from('xp_history')
      .insert({
        user_id: userId,
        amount: amount,
        action_type: actionType,
        related_id: relatedId
      });

    if (historyError) {
      console.error('Error inserting XP history:', historyError);
      return;
    }

    // 2. Fetch current user XP
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user for XP update:', userError);
      return;
    }

    const newXP = user.xp + amount;

    // 3. Update user's XP
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ xp: newXP })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user XP:', updateError);
      return;
    }

    // Create notification for XP gain
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: 'XP Gained!',
      message: `You earned +${amount} XP for action: ${actionType.replace(/_/g, ' ')}.`,
      type: 'xp_earned',
      related_id: relatedId
    });

    // 4. Check for badge unlocks
    // Get badges already earned by user
    const { data: earnedBadges, error: earnedBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    if (earnedBadgesError) {
      console.error('Error fetching user badges:', earnedBadgesError);
      return;
    }

    const earnedBadgeIds = (earnedBadges || []).map(eb => eb.badge_id);

    // Fetch badges where user meets the XP requirement
    let badgesQuery = supabaseAdmin
      .from('badges')
      .select('*')
      .lte('xp_required', newXP);

    const { data: eligibleBadges, error: badgesError } = await badgesQuery;

    if (badgesError) {
      console.error('Error checking badge eligibility:', badgesError);
      return;
    }

    // Filter to find new badges
    const newBadgesToAward = (eligibleBadges || []).filter(
      badge => !earnedBadgeIds.includes(badge.id)
    );

    for (const badge of newBadgesToAward) {
      // Award badge
      const { error: awardBadgeError } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id
        });

      if (!awardBadgeError) {
        // Send unlock notification
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title: 'New Badge Unlocked!',
          message: `Congratulations! You unlocked the "${badge.name}" badge: ${badge.description}`,
          type: 'badge_unlocked',
          related_id: badge.id
        });
      }
    }
  } catch (err) {
    console.error('Unhandled error in awardXP service:', err);
  }
};
