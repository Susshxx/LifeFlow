import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailIcon, ArrowLeftIcon, CheckCircleIcon, LockIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import emailjs from '@emailjs/browser';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// EmailJS configuration for password reset
const EMAILJS_SERVICE_ID  = 'service_hfrba86';
const EMAILJS_TEMPLATE_ID_RESET = 'template_eiz2djt'; // Password reset template
const EMAILJS_PUBLIC_KEY  = 'jf7SKwUj0GbF3OxLD';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  const result = await emailjs.send(
    EMAILJS_SERVICE_ID, 
    EMAILJS_TEMPLATE_ID_RESET, 
    { 
      to_email: email,      // Try to_email
      user_email: email,    // Fallback to user_email
      email: email,         // Fallback to email
      otp: otp,
      reset_code: otp       // Alternative variable name
    }, 
    EMAILJS_PUBLIC_KEY
  );
  if (result.status !== 200) {
    throw new Error(`EmailJS error ${result.status}: ${result.text}`);
  }
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if email exists and has password
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to verify email.');
        return;
      }

      if (!data.hasPassword) {
        setError('If an account exists with this email, you will receive a password reset code.');
        return;
      }

      // Generate and send OTP
      const otp = generateOTP();
      setGeneratedOTP(otp);
      
      await sendOTPEmail(email.trim(), otp);
      startCooldown();
      setStep('otp');

    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      await sendOTPEmail(email.trim(), otp);
      startCooldown();
      setOtp('');
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.trim() !== generatedOTP) {
      setError('Invalid verification code. Please check and try again.');
      return;
    }

    setError('');
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          newPassword 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setStep('success');

    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpBoxChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const val = e.target.value.replace(/\D/, '').slice(0, 1);
    const arr = Array.from({ length: 6 }, (_, idx) => otp[idx] ?? '');
    arr[i] = val;
    setOtp(arr.join(''));
    setError('');
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = Array.from({ length: 6 }, (_, idx) => otp[idx] ?? '');
      if (arr[i]) {
        arr[i] = '';
        setOtp(arr.join(''));
      } else if (i > 0) {
        arr[i - 1] = '';
        setOtp(arr.join(''));
        document.getElementById(`otp-${i - 1}`)?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-gray-600">
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Create a new password for your account'}
            {step === 'success' && 'Your password has been reset successfully'}
          </p>
        </div>

        <Card padding="lg">
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {error && <Alert variant="error">{error}</Alert>}
              
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="Enter your registered email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                leftIcon={<MailIcon className="w-5 h-5" />} 
                required 
              />

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                Send Verification Code
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {error && <Alert variant="error">{error}</Alert>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Code
                </label>
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => handleOtpBoxChange(e, i)}
                      onKeyDown={(e) => handleOtpBoxKeyDown(e, i)}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Code sent to {email}
                </p>
              </div>

              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                disabled={otp.length !== 6}
              >
                Verify Code
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Resend verification code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {error && <Alert variant="error">{error}</Alert>}

              <Input 
                label="New Password" 
                type="password" 
                placeholder="Enter new password (min 8 characters)" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                leftIcon={<LockIcon className="w-5 h-5" />} 
                required 
              />

              <Input 
                label="Confirm Password" 
                type="password" 
                placeholder="Re-enter new password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                leftIcon={<LockIcon className="w-5 h-5" />} 
                required 
              />

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Password Reset Successful
                </h3>
                <p className="text-gray-600 mt-2">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <Button 
                fullWidth 
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}