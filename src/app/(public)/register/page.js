'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, Mail, Lock, User, Check, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function RegisterForm() {
  const router = useRouter();
  
  // Step 1: Enter credentials. Step 2: Verify OTP
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    // Basic client validation
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to send OTP code');
        setIsLoading(false);
        return;
      }

      setServerSuccess(data.message || 'OTP sent successfully!');
      setStep(2);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!otp) {
      setErrors({ otp: 'Verification code is required' });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: 'Code must be exactly 6 digits' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp,
          purpose: 'email_verification',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Verification failed');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setServerError('');
    setServerSuccess('');
    setIsResending(true);

    try {
      const res = await fetch('/api/v1/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to resend code');
        return;
      }

      setServerSuccess(data.message || 'A new code has been sent!');
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleRegister = () => {
    router.push('/api/v1/auth/google?intent=register');
  };

  if (step === 2) {
    return (
      <>
        {serverError && (
          <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
            {serverError}
          </div>
        )}
        {serverSuccess && (
          <div className="p-3 mb-4 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-lg">
            {serverSuccess}
          </div>
        )}

        <form onSubmit={handleVerifyOtpAndRegister} className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            We sent a verification code to <strong className="text-slate-200">{formData.email}</strong>. Enter the code below to activate your account.
          </p>

          <Input
            label="6-Digit Verification Code"
            name="otp"
            placeholder="123456"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (errors.otp) setErrors({ ...errors, otp: '' });
            }}
            error={errors.otp}
            required
            className="text-center font-mono text-lg tracking-widest"
          />

          <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
            Verify & Create Account
          </Button>

          <div className="flex justify-between items-center mt-2 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Edit Info
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-blue-400 font-semibold hover:underline disabled:text-slate-600 disabled:no-underline"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      {serverError && (
        <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          name="name"
          placeholder="John Doe"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

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

        <Input
          label="Password"
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
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
          Get Verification Code
        </Button>
      </form>

      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <span className="relative px-3 bg-[#0f172a] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Or register with
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleRegister}
        className="w-full flex items-center justify-center gap-2 hover:bg-slate-800/50 transition-colors"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Google</span>
      </Button>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </>
  );
}

export default function RegisterPage() {
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

        <h1 className="auth-title">Create an Account</h1>
        <p className="auth-subtitle mb-6">Start tracking and optimizing your outreach campaigns</p>

        <Suspense fallback={<div className="text-xs text-slate-500 text-center py-4">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
