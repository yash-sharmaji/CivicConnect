'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Shield, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locality, setLocality] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !locality) {
      toast('warning', 'Incomplete Form', 'Please fill out all input fields to register.');
      return;
    }

    setIsLoading(true);
    signup(email, password, name, locality)
      .then(() => {
        setIsLoading(false);
        toast('success', 'Account Registered!', `Welcome to the community, ${name}!`);
        router.push('/dashboard');
      })
      .catch((err) => {
        setIsLoading(false);
        toast('danger', 'Registration Failed', err.message || 'Could not register account.');
      });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[#030303] min-h-[calc(100vh-64px)] grid-bg">
      <div className="glow-spot top-[15%] right-[25%]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 mb-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Join <span className="text-emerald-400">Civic Connect</span></h2>
          <p className="text-xs text-gray-500 font-medium mt-1">Start contributing to your neighborhood</p>
        </div>

        {/* Card Entry Form */}
        <Card glow className="bg-[#07070a]/80 border-white/5">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Join thousands of local heroes repairing Metro City.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="jane.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Zip Code / Locality"
                type="text"
                placeholder="94103 / Cyber District"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <div className="flex items-start gap-2.5 pt-1 text-[11px] text-gray-500 leading-normal">
                <input type="checkbox" required className="mt-0.5 accent-indigo-500 rounded bg-[#0f0f13] border-white/10" />
                <span>
                  I agree to report genuine concerns and follow standard community verification guidelines.
                </span>
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Register Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center text-xs text-gray-400">
            Already have an account?&nbsp;
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
