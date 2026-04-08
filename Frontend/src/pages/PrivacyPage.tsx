import React from 'react';
import { Card } from '../components/ui/Card';
export function PrivacyPage() {
  return <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <Card padding="lg" className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: June 1, 2024</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-gray-600 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Name, email address, and phone number</li>
              <li>Blood group and date of birth</li>
              <li>Location data (Province, District, Municipality)</li>
              <li>Health screening information relevant to blood donation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Connect blood donors with recipients and hospitals</li>
              <li>Verify donor eligibility and identity</li>
              <li>Send emergency blood request alerts</li>
              <li>Improve our platform and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Data Security
            </h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Sharing of Information
            </h2>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We may share your
              information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>
                Verified hospitals and blood banks when you agree to donate
              </li>
              <li>
                Emergency responders in critical situations (with your consent)
              </li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Contact Us
            </h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please
              contact us at privacy@lifeflow.org.np
            </p>
          </section>
        </Card>
      </div>
    </div>;
}