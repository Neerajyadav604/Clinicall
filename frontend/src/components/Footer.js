import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Heart } from 'lucide-react';
import logo from "../assets/logo.png"
const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribed:', email);
    setEmail('');
  };

  const footerLinks = {
    Features: [
      { name: 'Book Appointment', path: '/appointment' },
      { name: 'Find Doctors', path: '/doctors' },
      { name: 'Specialties', path: '/specialties' },
      { name: 'Health Records', path: '/records' }
    ],
    Support: [
      { name: 'Help Center', path: '/help' },
      { name: 'FAQ', path: '/faq' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Emergency', path: '/emergency' }
    ],
    Legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'Disclaimer', path: '/disclaimer' }
    ]
  };

  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            <div className="text-white">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Subscribe our newsletter
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md">
                Subscribe to our newsletter and be the first to receive insights, updates, and expert tips on optimizing your healthcare management.
              </p>
            </div>

            <div>
              <p className="text-blue-400 text-sm mb-4 font-medium">
                Stay up to date
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-gray-400 text-xs mt-3">
                By subscribing you agree to our{' '}
                <Link to="/privacy" className="text-blue-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-gray-200">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <img src={logo} className="h-10 font-bold text-gray-900"></img>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Make your healthcare journey simple and accessible. Quality medical care at your fingertips.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-gray-900 font-bold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-600 text-sm hover:text-blue-500 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© 2026 HealthCare. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;