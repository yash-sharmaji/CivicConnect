'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthContext';
import { 
  getStoredIssues, 
  submitAdminRequest, 
  getAdminRequests,
  updateProfileAvatar
} from '@/lib/mockData';
import { 
  User, 
  Award, 
  MapPin, 
  Calendar,
  ThumbsUp,
  Inbox,
  Shield,
  FileText,
  MessageSquare,
  CheckCircle2,
  Lock,
  LogOut,
  Settings2,
  Eye,
  BellRing
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [userIssues, setUserIssues] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'activity' | 'settings' | 'admin'
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestRefresh, setRequestRefresh] = useState(0);

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Settings States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [profileTheme, setProfileTheme] = useState('dark');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditUsername('@' + user.name.toLowerCase().replace(/\s+/g, ''));
      setEditCity('Metro City, Ward 3');
      
      getStoredIssues().then((issues) => {
        setUserIssues(issues.filter(i => i.creator?.name === user.name));
      });

      getAdminRequests()
        .then((reqs) => {
          const validReqs = Array.isArray(reqs) ? reqs : [];
          const myReqs = validReqs.filter((r) => r && r.email && r.email.toLowerCase() === user.email.toLowerCase());
          setAdminRequests(myReqs);
        })
        .catch((err) => {
          console.warn('[FRONTEND WARNING] Failed to fetch admin requests, defaulting to empty list:', err);
          setAdminRequests([]);
        });
    }
  }, [user, requestRefresh]);

  const handleRequestAccess = (e) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      toast('warning', 'Missing Details', 'Please provide a reason for requesting admin access.');
      return;
    }
    setIsSubmittingRequest(true);
    submitAdminRequest(requestReason)
      .then(() => {
        setIsSubmittingRequest(false);
        setRequestReason('');
        setRequestRefresh(prev => prev + 1);
        toast('success', 'Request Sent', 'Your admin access request is now pending review.');
      })
      .catch((err) => {
        setIsSubmittingRequest(false);
        toast('danger', 'Submission Failed', err.message || 'Could not submit admin request.');
      });
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('warning', 'File Too Large', 'The selected profile picture exceeds the 5MB size limit.');
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('warning', 'Invalid File Type', 'Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await updateProfileAvatar(formData);
      await refreshUser();
      toast('success', 'Avatar Updated', 'Your profile picture has been successfully uploaded.');
    } catch (err) {
      toast('danger', 'Upload Failed', err.message || 'Could not upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleRemoveAvatar = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('removeAvatar', 'true');

      try {
        await updateProfileAvatar(formData);
        await refreshUser();
        toast('success', 'Avatar Removed', 'Your profile picture has been removed.');
      } catch (err) {
        toast('danger', 'Removal Failed', err.message || 'Could not remove profile picture.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast('warning', 'Missing Name', 'Please provide a valid full name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('fullName', editName.trim());
      await updateProfileAvatar(formData);
      await refreshUser();
      toast('success', 'Profile Updated', 'Personal information saved successfully.');
    } catch (err) {
      toast('danger', 'Update Failed', err.message || 'Could not save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('warning', 'Password Mismatch', 'New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('success', 'Password Updated', 'Your security password was successfully modified.');
    }, 1000);
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
    toast('info', 'Signed Out', 'You have been successfully logged out.');
  };

  const toggleTheme = () => {
    const nextTheme = profileTheme === 'dark' ? 'light' : 'dark';
    setProfileTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    toast('success', 'Theme Updated', `Switched layout to ${nextTheme} mode.`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reported': return <Badge variant="warning">Reported</Badge>;
      case 'verified': return <Badge variant="info">Verified</Badge>;
      case 'in-progress': return <Badge variant="default" pulse>Resolving</Badge>;
      case 'resolved': return <Badge variant="success">Resolved</Badge>;
    }
  };

  // Derived stats
  const pendingCount = userIssues.filter(i => i.status === 'reported' || i.status === 'verified').length;
  const inProgressCount = userIssues.filter(i => i.status === 'in-progress').length;
  const resolvedCount = userIssues.filter(i => i.status === 'resolved').length;
  
  const superAdminEmail = process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL;
  const isSuper = user?.email && superAdminEmail && user.email.toLowerCase() === superAdminEmail.toLowerCase();
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  // Find latest request status
  const latestRequest = adminRequests.length > 0 ? adminRequests[adminRequests.length - 1] : null;

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-10 max-w-5xl">
        {/* Profile Info Header */}
        {user && (
          <Card glow className="bg-[#0b0b0e]/70 border-white/5 pt-6">
            <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-indigo-500 bg-[#0c0c0f] flex-shrink-0">
                <img src={user.avatar} alt={user.name} className="w-full h-full" />
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
                    <div className="flex gap-1.5 justify-center md:justify-start">
                      <Badge variant="glass">{editUsername}</Badge>
                      <Badge variant={isAdmin ? 'default' : 'info'}>
                        {isSuper ? 'Super Admin' : user.role}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    {editCity}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-600" />
                    Joined Ward Core: 2026-06-12
                  </p>
                </div>

                {/* Main profile Stats row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs text-gray-400">
                  <div>
                    <span className="text-lg font-black text-white block">{user.points}</span>
                    <span>Contribution Score</span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-white block">{user.rank}</span>
                    <span>Safety Rank</span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-white block">{user.badges?.length || 0}</span>
                    <span>Badges Earned</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === 'stats' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Stats & Badges
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === 'activity' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === 'settings' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === 'admin' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            {isAdmin ? 'Staff Portal' : 'Access Request'}
          </button>
        </div>

        {/* Tab Contents */}

        {/* Tab 1: Stats & Badges */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Detailed numeric stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardContent className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Submitted</span>
                  <span className="text-xl font-black text-white mt-1 block">{userIssues.length}</span>
                </CardContent>
              </Card>
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardContent className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Pending</span>
                  <span className="text-xl font-black text-amber-500 mt-1 block">{pendingCount}</span>
                </CardContent>
              </Card>
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardContent className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Resolving</span>
                  <span className="text-xl font-black text-blue-500 mt-1 block">{inProgressCount}</span>
                </CardContent>
              </Card>
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardContent className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Resolved</span>
                  <span className="text-xl font-black text-emerald-500 mt-1 block">{resolvedCount}</span>
                </CardContent>
              </Card>
            </div>

            {/* Badges Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Unlocked Badges ({user?.badges?.length || 0})</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {user?.badges && user.badges.length > 0 ? (
                  user.badges.map((badge) => (
                    <Card key={badge.id} className="bg-[#0b0b0e]/70 border-white/5">
                      <CardContent className="p-4.5 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{badge.description}</p>
                        </div>
                        <div className="text-[9px] text-gray-500 border-t border-white/5 pt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-600" />
                          Earned {badge.dateEarned}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full glass-panel p-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                    <Award className="w-8 h-8 text-gray-600" />
                    <span>Perform community reports or verifications to unlock profile badges.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity Feed */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* User Reports */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Submitted Reports
              </h3>
              <div className="space-y-3">
                {userIssues.length > 0 ? (
                  userIssues.map((issue) => (
                    <Link key={issue.id} href={`/issues/${issue.id}`} className="block">
                      <div className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all flex gap-4">
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getStatusBadge(issue.status)}
                              <span className="text-[10px] text-gray-500 font-semibold">{issue.category}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mt-1 truncate">{issue.title}</h4>
                          </div>
                          <span className="text-[9px] text-gray-500">Logged: {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 bg-[#0b0b0e]/70 border border-white/5 rounded-xl text-center text-xs text-gray-500">
                    No reports submitted yet.
                  </div>
                )}
              </div>
            </div>

            {/* Other Activities */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Comments Mock */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Recent Comments
                </h3>
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-[#0b0b0e]/70 border border-white/5 rounded-xl space-y-1.5">
                    <p className="text-xs text-gray-300 font-mono">"Looks like city sanitation checked the sewer line here yesterday."</p>
                    <span className="text-[9px] text-gray-500 font-semibold block">On Pothole near Oak Ave • 2 days ago</span>
                  </div>
                  <div className="p-3.5 bg-[#0b0b0e]/70 border border-white/5 rounded-xl space-y-1.5">
                    <p className="text-xs text-gray-300 font-mono">"The street lamp has been flicker-free since the team replaced the fuse."</p>
                    <span className="text-[9px] text-gray-500 font-semibold block">On Broken Light on Cyber District • 5 days ago</span>
                  </div>
                </div>
              </div>

              {/* Verifications Mock */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Recent Verifications
                </h3>
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-[#0b0b0e]/70 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Verified: Water Leakage</p>
                      <span className="text-[9px] text-gray-500 block mt-0.5">District Ward 4 • 1 week ago</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-[#0b0b0e]/70 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <ThumbsUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Upvoted: Structural Damage</p>
                      <span className="text-[9px] text-gray-500 block mt-0.5">Ward 3 Main Overpass • 2 weeks ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Account Settings */}
        {activeTab === 'settings' && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Edit Profile details */}
            <Card className="bg-[#0b0b0e]/70 border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-6">
                {/* Profile Picture Upload Section */}
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                  <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-[#0c0c0e] flex-shrink-0 relative group">
                    <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                        Updating...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => document.getElementById('avatar-file-input').click()}
                        disabled={isUploadingAvatar}
                      >
                        Change Picture
                      </Button>
                      {user?.avatar && !user.avatar.includes('dicebear.com') && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      JPG, JPEG, PNG, or WEBP. Max size 5MB.
                    </p>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input
                    label="Full Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <Input
                    label="Username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                  />
                  <Input
                    label="District City / State"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    value={user?.email || ''}
                    disabled
                  />
                  <Button type="submit" isLoading={isSavingProfile}>
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Security & Password */}
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button type="submit" isLoading={isChangingPassword}>
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="bg-[#0b0b0e]/70 border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-indigo-400" />
                    App Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {/* Theme */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Theme Setting</span>
                      <span className="text-[10px] text-gray-500">Toggle dark or light color scheme</span>
                    </div>
                    <Button size="xs" variant="outline" onClick={toggleTheme} className="capitalize">
                      {profileTheme} Mode
                    </Button>
                  </div>

                  {/* Public visibility */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Public Profile</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-600" />
                        Allow other citizens to view details
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                      className="h-4 w-4 accent-indigo-500 rounded bg-[#0f0f13] border-white/10"
                    />
                  </div>

                  {/* Email notifs */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Email Digests</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <BellRing className="w-3.5 h-3.5 text-gray-600" />
                        Receive weekly local status reviews
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="h-4 w-4 accent-indigo-500 rounded bg-[#0f0f13] border-white/10"
                    />
                  </div>

                  {/* Sign Out CTA */}
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="w-full border-red-500/10 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20"
                      leftIcon={<LogOut className="w-4 h-4" />}
                    >
                      Sign Out Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 4: Admin Controls / Access Requests */}
        {activeTab === 'admin' && (
          <div className="max-w-xl">
            {isAdmin ? (
              /* If Admin, render Board status and Shortcuts */
              <Card glow className="bg-[#08080b]/90 border-indigo-500/20">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <div>
                    <CardTitle className="text-sm font-bold">Administrator Console</CardTitle>
                    <CardDescription className="text-xs">You have full moderation access to ward operations</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Administrator Badge Unlocked</p>
                      <p className="text-[10px] text-gray-400">Permissions active: Dispatch, Verification, User Promotions</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Dashboard Shortcuts:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Link href="/admin">
                        <Button variant="outline" className="w-full text-xs font-semibold">
                          Admin Panel
                        </Button>
                      </Link>
                      <Link href="/admin?tab=operations">
                        <Button variant="outline" className="w-full text-xs font-semibold">
                          Pending Reports
                        </Button>
                      </Link>
                      <Link href="/admin?tab=requests">
                        <Button variant="outline" className="w-full text-xs font-semibold">
                          Admin Requests
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* If Member, render Request Access Form */
              <div className="space-y-4">
                {latestRequest ? (
                  <Card className="bg-[#0b0b0e]/70 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Request Access Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] text-gray-500 font-semibold">
                          Submitted on {new Date(latestRequest.createdAt).toLocaleDateString()}
                        </span>
                        <Badge
                          variant={
                            latestRequest.status === 'approved' ? 'success' :
                            latestRequest.status === 'rejected' ? 'danger' : 'warning'
                          }
                          pulse={latestRequest.status === 'pending'}
                        >
                          {latestRequest.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Submission Notes:</span>
                        <div className="text-xs text-gray-300 bg-white/5 rounded-lg p-3 font-mono leading-relaxed">
                          "{latestRequest.reason}"
                        </div>
                      </div>

                      {latestRequest.status === 'pending' && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-amber-400 mt-2 font-medium">
                          ⚠ Your request is currently under review by system moderators. Access credentials will sync once approved.
                        </div>
                      )}

                      {latestRequest.status === 'rejected' && (
                        <div className="space-y-3 pt-3">
                          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] text-red-400 font-medium">
                            ✗ This request has been rejected. You may submit another request below.
                          </div>
                          
                          <Button size="sm" variant="outline" onClick={() => setRequestRefresh(prev => prev + 1)} className="text-xs">
                            Create New Request
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-[#0b0b0e]/70 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Request Admin Access</CardTitle>
                      <CardDescription className="text-xs">
                        Admins oversee dispatch logs, process community verifications, and coordinate infrastructure repairs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <form onSubmit={handleRequestAccess} className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Reason for Request
                          </label>
                          <textarea
                            rows={4}
                            placeholder="State your role or reason why you require access to moderation panels..."
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                            className="w-full bg-[#0f0f13] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          />
                        </div>
                        <Button type="submit" isLoading={isSubmittingRequest}>
                          Submit Access Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
