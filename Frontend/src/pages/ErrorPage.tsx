import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, HomeIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
}
export function ErrorPage({
  code = 404,
  title = 'Page Not Found',
  message = "The page you are looking for doesn't exist or has been moved."
}: ErrorPageProps) {
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-subtle">
          <AlertTriangleIcon className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-6xl font-heading font-bold text-gray-900 mb-4">
          {code}
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8 text-lg">{message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg" leftIcon={<HomeIcon className="w-5 h-5" />}>
              Back to Home
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button size="lg" variant="outline" leftIcon={<ArrowLeftIcon className="w-5 h-5" />}>
              Go Back
            </Button>
          </button>
        </div>
      </div>
    </div>;
}