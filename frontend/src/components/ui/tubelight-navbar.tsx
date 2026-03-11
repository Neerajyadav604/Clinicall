import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import ProfileDropDown from "../ProfileDropDown"

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
    const location = useLocation()

    // Auth state
    const token = localStorage.getItem("token")

    useEffect(() => {
        // Sync active tab with route
        const currentItem = items.find(item => item.url === location.pathname)
        if (currentItem) {
            setActiveTab(currentItem.name)
        }
    }, [location.pathname, items])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg",
                className,
            )}
        >
            <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
                <Link
                    to="/"
                    className="flex items-center text-lg font-bold tracking-wide text-foreground"
                >
                    {logoText}
                </Link>

                <div className="ml-auto flex items-center">
                    <div className="flex items-center gap-3 rounded-full border border-border bg-background/5 px-1 py-1 shadow-lg">
                        {items.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.name

                            return (
                                <Link
                                    key={item.name}
                                    to={item.url}
                                    onClick={() => setActiveTab(item.name)}
                                    className={cn(
                                        "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                        "text-foreground/80 hover:text-primary",
                                        isActive && "bg-muted text-primary",
                                    )}
                                >
                                    <span className="hidden md:inline">{item.name}</span>
                                    <span className="md:hidden">
                                        <Icon size={18} strokeWidth={2.5} />
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="lamp"
                                            className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                            initial={false}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                                mass: 1,
                                            }}
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

                        {/* Auth Actions inside the tubelight container */}
                        <div className="flex items-center gap-2 pl-2 border-l border-border/50 ml-1">
                            {token ? (
                                <div className="px-2">
                                    <ProfileDropDown />
                                </div>
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
            </div>
        </header>
    )
}
