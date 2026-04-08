import { useState } from 'react';
import { MailIcon, PhoneIcon, MapPinIcon, SendIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import mascotImg from '../../img.png';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email || !formData.message) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about blood donation or need support? We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Image and Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mascot Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary to-primary-dark p-6">
              <img 
                src={mascotImg} 
                alt="LifeFlow — Blood Donor, LifeFlow, Blood Recipient" 
                className="w-full h-auto object-cover rounded-xl" 
              />
            </div>

            {/* Contact Info Card with better contrast */}
            <Card className="bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-lg">
              <h3 className="text-xl font-heading font-semibold mb-6">
                Contact Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90 text-sm">
                      Emergency Hotline
                    </p>
                    <p className="text-lg font-bold">1660-01-66666</p>
                    <p className="text-sm text-white/70 mt-1">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90 text-sm">
                      Email Us
                    </p>
                    <p className="text-lg font-bold">info@lifeflow.org.np</p>
                    <p className="text-sm text-white/70 mt-1">
                      For general inquiries
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90 text-sm">
                      Visit Us
                    </p>
                    <p className="text-lg font-bold">Kathmandu, Nepal</p>
                    <p className="text-sm text-white/70 mt-1">
                      Bagmati Province
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-heading font-semibold mb-4">
                Office Hours
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday - Friday</span>
                  <span className="font-medium">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium text-error">Closed</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                Send us a Message
              </h2>

              {submitSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input 
                    label="First Name" 
                    name="firstName"
                    placeholder="Enter first name" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  <Input 
                    label="Last Name" 
                    name="lastName"
                    placeholder="Enter last name" 
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input 
                    label="Email Address" 
                    name="email"
                    type="email" 
                    placeholder="Enter email address" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Input 
                    label="Phone Number" 
                    name="phone"
                    type="tel" 
                    placeholder="Enter phone number" 
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    name="message"
                    rows={5} 
                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    placeholder="How can we help you?" 
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  size="lg" 
                  rightIcon={<SendIcon className="w-4 h-4" />}
                  isLoading={isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
