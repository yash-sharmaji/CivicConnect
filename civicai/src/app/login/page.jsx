'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { setAuthToken, clearSession, setClientSession } from '@/lib/mockData';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login, refreshUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Handle Supabase OAuth callback tokens in URL hash fragment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        setIsLoading(true);
        // Save the tokens in client session storage
        setAuthToken(accessToken);
        if (refreshToken) {
          localStorage.setItem('civicai_refresh_token', refreshToken);
        }

        // Synchronize state with Supabase client and retrieve user profile
        const syncSessionAndProfile = async () => {
          await setClientSession(accessToken, refreshToken || '');
          await refreshUser();
        };

        syncSessionAndProfile()
          .then(() => {
            setIsLoading(false);
            toast('success', 'Access Granted', 'Logged in via social account.');
            // Clear URL hash to keep client address bar clean
            window.history.replaceState(null, null, window.location.pathname);
            router.push(redirectUrl);
          })
          .catch((err) => {
            setIsLoading(false);
            toast('danger', 'OAuth Sync Failed', err.message || 'Could not synchronize session details.');
            clearSession();
          });
      }
    }
  }, [router, redirectUrl, refreshUser, toast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast('warning', 'Fields Required', 'Please enter your email and password.');
      return;
    }
    
    setIsLoading(true);
    login(email, password)
      .then(() => {
        setIsLoading(false);
        toast('success', 'Welcome Back!', 'Successfully logged in to CivicAI.');
        router.push(redirectUrl);
      })
      .catch((err) => {
        setIsLoading(false);
        toast('danger', 'Login Failed', err.message || 'Invalid email or password.');
      });
  };

  const handleOAuth = (provider) => {
    toast('info', 'Connecting OAuth', `Initializing connection to ${provider}...`);
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      toast('danger', 'Configuration Error', 'Supabase URL is not configured.');
      return;
    }
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=${provider.toLowerCase()}&redirect_to=${redirectUri}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[#030303] min-h-[calc(100vh-64px)] grid-bg">
      <div className="glow-spot top-[20%] left-[30%]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 mb-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Access CivicAI Portal</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">See it. Snap it. Solve it.</p>
        </div>

        {/* Card Entry Form */}
        <Card glow className="bg-[#07070a]/80 border-white/5">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credential credentials below to manage issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="citizen@civicai.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Password</label>
                  <span className="text-[10px] font-semibold text-indigo-400 hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In
              </Button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <span className="relative bg-[#07070a] px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Or Continue With
              </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOAuth('Google')}
                leftIcon={
                  <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 1.18 15.48 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
                  </svg>
                }
                className="bg-white/5 border-white/5"
              >
                Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOAuth('Facebook')}
                leftIcon={
                  <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                  </svg>
                }
                className="bg-white/5 border-white/5"
              >
                Facebook
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center text-xs text-gray-400">
            Don't have an account?&nbsp;
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Create one
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#07070a] text-white">
        <div className="animate-pulse text-sm text-gray-400 font-medium">Loading login form...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
