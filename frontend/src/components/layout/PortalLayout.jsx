import React, { useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLinkItem } from "../ui/sidebar";
import { cn } from "../../lib/utils";

const PortalLayout = ({
  children,
  title,
  subtitle,
  sidebarLinks = [],
  brand = "Clinicall",
  brandBadge,
  userPanel,
  headerActions,
  backgroundClassName = "bg-slate-50",
  contentClassName,
  containerClassName,
  topContent,
  wrapperClassName,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const computedBrandBadge = useMemo(() => {
    if (brandBadge) return brandBadge;
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 text-sm font-bold text-white shadow-lg">
        {brand.slice(0, 2).toUpperCase()}
      </div>
    );
  }, [brand, brandBadge]);

  return (
    <div className={cn("min-h-screen flex", backgroundClassName)}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="app-sidebar-shell">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200/80 px-2 py-2">
              {computedBrandBadge}
              <div className="min-w-0 md:hidden lg:block">
                <p className="truncate text-sm font-semibold text-slate-900">{brand}</p>
                {subtitle ? (
                  <p className="truncate text-xs text-slate-500">{subtitle}</p>
                ) : null}
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-1.5">
              {sidebarLinks.map((link) => (
                <SidebarLinkItem key={`${link.href}-${link.label}`} link={link} />
              ))}
            </nav>
          </div>

          {userPanel ? (
            <div className="mt-6 border-t border-slate-200/80 px-2 py-3">
              <div className="flex min-h-[44px] items-center gap-3 rounded-2xl bg-slate-100/80 px-3 py-2">
                {userPanel.image ? (
                  <img
                    src={userPanel.image}
                    alt={userPanel.name || "Profile"}
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {(userPanel.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 md:hidden lg:block">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {userPanel.name}
                  </p>
                  {userPanel.subtitle ? (
                    <p className="truncate text-xs text-slate-500">{userPanel.subtitle}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </SidebarBody>
      </Sidebar>

      <div className={cn("app-main-wrapper", wrapperClassName)}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-6 py-4 md:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[clamp(1.25rem,2.5vw,2rem)] font-semibold leading-tight text-slate-900">
                  {title}
                </p>
                {subtitle ? (
                  <p className="mt-1 truncate text-sm text-slate-500 sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {headerActions ? (
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                {headerActions}
              </div>
            ) : null}
          </div>
          {topContent ? <div className="px-6 py-4 md:px-8 lg:px-10">{topContent}</div> : null}
        </header>

        <main className={cn("app-shell-main", contentClassName)}>
          <div className={cn("app-shell-container", containerClassName)}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;