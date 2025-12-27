'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { PageLoader } from '@/components/ui/PageLoader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, isLoading } = useAuth();

    return (
        <AdminGuard profile={profile} isLoading={isLoading}>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar role="admin" />
                
                <div className="flex-1 lg:ml-64">
                    {children}
                </div>

                <MobileNav role="admin" />
            </div>
        </AdminGuard>
    );
}
