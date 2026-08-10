'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Target, Lock, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    token: token,
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};
    if (!formData.token) newErrors.token = 'Reset token is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Password reset failed');
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setServerError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-center flex flex-col items-center gap-2 my-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        <p className="text-sm font-medium text-slate-200">Password reset successfully!</p>
        <p className="text-xs text-slate-400">Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!token && (
        <Input
          label="Reset Token"
          name="token"
          placeholder="Paste reset token from email"
          value={formData.token}
          onChange={handleChange}
          error={errors.token}
          required
        />
      )}

      <Input
        label="New Password"
        name="password"
        type="password"
        placeholder="Min 8 chars, 1 uppercase, 1 number"
        icon={Lock}
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Input
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        placeholder="Re-enter new password"
        icon={Lock}
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
      />

      {serverError && (
        <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
          {serverError}
        </div>
      )}

      <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
        Set New Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">OutreachTracker</h2>
            <p className="text-xs text-slate-400">Password Reset</p>
          </div>
        </div>

        <h1 className="auth-title">Create New Password</h1>
        <p className="auth-subtitle mb-6">Enter your new secure password below</p>

        <Suspense fallback={<div className="text-xs text-slate-500 text-center py-4">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
