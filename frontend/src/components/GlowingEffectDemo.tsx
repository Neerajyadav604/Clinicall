"use client";

import { Stethoscope, Activity, Heart, ShieldCheck, Clock } from "lucide-react";
import { GlowingEffect } from "./ui/glowing-effect";
import { cn } from "../lib/utils";
import React from "react";

export function GlowingEffectDemo() {
    return (
        <div className="py-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                    Why Choose Clinicall
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Advanced healthcare delivery tailored entirely around your needs.
                </p>
            </div>

            <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
                <GridItem
                    area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                    icon={<Stethoscope className="h-4 w-4" />}
                    title="Expert Medical Care"
                    description="Dedicated professionals committed to providing the highest quality healthcare."
                />
                <GridItem
                    area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                    icon={<Activity className="h-4 w-4" />}
                    title="Advanced Technology"
                    description="State-of-the-art medical equipment and telemedicine capabilities."
                />
                <GridItem
                    area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
                    icon={<Heart className="h-4 w-4" />}
                    title="Patient-Centered Appraoch"
                    description="Your well-being is our priority with personalized, deeply caring treatment plans."
                />
                <GridItem
                    area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Secure Records"
                    description="Your medical data is encrypted seamlessly and kept completely private."
                />
                <GridItem
                    area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
                    icon={<Clock className="h-4 w-4" />}
                    title="24/7 Availability"
                    description="Access seamless care and book appointments around the clock without waiting."
                />
            </ul>
        </div>
    );
}

interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
    return (
        <li className={cn("min-h-[14rem] list-none", area)}>
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 z-10">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                            {icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                                {title}
                            </h3>
                            <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                                {description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};
