import React from 'react';
import { motion } from 'framer-motion';
import { Carousel } from './ui/legacy-carousel';

const slideData = [
  {
    title: "Book Your Appointment in Seconds",
    button: "Book Now",
    src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&auto=format&fit=crop",
  },
  {
    title: "Connect with Verified Specialists",
    button: "Find a Doctor",
    src: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1600&auto=format&fit=crop",
  },
  {
    title: "Get Diagnoses from the Comfort of Home",
    button: "Try Teleconsult",
    src: "https://images.unsplash.com/photo-1588776814546-1ffbb172c21d?w=1600&auto=format&fit=crop",
  },
  {
    title: "Track Your Health Journey",
    button: "View Reports",
    src: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1600&auto=format&fit=crop",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-gradient-to-b from-white to-blue-50 py-20 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="text-center mb-16"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Healthcare,{' '}
            <span className="text-blue-500">Simplified</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
            From finding the right specialist to tracking your recovery — Clinicall makes every step of your healthcare journey effortless.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
          className="pb-20"
        >
          <Carousel slides={slideData} autoPlayInterval={3500} />
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;
