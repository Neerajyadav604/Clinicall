import { ShieldPlus, Github, Twitter, Facebook, Instagram } from "lucide-react"
import { Footer } from "./ui/footer"
import React from 'react';

export function FooterDemo() {
    return (
        <div className="w-full">
            <Footer
                logo={<ShieldPlus className="h-10 w-10 text-blue-500" />}
                brandName="Clinicall Care"
                socialLinks={[
                    {
                        icon: <Twitter className="h-5 w-5" />,
                        href: "https://twitter.com",
                        label: "Twitter",
                    },
                    {
                        icon: <Facebook className="h-5 w-5" />,
                        href: "https://facebook.com",
                        label: "Facebook",
                    },
                    {
                        icon: <Instagram className="h-5 w-5" />,
                        href: "https://instagram.com",
                        label: "Instagram",
                    },
                ]}
                mainLinks={[
                    { href: "/appointment", label: "Appointments" },
                    { href: "/aboutus", label: "About" },
                    { href: "/contact", label: "Contact" },
                    { href: "#", label: "Careers" },
                ]}
                legalLinks={[
                    { href: "#", label: "Privacy Policy" },
                    { href: "#", label: "Terms of Service" },
                ]}
                copyright={{
                    text: "© 2026 Clinicall Healthcare",
                    license: "All rights reserved. Designed for care.",
                }}
            />
        </div>
    )
}
