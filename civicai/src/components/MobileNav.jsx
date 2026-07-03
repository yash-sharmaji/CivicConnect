'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, PlusCircle, Trophy, User } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAppView = pathname !== '/' && pathname !== '/login' && pathname !== '/signup';

  if (!isAppView) return null;

  const links = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Map', href: '/map', icon: Map },
    { name: 'Report', href: '/report', icon: PlusCircle, highlight: true },
    { name: 'Trophy', href: '/leaderboard', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User, authRequired: true }
  ];

  const visibleLinks = links.filter((l) => !l.authRequired || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#030303]/80 backdrop-blur-md border-t border-white/5 md:hidden flex justify-around items-center h-16 px-2">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        
        if (link.highlight) {
          return (
            <Link key={link.name} href={link.href} className="relative -top-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        }

        return (
          <Link key={link.name} href={link.href} className="flex flex-col items-center justify-center flex-1 py-1">
            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
            <span className={`text-[10px] mt-1 transition-colors ${isActive ? 'text-white font-medium' : 'text-gray-500'}`}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
export default MobileNav;
