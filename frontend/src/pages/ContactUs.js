import React, { useState } from 'react';
import { Mail, Phone, Clock, MapPin, Send, CheckCircle } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Appointment issue',
    'Payment issue',
    'Doctor registration',
    'Technical issue',
    'General inquiry'
  ];

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@healthcare.com',
      link: 'mailto:support@healthcare.com'
    },
    {
      icon: Phone,
      title: 'Phone / WhatsApp',
      value: '+91 9876543210',
      link: 'tel:+919876543210'
    },
    {
      icon: Clock,
      title: 'Support Hours',
      value: 'Mon–Sat, 9AM–6PM',
      link: null
    },
    {
      icon: MapPin,
      title: 'Location',
      value: 'Mumbai, Maharashtra, India',
      link: null
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        category: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16 md:py-20 lg:py-24 mt-11">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-blue-500 text-sm sm:text-base font-medium mb-2">
            Get In Touch
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            We're here to help with appointments, payments, or technical issues.
          </p>
        </div>

     <div className="relative mb-16">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
  
  <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {contactInfo.map((info, index) => {
      const Icon = info.icon;
      const content = (
        <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-400 overflow-hidden">
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <Icon className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-sm font-medium text-blue-600 mb-1 uppercase tracking-wide">
              {info.title}
            </h3>
            <p className="text-gray-900 font-semibold text-base leading-relaxed">
              {info.value}
            </p>
          </div>

          {info.link && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      );

      return info.link ? (
        <a key={index} href={info.link} className="block">
          {content}
        </a>
      ) : (
        <div key={index}>
          {content}
        </div>
      );
    })}
  </div>
</div>

        <div className="max-w-3xl mx-auto">
          {isSubmitted ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Message Sent Successfully!
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Thanks! Our team will contact you within 24 hours.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Category (Optional)
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm">
            For urgent medical emergencies, please call{' '}
            <a href="tel:+911234567890" className="text-blue-500 font-semibold hover:underline">
              +91 123-456-7890
            </a>{' '}
            immediately.
          </p>
        </div>

      </div>
    </section>
  );
};

export default ContactUs;