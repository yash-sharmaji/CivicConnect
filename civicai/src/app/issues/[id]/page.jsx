'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Progress } from '@/components/ui/Progress';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import { useToast } from '@/components/ui/Toast';
import { 
  getReportDetails, 
  upvoteIssue, 
  verifyIssue, 
  addComment
} from '@/lib/mockData';
import { useAuth } from '@/components/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  ThumbsUp, 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  Calendar,
  User,
  Share2
} from 'lucide-react';

export default function IssueDetailsPage({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, triggerGuestRestriction } = useAuth();
  
  // Resolve params asynchronously (Next.js 15 standard)
  const resolvedParams = use(params);
  const issueId = resolvedParams.id;

  const [issue, setIssue] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    getReportDetails(issueId).then((found) => {
      if (found) {
        setIssue(found);
      } else {
        router.push('/dashboard');
      }
    });
  }, [issueId, refreshTrigger]);

  if (!issue) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs text-gray-500">
        Loading issue parameters...
      </div>
    );
  }

  // Verification Progress Calculation
  const VERIFY_THRESHOLD = 5;
  const verifyProgress = Math.min(100, (issue.verifiedCount / VERIFY_THRESHOLD) * 100);

  // Upvote Action
  const handleUpvote = () => {
    if (!user) {
      triggerGuestRestriction("An account is required to support/upvote reports. Please sign in or register.");
      return;
    }
    upvoteIssue(issue.id).then((updated) => {
      if (updated) {
        setIssue(updated);
        toast('success', 'Vote Recorded', 'Thank you for upvoting this issue.');
      }
    });
  };

  // Verify Action
  const handleVerify = () => {
    if (!user) {
      triggerGuestRestriction("An account is required to verify reported issues. Please sign in or register.");
      return;
    }
    verifyIssue(issue.id).then((updated) => {
      if (updated) {
        setIssue(updated);
        toast('success', 'Verification Recorded', 'Thank you for verifying this hazard.');
      }
    });
  };

  // Comment Action
  const handlePostComment = (e) => {
    e.preventDefault();
    if (!user) {
      triggerGuestRestriction("An account is required to comment on reports. Please sign in or register.");
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    addComment(issue.id, commentText).then((newComment) => {
      setIsSubmittingComment(false);
      if (newComment) {
        setCommentText('');
        // Reload details to get fresh comment feed and XP
        getReportDetails(issue.id).then((updated) => {
          if (updated) setIssue(updated);
        });
        toast('success', 'Comment Posted', 'Your message has been added to the feed.');
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'text-amber-400';
      case 'verified': return 'text-indigo-400';
      case 'in-progress': return 'text-blue-400';
      case 'resolved': return 'text-emerald-400';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'low': return <Badge variant="glass">Low Severity</Badge>;
      case 'medium': return <Badge variant="warning">Medium Severity</Badge>;
      case 'high': return <Badge variant="danger">High Severity</Badge>;
      case 'critical': return <Badge variant="danger" pulse>Critical Hazard</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Back button & Action Row */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast('success', 'Link Copied', 'Issue link copied to clipboard.');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Report
        </button>
      </div>

      {/* Main Issue Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={
              issue.status === 'resolved' ? 'success' :
              issue.status === 'in-progress' ? 'default' :
              issue.status === 'verified' ? 'info' : 'warning'
            } pulse={issue.status === 'in-progress'}>
              {issue.status.replace('-', ' ')}
            </Badge>
            {getSeverityBadge(issue.severity)}
            <span className="text-xs text-gray-500 font-semibold">{issue.category}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{issue.title}</h1>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            {issue.location.address}
          </p>
        </div>

        {/* Voting Quick Action box */}
        {issue.status !== 'resolved' && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpvote}
              leftIcon={<ThumbsUp className="w-4 h-4" />}
              className="bg-white/5 border-white/5 text-xs"
            >
              Upvote ({issue.upvotes})
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleVerify}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              className="text-xs"
            >
              Verify ({issue.verifiedCount})
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Visuals & details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Image Card */}
          <Card className="bg-[#0b0b0e]/70 border-white/5 overflow-hidden p-0">
            <div className="w-full h-80 sm:h-96 relative bg-[#121216]">
              <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Detailed Report Description</span>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{issue.description}</p>
            </div>
          </Card>

          {/* Comments Widget */}
          <Card className="bg-[#0b0b0e]/70 border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                Comments & Activity ({issue.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Comment entry Form */}
              <form onSubmit={handlePostComment} className="flex flex-col gap-3">
                <Textarea
                  placeholder="Post an update, coordinate resolution steps, or leave a note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingComment}
                  disabled={!commentText.trim()}
                  className="self-end"
                >
                  Post Comment
                </Button>
              </form>

              {/* Comments Feed List */}
              <div className="space-y-4 border-t border-white/5 pt-5">
                {issue.comments.length > 0 ? (
                  issue.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-xs leading-normal">
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-white/5 bg-[#0f0f13] flex-shrink-0">
                        <img src={comment.avatar} alt={comment.author} className="w-full h-full" />
                      </div>
                      <div className="flex-1 bg-[#121216]/50 border border-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="font-bold text-white">{comment.author}</span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500">
                    No comments logged. Be the first to start the coordination.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timelines & status stats */}
        <div className="space-y-6">
          {/* Resolution Status Progress Tracker */}
          <Card className="bg-[#0b0b0e]/70 border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-indigo-400" />
                Resolution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="relative border-l border-white/10 ml-2.5 pl-6 space-y-6 pb-2 text-xs">
                {issue.timeline.map((event, i) => {
                  const isActive = i === issue.timeline.length - 1;
                  return (
                    <div key={i} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={`
                        absolute -left-[31px] top-0.5 rounded-full border flex items-center justify-center w-4 h-4 transition-all
                        ${isActive 
                          ? 'bg-indigo-600 border-indigo-400 shadow-md shadow-indigo-600/30 ring-4 ring-indigo-950/40 text-white' 
                          : 'bg-[#0f0f13] border-white/10 text-gray-400'
                        }
                      `}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </span>

                      <div>
                        <div className={`font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {event.title}
                        </div>
                        <p className="text-gray-400 mt-1 leading-relaxed">{event.description}</p>
                        <div className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.updatedBy && <span>• by {event.updatedBy}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Verification Progress Box */}
          {issue.status !== 'resolved' && (
            <Card className="bg-[#0b0b0e]/70 border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
                  Verification Progress
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Requires {VERIFY_THRESHOLD} neighbor verifications to escalate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">
                    {issue.verifiedCount} / {VERIFY_THRESHOLD} Verifications
                  </span>
                  <span className="font-black text-indigo-400">{verifyProgress.toFixed(0)}%</span>
                </div>
                <Progress value={verifyProgress} color={issue.verifiedCount >= 5 ? 'success' : 'primary'} />
                
                {issue.verifiedCount < 5 ? (
                  <Button size="sm" variant="outline" className="w-full bg-white/5 text-xs" onClick={handleVerify}>
                    Verify this Issue
                  </Button>
                ) : (
                  <div className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Verification threshold exceeded. Scheduled for municipal workforce dispatch.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Vector Mini map box */}
          <Card className="bg-[#0b0b0e]/70 border-white/5 overflow-hidden flex flex-col p-0">
            <div className="h-44 w-full relative">
              <InteractiveMap
                interactive={false}
                highlightIssueId={issue.id}
                selectedLat={issue.location.lat}
                selectedLng={issue.location.lng}
              />
            </div>
            <div className="p-4 text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Reporter Details</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-7 w-7 rounded-full overflow-hidden border border-white/5 bg-[#0f0f13]">
                  <img src={issue.creator.avatar} alt="Reporter avatar" className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{issue.creator.name}</div>
                  <div className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{issue.creator.rank}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
