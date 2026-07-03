// CivicAI Frontend API Integration Layer
// Replaces static localStorage mock data with real Express API requests

// ==========================================
// API UTILITIES
// ==========================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const isServer = typeof window === 'undefined';

export function getAuthToken() {
  if (isServer) return null;
  const token = localStorage.getItem('civicai_token');
  if (!token) return null;
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1);
  }
  return token;
}

export function setAuthToken(token) {
  if (isServer) return;
  if (token) {
    const cleanToken = token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token;
    localStorage.setItem('civicai_token', cleanToken);
  } else {
    localStorage.removeItem('civicai_token');
  }
}

export function clearSession() {
  if (isServer) return;
  localStorage.removeItem('civicai_token');
  localStorage.removeItem('civicai_user_profile');
}

async function fetchAPI(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export async function loginUser(email, password) {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data?.session?.access_token) {
    setAuthToken(data.session.access_token);
    if (!isServer) {
      localStorage.setItem('civicai_user_email', email);
    }
  }
  return data;
}

export async function signupUser(email, password, fullName, locality) {
  // Pass full name and automatically seed avatar on signup
  const data = await fetchAPI('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      fullName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
    })
  });

  if (data?.session?.access_token) {
    setAuthToken(data.session.access_token);
    if (!isServer) {
      localStorage.setItem('civicai_user_email', email);
    }
  }
  return data;
}

export async function logoutUser() {
  try {
    await fetchAPI('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Backend logout failed/ignored:', err.message);
  } finally {
    clearSession();
  }
}

// ==========================================
// ISSUE REPORTING APIs
// ==========================================

export async function getStoredIssues() {
  try {
    return await fetchAPI('/reports');
  } catch (err) {
    console.error('Error fetching reports from backend:', err);
    return [];
  }
}

export async function getReportDetails(id) {
  try {
    return await fetchAPI(`/reports/${id}`);
  } catch (err) {
    console.error(`Error fetching report ${id}:`, err);
    return null;
  }
}

export async function addIssue(issueData) {
  return fetchAPI('/reports', {
    method: 'POST',
    body: JSON.stringify({
      title: issueData.title,
      description: issueData.description,
      categoryName: issueData.category,
      severity: issueData.severity,
      latitude: issueData.location.lat,
      longitude: issueData.location.lng,
      address: issueData.location.address,
      imageUrl: issueData.imageUrl
    })
  });
}

// Add issue with raw image upload (multipart)
export async function addIssueWithImage(formData) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit report with image');
  }

  return response.json();
}

export async function upvoteIssue(id) {
  try {
    const { upvotes } = await fetchAPI(`/reports/${id}/vote`, { method: 'POST' });
    const issue = await getReportDetails(id);
    return issue;
  } catch (err) {
    console.error('Error upvoting issue:', err);
    return null;
  }
}

