import { useState, useRef, useId, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface SlideData {
    title: string;
    button: string;
    src: string;
}

interface SlideProps {
    slide: SlideData;
    index: number;
    current: number;
    handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
    const slideRef = useRef<HTMLLIElement>(null);
    const xRef = useRef(0);
    const yRef = useRef(0);
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const animate = () => {
            if (!slideRef.current) return;
            slideRef.current.style.setProperty("--x", `${xRef.current}px`);
            slideRef.current.style.setProperty("--y", `${yRef.current}px`);
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, []);

    const handleMouseMove = (event: React.MouseEvent) => {
        const el = slideRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
        yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
    };

    const handleMouseLeave = () => {
        xRef.current = 0;
        yRef.current = 0;
    };

    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.style.opacity = "1";
    };

    const { src, button, title } = slide;

    return (
        <div className="[perspective:1200px] [transform-style:preserve-3d]">
            <li
                ref={slideRef}
                className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[4vmin] z-10"
                onClick={() => handleSlideClick(index)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform:
                        current !== index
                            ? "scale(0.98) rotateX(8deg)"
                            : "scale(1) rotateX(0deg)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    transformOrigin: "bottom",
                }}
            >
                <div
                    className="absolute top-0 left-0 w-full h-full bg-[#1D1F2F] rounded-[1%] overflow-hidden transition-all duration-150 ease-out"
                    style={{
                        transform:
                            current === index
                                ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
                                : "none",
                    }}
                >
                    <img
                        className="absolute inset-0 w-[120%] h-[120%] object-cover transition-opacity duration-600 ease-in-out"
                        style={{ opacity: current === index ? 1 : 0.5 }}
                        alt={title}
                        src={src}
                        onLoad={imageLoaded}
                        loading="eager"
                        decoding="sync"
                    />
                    {current === index && (
                        <div className="absolute inset-0 bg-black/40 transition-all duration-1000" />
                    )}
                </div>

                <article
                    className={`relative p-[4vmin] transition-opacity duration-1000 ease-in-out ${current === index ? "opacity-100 visible" : "opacity-0 invisible"
                        }`}
                >
                    <h2 className="text-lg md:text-2xl lg:text-4xl font-semibold">
                        {title}
                    </h2>
                    <div className="flex justify-center">
                        <button className="mt-6 px-6 py-2 w-fit mx-auto text-sm text-black bg-white h-12 border border-transparent flex justify-center items-center rounded-2xl hover:shadow-lg transition duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] gap-2">
                            {button} <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </article>
            </li>
        </div>
    );
};

interface CarouselProps {
    slides: SlideData[];
    autoPlayInterval?: number;
}

export function Carousel({ slides, autoPlayInterval = 3500 }: CarouselProps) {
    const [current, setCurrent] = useState(0);

    // Auto-play: advance slide every `autoPlayInterval` ms
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1 === slides.length ? 0 : prev + 1));
        }, autoPlayInterval);
        return () => clearInterval(timer);
    }, [slides.length, autoPlayInterval]);

    const handlePreviousClick = () => {
        setCurrent((prev) => (prev - 1 < 0 ? slides.length - 1 : prev - 1));
    };

    const handleNextClick = () => {
        setCurrent((prev) => (prev + 1 === slides.length ? 0 : prev + 1));
    };

    const handleSlideClick = (index: number) => {
        if (current !== index) setCurrent(index);
    };

    const id = useId();

    return (
        <div
            className="relative w-[70vmin] h-[70vmin] mx-auto"
            aria-labelledby={`carousel-heading-${id}`}
        >
            <ul
                className="absolute flex mx-[-4vmin] transition-transform duration-1000 ease-in-out"
                style={{
                    transform: `translateX(-${current * (100 / slides.length)}%)`,
                }}
            >
                {slides.map((slide, index) => (
                    <Slide
                        key={index}
                        slide={slide}
                        index={index}
                        current={current}
                        handleSlideClick={handleSlideClick}
                    />
                ))}
            </ul>

            {/* Dot indicators */}
            <div className="absolute flex justify-center gap-2 w-full top-[calc(100%+1.5rem)]">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-blue-500 scale-125" : "bg-neutral-300 hover:bg-neutral-400"
                            }`}
                    />
                ))}
            </div>

            {/* Prev / Next controls */}
            <div className="absolute flex justify-center gap-2 w-full top-[calc(100%+3.5rem)]">
                <button
                    className="w-10 h-10 flex items-center justify-center bg-neutral-200 rounded-full hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200 rotate-180"
                    title="Previous slide"
                    onClick={handlePreviousClick}
                >
                    <ArrowRight className="h-4 w-4 text-neutral-600" />
                </button>
                <button
                    className="w-10 h-10 flex items-center justify-center bg-neutral-200 rounded-full hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200"
                    title="Next slide"
                    onClick={handleNextClick}
                >
                    <ArrowRight className="h-4 w-4 text-neutral-600" />
                </button>
            </div>
        </div>
    );
}
