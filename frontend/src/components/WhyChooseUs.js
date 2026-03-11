import React from 'react';
import { Heart, Shield, Clock, Users, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraBackground } from './ui/aurora-background';
import { BentoGrid, BentoCard } from './ui/bento-grid';

const features = [
  {
    Icon: Heart,
    name: "Expert Medical Care",
    description: "Our experienced healthcare professionals deliver the highest quality medical care — personalised for you.",
    href: "/appointment",
    cta: "Book Now",
    background: (
      <img
        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop"
        alt="Expert Care"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ),
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Shield,
    name: "Trusted & Safe",
    description: "We maintain the highest standards of safety, hygiene, and ethics to ensure your wellbeing at all times.",
    href: "/aboutus",
    cta: "Learn More",
    background: (
      <img
        src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&auto=format&fit=crop"
        alt="Trusted Service"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: Clock,
    name: "24/7 Availability",
    description: "Round-the-clock medical support whenever you need it, giving you peace of mind at any hour.",
    href: "/contact",
    cta: "Contact Us",
    background: (
      <img
        src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&auto=format&fit=crop"
        alt="24/7 Availability"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: Users,
    name: "Patient Focused",
    description: "Your comfort and recovery are our top priority. Every patient treated with compassion and respect.",
    href: "/appointment",
    cta: "Book Appointment",
    background: (
      <img
        src="https://images.unsplash.com/photo-1666214280391-8ff5bd3d9bf6?w=800&auto=format&fit=crop"
        alt="Patient Focused"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Stethoscope,
    name: "Advanced Technology",
    description: "Get notified when your doctor is available, test results are out, or your appointment is confirmed.",
    href: "/appointment",
    cta: "Get Started",
    background: (
      <img
        src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&auto=format&fit=crop"
        alt="Advanced Technology"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

const WhyChooseUs = () => {
  return (
    <AuroraBackground className="py-20 sm:py-24 min-h-0 h-auto">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-blue-600 text-sm sm:text-base font-semibold uppercase tracking-widest mb-3">
            Why Choose Us
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            We Provide Quality
          </h2>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="text-blue-500">Healthcare</span>{' '}
            <span className="text-gray-900">Services</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-6 max-w-2xl mx-auto">
            We are committed to delivering exceptional healthcare experiences with compassion, expertise, and cutting-edge technology.
          </p>
        </motion.div>

        {/* Bento Grid Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.8, ease: "easeInOut" }}
        >
          <BentoGrid className="lg:grid-rows-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>

        {/* Happy Patients Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.7, ease: "easeInOut" }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-full px-6 sm:px-8 py-3 sm:py-4 shadow-lg">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?img=${i}`}
                  alt={`Patient ${i}`}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white"
                />
              ))}
            </div>
            <div className="text-left">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">10,000+</p>
              <p className="text-xs sm:text-sm text-gray-600">Happy Patients</p>
            </div>
          </div>
        </motion.div>

      </div>
    </AuroraBackground>
  );
};

export default WhyChooseUs;
