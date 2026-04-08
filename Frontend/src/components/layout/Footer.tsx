import React from 'react';

import { Link } from 'react-router-dom';
import { HeartPulseIcon, FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon, MailIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
export function Footer() {
  const currentYear = new Date().getFullYear();
  const quickLinks = [{
    href: '/search',
    label: 'Find Blood'
  }, {
    href: '/signup',
    label: 'Become a Donor'
  }, {
    href: '/about',
    label: 'About Us'
  }, {
    href: '/contact',
    label: 'Contact'
  }];
  const resourceLinks = [{
    href: '/faq',
    label: 'FAQs'
  }, {
    href: '/guidelines',
    label: 'Donation Guidelines'
  }, {
    href: '/privacy',
    label: 'Privacy Policy'
  }, {
    href: '/terms',
    label: 'Terms & Conditions'
  }];
  const socialLinks = [{
    href: 'https://facebook.com',
    icon: FacebookIcon,
    label: 'Facebook'
  }, {
    href: 'https://twitter.com',
    icon: TwitterIcon,
    label: 'Twitter'
  }, {
    href: 'https://instagram.com',
    icon: InstagramIcon,
    label: 'Instagram'
  }, {
    href: 'https://youtube.com',
    icon: YoutubeIcon,
    label: 'YouTube'
  }];
  return <footer className="bg-secondary text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <HeartPulseIcon className="w-6 h-6 text-primary-light" />
              </div>
              <span className="font-heading font-bold text-xl">
                Life<span className="text-primary-light">Flow</span>
              </span>
            </Link>
            <p className="text-gray-300 text-sm mb-4">
              Connecting blood donors with those in need across Nepal. Every
              drop counts, every donor matters.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors" aria-label={social.label}>
                  <social.icon className="w-4 h-4" />
                </a>)}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-gray-300 hover:text-white hover:underline transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-gray-300 hover:text-white hover:underline transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <MapPinIcon className="w-5 h-5 flex-shrink-0 text-primary-light" />
                <span>
                  Kathmandu, Nepal
                  <br />
                  Bagmati Province
                </span>
              </li>
              <li>
                <a href="tel:1660-01-66666" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <PhoneIcon className="w-5 h-5 flex-shrink-0 text-primary-light" />
                  1660-01-66666
                </a>
              </li>
              <li>
                <a href="mailto:info@lifeflow.org.np" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <MailIcon className="w-5 h-5 flex-shrink-0 text-primary-light" />
                  info@lifeflow.org.np
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Partner Badge */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white/10 rounded-lg">
                <span className="text-xs text-gray-400">
                  In Partnership with
                </span>
                <p className="font-semibold text-sm">Nepal Red Cross Society</p>
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-lg">
                <span className="text-xs text-gray-400">Supported by</span>
                <p className="font-semibold text-sm">Ministry of Health</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              © {currentYear} LifeFlow Nepal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>;
}