'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Bell, Menu, X, LogOut, Sun, Moon, ChevronDown, User, Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { getStoredNotifications } from '@/lib/mockData';
import { useAuth } from '@/components/AuthContext';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  const avatar = user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane';
  const isAppView = pathname !== '/' && pathname !== '/login' && pathname !== '/signup';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const checkNotifications = () => {
      getStoredNotifications()
        .then((notifs) => {
          setUnreadCount(notifs.filter(n => !n.read).length);
        })
        .catch((err) => console.warn('Failed to load notifications in Navbar:', err.message));
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#030303]/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Civic<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isAppView ? (
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="/#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How AI Works</Link>
              <Link href="/#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
              <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Enter App</Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className={`text-sm font-semibold transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                Dashboard
              </Link>
              <Link href="/map" className={`text-sm font-semibold transition-colors ${pathname === '/map' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                City Map
              </Link>
              <Link href="/report" className={`text-sm font-semibold transition-colors ${pathname === '/report' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                Report Issue
              </Link>
            </nav>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {user && (
              <Link href="/notifications" className="relative p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white ring-2 ring-[#030303]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {!user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors">
                    <img src={avatar} alt="Profile" className="w-full h-full" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0b0b0e] border border-white/10 py-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.rank}</p>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        My Profile
                      </Link>
                      
                      <Link 
                        href="/settings" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </Link>
                      
                      <div className="border-t border-white/5 my-1" />
                      
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleSignOut();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 md:hidden rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#030303] px-4 py-4 space-y-3">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <Link href="/map" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">City Map</Link>
          <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">Leaderboard</Link>
          
          {user ? (
            <>
              <Link href="/notifications" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">Notifications</Link>
              <Link href="/profile" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">My Profile</Link>
              <Link href="/settings" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white">Settings</Link>
              
              {(user.role === 'Admin' || user.role === 'admin' || user.role === 'staff' || (user.email && process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL && user.email.toLowerCase() === process.env.VITE_INITIAL_SUPER_ADMIN_EMAIL.toLowerCase())) && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-white text-indigo-400">Admin Panel</Link>
              )}
              
              <div className="border-t border-white/5 pt-2 mt-2" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2 py-2 text-sm text-red-400 hover:text-red-300 font-semibold text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
