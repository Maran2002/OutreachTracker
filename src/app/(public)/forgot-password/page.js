'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setSuccessMessage(data.message || 'If an account exists for this email, a reset link has been sent.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
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
            <p className="text-xs text-slate-400">Password Recovery</p>
          </div>
        </div>

        <h1 className="auth-title">Reset Your Password</h1>
        <p className="auth-subtitle">Enter your email and we&apos;ll send you instructions</p>

        {successMessage ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-center flex flex-col items-center gap-2 my-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-sm font-medium text-slate-200">{successMessage}</p>
            <Link href="/login" className="mt-2 text-xs text-blue-400 hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />

            <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
              Send Reset Link
            </Button>

            <div className="text-center mt-2">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
