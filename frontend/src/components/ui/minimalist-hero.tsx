import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface MinimalistHeroProps {
    mainText: string;
    readMoreLink: string;
    imageSrc: string;
    imageAlt: string;
    overlayText: string;
    ctaText?: string;
    ctaLink?: string;
    locationText: string;
    className?: string;
}

export const MinimalistHero = ({
    mainText,
    readMoreLink,
    imageSrc,
    imageAlt,
    overlayText,
    ctaText = 'Book Appointment',
    ctaLink = '/appointment',
    locationText,
    className,
}: MinimalistHeroProps) => {
    return (
        <div
            className={cn(
                'relative flex min-h-screen w-full flex-col items-center justify-between bg-background p-8 font-sans md:p-12',
                className
            )}
        >
            {/* Watermark Text Overlay - Positioned relative to viewport */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                className="pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
                <h1 className="whitespace-nowrap text-center text-[clamp(30px,4vw,60px)] font-black leading-none tracking-tight text-black">
                    {overlayText}
                </h1>
            </motion.div>

            {/* Main Content Area */}
            <div className="relative grid w-full max-w-7xl flex-grow grid-cols-1 items-end md:grid-cols-3 min-h-0">
                {/* Left Text Content - Buttons Only */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1 }}
                    className="z-20 order-2 text-center md:order-1 md:text-left mb-8 md:mb-16"
                >
                    <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                        <Link
                            to={readMoreLink}
                            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 transition-all duration-300 hover:text-foreground hover:gap-3"
                        >
                            Read More
                            <span className="inline-block h-px w-6 bg-current transition-all duration-300 group-hover:w-8" />
                        </Link>

                        <Link
                            to={ctaLink}
                            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-blue-700"
                        >
                            {ctaText}
                        </Link>
                    </div>
                </motion.div>

                {/* Center Image with Circle */}
                <div className="relative order-1 flex w-full justify-center items-end h-full min-h-[500px] md:order-2">
                    <motion.div
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="absolute z-5 h-[360px] w-[360px] rounded-full bg-yellow-400/90 shadow-[0_0_80px_20px_rgba(234,179,8,0.18)] md:h-[460px] md:w-[460px] lg:h-[560px] lg:w-[560px] bottom-12 md:bottom-0"
                    />
                    <motion.img
                        src={imageSrc}
                        alt={imageAlt}
                        className="relative z-20 w-72 md:w-80 lg:w-96 h-auto self-end object-cover object-top"
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    />
                    {/* Main Text - Behind Image, Overlapping Lower Body */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1 }}
                        className="absolute z-10 bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[clamp(28px,3.5vw,52px)] font-black text-foreground"
                    >
                        {mainText}
                    </motion.p>
                </div>

                <div className="order-3 hidden md:block" />
            </div>

            {/* Footer Elements (No SocialLinks) */}
            <footer className="z-30 flex w-full max-w-7xl items-center justify-end">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 1.5 }}
                    className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50"
                >
                    {locationText}
                </motion.div>
            </footer>
        </div>
    );
};
