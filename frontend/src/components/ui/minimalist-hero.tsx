import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
// Note: we might need to adjust relative paths for cn if it's in lib/utils inside src.
// Since typical shadcn src is `src/lib/utils.ts`. 
// I'll assume cn is from "../../lib/utils" based on tubelight-navbar.

export interface MinimalistHeroProps {
    mainText: string;
    readMoreLink: string;
    imageSrc: string;
    imageAlt: string;
    overlayText: {
        part1: string;
        part2: string;
    };
    locationText: string;
    className?: string;
}

export const MinimalistHero = ({
    mainText,
    readMoreLink,
    imageSrc,
    imageAlt,
    overlayText,
    locationText,
    className,
}: MinimalistHeroProps) => {
    return (
        <div
            className={cn(
                'relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-background p-8 font-sans md:p-12',
                className
            )}
        >
            {/* Main Content Area */}
            <div className="relative grid w-full max-w-7xl flex-grow grid-cols-1 items-end md:grid-cols-3 min-h-0">
                {/* Left Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1 }}
                    className="z-20 order-2 text-center md:order-1 md:text-left mb-8 md:mb-16"
                >
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/70 md:mx-0">{mainText}</p>

                    <a
                        href={readMoreLink}
                        className="group mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 transition-all duration-300 hover:text-foreground hover:gap-3"
                    >
                        Read More
                        <span className="inline-block h-px w-6 bg-current transition-all duration-300 group-hover:w-8" />
                    </a>
                </motion.div>

                {/* Center Image with Circle */}
                <div className="relative order-1 flex justify-center items-end h-full min-h-[500px] md:order-2">
                    <motion.div
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="absolute z-0 h-[360px] w-[360px] rounded-full bg-yellow-400/90 shadow-[0_0_80px_20px_rgba(234,179,8,0.18)] md:h-[460px] md:w-[460px] lg:h-[560px] lg:w-[560px] bottom-12 md:bottom-0"
                    />
                    <motion.img
                        src={imageSrc}
                        alt={imageAlt}
                        className="relative z-10 w-72 md:w-80 lg:w-96 h-auto self-end object-cover object-top"
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    />
                </div>

                {/* Right Text */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
                    className="z-20 order-3 flex items-center justify-center text-center md:justify-start xl:-ml-12 mb-8 md:mb-16"
                >
                    <h1 className="select-none text-7xl font-extrabold leading-none tracking-tight text-foreground md:text-8xl lg:text-9xl">
                        {overlayText.part1}
                        <br />
                        {overlayText.part2}
                    </h1>
                </motion.div>
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
