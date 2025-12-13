'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    const navItems = [
        { label: 'Personal Info', href: '/settings', icon: 'person' },
        { label: 'Password & Security', href: '/settings/security', icon: 'lock' },
        { label: 'Notifications', href: '/settings/notifications', icon: 'notifications' },
        { label: 'Privacy & Data', href: '/settings/privacy', icon: 'shield' },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* SideNavBar */}
                <aside className="lg:col-span-1">
                    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#101922] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3 items-center">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                                    style={{ backgroundImage: `url("${profile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMrT4hyv2VxHFVUlbPXuqxJAIbSa6NuvbBjsu_0DUU6kMDzSDlFvkGWlR6qo_EuK-49tVTpmQDBNUo_f_t6RVO0IqpXGqdvZOwWzQmLzN22QXY5SSHKsJVA_dop2oytxmAZr20BCoTmFOHuDsToKqTLm_aqPfhx2lwBCtW4Qv9i2hJqgSdSH38AYQXXbPVp8ilxSkOULwDQd2zCa1tJqkjDPcgXvcWT7Zup9-sKZdW1zUJ9Jyf74E1rvBWacpHZkISYZ1mVHJxg9Yq'}")` }}
                                ></div>
                                <div className="flex flex-col">
                                    <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                                        {profile?.full_name || 'Student'}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                        {profile?.email || ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 mt-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.href)
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <p className="text-sm font-medium leading-normal">{item.label}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 mt-8 border-t border-gray-200 dark:border-gray-800 pt-4">
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg w-full text-left"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                <p className="text-sm font-medium leading-normal">Logout</p>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                    {children}
                </div>
            </div>
        </main>
    );
}
