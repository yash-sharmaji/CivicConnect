'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import { getStoredIssues, getStoredUser, getLeaderboard } from '@/lib/mockData';
import { 
  PlusCircle, 
  Map as MapIcon, 
  Trophy, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  ThumbsUp, 
  Search,
  ArrowRight
} from 'lucide-react';

// Dynamically load Recharts to prevent hydration errors on NextJS SSR
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    getStoredIssues().then(setIssues);
    getStoredUser().then(setUser);
    getLeaderboard().then(setLeaderboard);
  }, []);

  const stats = [
    { title: 'Reported Issues', val: user?.issuesReported || 0, desc: 'Logged by you', icon: <AlertCircle className="w-5 h-5 text-indigo-400" /> },
    { title: 'Issues Resolved', val: user?.issuesResolved || 0, desc: 'Fixed by town crews', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
    { title: 'Verifications Provided', val: user?.verificationsCount || 0, desc: 'Neighborhood check', icon: <ThumbsUp className="w-5 h-5 text-blue-400" /> },
    { title: 'Contribution Score', val: `${user?.points || 0} pts`, desc: 'Level: Vigilant Citizen', icon: <Trophy className="w-5 h-5 text-amber-400" /> }
  ];

  // Process category stats for chart
  const categoriesMap = {};
  issues.forEach(i => {
    categoriesMap[i.category] = (categoriesMap[i.category] || 0) + 1;
  });
  
  const chartData = Object.keys(categoriesMap).map(cat => ({
    name: cat.split(' ')[0], // short name
    count: categoriesMap[cat]
  }));

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reported': return <Badge variant="warning">Reported</Badge>;
      case 'verified': return <Badge variant="info">Verified</Badge>;
      case 'in-progress': return <Badge variant="default" pulse>Resolving</Badge>;
      case 'resolved': return <Badge variant="success">Resolved</Badge>;
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

  return (
    <div className="space-y-8 pb-10">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Community Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Hello Jane, here is what's happening in your neighborhood today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/report">
            <Button leftIcon={<PlusCircle className="w-4 h-4" />}>Report Issue</Button>
          </Link>
          <Link href="/map">
            <Button variant="outline" leftIcon={<MapIcon className="w-4 h-4" />}>Explore Map</Button>
          </Link>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverable className="bg-[#0b0b0e]/70 border-white/5">
            <CardContent className="pt-2 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</span>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{stat.icon}</div>
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">{stat.val}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Mini Map Panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Count Bar Chart */}
        <Card className="lg:col-span-1 bg-[#0b0b0e]/70 border-white/5">
          <CardHeader>
            <CardTitle>Issues by Type</CardTitle>
            <CardDescription>Number of logs per category</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090c', borderColor: 'rgba(255,255,255,0.08)' }}
                    labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                    itemStyle={{ color: '#6366f1', fontSize: 11 }}
                  />
                  <Bar dataKey="count" fill="url(#indigoGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-500">Generating analytics data...</span>
            )}
          </CardContent>
        </Card>

        {/* Interactive Mini Map */}
        <Card className="lg:col-span-2 bg-[#0b0b0e]/70 border-white/5 flex flex-col">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Local Hazard Map</CardTitle>
              <CardDescription>Near your default locality (Cyber District)</CardDescription>
            </div>
            <Link href="/map" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
              Full Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 min-h-[220px] p-0 relative">
            <InteractiveMap interactive={false} />
          </CardContent>
        </Card>
      </div>

      {/* Main feed area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Recent Issues Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Active Local Issues
            </h3>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search local reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#0b0b0e]/75 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#0b0b0e]/75 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Categories</option>
                <option value="Pothole & Road Damage">Potholes</option>
                <option value="Broken Streetlight">Streetlights</option>
                <option value="Water Leakage">Leaks</option>
                <option value="Overflowing Garbage Bins">Garbage</option>
                <option value="Damaged Public Infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <Link key={issue.id} href={`/issues/${issue.id}`} className="block">
                  <div className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all flex flex-col sm:flex-row gap-4">
                    {/* Image Preview */}
                    <div className="w-full sm:w-28 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {getStatusBadge(issue.status)}
                          {getSeverityBadge(issue.severity)}
                          <span className="text-[10px] text-gray-500 font-semibold">{issue.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{issue.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 truncate">{issue.location.address}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-3 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                          {issue.upvotes} upvotes • {issue.verifiedCount} verified
                        </span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass-panel p-8 rounded-xl border border-white/5 text-center text-xs text-gray-500">
                No active community issues found matching your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Widget Column */}
        <div className="space-y-6">
          {/* Quick Actions widget */}
          <Card className="bg-[#0b0b0e]/70 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-indigo-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Link href="/report">
                <Button size="sm" className="w-full" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Submit AI Report
                </Button>
              </Link>
              <Link href="/map">
                <Button size="sm" variant="outline" className="w-full bg-white/5" leftIcon={<MapIcon className="w-4 h-4" />}>
                  Explore Neighbor Map
                </Button>
              </Link>
              {user && (user.role === 'Admin' || user.role === 'admin' || user.role === 'staff' || (user.email && process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL && user.email.toLowerCase() === process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL.toLowerCase())) && (
                <Link href="/admin">
                  <Button size="sm" variant="ghost" className="w-full text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/5 hover:bg-indigo-500/10">
                    Switch to Admin View
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard standings */}
          <Card className="bg-[#0b0b0e]/70 border-white/5">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-sm font-bold">Local Heroes</CardTitle>
                <CardDescription className="text-[10px]">Leaderboard standings</CardDescription>
              </div>
              <Link href="/leaderboard" className="text-[10px] text-indigo-400 hover:underline font-bold">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {leaderboard.slice(0, 4).map((hero) => (
                  <div key={hero.rank} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black w-4 text-center ${
                        hero.rank === 1 ? 'text-amber-400' :
                        hero.rank === 2 ? 'text-gray-300' :
                        hero.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {hero.rank}
                      </span>
                      <div className="h-7 w-7 rounded-full overflow-hidden border border-white/5 bg-[#0f0f13] flex-shrink-0">
                        <img src={hero.avatar} alt={hero.name} className="w-full h-full" />
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[90px]">{hero.name}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400">{hero.points} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
