import React from 'react'
import { useSelector } from "react-redux";
import doctorMask from "../assets/doctor_mask.png";
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWroks';
import DoctorCTA from '../components/DoctorCTA';
import { MinimalistHero } from '../components/ui/minimalist-hero';
import TestimonialCarouselSection from '../components/TestimonialCarouselSection';
import { SiteFooter } from '../components/ui/site-footer';
import { NAV_LINKS } from '../lib/nav-links';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import SymptomChecker from "../components/ai/SymptomChecker";
import video1 from "../assets/video1.mp4";

const socialLinks = [
  { icon: Facebook, href: '#' },
  { icon: Instagram, href: '#' },
  { icon: Twitter, href: '#' },
  { icon: Linkedin, href: '#' },
];



const Home = () => {
  const { user } = useSelector((state) => state.profile || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-visible">
      
        <div className="absolute top-0 sm:top-0 md:top-0 lg:top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 border-2 sm:border-3 md:border-4 border-blue-400 rounded-full opacity-60"></div>
      
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
  mainText="AppointMed"
  overlayText="Better Patient Care"
  imageSrc="/doctor.png"
  imageAlt="Dr. Kavya Sharma"
  readMoreLink="/about"
  ctaText="Book Appointment"
  ctaLink="/appointment"
  locationText="India · Est. 2024"
  videoScenes={[
    { label: 'Patient Booking',     src: video1 },
    { label: 'Doctor Consultation', src: video1 },
    { label: 'Clinical Records',    src: video1 },
  ]}
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
