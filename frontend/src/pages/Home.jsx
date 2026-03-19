import React from 'react'
import { useSelector } from "react-redux";
import doctor from "../assets/doctor.png"
import doctorMask from "../assets/doctor_mask.png";
import { Link } from "react-router-dom";
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWroks';
import DoctorCTA from '../components/DoctorCTA';
import { MinimalistHero } from '../components/ui/minimalist-hero';
import TestimonialCarouselSection from '../components/TestimonialCarouselSection';
import { SiteFooter } from '../components/ui/site-footer';
import { NAV_LINKS } from '../lib/nav-links';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import SymptomChecker from "../components/ai/SymptomChecker";

const socialLinks = [
  { icon: Facebook, href: '#' },
  { icon: Instagram, href: '#' },
  { icon: Twitter, href: '#' },
  { icon: Linkedin, href: '#' },
];



const Home = () => {
  const { user } = useSelector((state) => state.profile || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-visible pt-16 sm:pt-20 md:pt-24 lg:pt-28">
      
        <div className="absolute top-16 sm:top-20 md:top-24 lg:top-28 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 border-2 sm:border-3 md:border-4 border-blue-400 rounded-full opacity-60"></div>
      
      <div className="absolute top-4 sm:top-8 right-4 sm:right-8 grid grid-cols-3 gap-1 sm:gap-2">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
        ))}
      </div>

      <div className="absolute bottom-1/3 left-1/4 sm:left-1/3 opacity-30 hidden sm:block">
        <svg width="80" height="30" viewBox="0 0 120 40" fill="none" className="w-[80px] h-[30px] sm:w-[100px] sm:h-[35px] md:w-[120px] md:h-[40px]">
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

      {/* hero section replaced by minimalist component */}
      <MinimalistHero
        mainText="Quick and easy medical appointments from the comfort of your home."
        readMoreLink="/aboutus"
        imageSrc={doctorMask}
        imageAlt="Medical Professional"
       
        ctaText="Book an Appointment"
        ctaLink="/appointment"
        locationText="Worldwide"
      />
      
      {/* AI Symptom Checker Widget - Only for logged-in users */}
      {user && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <SymptomChecker />
        </section>
      )}

      <WhyChooseUs/>
        <HowItWorks/>
       <DoctorCTA/>
       <TestimonialCarouselSection/>
       <SiteFooter
         logoText="Clinicall."
         tagline="Quick medical services tailored for you."
         navLinks={NAV_LINKS}
         socialLinks={socialLinks}
         copyrightText="© 2025 Clinicall. All rights reserved."
       />

    </div>
  )
}

export default Home
