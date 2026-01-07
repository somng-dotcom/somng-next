'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { getAdminStats } from '@/lib/api/courses';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

interface TopCourse {
    id: string;
    title: string;
    enrolled_count: number;
    completion_rate: number;
    revenue: number;
}

export default function AnalyticsPage() {
    const { profile, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [timeRange, setTimeRange] = useState('30days');
    const [stats, setStats] = useState<any>(null);
    const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!profile) {
            router.push('/login');
            return;
        }

        async function loadAnalytics() {
            try {
                const supabase = createClient();
                const adminStats = await getAdminStats();
                setStats(adminStats);

                // Load top courses by enrollment
                const { data: courses, error } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        title,
                        price,
                        enrollments:enrollments(count)
                    `)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && courses) {
                    const formattedCourses = courses.map((course: any) => ({
                        id: course.id,
                        title: course.title,
                        enrolled_count: course.enrollments?.[0]?.count || 0,
                        completion_rate: 0,
                        revenue: (course.enrollments?.[0]?.count || 0) * (course.price || 0)
                    }));
                    // Sort by enrolled count
                    formattedCourses.sort((a, b) => b.enrolled_count - a.enrolled_count);
                    setTopCourses(formattedCourses.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAnalytics();
    }, [timeRange, isAuthLoading, profile, router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex-1 p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <>
            <main className="p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6 mb-8">
                        <div className="flex min-w-72 flex-col gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Analytics Dashboard</h1>
                            <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Overview of your platform's performance and student engagement.</p>
                        </div>
                        {/* Time Range Chips */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: '7days', label: 'Last 7 Days' },
                                { value: '30days', label: 'Last 30 Days' },
                                { value: 'quarter', label: 'This Quarter' },
                            ].map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setTimeRange(range.value)}
                                    className={`flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${timeRange === range.value
                                        ? 'bg-primary text-white'
                                        : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-background-light dark:hover:bg-background-dark'
                                        }`}
                                >
                                    <span>{range.label}</span>
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Total Revenue</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-3xl font-bold">
                                {isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                            </p>
                            <p className="text-success text-sm font-medium">+2.5%</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Successful Transactions</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-3xl font-bold">
                                {isLoading ? '...' : (stats?.successfulTransactions || 0).toLocaleString()}
                            </p>
                            <p className="text-success text-sm font-medium">+1.2%</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Pending Payments</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-3xl font-bold">
                                {isLoading ? '...' : (stats?.pendingPayments || 0).toLocaleString()}
                            </p>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Needs attention</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Total Courses</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-3xl font-bold">
                                {isLoading ? '...' : stats?.totalCourses || 0}
                            </p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Enrollments Chart */}
                        <div className="flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark p-6 bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-primary-light dark:text-text-primary-dark text-lg font-medium">New Enrollments</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-4xl font-bold">
                                {isLoading ? '...' : stats?.newEnrollments || 0}
                            </p>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">This week</p>
                            <div className="flex min-h-[220px] flex-1 flex-col justify-end pt-4">
                                <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear_enrollment)" />
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#137fec" strokeLinecap="round" strokeWidth="3" />
                                    <defs>
                                        <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_enrollment" x1="236" x2="236" y1="1" y2="149">
                                            <stop stopColor="#137fec" stopOpacity="0.2" />
                                            <stop offset="1" stopColor="#137fec" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        <div className="flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark p-6 bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-primary-light dark:text-text-primary-dark text-lg font-medium">Revenue</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-4xl font-bold">
                                {isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                            </p>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">All time</p>
                            <div className="flex min-h-[220px] flex-1 flex-col justify-end pt-4">
                                <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 81C18.1538 81 18.1538 129 36.3077 129C54.4615 129 54.4615 25 72.6154 25C90.7692 25 90.7692 109 108.923 109C127.077 109 127.077 21 145.231 21C163.385 21 163.385 41 181.538 41C199.692 41 199.692 93 217.846 93C236 93 236 33 254.154 33C272.308 33 272.308 101 290.462 101C308.615 101 308.615 61 326.769 61C344.923 61 344.923 45 363.077 45C381.231 45 381.231 121 399.385 121C417.538 121 417.538 149 435.692 149C453.846 149 453.846 1 472 1V149H0V81Z" fill="url(#paint0_linear_revenue)" />
                                    <path d="M0 81C18.1538 81 18.1538 129 36.3077 129C54.4615 129 54.4615 25 72.6154 25C90.7692 25 90.7692 109 108.923 109C127.077 109 127.077 21 145.231 21C163.385 21 163.385 41 181.538 41C199.692 41 199.692 93 217.846 93C236 93 236 33 254.154 33C272.308 33 272.308 101 290.462 101C308.615 101 308.615 61 326.769 61C344.923 61 344.923 45 363.077 45C381.231 45 381.231 121 399.385 121C417.538 121 417.538 149 435.692 149C453.846 149 453.846 1 472 1" stroke="#137fec" strokeLinecap="round" strokeWidth="3" />
                                    <defs>
                                        <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_revenue" x1="236" x2="236" y1="1" y2="149">
                                            <stop stopColor="#137fec" stopOpacity="0.2" />
                                            <stop offset="1" stopColor="#137fec" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Top Courses Table */}
                    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden">
                        <div className="p-6 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">Top Courses by Enrollment</h3>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Overview of course performance.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light/50 dark:bg-background-dark/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold" scope="col">Course</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Students</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {topCourses.map((course) => (
                                        <tr key={course.id} className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-text-primary-light dark:text-text-primary-dark">{course.title}</td>
                                            <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{course.enrolled_count.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark">{formatCurrency(course.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
