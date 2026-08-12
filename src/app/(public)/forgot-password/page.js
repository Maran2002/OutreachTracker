'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, Mail, Lock, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ForgotPasswordForm() {
  const router = useRouter();
  
  // Step 1: Request OTP, Step 2: Verify OTP, Step 3: Reset Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!email) {
      setErrors({ email: 'Email address is required' });
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

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to request code');
        setIsLoading(false);
        return;
      }

      setServerSuccess(data.message || 'Verification code sent to your email.');
      setStep(2);
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
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
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          purpose: 'password_reset',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Verification failed. Please try again.');
        return;
      }

      setResetToken(data.data.resetToken);
      setStep(3);
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setServerError('');
    setServerSuccess('');
    setIsResending(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to resend code');
        return;
      }

      setServerSuccess(data.message || 'A new code has been sent!');
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};
    if (!passwordData.password) newErrors.password = 'Password is required';
    else if (passwordData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: passwordData.password,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to reset password');
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

  if (step === 3) {
    return (
      <>
        {serverError && (
          <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
            {serverError}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            icon={Lock}
            value={passwordData.password}
            onChange={handlePasswordChange}
            error={errors.password}
            required
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            icon={Lock}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
            Save & Update Password
          </Button>
        </form>
      </>
    );
  }

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

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Enter the 6-digit password reset code sent to <strong className="text-slate-200">{email}</strong>.
          </p>

          <Input
            label="6-Digit Reset Code"
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
            Verify Code
          </Button>

          <div className="flex justify-between items-center mt-2 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
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
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          error={errors.email}
          required
        />

        <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 w-full">
          Send Verification Code
        </Button>

        <div className="text-center mt-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </form>
    </>
  );
}

export default function ForgotPasswordPage() {
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
        <p className="auth-subtitle mb-6">Enter your email and we&apos;ll send you verification code</p>

        <Suspense fallback={<div className="text-xs text-slate-500 text-center py-4">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
