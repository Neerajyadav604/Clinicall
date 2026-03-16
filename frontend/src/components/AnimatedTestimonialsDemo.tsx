import React from "react";
import { AnimatedTestimonials } from "./ui/animated-testimonials";

interface Testimonial {
    quote: string;
    name: string;
    designation: string;
    src: string;
}

export function AnimatedTestimonialsDemo() {
    // Testimonials removed - in production, fetch from backend API
    // const testimonials = await fetchTestimonials(); // TODO: implement backend endpoint
    
    // For now, return empty state
    const testimonials: Testimonial[] = [];
    
    if (testimonials.length === 0) {
        return (
            <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16 md:py-20 lg:py-24">
                <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
                    <p className="text-blue-500 text-xs sm:text-sm mb-2 font-medium">Healthcare Provider Testimonials</p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-gray-900">What Healthcare Providers Say</h2>
                    <p className="text-gray-600 text-lg">Testimonials from healthcare providers will appear here.</p>
                    <p className="text-gray-500 text-sm mt-4">Backend endpoint needed: GET /api/v1/testimonials</p>
                </div>
            </section>
        );
    }
    
    return <AnimatedTestimonials testimonials={testimonials} autoplay={true} />;
}
