import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, AlertCircle, Video } from 'lucide-react';
import doctorBg from '../assets/doctor-bg.jpg';
import Footer from '../components/Footer';

const AboutUs = () => {
  const services = [
    {
      icon: Stethoscope,
      title: "Primary Care",
      description: "Comprehensive health services for your everyday medical needs"
    },
    {
      icon: AlertCircle,
      title: "Emergency Cases",
      description: "24/7 emergency medical care when you need it most"
    },
    {
      icon: Video,
      title: "Online Appointment",
      description: "Book virtual consultations from the comfort of your home"
    }
  ];

  return (
    <section className="min-h-screen bg-white mt-10">
      
      <div 
        className="relative h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${doctorBg})`,
        }}
      >
        <div className="absolute inset-0 bg-white/40"></div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Making Health Care Better Together
            </h1>
            
            <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed max-w-xl">
              Also you dry creeping beast multiply fourth abundantly our itself signs bring our. Won form living. Whose dry you seasons divide given gathering great in whose you'll greater let living form beast sinhere better together these place absolute right.
            </p>

          
          </div>
        </div>
      </div>

      <div className="bg-blue-600 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
};

export default AboutUs;