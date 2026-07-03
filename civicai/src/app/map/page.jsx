'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getStoredIssues } from '@/lib/mockData';
import { 
  Search, 
  Filter, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  SlidersHorizontal,
  ThumbsUp,
  Compass
} from 'lucide-react';

export default function MapPage() {
  const [issues, setIssues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [activeIssueId, setActiveIssueId] = useState(undefined);

  useEffect(() => {
    getStoredIssues().then(setIssues);
  }, []);

  const categories = ['All', 'Pothole & Road Damage', 'Broken Streetlight', 'Water Leakage', 'Overflowing Garbage Bins', 'Damaged Public Infrastructure'];
  const statuses = ['All', 'reported', 'verified', 'in-progress', 'resolved'];
  const severities = ['All', 'low', 'medium', 'high', 'critical'];

  // Apply filters
  const filteredIssues = issues.filter(issue => {
    if (categoryFilter !== 'All' && issue.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && issue.status !== statusFilter) return false;
    if (severityFilter !== 'All' && issue.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'verified': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'in-progress': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  const getSeverityColorBg = (severity) => {
    switch (severity) {
      case 'low': return 'bg-gray-400';
      case 'medium': return 'bg-amber-400';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
    }
  };

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-112px)] flex flex-col gap-5 overflow-hidden">
      {/* Header title */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400 animate-spin-slow" />
            Interactive City Map
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Filter, find, and coordinate responses for neighborhood infrastructure concerns.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        {/* Left Side: Filter Sidebar and list */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto lg:overflow-visible flex-shrink-0">
          {/* Controls Card */}
          <Card className="bg-[#0b0b0e]/70 border-white/5 flex-shrink-0">
            <CardContent className="pt-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search address or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#121216]/50 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121216]/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              </div>

              {/* Status & Severity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121216]/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize cursor-pointer"
                  >
                    {statuses.map((stat, i) => (
                      <option key={i} value={stat}>{stat === 'All' ? 'All Status' : stat.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121216]/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize cursor-pointer"
                  >
                    {severities.map((sev, i) => (
                      <option key={i} value={sev}>{sev === 'All' ? 'All Severity' : sev}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List panel (scrolling) */}
          <div className="flex-1 lg:overflow-y-auto space-y-2.5 custom-scrollbar min-h-[150px] lg:min-h-0">
            <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block mb-1">
              Matching Reports ({filteredIssues.length})
            </span>

            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setActiveIssueId(issue.id)}
                  className={`
                    p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2
                    ${activeIssueId === issue.id 
                      ? 'bg-indigo-950/20 border-indigo-500 shadow-md' 
                      : 'bg-[#0b0b0e]/70 border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${getSeverityColorBg(issue.severity)}`} />
                      <span className="text-[9px] text-gray-400 capitalize">{issue.severity}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">{issue.title}</h4>
                  
                  <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1 border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1 truncate max-w-[130px]">
                      <MapPin className="w-3.5 h-3.5 text-gray-600" />
                      {issue.location.address}
                    </span>
                    <Link href={`/issues/${issue.id}`} className="text-indigo-400 hover:underline font-bold">
                      Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 bg-[#0b0b0e]/70 border border-white/5 rounded-xl text-center text-xs text-gray-500">
                No matching reports. Adjust filters to search other regions.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas */}
        <div className="flex-1 min-h-[300px] lg:min-h-0 relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <InteractiveMap
            interactive={true}
            filterCategory={categoryFilter}
            filterStatus={statusFilter}
            filterSeverity={severityFilter}
            searchQuery={searchQuery}
            highlightIssueId={activeIssueId}
          />

          {/* Floating Action Button (FAB) */}
          <Link href="/report" className="absolute bottom-5 right-5 z-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 active:scale-95 transition-all animate-bounce-slow">
              <Plus className="w-6 h-6" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
