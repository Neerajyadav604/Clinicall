"use client";

import { cn } from "../../lib/utils";
import React from "react";

export const BackgroundGlow = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={cn("w-full relative overflow-hidden", className)}>
            {/* Visible yellow-orange radial glow */}
            <div
                className="absolute pointer-events-none"
                style={{
                    inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 220, 60, 0.35) 0%, rgba(255, 180, 30, 0.15) 40%, transparent 75%)`,
                    zIndex: 0,
                }}
            />
            {/* Content rendered on top */}
            <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </div>
    );
};
