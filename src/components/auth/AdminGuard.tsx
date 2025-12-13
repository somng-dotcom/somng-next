'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Profile } from '@/types/database';

interface AdminGuardProps {
    children: ReactNode;
    profile: Profile | null;
    isLoading: boolean;
}

/**
 * AdminGuard - Client-side defense-in-depth component
 * 
 * This component provides a fallback security check for admin pages.
 * The primary security is handled by middleware, but this adds an
 * extra layer of protection in case of cached pages or edge cases.
 * 
 * Usage:
 * ```tsx
 * <AdminGuard profile={profile} isLoading={isLoading}>
 *   {pageContent}
 * </AdminGuard>
 * ```
 */
export function AdminGuard({ children, profile, isLoading }: AdminGuardProps) {
    // Don't block while still loading - show nothing until we know
    if (isLoading) {
        return null;
    }

    // If profile exists and user is NOT admin, show access denied
    if (profile && profile.role !== 'admin') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">block</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You don&apos;t have permission to access the admin panel.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Render children if user is admin or profile not loaded yet
    return <>{children}</>;
}
