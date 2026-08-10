'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Mail, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
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
    if (!formData.email) newErrors.email = 'Admin email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Invalid administrator credentials');
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setServerError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40">
      <div className="auth-card border-red-900/30">
        <div className="auth-logo">
          <div className="auth-logo-icon bg-gradient-to-r from-red-600 to-amber-600">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">Admin Console</h2>
            <p className="text-xs text-red-400">Restricted Access</p>
          </div>
        </div>

        <h1 className="auth-title">Administrator Login</h1>
        <p className="auth-subtitle">Sign in with your administrator account credentials</p>

        {serverError && (
          <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/60 border border-red-900/50 rounded-lg">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Admin Email"
            name="email"
            type="email"
            placeholder="admin@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

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

          <Button type="submit" variant="danger" isLoading={isLoading} className="mt-2 w-full">
            Authenticate Administrator
          </Button>
        </form>
      </div>
    </div>
  );
}
