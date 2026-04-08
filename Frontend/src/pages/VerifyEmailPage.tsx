import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
export function VerifyEmailPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Handle verification success
  };
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Verify Your Email
          </h1>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit code to your email. Please enter it below to
            verify your account.
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <Input placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-widest font-mono" maxLength={6} required />
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} disabled={otp.length !== 6}>
              Verify Account
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Didn't receive code? </span>
              <button type="button" className="text-primary font-semibold hover:underline">
                Resend
              </button>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-primary transition-colors">
            Skip for now
          </Link>
        </div>
      </div>
    </div>;
}