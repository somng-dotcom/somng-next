'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { getSiteSettings } from '@/lib/api/settings';
import { SiteSettings } from '@/types/settings';

interface SidebarProps {
    role?: 'student' | 'admin';
}

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

// Student navigation items
const studentNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Courses', href: '/courses', icon: 'book' },
    { label: 'My Learning', href: '/my-courses', icon: 'school' },
    { label: 'Profile', href: '/profile', icon: 'person' },
    { label: 'Logout', href: '/logout', icon: 'logout' },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { label: 'Courses', href: '/admin/courses', icon: 'book' },
    { label: 'Students', href: '/admin/students', icon: 'group' },
    { label: 'Payments', href: '/admin/payments', icon: 'credit_card' },
    { label: 'Analytics', href: '/admin/analytics', icon: 'bar_chart' },
    { label: 'Notifications', href: '/admin/notifications', icon: 'notifications' },
    { label: 'Settings', href: '/admin/settings', icon: 'settings' },
    { label: 'Logout', href: '/logout', icon: 'logout' },
];

export function Sidebar({ role = 'student' }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const navItems = role === 'admin' ? adminNavItems : studentNavItems;
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSiteSettings();
            if (settings?.site_logo_url) {
                setLogoUrl(settings.site_logo_url);
            }
        };

        fetchSettings();

        // Listen for settings updates
        const handleSettingsUpdate = () => {
            fetchSettings();
        };

        window.addEventListener('site_settings_updated', handleSettingsUpdate);

        return () => {
            window.removeEventListener('site_settings_updated', handleSettingsUpdate);
        };
    }, []);

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href.split('?')[0]);
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden lg:flex">
            {/* Branding / User Info */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                <div
                    className={`${logoUrl ? 'w-12 h-12 rounded-lg' : 'w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900'} flex items-center justify-center relative overflow-hidden transition-all duration-300`}
                >
                    {logoUrl ? (
                        <div
                            className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${logoUrl})` }}
                        />
                    ) : (
                        !profile?.avatar_url && (
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                                {profile?.full_name?.charAt(0) || 'A'}
                            </span>
                        )
                    )}
                    {profile?.avatar_url && !logoUrl && (
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${profile.avatar_url})` }}
                        />
                    )}
                </div>
                <div className="flex flex-col">
                    <h1 className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                        {role === 'admin' ? 'Admin' : profile?.full_name || 'Student'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                        School of Mathematics
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-4 flex-grow">
                {navItems.map((item) => {
                    if (item.href === '/logout') {
                        return (
                            <button
                                key={item.href}
                                onClick={() => signOut()}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                    text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                                `}
                            >
                                <span className="material-symbols-outlined">
                                    {item.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal">{item.label}</p>
                            </button>
                        );
                    }
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                ${isActive(item.href)
                                    ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
                            `}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontVariationSettings: isActive(item.href) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <p className="text-sm font-medium leading-normal">{item.label}</p>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-1">
                {role === 'admin' && (
                    <button
                        onClick={() => router.push('/admin/courses/new')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors mb-3"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Create Course</span>
                    </button>
                )}
                <Link
                    href={role === 'admin' ? '/admin/settings' : '/settings'}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined">settings</span>
                    <p className="text-sm font-medium leading-normal">Settings</p>
                </Link>

            </div>
        </aside>
    );
}

// Mobile Bottom Navigation
export function MobileNav({ role = 'student' }: SidebarProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSiteSettings();
            if (settings?.site_logo_url) {
                setLogoUrl(settings.site_logo_url);
            }
        };
        fetchSettings();

        const handleSettingsUpdate = () => fetchSettings();
        window.addEventListener('site_settings_updated', handleSettingsUpdate);
        return () => window.removeEventListener('site_settings_updated', handleSettingsUpdate);
    }, []);

    // Mobile nav: Key items + Notifications + Logout
    const mobileNavItems = role === 'admin'
        ? [
            { label: 'Home', href: '/admin', icon: 'dashboard' },
            { label: 'Courses', href: '/admin/courses', icon: 'book' },
            { label: 'Alerts', href: '/admin/notifications', icon: 'notifications' },
            { label: 'More', href: '/admin/settings', icon: 'menu' },
            { label: 'Logout', href: '/logout', icon: 'logout' },
        ]
        : [
            { label: 'Home', href: '/dashboard', icon: 'dashboard' },
            { label: 'Courses', href: '/courses', icon: 'book' },
            { label: 'Learning', href: '/my-courses', icon: 'school' },
            { label: 'Profile', href: '/profile', icon: 'person' },
            { label: 'Logout', href: '/logout', icon: 'logout' },
        ];

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href.split('?')[0]);
    };

    return (
        <>
            {/* Mobile Header with Logo */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 lg:hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`${logoUrl ? 'w-10 h-10 rounded-lg' : 'w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900'} flex items-center justify-center relative overflow-hidden`}>
                        {logoUrl ? (
                            <div
                                className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${logoUrl})` }}
                            />
                        ) : (
                            <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">SM</span>
                        )}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">School of Mathematics</span>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden overflow-x-hidden">
                <div className="flex items-center justify-around py-2 px-1 max-w-full">
                    {mobileNavItems.map((item) => {
                        if (item.href === '/logout') {
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => signOut()}
                                    className="flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors text-gray-500 dark:text-gray-400 min-w-0"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {item.icon}
                                    </span>
                                    <span className="text-[10px] truncate max-w-[50px]">{item.label}</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors min-w-0
                                    ${isActive(item.href)
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }
                                `}
                            >
                                <span
                                    className="material-symbols-outlined text-lg"
                                    style={{ fontVariationSettings: isActive(item.href) ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.icon}
                                </span>
                                <span className="text-[10px] truncate max-w-[50px]">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
