import React from "react";
import { ContainerScroll } from "./ui/container-scroll-animation";

export function ScrollHeroDemo() {
    return (
        <div className="flex flex-col overflow-hidden">
            <ContainerScroll
                titleComponent={
                    <div className="text-center px-4">
                        <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">
                            For Healthcare Professionals
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                            Are You a Doctor? <br />
                            <span className="text-4xl md:text-[5rem] font-extrabold leading-none bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                Join Clinicall
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto mt-4">
                            Expand your practice digitally. Manage appointments, consult patients online, and grow your patient base with ease.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            <a
                                href="/doctor/signup"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/40"
                            >
                                Register as Doctor
                            </a>
                            <a
                                href="/doctor/login"
                                className="bg-secondary hover:bg-secondary/80 text-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300"
                            >
                                Doctor Login
                            </a>
                        </div>
                    </div>
                }
            >
                <img
                    src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=2070&auto=format&fit=crop"
                    alt="Doctor using Clinicall platform"
                    className="mx-auto rounded-2xl object-cover h-full w-full object-top"
                    draggable={false}
                />
            </ContainerScroll>
        </div>
    );
}
