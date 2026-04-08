import React from 'react';
import { HeartPulseIcon, TargetIcon, EyeIcon, ShieldCheckIcon, UsersIcon, BuildingIcon, MapPinIcon, TrophyIcon, CheckCircleIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
const stats = [{
  value: '50,000+',
  label: 'Units Collected',
  icon: HeartPulseIcon
}, {
  value: '25,000+',
  label: 'Registered Donors',
  icon: UsersIcon
}, {
  value: '500+',
  label: 'Partner Hospitals',
  icon: BuildingIcon
}, {
  value: '77',
  label: 'Districts Covered',
  icon: MapPinIcon
}];
const values = [{
  icon: ShieldCheckIcon,
  title: 'Safety First',
  description: 'Every donor and hospital is verified to ensure the highest safety standards for blood transfusions.'
}, {
  icon: UsersIcon,
  title: 'Community Driven',
  description: 'Built by Nepalis, for Nepalis. Our platform connects communities to save lives together.'
}, {
  icon: TargetIcon,
  title: 'Transparency',
  description: 'Clear tracking of donations, requests, and impact. Know exactly how your contribution helps.'
}, {
  icon: EyeIcon,
  title: 'Accessibility',
  description: 'Available across all 77 districts of Nepal, making blood donation accessible to everyone.'
}];
const team = [{
  name: 'Dr. Ramesh Adhikari',
  role: 'Medical Director',
  image: ''
}, {
  name: 'Sunita Sharma',
  role: 'Operations Head',
  image: ''
}, {
  name: 'Bikash Thapa',
  role: 'Technology Lead',
  image: ''
}, {
  name: 'Maya Gurung',
  role: 'Community Manager',
  image: ''
}];
const milestones = [{
  year: '2020',
  title: 'Platform Launch',
  description: 'LifeFlow launched in Kathmandu Valley'
}, {
  year: '2021',
  title: 'National Expansion',
  description: 'Expanded to all 7 provinces of Nepal'
}, {
  year: '2022',
  title: 'NRCS Partnership',
  description: 'Official partnership with Nepal Red Cross Society'
}, {
  year: '2023',
  title: '50K Milestone',
  description: 'Crossed 50,000 successful blood donations'
}, {
  year: '2024',
  title: 'Emergency Network',
  description: 'Launched 24/7 emergency response system'
}];
export function AboutPage() {
  return <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary to-secondary-dark text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              About LifeFlow
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              LifeFlow is Nepal's premier blood donation platform, connecting
              donors with hospitals and patients in need. Our mission is to
              ensure no one in Nepal dies due to lack of blood availability.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(stat => <Card key={stat.label} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <TargetIcon className="w-4 h-4" />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6">
                Bridging the Gap Between Donors and Those in Need
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Nepal faces a significant blood shortage, with demand far
                exceeding supply. Many patients, especially in rural areas,
                struggle to find compatible blood donors during emergencies.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                LifeFlow was created to solve this critical problem by building
                a nationwide network of verified donors, streamlining the
                donation process, and enabling rapid emergency response.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-gray-700">
                    Verified donor and hospital network
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-gray-700">
                    Real-time blood availability tracking
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-gray-700">
                    24/7 emergency response system
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl flex items-center justify-center">
                <HeartPulseIcon className="w-32 h-32 text-primary/30" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Blood Donation Matters */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Why Blood Donation in Nepal is Critical
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Understanding the challenges we face and why your contribution
              matters
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-primary/5 border-primary/20">
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                The Challenge
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                  Nepal needs approximately 400,000 units of blood annually
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                  Only about 300,000 units are collected each year
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                  Rural areas face severe blood shortages
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                  Emergency situations often lack immediate blood supply
                </li>
              </ul>
            </Card>

            <Card className="bg-success/5 border-success/20">
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                Our Solution
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  Digital platform connecting donors across all 77 districts
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  Real-time matching for emergency blood requests
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  Verified donor network ensuring safety
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  Regular blood donation camps in underserved areas
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Our Core Values
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(value => <Card key={value.title} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Our Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Key milestones in our mission to save lives
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => <div key={milestone.year} className={`relative flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} pl-20 md:pl-0`}>
                    <Card>
                      <div className="text-primary font-bold text-lg mb-1">
                        {milestone.year}
                      </div>
                      <h3 className="font-heading font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {milestone.description}
                      </p>
                    </Card>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-white shadow" />

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Meet Our Team
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Dedicated professionals working to save lives across Nepal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(member => <Card key={member.name} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Our Partners
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Working together with leading organizations to strengthen Nepal's
            blood donation ecosystem
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="px-8 py-4 bg-white rounded-xl shadow-sm">
              <p className="font-heading font-semibold text-gray-700">
                Nepal Red Cross Society
              </p>
            </div>
            <div className="px-8 py-4 bg-white rounded-xl shadow-sm">
              <p className="font-heading font-semibold text-gray-700">
                Ministry of Health
              </p>
            </div>
            <div className="px-8 py-4 bg-white rounded-xl shadow-sm">
              <p className="font-heading font-semibold text-gray-700">
                WHO Nepal
              </p>
            </div>
            <div className="px-8 py-4 bg-white rounded-xl shadow-sm">
              <p className="font-heading font-semibold text-gray-700">
                Central Blood Bank
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>;
}