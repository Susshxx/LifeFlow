import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your email to receive reset instructions
          </p>
        </div>

        <Card padding="lg">
          {isSubmitted ? <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Check your email
                </h3>
                <p className="text-gray-600 mt-2">
                  We've sent password reset instructions to{' '}
                  <span className="font-medium">{email}</span>
                </p>
              </div>
              <Button fullWidth onClick={() => setIsSubmitted(false)} variant="outline">
                Try another email
              </Button>
            </div> : <form onSubmit={handleSubmit} className="space-y-6">
              <Input label="Email Address" type="email" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<MailIcon className="w-5 h-5" />} required />

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>}
        </Card>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>;
}