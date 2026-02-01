import React from 'react'
import doctor from "../assets/doctor.png"
import { Link } from "react-router-dom";
import Testimonials from "../components/RatingandReview"
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWroks';
import DoctorCTA from '../components/DoctorCTA';
import Footer from '../components/Footer';



const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden mt-11">
    
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 border-2 sm:border-3 md:border-4 border-blue-400 rounded-full opacity-60"></div>
      
      <div className="absolute top-4 sm:top-8 right-4 sm:right-8 grid grid-cols-3 gap-1 sm:gap-2">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
        ))}
      </div>

      <div className="absolute bottom-1/3 left-1/4 sm:left-1/3 opacity-30 hidden sm:block">
        <svg width="80" height="30" viewBox="0 0 120 40" fill="none" className="sm:w-[100px] sm:h-[35px] md:w-[120px] md:h-[40px]">
          <path d="M5 20 Q 15 10, 25 20 T 45 20 T 65 20 T 85 20 T 105 20" 
                stroke="#10b981" 
                strokeWidth="3" 
                fill="none"/>
          <path d="M5 30 Q 15 20, 25 30 T 45 30 T 65 30 T 85 30 T 105 30" 
                stroke="#10b981" 
                strokeWidth="3" 
                fill="none"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 min-h-screen flex items-center">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full">
          
          <div className="space-y-4 sm:space-y-6 md:space-y-8 text-center md:text-left">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4">
                Get Quick
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <span className="text-blue-500">Medical</span>{' '}
                <span className="text-gray-900">Services</span>
              </h1>
            </div>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam.
            </p>
            
            <Link to="/appointment">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 sm:px-10 py-3  mt-5 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ">
                Get Appointment
              </button>
            </Link>

            <div className="pt-4 sm:pt-8 flex justify-center md:justify-start">
              <svg width="100" height="40" viewBox="0 0 140 50" fill="none" className="sm:w-[120px] sm:h-[45px] md:w-[140px] md:h-[50px]">
                <path d="M5 25 Q 20 10, 35 25 T 65 25 T 95 25 T 125 25" 
                      stroke="#10b981" 
                      strokeWidth="3" 
                      fill="none"
                      strokeLinecap="round"/>
                <path d="M5 35 Q 20 20, 35 35 T 65 35 T 95 35 T 125 35" 
                      stroke="#10b981" 
                      strokeWidth="3" 
                      fill="none"
                      strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="relative flex justify-center items-center mt-8 md:mt-0">
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-40"></div>
            
            <div className="absolute w-80 h-80 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-gradient-to-br from-blue-100 to-blue-200 rounded-full opacity-30"></div>

            <div className="relative z-10 w-72 h-80 sm:w-80 sm:h-96 md:w-[450px] md:h-[500px] rounded-t-full flex items-end justify-center overflow-hidden shadow-2xl">
              <img
                src={doctor}
                alt="Medical Professional"
                className="w-full h-full object-cover object-top"
              />
              
              <div className="absolute top-1/3 right-8 sm:right-12 w-12 h-24 sm:w-16 sm:h-32 border-2 sm:border-4 border-white rounded-full opacity-60"></div>
              <div className="absolute top-1/3 right-5 sm:right-8 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full opacity-80"></div>
            </div>
          

            <div className="absolute top-8 sm:top-12 left-8 sm:left-12 w-12 h-12 sm:w-16 sm:h-16 border-2 sm:border-4 border-blue-400 rounded-full opacity-50">
              
            </div>
          </div>
        </div>
      </div>
        <Testimonials/>
        <WhyChooseUs/>
        <HowItWorks/>
       <DoctorCTA/>
       <Footer/>

    </div>
  )
}

export default Home