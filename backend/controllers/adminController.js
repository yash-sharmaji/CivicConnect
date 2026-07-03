import { supabaseAdmin } from '../config/supabase.js';
import { awardXP } from '../services/xpService.js';

/**
 * Assign a staff/worker member to an issue
 */
export const assignStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    // Check if staff user exists and has correct role
    const { data: staffUser, error: staffError } = await supabaseAdmin
      .from('users')
      .select('role, full_name')
      .eq('id', staffId)
      .single();

    if (staffError || !staffUser) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (staffUser.role === 'citizen') {
      return res.status(400).json({ error: 'Cannot assign a citizen to resolve issues.' });
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ assigned_staff_id: staffId })
      .eq('id', id);

    if (error) throw error;

    // Log in history
    await supabaseAdmin.from('report_status_history').insert({
      report_id: id,
      status: 'in_progress',
      changed_by: req.user.id,
      comments: `Assigned to staff member ${staffUser.full_name}.`
    });

    res.status(200).json({ message: `Assigned successfully to ${staffUser.full_name}` });
  } catch (err) {
    next(err);
  }
};

/**
 * Update report status (with automatic XP allocation on resolution)
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body; // status must be 'submitted', 'verified', 'in_progress', 'resolved', 'rejected'

    const validStatuses = ['submitted', 'verified', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
    }

    // Get current report details
    const { data: report, error: fetchErr } = await supabaseAdmin
      .from('reports')
      .select('status, title, reporter_id')
      .eq('id', id)
      .single();

    if (fetchErr || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const oldStatus = report.status;

    // Update status
    const { error: updateErr } = await supabaseAdmin
      .from('reports')
      .update({ status })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Log status history
    await supabaseAdmin.from('report_status_history').insert({
      report_id: id,
      status,
      changed_by: req.user.id,
      comments: comments || `Status updated from "${oldStatus}" to "${status}" by administrative staff.`
    });

    // Notify the reporter
    if (report.reporter_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: report.reporter_id,
        title: 'Report Status Updated',
        message: `Your report "${report.title}" status has changed to "${status.replace('_', ' ')}".`,
        type: 'status_change',
        related_id: id
      });

      // Award XP on resolution (100 XP for reporter)
      if (status === 'resolved' && oldStatus !== 'resolved') {
        await awardXP(report.reporter_id, 100, 'report_resolved', id);
      }
    }

    res.status(200).json({ message: 'Status updated successfully', currentStatus: status });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch portal statistics / analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Get status counts
    const { data: statusCounts, error: statusErr } = await supabaseAdmin
      .from('reports')
      .select('status');
      
    if (statusErr) throw statusErr;

    const stats = {
      total: statusCounts.length,
      submitted: statusCounts.filter(r => r.status === 'submitted').length,
      verified: statusCounts.filter(r => r.status === 'verified').length,
      in_progress: statusCounts.filter(r => r.status === 'in_progress').length,
      resolved: statusCounts.filter(r => r.status === 'resolved').length,
      rejected: statusCounts.filter(r => r.status === 'rejected').length
    };

    // 2. Get category distribution
    const { data: categoryData, error: catErr } = await supabaseAdmin
      .from('reports')
      .select('categories(name)');
      
    if (catErr) throw catErr;

    const categoriesDistribution = {};
    categoryData.forEach(r => {
      const name = r.categories?.name || 'Unknown';
      categoriesDistribution[name] = (categoriesDistribution[name] || 0) + 1;
    });

    // 3. List active staff/admins
    const { data: staffMembers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .in('role', ['staff', 'admin']);

    res.status(200).json({
      reportsSummary: stats,
      categoriesDistribution,
      staff: staffMembers || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Manage user listings and role modifiers
 */
export const manageUsers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('xp', { ascending: false });

    if (error) throw error;

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Update user role (e.g. citizen to staff or admin)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body; // 'citizen', 'staff', 'admin'

    if (!['citizen', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection' });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;

    res.status(200).json({ message: `Role updated successfully to ${role}` });
  } catch (err) {
    next(err);
  }
};
