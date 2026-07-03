'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getStoredNotifications, markNotificationAsRead } from '@/lib/mockData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Bell, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Award,
  ArrowRight,
  Inbox
} from 'lucide-react';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getStoredNotifications().then(setNotifications);
  }, []);

  const handleMarkAllRead = () => {
    markNotificationAsRead('all')
      .then(() => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        toast('success', 'All Read', 'Marked all notifications as read.');
      })
      .catch(err => {
        toast('danger', 'Error', err.message || 'Failed to update notifications');
      });
  };

  const handleMarkSingleRead = (id) => {
    markNotificationAsRead(id)
      .then(() => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
      })
      .catch(err => {
        console.error('Failed to mark notification read:', err);
      });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'status_change': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'verification': return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'badge_earned': return <Award className="w-4 h-4 text-amber-400" />;
    }
  };

  const getBadge = (read) => {
    if (!read) return <Badge variant="info">New</Badge>;
    return <Badge variant="glass">Read</Badge>;
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-10 max-w-4xl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-400" />
            Notifications
          </h1>
          <p className="text-sm text-gray-400 mt-1">Stay updated with resolutions, upvotes, and achievements earned in your ward.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckSquare className="w-4 h-4" />}
            className="bg-white/5 border-white/5 text-xs self-start"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleMarkSingleRead(n.id)}
              className={`
                bg-[#0b0b0e]/70 border transition-all
                ${n.read ? 'border-white/5 opacity-70' : 'border-indigo-500/20 shadow-[0_0_15px_-5px_rgba(99,102,241,0.15)]'}
              `}
            >
              <CardContent className="p-4.5 flex gap-4 items-start">
                {/* Icon category */}
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                  {getIcon(n.type)}
                </div>

                {/* Text fields */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {getBadge(n.read)}
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{n.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                </div>

                {/* Redirect details trigger */}
                {n.issueId && (
                  <Link href={`/issues/${n.issueId}`} className="self-center">
                    <div className="p-2 rounded-lg bg-[#121216] border border-white/5 hover:border-indigo-500/30 text-gray-400 hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="glass-panel p-16 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center gap-3">
            <Inbox className="w-10 h-10 text-gray-600" />
            <div>
              <p className="text-sm font-bold text-white">All Caught Up!</p>
              <p className="text-xs text-gray-500 mt-0.5">No new notifications in your district feed.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
