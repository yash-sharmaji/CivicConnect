import { supabase, supabaseAdmin } from '../config/supabase.js';
import { uploadToSupabaseStorage } from '../utils/storage.js';
import { awardXP } from '../services/xpService.js';
import { APIError } from '../middleware/errorHandler.js';

// ==========================================
// HELPERS
// ==========================================

const mapStatusToFrontend = (dbStatus) => {
  if (dbStatus === 'submitted') return 'reported';
  if (dbStatus === 'in_progress') return 'in-progress';
  return dbStatus; // 'verified', 'resolved', 'rejected'
};

const mapStatusToDB = (feStatus) => {
  if (feStatus === 'reported') return 'submitted';
  if (feStatus === 'in-progress') return 'in_progress';
  return feStatus; // 'verified', 'resolved'
};

const getRankFromXP = (xp) => {
  const points = xp || 0;
  if (points < 100) return 'Local Observer';
  if (points < 300) return 'Vigilant Citizen';
  if (points < 600) return 'Community Guardian';
  if (points < 1000) return 'Safety Champion';
  return 'Eco Warrior';
};

/**
 * Maps DB objects to the exact structure the Next.js frontend expects (Issue interface)
 */
const formatIssue = (report) => {
  const images = (report.report_images || []).map(img => img.image_url);
  const upvotesCount = (report.votes || []).filter(v => v.vote_type === 'upvote').length;
  const verificationsCount = (report.verifications || []).length;

  const formattedComments = (report.comments || []).map(c => ({
    id: c.id,
    author: c.users?.full_name || 'Citizen',
    avatar: c.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`,
    content: c.content,
    createdAt: c.created_at
  }));

  const formattedTimeline = (report.report_status_history || []).map(t => ({
    status: mapStatusToFrontend(t.status),
    title: t.status === 'submitted' ? 'Issue Reported' :
           t.status === 'verified' ? 'Community Verified' :
           t.status === 'in_progress' ? 'Work Order Dispatched' : 
           t.status === 'resolved' ? 'Cleaned & Resolved' : 'Rejected',
    description: t.comments || '',
    timestamp: t.created_at,
    updatedBy: t.users?.full_name || 'System'
  }));

  return {
    id: report.id,
    title: report.title,
    description: report.description,
    category: report.categories?.name || 'Damaged Public Infrastructure',
    severity: report.severity,
    status: mapStatusToFrontend(report.status),
    location: {
      address: report.address || `${Math.floor(report.latitude * 1000) % 800 + 100} Digital Way, Cyber District`,
      lat: Number(report.latitude),
      lng: Number(report.longitude)
    },
    imageUrl: images[0] || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    upvotes: upvotesCount,
    verifiedCount: verificationsCount,
    creator: {
      name: report.users?.full_name || 'Citizen Reporter',
      avatar: report.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reporter_id || 'Civic'}`,
      rank: getRankFromXP(report.users?.xp)
    },
    createdAt: report.created_at,
    timeline: formattedTimeline,
    comments: formattedComments
  };
};

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * Report an issue (Creates record, uploads optional image, updates timeline, awards XP)
 */
export const createReport = async (req, res, next) => {
  try {
    const { title, description, categoryName, severity, latitude, longitude, address, confidenceScore } = req.body;
    const reporterId = req.user.id;

    // 1. Resolve Category UUID by Name
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName || 'Damaged Public Infrastructure')
      .single();

    if (catErr || !catData) {
      return res.status(400).json({ error: `Category '${categoryName}' does not exist.` });
    }

    // 2. Upload file if submitted
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = await uploadToSupabaseStorage(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    // 3. Create Report in DB
    const { data: newReport, error: reportErr } = await supabaseAdmin
      .from('reports')
      .insert({
        title,
        description,
        category_id: catData.id,
        severity: severity || 'medium',
        status: 'submitted',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || '',
        reporter_id: reporterId,
        confidence_score: confidenceScore ? parseFloat(confidenceScore) : null
      })
      .select()
      .single();

    if (reportErr || !newReport) {
      throw new Error(`Failed to log report: ${reportErr?.message}`);
    }

    // 4. Save Image Link if present
    if (imageUrl) {
      await supabaseAdmin.from('report_images').insert({
        report_id: newReport.id,
        image_url: imageUrl
      });
    }

    // 5. Initialize Status History Timeline
    await supabaseAdmin.from('report_status_history').insert({
      report_id: newReport.id,
      status: 'submitted',
      changed_by: reporterId,
      comments: `Reported by ${req.user.full_name} with AI diagnostic scan.`
    });

    // 6. Award Gamification XP (50 XP for reporting)
    await awardXP(reporterId, 50, 'report_submitted', newReport.id);

    // 7. Retrieve fully populated report to format and send
    const { data: populatedReport } = await supabase
      .from('reports')
      .select(`
        *,
        categories(name),
        users:users!reports_reporter_id_fkey(full_name, avatar_url, xp),
        report_images(image_url),
        votes(id, vote_type),
        verifications(id),
        comments(*, users(full_name, avatar_url)),
        report_status_history(*, users(full_name))
      `)
      .eq('id', newReport.id)
      .single();

    res.status(201).json(formatIssue(populatedReport));
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch all reports with filters & geospatial nearby search
 */
export const getReports = async (req, res, next) => {
  console.log('[REPORTS] Fetching reports list from Supabase...', { query: req.query });
  try {
    const { category, status, severity, search, nearby, lat, lng, radius } = req.query;

    let reports = [];

    if (nearby === 'true' && lat && lng) {
      console.log('[REPORTS] Performing nearby geospatial query...');
      // 1. Call PostgreSQL Haversine RPC
      const { data: nearbyData, error: rpcErr } = await supabase.rpc('get_nearby_reports', {
        p_latitude: parseFloat(lat),
        p_longitude: parseFloat(lng),
        p_radius_km: parseFloat(radius || 5.0)
      });

      if (rpcErr) {
        console.error('[REPORTS ERROR] Nearby RPC query failed:', rpcErr);
        if (rpcErr.code === 'PGRST205' || rpcErr.code === '3f000') {
          return res.status(503).json({
            error: 'Database function get_nearby_reports or tables do not exist. Please apply the schema.sql script via the Supabase SQL Editor to initialize the database.',
            code: 'DB_SCHEMA_MISSING'
          });
        }
        throw rpcErr;
      }

      console.log(`[REPORTS] Nearby RPC returned ${nearbyData?.length || 0} reports. Hydrating details...`);

      // Hydrate with relations for frontend compatibility
      if (nearbyData && nearbyData.length > 0) {
        const ids = nearbyData.map(r => r.id);
        const { data: hydratedReports, error: hydrationErr } = await supabase
          .from('reports')
          .select(`
            *,
            categories(name),
            users:users!reports_reporter_id_fkey(full_name, avatar_url, xp),
            report_images(image_url),
            votes(id, vote_type),
            verifications(id),
            comments(*, users(full_name, avatar_url)),
            report_status_history(*, users(full_name))
          `)
          .in('id', ids);

        if (hydrationErr) {
          console.error('[REPORTS ERROR] Hydration query failed:', hydrationErr);
          if (hydrationErr.code === 'PGRST205') {
            return res.status(503).json({
              error: 'Database tables do not exist. Please apply the schema.sql script via the Supabase SQL Editor to initialize the database.',
              code: 'DB_SCHEMA_MISSING'
            });
          }
          throw hydrationErr;
        }
        
        // Retain nearby distance ordering
        reports = nearbyData.map(nd => {
          const matched = hydratedReports.find(hr => hr.id === nd.id);
          return matched ? { ...matched, distance_km: nd.distance_km } : null;
        }).filter(Boolean);
      }
    } else {
      console.log('[REPORTS] Performing standard query...');
      // 2. Perform standard Postgrest queries
      let query = supabase
        .from('reports')
        .select(`
          *,
          categories(name),
          users:users!reports_reporter_id_fkey(full_name, avatar_url, xp),
          report_images(image_url),
          votes(id, vote_type),
          verifications(id),
          comments(*, users(full_name, avatar_url)),
          report_status_history(*, users(full_name))
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'All') {
        query = query.eq('status', mapStatusToDB(status));
      }
      if (severity && severity !== 'All') {
        query = query.eq('severity', severity);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[REPORTS ERROR] Standard query failed:', error);
        if (error.code === 'PGRST205') {
          return res.status(503).json({
            error: 'Database tables do not exist. Please apply the schema.sql script via the Supabase SQL Editor to initialize the database.',
            code: 'DB_SCHEMA_MISSING'
          });
        }
        throw error;
      }
      reports = data || [];

      // Filter by category name locally or via mapping since categories are relational
      if (category && category !== 'All') {
        reports = reports.filter(r => r.categories?.name === category);
      }
    }

    // Format issues to match frontend expected interface
    console.log(`[REPORTS] Formatting ${reports.length} reports for frontend.`);
    const formatted = reports.map(formatIssue);
    res.status(200).json(formatted);
  } catch (err) {
    console.error('[REPORTS CRITICAL ERROR] Exception caught:', err.stack || err);
    next(err);
  }
};

/**
 * Fetch detailed report by ID
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories(name),
        users:users!reports_reporter_id_fkey(full_name, avatar_url, xp),
        report_images(image_url),
        votes(id, vote_type, user_id),
        verifications(*, users(full_name, avatar_url)),
        comments(*, users(full_name, avatar_url)),
        report_status_history(*, users(full_name))
      `)
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Issue report not found' });
    }

    res.status(200).json(formatIssue(report));
  } catch (err) {
    next(err);
  }
};

/**
 * Upvote / Downvote toggle logic
 */
export const upvoteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('report_id', id)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Toggle / Delete vote
      const { error: deleteErr } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id);
      if (deleteErr) throw deleteErr;
    } else {
      // Insert vote
      const { error: insertErr } = await supabase
        .from('votes')
        .insert({
          report_id: id,
          user_id: userId,
          vote_type: 'upvote'
        });
      if (insertErr) throw insertErr;

      // Award 5 XP for community vote engagement
      await awardXP(userId, 5, 'comment_bonus', id);
    }

    // Retrieve updated vote counts
    const { data: votes } = await supabase
      .from('votes')
      .select('id')
      .eq('report_id', id);

    res.status(200).json({ upvotes: votes?.length || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * Community verification submission (Auto-escalation to verified when threshold hit)
 */
export const verifyReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verifierId = req.user.id;
    const { comments } = req.body;

    // Check if user already verified this report
    const { data: existingVerification } = await supabase
      .from('verifications')
      .select('*')
      .eq('report_id', id)
      .eq('verifier_id', verifierId)
      .single();

    if (existingVerification) {
      return res.status(400).json({ error: 'You have already verified this issue.' });
    }

    // 1. Log verification
    const { error: verifErr } = await supabaseAdmin
      .from('verifications')
      .insert({
        report_id: id,
        verifier_id: verifierId,
        verification_status: 'approved',
        comments: comments || 'Verified as active by resident.'
      });

    if (verifErr) throw verifErr;

    // 2. Fetch current report details
    const { data: report } = await supabase
      .from('reports')
      .select('status, title, reporter_id')
      .eq('id', id)
      .single();

    // 3. Count verifications
    const { data: allVerifications } = await supabase
      .from('verifications')
      .select('id')
      .eq('report_id', id);

    const count = allVerifications?.length || 0;

    // 4. Threshold auto-update status to verified if submitted
    if (report && report.status === 'submitted' && count >= 5) {
      await supabaseAdmin
        .from('reports')
        .update({ status: 'verified' })
        .eq('id', id);

      // Log status change timeline
      await supabaseAdmin.from('report_status_history').insert({
        report_id: id,
        status: 'verified',
        comments: `Community Verified. Reached threshold of ${count} verifications.`
      });

      // Send status change notification to reporter
      if (report.reporter_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: report.reporter_id,
          title: 'Report Community Verified',
          message: `Your report "${report.title}" is now marked "Verified" after receiving ${count} verifications.`,
          type: 'status_change',
          related_id: id
        });
      }
    }

    // 5. Award verifier 15 XP
    await awardXP(verifierId, 15, 'report_verified', id);

    res.status(200).json({ verifiedCount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * Comment on report (creates comment and awards XP)
 */
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        report_id: id,
        user_id: userId,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Award 5 XP for commenting
    await awardXP(userId, 5, 'comment_bonus', id);

    // Retrieve fully populated comment
    const { data: populatedComment } = await supabase
      .from('comments')
      .select('*, users(full_name, avatar_url)')
      .eq('id', comment.id)
      .single();

    res.status(201).json({
      id: populatedComment.id,
      author: populatedComment.users?.full_name || 'Citizen',
      avatar: populatedComment.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      content: populatedComment.content,
      createdAt: populatedComment.created_at
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete issue report
 */
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Retrieve report to check ownership
    const { data: report } = await supabase
      .from('reports')
      .select('reporter_id')
      .eq('id', id)
      .single();

    if (!report) {
      return res.status(404).json({ error: 'Issue report not found' });
    }

    // Only creator or admin/staff can delete
    if (report.reporter_id !== userId && req.user.role === 'citizen') {
      return res.status(403).json({ error: 'Unauthorized to delete this report' });
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
};
