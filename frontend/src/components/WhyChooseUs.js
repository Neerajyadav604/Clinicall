import React from 'react';
import { Heart, Shield, Clock, Users } from 'lucide-react';

const WhyChooseUs = () => {
  const features = [
    {
      icon: Heart,
      title: "Expert Care",
      description: "Our team of experienced healthcare professionals is dedicated to providing you with the highest quality medical care."
    },
    {
      icon: Shield,
      title: "Trusted Service",
      description: "We maintain the highest standards of safety and hygiene to ensure your wellbeing at all times."
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Round-the-clock medical support whenever you need it, ensuring peace of mind at all hours."
    },
    {
      icon: Users,
      title: "Patient Focused",
      description: "Your comfort and recovery are our top priorities. We treat every patient with compassion and respect."
    }
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-blue-500 text-sm sm:text-base font-medium mb-2">
            Why Choose Us
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            We Provide Quality
          </h2>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="text-blue-500">Healthcare</span>{' '}
            <span className="text-gray-900">Services</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-6 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-400 group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-6 sm:px-8 py-3 sm:py-4 shadow-lg">
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
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;