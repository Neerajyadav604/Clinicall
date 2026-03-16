import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NavBar } from './ui/tubelight-navbar';
import { NAV_LINKS } from '../lib/nav-links';
import { Home, Calendar, ClipboardList, UserPlus, Info, Phone, Building2, Hospital, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    Home: Home,
    Appointment: Calendar,
    'My Requests': ClipboardList,
    Register: UserPlus,
    'Register Hospital': Hospital,
    Hospitals: Building2,
    About: Info,
    Contact: Phone,
};

export const GlobalNavbar = () => {
    // ✅ Read from Redux store — reactive, re-renders on login/logout
    const token = useSelector((state: any) => state.auth.token);
    const user = useSelector((state: any) => state.profile.user);
    const userRole = user?.role?.toLowerCase() ?? null;

    const filteredItems = useMemo(() => {
        return NAV_LINKS.filter((item) => {
            // If link is protected and user is not logged in, hide it
            if (item.protected && !token) return false;

            // If link has a specific role requirement, check user's role
            if (item.role && item.role.toLowerCase() !== userRole) return false;

            return true;
        }).map((item) => ({
            name: item.label,
            url: item.href,
            icon: iconMap[item.label] || Info,
        }));
    }, [token, userRole]);

    return <NavBar items={filteredItems} logoText="Clinicall" />;
};
