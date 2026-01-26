import React from 'react';
import { Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import {Link} from "react-router-dom"

const DoctorCTA = () => {
  const benefits = [
    {
      icon: Calendar,
      title: "Manage Appointments",
      description: "Streamline your schedule with our smart booking system"
    },
    {
      icon: Users,
      title: "Reach More Patients",
      description: "Connect with thousands of patients looking for care"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Practice",
      description: "Expand your reach and build your medical practice"
    }
  ];

  return (
    <section className="bg-gray-900 py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400 rounded-full blur-3xl opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          <div className="text-white space-y-6 sm:space-y-8">
            <div>
              <p className="text-blue-400 text-sm sm:text-base font-medium mb-3">
                Join Our Network
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
                Are you a <span className="text-blue-400">doctor?</span>
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Join our growing network of healthcare professionals and take your practice to the next level. Manage appointments effortlessly and connect with more patients.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to = "/register">
               <button className="group bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2">
                Register as Doctor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button></Link>
             
              <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full font-semibold transition-all duration-300">
                Learn More
              </button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-sm">
              <div>
                <p className="text-3xl font-bold text-blue-400">500+</p>
                <p className="text-gray-400">Doctors Registered</p>
              </div>
              <div className="w-px h-12 bg-gray-700"></div>
              <div>
                <p className="text-3xl font-bold text-blue-400">10k+</p>
                <p className="text-gray-400">Appointments Monthly</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 transition-all duration-300 border border-gray-700 hover:border-blue-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-bold mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default DoctorCTA;