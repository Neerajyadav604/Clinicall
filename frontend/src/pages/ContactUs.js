import React, { useState } from 'react';
import { Mail, Phone, Clock, MapPin, ArrowUpRight, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { MultiStepForm } from '../components/ui/multi-step-form';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { SiteFooter } from '../components/ui/site-footer';
import { NAV_LINKS } from '../lib/nav-links';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const socialLinks = [
  { icon: Facebook, href: '#' },
  { icon: Instagram, href: '#' },
  { icon: Twitter, href: '#' },
  { icon: Linkedin, href: '#' },
];

const TooltipIcon = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-pointer flex-shrink-0" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'support@clinicall.com', link: 'mailto:support@clinicall.com' },
  { icon: Phone, title: 'Phone / WhatsApp', value: '+91 98765 43210', link: 'tel:+919876543210' },
  { icon: Clock, title: 'Support Hours', value: 'Mon–Sat, 9AM–6PM', link: null },
  { icon: MapPin, title: 'Location', value: 'Mumbai, Maharashtra, India', link: null },
];

const TOTAL_STEPS = 3;

const ContactUs = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    category: '', subject: '', message: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
    else {
      // Submit
      setTimeout(() => setIsSubmitted(true), 500);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const stepTitles = [
    'Your Information',
    'Issue Details',
    'Your Message',
  ];

  const stepDescriptions = [
    'Tell us who you are so we can get back to you.',
    'Help us understand what you need help with.',
    'Describe your issue in detail so we can assist you better.',
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Hero Header */}
        <div className="text-center mb-12">
          <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">Get In Touch</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
            We're here to help with appointments, payments, doctor registrations, or any technical issues.
          </p>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            const content = (
              <div className="group bg-white rounded-2xl p-5 shadow hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 flex items-start gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">{info.title}</p>
                  <p className="text-gray-800 font-medium text-sm">{info.value}</p>
                </div>
              </div>
            );
            return info.link ? (
              <a key={index} href={info.link} className="block">{content}</a>
            ) : (
              <div key={index}>{content}</div>
            );
          })}
        </div>

        {/* Multi-Step Form or Success state */}
        <div className="flex justify-center">
          {isSubmitted ? (
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-lg w-full mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Message Sent!</h3>
              <p className="text-gray-500 text-lg mb-8">
                Thanks for reaching out! Our team will contact you within 24 hours.
              </p>
              <button
                onClick={() => { setIsSubmitted(false); setCurrentStep(1); setFormData({ fullName: '', email: '', phone: '', category: '', subject: '', message: '' }); }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <MultiStepForm
              size="default"
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              title={stepTitles[currentStep - 1]}
              description={stepDescriptions[currentStep - 1]}
              onBack={handleBack}
              onNext={handleNext}
              nextButtonText={currentStep === TOTAL_STEPS ? 'Submit Message' : 'Next Step'}
              footerContent={
                <a href="tel:+911234567890" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Emergency? Call us <ArrowUpRight className="h-4 w-4" />
                </a>
              }
              className="w-full max-w-2xl shadow-2xl border-0"
            >
              {/* Step 1 – Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                      <TooltipIcon text="Enter your full name as registered." />
                    </div>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Rahul Sharma" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <TooltipIcon text="We'll send you a reply at this address." />
                    </div>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone / WhatsApp (Optional)</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                  </div>
                </div>
              )}

              {/* Step 2 – Issue Details */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="category">Issue Category <span className="text-red-500">*</span></Label>
                      <TooltipIcon text="Select the category that best describes your issue." />
                    </div>
                    <Select onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment Issue</SelectItem>
                        <SelectItem value="payment">Payment Issue</SelectItem>
                        <SelectItem value="doctor-registration">Doctor Registration</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                      <TooltipIcon text="A brief title for your issue." />
                    </div>
                    <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g. Unable to book appointment" />
                  </div>

                  <Alert variant="info" icon={<AlertTriangle className="h-4 w-4" />}>
                    <AlertDescription>
                      For urgent issues, please call our support line directly for faster resolution.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 3 – Message */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="message">Your Message <span className="text-red-500">*</span></Label>
                      <TooltipIcon text="Describe the issue in detail. The more info, the faster we can help." />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={7}
                      placeholder="Please describe your issue in detail..."
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 resize-none"
                    />
                  </div>
                  <Alert variant="default" icon={<Info className="h-4 w-4" />}>
                    <AlertDescription>
                      By submitting, you agree to our Privacy Policy. We'll respond within 24 business hours.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </MultiStepForm>
          )}
        </div>

        {/* Emergency Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            For medical emergencies, call{' '}
            <a href="tel:+911234567890" className="text-blue-500 font-semibold hover:underline">
              +91 123-456-7890
            </a>{' '}
            immediately.
          </p>
        </div>

      </div>
      <SiteFooter
        logoText="Clinicall."
        tagline="Quick medical services tailored for you."
        navLinks={NAV_LINKS}
        socialLinks={socialLinks}
        copyrightText="� 2025 Clinicall. All rights reserved."
      />
    </section>
  );
};

export default ContactUs;
