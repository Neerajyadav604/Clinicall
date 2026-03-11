import React from "react"
import { Testimonials } from "./ui/testimonials"

const testimonialsData = [
    {
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780&auto=format&fit=crop',
        text: 'I\'m blown away by the versatility of Clinicall. It make health care a breeze!',
        name: 'Alice Johnson',
        username: '@alicejohnson',
        social: 'https://twitter.com'
    },
    {
        image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1780&auto=format&fit=crop',
        text: 'Using this platform has significantly speed up our appointment process. The quality and ease of integration are remarkable!',
        name: 'David Smith',
        username: '@davidsmith',
        social: 'https://twitter.com'
    },
    {
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
        text: 'The best decision I made for my family\'s healthcare needs. Very prompt and professional doctors.',
        name: 'Emma Brown',
        username: '@emmabrown',
        social: 'https://twitter.com'
    },
    {
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
        text: 'I love how intuitive and well-documented this platform is. It has significantly improved our UI consistency across projects.',
        name: 'James Wilson',
        username: '@jameswilson',
        social: 'https://twitter.com'
    },
    {
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
        text: 'Implementing this platform was a game-changer for our team. Highly recommend it to everyone.',
        name: 'Sophia Lee',
        username: '@sophialee',
        social: 'https://twitter.com'
    },
    {
        image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1000&auto=format&fit=crop',
        text: 'Using this library has been a game-changer for our product development.',
        name: 'Michael Davis',
        username: '@michaeldavis',
        social: 'https://twitter.com'
    },
];

export function TestimonialsDemo() {
    return (
        <div className="container mx-auto py-10 mb-8 max-w-7xl">
            <Testimonials
                testimonials={testimonialsData}
                title="What Our Patients Say"
                description="Real feedback from our satisfied patients."
            />
        </div>
    )
}
