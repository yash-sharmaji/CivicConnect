'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredUser, loginUser, signupUser, logoutUser } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalMessage, setGuestModalMessage] = useState('');

  const refreshUser = async () => {
    try {
      const u = await getStoredUser();
      setUser(u);
    } catch (err) {
      console.warn('Failed to load user in context:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      await refreshUser();
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, fullName, locality) => {
    setLoading(true);
    try {
      const data = await signupUser(email, password, fullName, locality);
      await refreshUser();
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerGuestRestriction = (message) => {
    setGuestModalMessage(message);
    setGuestModalOpen(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, triggerGuestRestriction, refreshUser }}>
      {children}

      {/* Global Guest Restriction Popup Modal */}
      {guestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#07070a]/95 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-5 text-center relative animate-fade-in">
            <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">Account Required</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {guestModalMessage || "You must be signed in to perform this community action."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href={`/login?redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`} onClick={() => setGuestModalOpen(false)}>
                <Button variant="primary" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setGuestModalOpen(false)}>
                <Button variant="outline" className="w-full text-xs bg-white/5 border-white/5 text-white hover:bg-white/10">
                  Sign Up
                </Button>
              </Link>
            </div>
            <button
              onClick={() => setGuestModalOpen(false)}
              className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-semibold block mx-auto pt-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
