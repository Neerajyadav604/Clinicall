import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export interface SiteFooterProps {
  logoText: string;
  tagline?: string;
  navLinks: { label: string; href: string }[];
  socialLinks: { icon: LucideIcon; href: string }[];
  copyrightText?: string;
}

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    to={href}
    className="text-sm font-medium text-foreground/70 transition-all duration-300 hover:text-foreground hover:tracking-widest"
  >
    {children}
  </Link>
);

const SocialIcon = ({ href, icon: Icon }: { href: string; icon: LucideIcon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:border-yellow-400/60 hover:text-foreground"
  >
    <Icon className="h-4 w-4" />
  </a>
);

export const SiteFooter = ({
  logoText,
  tagline,
  navLinks,
  socialLinks,
  copyrightText,
}: SiteFooterProps) => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full bg-background border-t border-border px-8 py-10 md:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Left: Brand */}
          <div className="space-y-3">
            <div className="text-2xl font-semibold tracking-wide text-foreground">
              {logoText}
            </div>
            {tagline ? (
              <p className="text-sm text-foreground/60 max-w-xs">{tagline}</p>
            ) : null}
          </div>

          {/* Center: Nav Links */}
          <nav className="flex flex-col gap-3 md:items-center">
            {navLinks.map((link) => (
              <NavLink key={link.label} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Social */}
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="text-sm font-medium text-foreground/70">Connect</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link, index) => (
                <SocialIcon key={index} href={link.href} icon={link.icon} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
          <div>{copyrightText}</div>
          <div>
            Made with <span className="text-yellow-500">?</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