export async function verifyIssue(id, comments) {
  try {
    await fetchAPI(`/reports/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    });
    return await getReportDetails(id);
  } catch (err) {
    console.error('Error verifying issue:', err);
    return null;
  }
}

export async function addComment(id, content) {
  try {
    return await fetchAPI(`/reports/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
}

// ==========================================
// USER PROFILE & gamification STATS
// ==========================================

const getRankFromXP = (xp) => {
  if (xp < 100) return 'Local Observer';
  if (xp < 300) return 'Vigilant Citizen';
  if (xp < 600) return 'Community Guardian';
  if (xp < 1000) return 'Safety Champion';
  return 'Eco Warrior';
};

export async function getStoredUser() {
  const token = getAuthToken();
  if (!token) {
    if (!isServer) {
      const cached = localStorage.getItem('civicai_user_profile');
      if (cached) return JSON.parse(cached);
    }
    return null;
  }
  try {
    const data = await fetchAPI('/auth/profile');
    const u = data.user;

    if (!u) return null;

    const userEmail = u.email || (!isServer ? localStorage.getItem('civicai_user_email') : '');
    const superAdminEmail = process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL;
    const isSuper = superAdminEmail && userEmail && userEmail.toLowerCase() === superAdminEmail.toLowerCase();
    
    // Default role is Member. Super admin always maps to Admin.
    let resolvedRole = 'Member';
    if (isSuper) {
      resolvedRole = 'Admin';
    } else if (u.role) {
      // Normalize role capitalization to match request expectations
      resolvedRole = u.role.toLowerCase() === 'admin' ? 'Admin' : u.role;
    }

    const stats = {
      id: u.id,
      name: u.full_name || 'Citizen',
      email: userEmail || '',
      avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      points: u.xp || 0,
      rank: getRankFromXP(u.xp || 0),
      issuesReported: u.reports?.length || 0,
      issuesResolved: u.reports?.filter((r) => r.status === 'resolved').length || 0,
      verificationsCount: u.verifications?.length || 0,
      badges: u.user_badges?.map((ub) => ({
        id: ub.badges.id,
        name: ub.badges.name,
        icon: 'Award',
        description: ub.badges.description,
        dateEarned: new Date(ub.awarded_at).toISOString().split('T')[0]
      })) || [],
      role: resolvedRole
    };

    if (!isServer) {
      localStorage.setItem('civicai_user_profile', JSON.stringify(stats));
    }
    return stats;
  } catch (err) {
    console.warn('Failed to retrieve profile, using cached profile:', err.message);
    if (!isServer) {
      const cached = localStorage.getItem('civicai_user_profile');
      if (cached) return JSON.parse(cached);
    }
    return null;
  }
}

// ==========================================
// LEADERBOARD standings
// ==========================================

export async function getLeaderboard() {
  try {
    return await fetchAPI('/leaderboard');
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function getStoredNotifications() {
  if (!getAuthToken()) return [];
  try {
    return await fetchAPI('/notifications');
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(id) {
  if (!getAuthToken()) return;
  return fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' });
}

// ==========================================
// AI DIAGNOSTIC SCAN
// ==========================================

export async function scanImageWithAI(file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI image diagnostic failed.');
  }

  return response.json();
}

// ==========================================
// ADMIN / STAFF WORKFLOWS
// ==========================================

export async function getAdminAnalytics() {
  return fetchAPI('/admin/analytics');
}

export async function assignStaffToIssue(issueId, staffId) {
  return fetchAPI(`/admin/reports/${issueId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ staffId })
  });
}

export async function updateIssueStatus(id, status, comments) {
  return fetchAPI(`/admin/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comments })
  });
}

// ==========================================
// ADMIN REQUESTS & USER DIRECTORY (MOCKS/PLACEHOLDERS)
// ==========================================

const getMockRequests = () => {
  if (isServer) return [];
  const cached = localStorage.getItem('civicai_admin_requests');
  return cached ? JSON.parse(cached) : [
    {
      id: 'req-1',
      name: 'John Miller',
      email: 'john.miller@example.com',
      reason: 'I am a local community leader and want to help verify potholes and street light issues in my district.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'pending'
    },
    {
      id: 'req-2',
      name: 'Alice Cooper',
      email: 'alice.cooper@example.com',
      reason: 'Need access to coordinate sanitation crew dispatch.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: 'approved'
    }
  ];
};

const saveMockRequests = (reqs) => {
  if (isServer) return;
  localStorage.setItem('civicai_admin_requests', JSON.stringify(reqs));
};

const getMockUsers = () => {
  if (isServer) return [];
  const cached = localStorage.getItem('civicai_admin_users');
  return cached ? JSON.parse(cached) : [
    { id: 'usr-1', name: 'John Miller', email: 'john.miller@example.com', role: 'Member', points: 150 },
    { id: 'usr-2', name: 'Alice Cooper', email: 'alice.cooper@example.com', role: 'Admin', points: 340 },
    { id: 'usr-3', name: 'Sarah Connor', email: 'sarah.connor@example.com', role: 'Member', points: 80 },
    { id: 'usr-4', name: 'Tony Stark', email: 'tony.stark@example.com', role: 'Admin', points: 950 }
  ];
};

const saveMockUsers = (users) => {
  if (isServer) return;
  localStorage.setItem('civicai_admin_users', JSON.stringify(users));
};

export async function submitAdminRequest(reason) {
  try {
    return await fetchAPI('/admin/requests', {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  } catch (err) {
    console.warn('Backend request failed, using localStorage:', err.message);
    const currentUser = await getStoredUser();
    const reqs = getMockRequests();
    
    // Check if pending request already exists
    const exists = reqs.some(r => r.email === currentUser?.email && r.status === 'pending');
    if (exists) {
      throw new Error('You already have a pending admin request.');
    }

    const newReq = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      name: currentUser?.name || 'Citizen',
      email: currentUser?.email || 'citizen@example.com',
      reason,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    reqs.push(newReq);
    saveMockRequests(reqs);
    return newReq;
  }
}

export async function getAdminRequests() {
  try {
    return await fetchAPI('/admin/requests');
  } catch (err) {
    console.warn('Backend getRequests failed, using localStorage:', err.message);
    return getMockRequests();
  }
}

export async function updateAdminRequestStatus(requestId, status) {
  try {
    return await fetchAPI(`/admin/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.warn('Backend updateRequest failed, using localStorage:', err.message);
    const reqs = getMockRequests();
    const reqIndex = reqs.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      reqs[reqIndex].status = status;
      saveMockRequests(reqs);
      
      // If approved, promote the user in the mock database
      if (status === 'approved') {
        const users = getMockUsers();
        const uIndex = users.findIndex(u => u.email === reqs[reqIndex].email);
        if (uIndex !== -1) {
          users[uIndex].role = 'Admin';
          saveMockUsers(users);
        }
        
        // Update local session role instantly if it's the current user
        const currentUser = await getStoredUser();
        if (currentUser && currentUser.email === reqs[reqIndex].email) {
          currentUser.role = 'Admin';
          localStorage.setItem('civicai_user_profile', JSON.stringify(currentUser));
        }
      }
    }
    return { success: true };
  }
}

export async function getAllUsers() {
  try {
    return await fetchAPI('/admin/users');
  } catch (err) {
    console.warn('Backend getAllUsers failed, using localStorage:', err.message);
    return getMockUsers();
  }
}

export async function promoteUser(userId) {
  try {
    return await fetchAPI(`/admin/users/${userId}/promote`, { method: 'POST' });
  } catch (err) {
    console.warn('Backend promoteUser failed, using localStorage:', err.message);
    const users = getMockUsers();
    const uIndex = users.findIndex(u => u.id === userId);
    if (uIndex !== -1) {
      users[uIndex].role = 'Admin';
      saveMockUsers(users);
      
      // If current user is promoted
      const currentUser = await getStoredUser();
      if (currentUser && currentUser.email === users[uIndex].email) {
        currentUser.role = 'Admin';
        localStorage.setItem('civicai_user_profile', JSON.stringify(currentUser));
      }
    }
    return { success: true };
  }
}

export async function demoteUser(userId) {
  try {
    return await fetchAPI(`/admin/users/${userId}/demote`, { method: 'POST' });
  } catch (err) {
    console.warn('Backend demoteUser failed, using localStorage:', err.message);
    const users = getMockUsers();
    const uIndex = users.findIndex(u => u.id === userId);
    if (uIndex !== -1) {
      users[uIndex].role = 'Member';
      saveMockUsers(users);
      
      // If current user is demoted
      const currentUser = await getStoredUser();
      if (currentUser && currentUser.email === users[uIndex].email) {
        currentUser.role = 'Member';
        localStorage.setItem('civicai_user_profile', JSON.stringify(currentUser));
      }
    }
    return { success: true };
  }
}
