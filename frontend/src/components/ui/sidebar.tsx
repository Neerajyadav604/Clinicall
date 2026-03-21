import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// Internal type — renamed to avoid conflict with the exported SidebarLink alias
interface SidebarLinkData {
    label: string;
    href: string;
    icon: React.JSX.Element | React.ReactNode;
    onClick?: () => void;
}

interface SidebarContextProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
}) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
}) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
    const { onAnimationStart, ...rest } = props;
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...(rest as React.ComponentProps<typeof motion.div>)} />
        </>
    );
};

export const DesktopSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof motion.div>) => {
    const { animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "fixed left-0 top-0 z-40 hidden h-screen w-16 border-r border-slate-200 bg-white/95 flex-col px-3 py-5 backdrop-blur md:flex lg:w-[240px]",
                className
            )}
            animate={animate ? { opacity: 1 } : undefined}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const MobileSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof motion.div>) => {
    const { open, setOpen } = useSidebar();
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-slate-950/55 md:hidden"
                        onClick={() => setOpen(false)}
                        aria-label="Close sidebar overlay"
                    />
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 flex w-[min(85vw,320px)] flex-col bg-white px-4 py-5 shadow-2xl md:hidden",
                            className
                        )}
                        {...props}
                    >
                        <div className="mb-4 flex justify-end">
                            <button
                                type="button"
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                                onClick={() => setOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {children as React.ReactNode}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export const SidebarLinkItem = ({
    link,
    className,
}: {
    link: SidebarLinkData;
    className?: string;
}) => {
    const { setOpen } = useSidebar();

    const inner = (
        <>
            <span className="flex-shrink-0">{link.icon}</span>
            <motion.span className="whitespace-pre text-sm text-slate-700 transition duration-150 md:hidden lg:inline-block">
                {link.label}
            </motion.span>
        </>
    );

    if (link.onClick) {
        return (
            <button
                onClick={() => {
                    link.onClick?.();
                    setOpen(false);
                }}
                className={cn(
                    "interactive-hover flex min-h-[44px] w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    className
                )}
            >
                {inner}
            </button>
        );
    }

    return (
        <Link
            to={link.href}
            onClick={() => setOpen(false)}
            className={cn(
                "interactive-hover flex min-h-[44px] items-center justify-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                className
            )}
        >
            {inner}
        </Link>
    );
};

// Backward-compatible alias — DoctorLayout and AdminLayout import SidebarLink
export const SidebarLink = SidebarLinkItem;
