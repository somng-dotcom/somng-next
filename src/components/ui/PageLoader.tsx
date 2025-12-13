'use client';

import { Sidebar, MobileNav } from '@/components/layout/Sidebar';

interface PageLoaderProps {
    role?: 'admin' | 'student';
}

export function PageLoader({ role = 'admin' }: PageLoaderProps) {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display">
            <Sidebar role={role} />
            <main className="flex-1 h-full lg:ml-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    {/* Spinner */}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                    </div>
                    {/* Loading text */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
                </div>
            </main>
            <MobileNav role={role} />
        </div>
    );
}
