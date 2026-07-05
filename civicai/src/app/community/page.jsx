'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  communityGetPosts,
  communityCreatePost,
  communityDeletePost,
  communityToggleLike
} from '@/lib/mockData';
import { Heart, Trash2, Plus, X, MessageSquare } from 'lucide-react';

export default function CommunityPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load posts from localStorage on mount
  useEffect(() => {
    setPosts(communityGetPosts());
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    const newPost = communityCreatePost({
      title,
      message,
      userName: user.name || user.email || 'Citizen',
      userId: user.id
    });
    setPosts(communityGetPosts());
    setTitle('');
    setMessage('');
    setShowForm(false);
  }

  function handleDelete(postId) {
    try {
      communityDeletePost(postId, user.id);
      setPosts(communityGetPosts());
    } catch {
      // silently ignore
    }
  }

  function handleLike(postId) {
    if (!user) return;
    try {
      communityToggleLike(postId, user.id);
      setPosts(communityGetPosts());
    } catch {
      // silently ignore
    }
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Community
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Share updates and discussions with your neighbourhood</p>
        </div>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Post
          </button>
        )}
      </div>

      {/* Create Post Form */}
      {showForm && user && (
        <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white">New Discussion</span>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={120}
              className="w-full bg-[#0a0a0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What would you like to discuss?"
              rows={4}
              maxLength={1000}
              className="w-full bg-[#0a0a0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign-in prompt for guests */}
      {!user && (
        <div className="text-center py-4 px-4 bg-white/3 border border-white/10 rounded-xl">
          <p className="text-sm text-gray-400">
            <a href="/login" className="text-indigo-400 hover:underline">Sign in</a> to create a post or like discussions.
          </p>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No discussions yet. Be the first to start one!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const isOwner = user && post.userId === user.id;
            const isLiked = user && post.likes.includes(user.id);

            return (
              <div
                key={post.id}
                className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3"
              >
                {/* Post header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 uppercase">
                        {(post.userName || 'C')[0]}
                      </div>
                      <span className="text-xs font-semibold text-white">{post.userName}</span>
                      <span className="text-[10px] text-gray-500">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      title="Delete your post"
                      className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Post body */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-white leading-snug">{post.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{post.message}</p>
                </div>

                {/* Like button */}
                <div className="flex items-center pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={!user}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default ${
                      isLiked
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>{post.likes.length}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
