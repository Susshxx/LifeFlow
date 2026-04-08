import React from 'react';
import { Card } from '../components/ui/Card';
export function TermsPage() {
  return <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-8">
          Terms & Conditions
        </h1>

        <Card padding="lg" className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: June 1, 2024</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 mb-4">
              By accessing and using LifeFlow, you accept and agree to be bound
              by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. User Responsibilities
            </h2>
            <p className="text-gray-600 mb-4">
              As a user of LifeFlow, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the confidentiality of your account</li>
              <li>
                Use the platform for legitimate blood donation purposes only
              </li>
              <li>Not misuse or harass other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Medical Disclaimer
            </h2>
            <p className="text-gray-600 mb-4">
              LifeFlow is a platform for connecting donors and recipients. We do
              not provide medical advice, diagnosis, or treatment. Always seek
              the advice of your physician or other qualified health provider
              with any questions you may have regarding a medical condition.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Account Termination
            </h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to terminate or suspend your account
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Changes to Terms
            </h2>
            <p className="text-gray-600">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. What constitutes a material change will
              be determined at our sole discretion.
            </p>
          </section>
        </Card>
      </div>
    </div>;
}