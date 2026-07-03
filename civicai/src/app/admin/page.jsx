'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { 
  getStoredIssues, 
  updateIssueStatus, 
  getStoredUser, 
  getAdminRequests, 
  updateAdminRequestStatus, 
  getAllUsers, 
  promoteUser, 
  demoteUser 
} from '@/lib/mockData';
import { 
  ShieldCheck, 
  Settings2, 
  MapPin, 
  Check, 
  Wrench,
  AlertOctagon,
  TrendingUp,
  Inbox,
  UserCheck,
  UserX
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [issues, setIssues] = useState([]);
  const [requests, setRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [activeSection, setActiveSection] = useState('operations'); // 'operations' | 'requests' | 'users'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  useEffect(() => {
    getStoredUser().then((usr) => {
      setCurrentUser(usr);
      if (usr) {
        const isSuper = usr.email && process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL && usr.email.toLowerCase() === process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL.toLowerCase();
        const isAdmin = usr.role === 'Admin' || usr.role === 'admin' || usr.role === 'staff' || isSuper;
        if (isAdmin) {
          setAuthorized(true);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (authorized) {
      getStoredIssues().then(setIssues);
      getAdminRequests().then(setRequests);
      getAllUsers().then(setUsersList);
    }
  }, [authorized, refreshTrigger]);

  const handleStatusChange = (id, status) => {
    let dbStatus = status;
    if (status === 'reported') dbStatus = 'submitted';
    if (status === 'in-progress') dbStatus = 'in_progress';

    updateIssueStatus(id, dbStatus, 'Status changed via Admin Operations Portal')
      .then(() => {
        setRefreshTrigger(prev => prev + 1);
        toast('success', 'Database Sync', `Issue updated to status: "${status}"`);
      })
      .catch((err) => {
        toast('danger', 'Sync Failed', err.message || 'Could not update issue status.');
      });
  };

  const handleRequestStatusChange = (reqId, status) => {
    updateAdminRequestStatus(reqId, status)
      .then(() => {
        setRefreshTrigger(prev => prev + 1);
        toast('success', 'Access Request', `Request has been ${status}.`);
      })
      .catch((err) => {
        toast('danger', 'Request Update Failed', err.message || 'Could not update request.');
      });
  };

  const handlePromote = (userId) => {
    promoteUser(userId)
      .then(() => {
        setRefreshTrigger(prev => prev + 1);
        toast('success', 'User Promoted', 'User promoted to Admin successfully.');
      })
      .catch((err) => {
        toast('danger', 'Promotion Failed', err.message || 'Could not promote user.');
      });
  };

  const handleDemote = (userId, email) => {
    const superAdminEmail = process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL;
    if (superAdminEmail && email && email.toLowerCase() === superAdminEmail.toLowerCase()) {
      toast('warning', 'Action Forbidden', 'Super Admin cannot be demoted.');
      return;
    }
    demoteUser(userId)
      .then(() => {
        setRefreshTrigger(prev => prev + 1);
        toast('success', 'User Demoted', 'User demoted to Member successfully.');
      })
      .catch((err) => {
        toast('danger', 'Demotion Failed', err.message || 'Could not demote user.');
      });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'verified': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'in-progress': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'low': return <Badge variant="glass">Low</Badge>;
      case 'medium': return <Badge variant="warning">Medium</Badge>;
      case 'high': return <Badge variant="danger">High</Badge>;
      case 'critical': return <Badge variant="danger" pulse>Critical</Badge>;
    }
  };

  if (isLoading || !authorized) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-sm font-semibold text-gray-500 animate-pulse">Checking credentials...</div>
      </div>
    );
  }

  const filteredIssues = issues.filter(issue => {
    if (statusFilter !== 'All' && issue.status !== statusFilter) return false;
    if (severityFilter !== 'All' && issue.severity !== severityFilter) return false;
    return true;
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  const counts = {
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    resolving: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
          Admin Operations
        </h1>
        <p className="text-sm text-gray-400 mt-1">Review coordinates, assign road repair orders, and coordinate town resolutions.</p>
      </div>

      {/* Analytics stats row */}
      <div className="grid sm:grid-cols-4 gap-5">
        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardContent className="pt-5 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Incidents</span>
              <span className="text-2xl font-black text-white mt-1 block">{counts.total}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardContent className="pt-5 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Unassigned Logs</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">{counts.reported}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertOctagon className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardContent className="pt-5 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Dispatches</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block">{counts.resolving}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wrench className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardContent className="pt-5 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Resolved Tasks</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{counts.resolved}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Check className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub navigation Tabs */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveSection('operations')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSection === 'operations' 
              ? 'border-indigo-500 text-white font-black' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Incident Operations
        </button>
        <button
          onClick={() => setActiveSection('requests')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSection === 'requests' 
              ? 'border-indigo-500 text-white font-black' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Admin Requests
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSection === 'users' 
              ? 'border-indigo-500 text-white font-black' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Manage Admins
        </button>
      </div>

      {/* Section 1: Operations */}
      {activeSection === 'operations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Settings2 className="w-4.5 h-4.5 text-indigo-400" />
              Incident Logs Directory
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#0b0b0e]/75 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="All">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="verified">Verified</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-[#0b0b0e]/75 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="All">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <Card className="bg-[#0b0b0e]/70 border-white/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              {filteredIssues.length > 0 ? (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4.5 px-6">Incident Details</th>
                      <th className="py-4.5 px-6">Location</th>
                      <th className="py-4.5 px-6 text-center">Severity</th>
                      <th className="py-4.5 px-6 text-center">Status</th>
                      <th className="py-4.5 px-6 text-center">Verifications</th>
                      <th className="py-4.5 px-6 text-right">Quick Dispatch Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4.5 px-6 max-w-[200px]">
                          <Link href={`/issues/${issue.id}`} className="hover:underline">
                            <span className="font-bold text-white block truncate">{issue.title}</span>
                          </Link>
                          <span className="text-[10px] text-gray-500 mt-1 block font-semibold">{issue.category}</span>
                        </td>
                        <td className="py-4.5 px-6 max-w-[150px]">
                          <span className="flex items-center gap-1 text-gray-400 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                            {issue.location.address}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          {getSeverityBadge(issue.severity)}
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>
                            {issue.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-center text-gray-400">
                          {issue.upvotes} votes • {issue.verifiedCount} checks
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            {issue.status === 'reported' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="py-1 px-2.5 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 text-[10px]"
                                onClick={() => handleStatusChange(issue.id, 'verified')}
                              >
                                Verify
                              </Button>
                            )}
                            {issue.status !== 'resolved' && issue.status !== 'in-progress' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="py-1 px-2.5 bg-blue-500/10 border-blue-500/20 text-blue-400 text-[10px]"
                                onClick={() => handleStatusChange(issue.id, 'in-progress')}
                              >
                                Dispatch Crew
                              </Button>
                            )}
                            {issue.status === 'in-progress' && (
                              <Button 
                                size="sm" 
                                variant="success" 
                                className="py-1 px-2.5 text-[10px]"
                                onClick={() => handleStatusChange(issue.id, 'resolved')}
                              >
                                Mark Resolved
                              </Button>
                            )}
                            {issue.status === 'resolved' && (
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pr-3 py-1 block">
                                Completed ✓
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-3">
                  <Inbox className="w-9 h-9 text-gray-600" />
                  <span>No active reports matching current search metrics.</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Section 2: Admin Requests */}
      {activeSection === 'requests' && (
        <Card className="bg-[#0b0b0e]/70 border-white/5 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Pending Requests</h3>
            <p className="text-xs text-gray-500">Review access requests submitted by ward members</p>
          </div>
          <div className="space-y-3">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{req.name}</span>
                      <span className="text-xs text-gray-500">({req.email})</span>
                      <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-300 font-mono mt-1">"Reason: {req.reason}"</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Submitted: {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="success"
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        onClick={() => handleRequestStatusChange(req.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30"
                        onClick={() => handleRequestStatusChange(req.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">No requests submitted.</div>
            )}
          </div>
        </Card>
      )}

      {/* Section 3: Manage Admins */}
      {activeSection === 'users' && (
        <Card className="bg-[#0b0b0e]/70 border-white/5 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Users Directory</h3>
            <p className="text-xs text-gray-500">Promote active members to Admin or demote them back to standard accounts</p>
          </div>
          <div className="space-y-3">
            {usersList.length > 0 ? (
              usersList.map((usr) => {
                const superAdminEmail = process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL;
                const isSuper = superAdminEmail && usr.email && usr.email.toLowerCase() === superAdminEmail.toLowerCase();
                const isUserAdmin = usr.role === 'Admin' || usr.role === 'admin' || isSuper;

                return (
                  <div key={usr.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{usr.name}</span>
                        <Badge variant={isUserAdmin ? 'default' : 'glass'}>
                          {isSuper ? 'Super Admin' : (isUserAdmin ? 'Admin' : 'Member')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{usr.email} • {usr.points || 0} XP</p>
                    </div>
                    <div>
                      {isSuper ? (
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg">
                          System Master
                        </span>
                      ) : (
                        isUserAdmin ? (
                          <Button
                            size="xs"
                            variant="outline"
                            className="border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30"
                            onClick={() => handleDemote(usr.id, usr.email)}
                          >
                            Demote to Member
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handlePromote(usr.id)}
                          >
                            Promote to Admin
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">No users found.</div>
            )}
          </div>
        </Card>
      )}
    </div>
    </ProtectedRoute>
  );
}
