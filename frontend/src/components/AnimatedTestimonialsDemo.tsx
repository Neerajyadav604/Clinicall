import React from "react";
import { AnimatedTestimonials } from "./ui/animated-testimonials";

export function AnimatedTestimonialsDemo() {
    const testimonials = [
        {
            quote: "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for. The clinic management is flawless now.",
            name: "Dr. Sarah Chen",
            designation: "Chief Medical Officer at CarePlus",
            src: "https://images.unsplash.com/photo-1594824436998-d8bb49db607a?q=80&w=2600&auto=format&fit=crop&ixlib=rb-4.0.3",
        },
        {
            quote: "Implementation was seamless and the results exceeded our expectations. The platform's flexibility for scheduling appointments is remarkable.",
            name: "Dr. Michael Rodriguez",
            designation: "Lead Surgeon at Innovate Health",
            src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
        },
        {
            quote: "This solution has significantly improved our team's productivity. The intuitive interface makes complex medical charting simple and fast.",
            name: "Emily Watson, RN",
            designation: "Operations Director at CityHospital",
            src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
        },
        {
            quote: "Outstanding support and robust features. It's rare to find a software product that actually understands clinical workflows intuitively.",
            name: "Dr. James Kim",
            designation: "Pediatrician",
            src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3",
        },
        {
            quote: "The scalability and performance have been game-changing. Highly recommend this system to any growing clinic or private practice.",
            name: "Dr. Lisa Thompson",
            designation: "VP of Medicine at FutureNet",
            src: "https://images.unsplash.com/photo-1551601651-2a8555f1a1eb?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3",
        },
    ];
    return <AnimatedTestimonials testimonials={testimonials} autoplay={true} />;
}
