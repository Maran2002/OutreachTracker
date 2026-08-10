'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, Mail, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

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
        <p className="auth-subtitle">Sign in to manage your outreach records</p>

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

        <div className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 font-semibold hover:underline">
            Create one
          </Link>
        </div>

        {/* <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link href="/admin/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Administrator Login →
          </Link>
        </div> */}
      </div>
    </div>
  );
}
