'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
    user?: {
        name: string;
        email: string;
        avatar?: string;
        role: 'student' | 'admin';
    } | null;
    onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 w-full bg-[var(--card-bg)]/80 backdrop-blur-lg border-b border-[var(--border)]">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                {/* Mobile menu button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg lg:hidden hover:bg-[var(--muted)] transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Logo for mobile */}
                <Link href="/" className="flex items-center gap-2 lg:hidden">
                    <div className="w-8 h-8  rounded-lg flex items-center justify-center text-white font-bold">
                        <img src="public/somng logo.jpeg" alt="" />
                    </div>
                    <span className="font-display font-bold">SOMNG</span>
                </Link>

                {/* Search */}
                <div className="hidden md:flex flex-1 max-w-md ml-4">
                    <div className="relative w-full">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search courses..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--muted)] border-0 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
                        <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
                    </button>

                    {/* Profile dropdown */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                            >
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <svg className="w-4 h-4 text-[var(--muted-foreground)] hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown menu */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg z-50 animate-slide-down">
                                        <div className="p-4 border-b border-[var(--border)]">
                                            <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                                            <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>Profile</span>
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Admin Panel</span>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false);
                                                    onLogout?.();
                                                }}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-950 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="lg:hidden border-t border-[var(--border)] bg-[var(--card-bg)]">
                    <div className="p-4">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Search courses..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--muted)] border-0 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
