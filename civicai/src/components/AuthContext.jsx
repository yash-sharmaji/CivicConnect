'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredUser, loginUser, signupUser, logoutUser, setAuthToken, clearSession } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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
    let active = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session) {
          setAuthToken(session.access_token);
          localStorage.setItem('civicai_refresh_token', session.refresh_token);
          const u = await getStoredUser();
          if (active) {
            setUser(u);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch initial session:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ON AUTH STATE CHANGE]', event, session);
      if (!active) return;
      if (session) {
        setLoading(true);
        setAuthToken(session.access_token);
        localStorage.setItem('civicai_refresh_token', session.refresh_token);
        try {
          const u = await getStoredUser();
          if (active) {
            setUser(u);
          }
        } catch (err) {
          console.warn('Failed to refresh user on auth change:', err);
          if (active) {
            setUser(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      } else {
        clearSession();
        if (active) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      return await loginUser(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (email, password, fullName, locality) => {
    setLoading(true);
    try {
      return await signupUser(email, password, fullName, locality);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      setLoading(false);
      throw err;
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
