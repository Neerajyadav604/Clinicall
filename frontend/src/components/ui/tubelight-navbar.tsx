import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon, Menu, X } from "lucide-react"
import { cn } from "../../lib/utils"
import ProfileDropDown from "../ProfileDropDown"
import NotificationBell from "../NotificationBell"

export interface NavItem {
    name: string
    url: string
    icon: LucideIcon
}

interface NavBarProps {
    items: NavItem[]
    logoText?: string
    className?: string
}

export function NavBar({ items, logoText = "Clinicall", className }: NavBarProps) {
    const [activeTab, setActiveTab] = useState(items[0]?.name || "")
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    const token = localStorage.getItem("token")

    useEffect(() => {
        const currentItem = items.find(item => item.url === location.pathname)
        if (currentItem) setActiveTab(currentItem.name)
        // Close mobile menu on route change
        setMobileOpen(false)
    }, [location.pathname, items])

    // Close mobile menu on outside click / scroll
    useEffect(() => {
        const close = () => setMobileOpen(false)
        if (mobileOpen) {
            window.addEventListener("scroll", close, { passive: true })
        }
        return () => window.removeEventListener("scroll", close)
    }, [mobileOpen])

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-lg",
                    className,
                )}
            >
                <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center text-lg font-bold tracking-wide text-foreground"
                    >
                        {logoText}
                    </Link>

                    {/* ── Desktop nav pill ── */}
                    <div className="ml-auto hidden md:flex items-center">
                        <div className="flex items-center gap-1 rounded-full border border-border bg-background/5 px-1 py-1 shadow-lg">
                            {items.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.name
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.url}
                                        onClick={() => setActiveTab(item.name)}
                                        className={cn(
                                            "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors",
                                            "text-foreground/80 hover:text-primary",
                                            isActive && "bg-muted text-primary",
                                        )}
                                    >
                                        <span>{item.name}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="lamp"
                                                className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            >
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </Link>
                                )
                            })}

                            {/* Auth — desktop */}
                            <div className="flex items-center gap-2 pl-2 border-l border-border/50 ml-1">
                                {token ? (
                                    <>
                                        <NotificationBell />
                                        <div className="px-1">
                                            <ProfileDropDown />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="px-4 py-2 rounded-full font-semibold text-sm text-foreground/80 hover:bg-muted transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="px-4 py-2 rounded-full font-semibold text-sm bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Mobile right-side: bell + profile + hamburger ── */}
                    <div className="ml-auto flex items-center gap-2 md:hidden">
                        {token && (
                            <>
                                <NotificationBell />
                                <ProfileDropDown />
                            </>
                        )}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            aria-label="Toggle menu"
                            className="p-2 rounded-md text-foreground/80 hover:bg-muted transition-colors"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Mobile slide-down menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="fixed top-[57px] left-0 z-40 w-full bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-lg md:hidden"
                    >
                        <nav className="flex flex-col px-4 py-3 gap-1">
                            {items.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.name
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.url}
                                        onClick={() => { setActiveTab(item.name); setMobileOpen(false) }}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-foreground/80 hover:bg-muted",
                                        )}
                                    >
                                        <Icon size={18} strokeWidth={2} />
                                        {item.name}
                                    </Link>
                                )
                            })}

                            {/* Auth — mobile (only when not logged in) */}
                            {!token && (
                                <div className="flex gap-2 pt-2 border-t border-border/40 mt-1">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 text-center px-4 py-2.5 rounded-xl font-semibold text-sm text-foreground/80 hover:bg-muted transition-colors border border-border"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 text-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground shadow-md"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
