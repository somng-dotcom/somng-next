'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/ui/PageLoader';
import { getAdminStats, getRecentEnrollments } from '@/lib/api/courses';

interface RecentEnrollment {
    id: string;
    enrolled_at: string;
    profile?: { full_name: string | null; email: string; avatar_url: string | null } | null;
    course?: { title: string; slug: string } | null;
}

export default function AdminDashboardPage() {
    const { profile, signOut, user, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<RecentEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to be ready
        if (authLoading) return;

        // If not authenticated, the sidebar/layout will handle redirect, 
        // but we should stop here
        if (!user) return;

        async function loadAdminData() {
            try {
                const [statsData, enrollmentsData] = await Promise.all([
                    getAdminStats(),
                    getRecentEnrollments(5)
                ]);
                setStats(statsData);
                setEnrollments(enrollmentsData);
            } catch (error) {
                console.error('Failed to load admin data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAdminData();
    }, [user, authLoading]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (authLoading || isLoading) {
        return <PageLoader role="admin" />;
    }

    // Client-side admin check (defense in depth - middleware should catch this first)
    if (!authLoading && profile && profile.role !== 'admin') {
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

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar role="admin" />

            <div className="flex-1 lg:ml-64">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 sticky top-0 z-20">
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold">Admin Dashboard</h2>
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative w-full max-w-sm hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                placeholder="Search courses, students..."
                                type="search"
                            />
                        </div>
                        {/* Notifications */}
                        <button className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white dark:ring-gray-900"></span>
                        </button>
                        {/* Avatar */}
                        <div
                            className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center cursor-pointer"
                            onClick={signOut}
                            title="Click to logout"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <span className="text-primary-600 font-medium">{profile?.full_name?.charAt(0) || 'A'}</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Courses</p>
                                <p className="text-gray-900 dark:text-white text-3xl font-bold">
                                    {isLoading ? '...' : stats?.totalCourses || 0}
                                </p>
                                <p className="text-green-600 dark:text-green-400 text-sm font-medium">+5% this month</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Students</p>
                                <p className="text-gray-900 dark:text-white text-3xl font-bold">
                                    {isLoading ? '...' : stats?.totalStudents?.toLocaleString() || 0}
                                </p>
                                <p className="text-green-600 dark:text-green-400 text-sm font-medium">+12% this month</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Revenue (Month)</p>
                                <p className="text-gray-900 dark:text-white text-3xl font-bold">
                                    {isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                                </p>
                                <p className="text-green-600 dark:text-green-400 text-sm font-medium">+8% this month</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">New Enrollments (Week)</p>
                                <p className="text-gray-900 dark:text-white text-3xl font-bold">
                                    {isLoading ? '...' : stats?.newEnrollments || 0}
                                </p>
                                <p className="text-green-600 dark:text-green-400 text-sm font-medium">+20% this week</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {/* Chart */}
                            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Enrollment Trends</h3>
                                    <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:ring-primary-500">
                                        <option>Last 30 Days</option>
                                        <option>Last 6 Months</option>
                                        <option>Last Year</option>
                                    </select>
                                </div>
                                <div className="flex min-h-[300px] flex-1 flex-col justify-end pt-4">
                                    <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 540 300" width="100%" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 245.5C30 245.5 30 185.5 60 185.5C90 185.5 90 145.5 120 145.5C150 145.5 150 205.5 180 205.5C210 205.5 210 105.5 240 105.5C270 105.5 270 55.5 300 55.5C330 55.5 330 125.5 360 125.5C390 125.5 390 165.5 420 165.5C450 165.5 450 225.5 480 225.5C510 225.5 510 25.5 540 25.5V299.5H0V245.5Z" fill="url(#chart-gradient)" />
                                        <path d="M0 245.5C30 245.5 30 185.5 60 185.5C90 185.5 90 145.5 120 145.5C150 145.5 150 205.5 180 205.5C210 205.5 210 105.5 240 105.5C270 105.5 270 55.5 300 55.5C330 55.5 330 125.5 360 125.5C390 125.5 390 165.5 420 165.5C450 165.5 450 225.5 480 225.5C510 225.5 510 25.5 540 25.5" stroke="#137fec" strokeLinecap="round" strokeWidth="3" />
                                        <defs>
                                            <linearGradient gradientUnits="userSpaceOnUse" id="chart-gradient" x1="270" x2="270" y1="25.5" y2="299.5">
                                                <stop stopColor="#137fec" stopOpacity="0.2" />
                                                <stop offset="1" stopColor="#137fec" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-2">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Week 1</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Week 2</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Week 3</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Week 4</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Enrollments */}
                            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Recent Enrollments</h3>
                                    <Link href="/admin/students" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                                        </div>
                                    ) : enrollments.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-4">No recent enrollments</p>
                                    ) : (
                                        enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                    {enrollment.profile?.avatar_url ? (
                                                        <img src={enrollment.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-primary-600 font-medium text-sm">
                                                            {enrollment.profile?.full_name?.charAt(0) || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                        {enrollment.profile?.full_name || 'Unknown Student'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {enrollment.course?.title || 'Unknown Course'}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {formatTimeAgo(enrollment.enrolled_at)}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                href="/admin/courses/new"
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary-600">add_circle</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Create Course</p>
                                    <p className="text-xs text-gray-500">Add a new course</p>
                                </div>
                            </Link>
                            <Link
                                href="/admin/students"
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-600">group_add</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Manage Students</p>
                                    <p className="text-xs text-gray-500">View all students</p>
                                </div>
                            </Link>
                            <Link
                                href="/admin/payments"
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-yellow-600">payments</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">View Payments</p>
                                    <p className="text-xs text-gray-500">Transaction history</p>
                                </div>
                            </Link>
                            <Link
                                href="/admin/analytics"
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600">analytics</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                                    <p className="text-xs text-gray-500">View insights</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>

            <MobileNav role="admin" />
        </div>
    );
}
