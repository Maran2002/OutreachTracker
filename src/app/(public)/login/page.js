'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Target, Mail, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'csrf':
          setServerError('Security check failed. Please try logging in again.');
          break;
        case 'no_code':
          setServerError('Did not receive permission code from Google. Try again.');
          break;
        case 'invalid_token':
          setServerError('Invalid credentials returned from Google. Try again.');
          break;
        case 'inactive':
          setServerError(`This Google account is associated with an inactive profile. contact: nixlinlabs@gmail.com`);
          break;
        case 'inactive_register':
          setServerError('This account is inactive or has been deleted. Please register for a new account.');
          break;
        case 'google_auth_failed':
          setServerError('Google sign-in failed. Please try again.');
          break;
        default:
          setServerError('Failed to sign in with Google.');
      }
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    router.push('/api/v1/auth/google?intent=login');
  };

  return (
    <>
      {serverError && (
        <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@company.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <div className="text-right mt-1">
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
          Sign In
        </Button>
      </form>

      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <span className="relative px-3 bg-[#0f172a] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 hover:bg-slate-800/50 transition-colors"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span>Google</span>
      </Button>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-400 font-semibold hover:underline">
          Create one
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">OutreachTracker</h2>
            <p className="text-xs text-slate-400">Cold Outreach Platform</p>
          </div>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle mb-6">Sign in to manage your outreach records</p>

        <Suspense fallback={<div className="text-xs text-slate-500 text-center py-4">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
