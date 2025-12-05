'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress, CourseProgress } from '@/components/ui/Progress';
import { Badge, LevelBadge, PremiumBadge, FreeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, StatsSkeleton } from '@/components/ui/Skeleton';

// Mock data - will be replaced with real data from Supabase
const mockEnrolledCourses = [
    {
        id: '1',
        title: 'JAMB Mathematics - Complete Course',
        slug: 'jamb-mathematics-complete',
        thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
        level: 'JAMB' as const,
        is_premium: true,
        progress: { completed: 12, total: 30 },
    },
    {
        id: '2',
        title: 'WAEC Further Mathematics',
        slug: 'waec-further-mathematics',
        thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        level: 'WAEC' as const,
        is_premium: false,
        progress: { completed: 5, total: 20 },
    },
    {
        id: '3',
        title: 'SS2 Algebra and Calculus',
        slug: 'ss2-algebra-calculus',
        thumbnail_url: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400',
        level: 'SS2' as const,
        is_premium: true,
        progress: { completed: 8, total: 15 },
    },
];

const mockStats = {
    enrolledCourses: 3,
    completedLessons: 25,
    quizzesTaken: 12,
    averageScore: 78,
};

export default function DashboardPage() {
    const { user, profile, isLoading, signOut } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Sidebar role="student" />
                <div className="lg:ml-64">
                    <Header user={null} />
                    <main className="p-4 lg:p-6 pb-20 lg:pb-6">
                        <div className="mb-6">
                            <div className="skeleton h-8 w-48 mb-2" />
                            <div className="skeleton h-4 w-64" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <StatsSkeleton key={i} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                    </main>
                </div>
                <MobileNav role="student" />
            </div>
        );
    }

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

    const sidebarRole = profile?.role === 'admin' ? 'admin' : 'student';

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar role={sidebarRole} />

            <div className="lg:ml-64">
                <Header
                    user={profile ? {
                        name: profile.full_name || '',
                        email: profile.email,
                        avatar: profile.avatar_url || undefined,
                        role: sidebarRole,
                    } : null}
                    onLogout={signOut}
                />

                <main className="p-4 lg:p-6 pb-20 lg:pb-6">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                            Welcome back, {userName}! 👋
                        </h1>
                        <p className="mt-2 text-[var(--muted-foreground)]">
                            Continue your mathematics journey. Here&apos;s your learning overview.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Enrolled</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.enrolledCourses}</p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success-100 dark:bg-success-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Lessons</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.completedLessons}</p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Quizzes</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.quizzesTaken}</p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-warning-100 dark:bg-warning-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Avg Score</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.averageScore}%</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Continue Learning Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Continue Learning</h2>
                            <Link href="/my-courses">
                                <Button variant="ghost" size="sm">
                                    View all
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockEnrolledCourses.map((course) => (
                                <Link key={course.id} href={`/courses/${course.slug}/learn`}>
                                    <Card hover padding="none" className="overflow-hidden">
                                        {/* Thumbnail */}
                                        <div className="relative h-40">
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <LevelBadge level={course.level} />
                                                {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 mb-3">
                                                {course.title}
                                            </h3>

                                            <CourseProgress
                                                completedLessons={course.progress.completed}
                                                totalLessons={course.progress.total}
                                            />

                                            <Button variant="primary" size="sm" className="w-full mt-4">
                                                Continue
                                            </Button>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/courses">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Browse Courses</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Find new courses</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/courses?type=free">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-success-100 dark:bg-success-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Free Courses</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Start learning free</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/profile">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">My Profile</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Update settings</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/support">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-warning-100 dark:bg-warning-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Get Help</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Contact support</p>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}
