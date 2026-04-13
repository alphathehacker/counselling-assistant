import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../AppIcon';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', path: '/features' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'API', path: '/api' },
        { label: 'Documentation', path: '/docs' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Careers', path: '/careers' },
        { label: 'Blog', path: '/blog' },
        { label: 'Press', path: '/press' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', path: '/help' },
        { label: 'Community', path: '/community' },
        { label: 'Guidelines', path: '/guidelines' },
        { label: 'Privacy Policy', path: '/privacy' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'GDPR', path: '/gdpr' }
      ]
    }
  ];

  const socialLinks = [
    { name: 'Twitter', icon: 'Twitter', path: 'https://twitter.com/admissionpredictor' },
    { name: 'LinkedIn', icon: 'Linkedin', path: 'https://linkedin.com/company/admissionpredictor' },
    { name: 'Facebook', icon: 'Facebook', path: 'https://facebook.com/admissionpredictor' },
    { name: 'Instagram', icon: 'Instagram', path: 'https://instagram.com/admissionpredictor' },
    { name: 'YouTube', icon: 'Youtube', path: 'https://youtube.com/admissionpredictor' }
  ];

  return (
    <footer className="bg-black border-t border-border mt-auto text-gray-200">
      <div className="container mx-auto px-4 lg:px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="GraduationCap" size={20} color="white" />
              </div>
              <span className="font-heading font-semibold text-lg text-white">
                Counselling Assistant
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Your intelligent companion for college admission predictions. 
              Make informed decisions about your educational future with AI-powered insights.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks?.map((social) => (
                <a
                  key={social?.name}
                  href={social?.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth"
                  aria-label={social?.name}
                >
                  <Icon name={social?.icon} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks?.map((section) => (
            <div key={section?.title}>
              <h3 className="font-heading font-semibold text-sm text-white mb-4">
                {section?.title}
              </h3>
              <ul className="space-y-2">
                {section?.links?.map((link) => (
                  <li key={link?.label}>
                    <Link
                      to={link?.path}
                      className="text-sm text-gray-300 hover:text-white transition-smooth"
                    >
                      {link?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading font-semibold text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-sm text-gray-300">
                Get the latest updates on college admissions and new features.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-white border border-border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-smooth">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © {currentYear} Counselling Assistant. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-smooth">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-smooth">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-white transition-smooth">
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
