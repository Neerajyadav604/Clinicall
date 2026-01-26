import React from 'react';
import { Calendar, FileText, Stethoscope, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Calendar,
      number: "01",
      title: "Book Appointment",
      description: "Choose your preferred doctor and select a convenient time slot for your consultation."
    },
    {
      icon: FileText,
      number: "02",
      title: "Fill Details",
      description: "Complete your medical history and provide necessary information for better diagnosis."
    },
    {
      icon: Stethoscope,
      number: "03",
      title: "Consultation",
      description: "Meet with our experienced doctors and receive professional medical advice and care."
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Get Treatment",
      description: "Follow the prescribed treatment plan and medications for a speedy recovery."
    }
  ];

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">

      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 border-2 border-blue-500 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 border-2 border-gray-400 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center mb-12 sm:mb-20">
          <p className="text-blue-500 text-sm sm:text-base font-medium mb-2">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            Getting quality healthcare has never been easier. Follow these simple steps to book your appointment.
          </p>
        </div>

        <div className="relative">

          <div className="hidden lg:block absolute top-0 left-0 right-0 bottom-0">
            <svg className="w-full h-full" viewBox="0 0 1200 400">
              <path
                d="M 100 200 Q 300 100, 450 200 T 800 200 T 1100 200"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
                strokeDasharray="10,10"
                opacity="0.3"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={`relative flex flex-col items-center text-center ${isEven ? 'lg:mt-0' : 'lg:mt-20'
                    }`}
                >

                  <div className="relative mb-6 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl">
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>

                    <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm sm:text-base font-bold">{step.number}</span>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xs">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-8 mb-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center justify-center gap-6">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1">
            Get Started Now
          </button>

          <div className="flex items-center gap-3 text-gray-600">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
              ))}
            </div>
            <span className="text-sm font-medium">Trusted by 10,000+ patients</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;