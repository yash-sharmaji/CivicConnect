'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { AuthProvider } from '@/components/AuthContext';

export const ClientLayout = ({ children }) => {
  const pathname = usePathname();

  const isAuthOrLanding = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/404';

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-[#030303] text-gray-200 antialiased selection:bg-indigo-500/30 selection:text-white">
          {/* Sticky Global Topbar */}
          <Navbar />

          {/* Layout Grid */}
          {!isAuthOrLanding ? (
            <div className="flex-1 flex flex-row relative">
              {/* Desktop Left Sidebar */}
              <Sidebar />

              {/* Main Application Window */}
              <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto pb-20 md:pb-6 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                {children}
              </main>

              {/* Mobile Bottom Navigation Tab bar */}
              <MobileNav />
            </div>
          ) : (
            /* Landing/Auth Fullscreen views */
            <div className="flex-1 flex flex-col">{children}</div>
          )}
        </div>
      </ToastProvider>
    </AuthProvider>
  );
};
export default ClientLayout;
