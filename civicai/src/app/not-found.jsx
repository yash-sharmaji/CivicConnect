'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Compass, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden bg-[#030303] min-h-[calc(100vh-100px)] grid-bg">
      <div className="glow-spot top-[30%] left-[30%]" />

      <div className="relative z-10 max-w-md space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-white">404</h1>
          <h2 className="text-xl font-bold text-gray-300">Route Disoriented</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            The community coordinate you are looking for has been archived, resolved, or relocated.
          </p>
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/dashboard">
            <Button className="w-full" leftIcon={<Compass className="w-4 h-4" />}>
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full bg-white/5" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Landing Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
