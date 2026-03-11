import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const BentoGrid = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "grid w-full auto-rows-[20rem] grid-cols-3 gap-4",
                className,
            )}
        >
            {children}
        </div>
    );
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: {
    name: string;
    className: string;
    background: ReactNode;
    Icon: any;
    description: string;
    href: string;
    cta: string;
}) => (
    <div
        key={name}
        className={cn(
            "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
            "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
            "transform-gpu",
            className,
        )}
    >
        {/* Background image with dark overlay */}
        <div className="absolute inset-0">
            {background}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>

        {/* Content */}
        <div className="pointer-events-none relative z-10 flex transform-gpu flex-col gap-2 p-6 mt-auto transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-10 w-10 origin-left transform-gpu text-white/90 transition-all duration-300 ease-in-out group-hover:scale-75 drop-shadow-md" />
            <h3 className="text-xl font-bold text-white drop-shadow-md">
                {name}
            </h3>
            <p className="max-w-lg text-white/75 text-sm leading-relaxed">{description}</p>
        </div>

        {/* CTA — appears on hover */}
        <div
            className={cn(
                "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
            )}
        >
            <Button variant="ghost" asChild size="sm" className="pointer-events-auto text-white hover:text-white hover:bg-white/20">
                <a href={href}>
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </a>
            </Button>
        </div>

        {/* Hover shimmer */}
        <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[.04]" />
    </div>
);

export { BentoCard, BentoGrid };
