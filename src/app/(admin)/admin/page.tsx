'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatsSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { getAdminStats, getRecentEnrollments, getPopularCourses } from '@/lib/api/courses';

interface RecentEnrollment {
    id: string;
    enrolled_at: string;
    profile: { full_name: string | null; email: string; avatar_url: string | null } | null;
    course: { title: string; slug: string } | null;
}

interface PopularCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    enrolled_count: number;
}

export default function AdminDashboardPage() {
    const { profile, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        students: 0,
        courses: 0,
        enrollments: 0,
        revenue: 0,
    });
    const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
    const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);

    useEffect(() => {
        async function loadAdminData() {
            try {
                const [statsData, enrollmentsData, coursesData] = await Promise.all([
                    getAdminStats(),
                    getRecentEnrollments(5),
                    getPopularCourses(5),
                ]);

                setStats(statsData);
                setRecentEnrollments(enrollmentsData as RecentEnrollment[]);
                setPopularCourses(coursesData as PopularCourse[]);
            } catch (error) {
                console.error('Error loading admin data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadAdminData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar role="admin" />

            <div className="lg:ml-64">
                <Header
                    user={profile ? {
                        name: profile.full_name || '',
                        email: profile.email,
                        avatar: profile.avatar_url || undefined,
                        role: 'admin',
                    } : null}
                    onLogout={signOut}
                />

                <main className="p-4 lg:p-6 pb-20 lg:pb-6">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                            Admin Dashboard
                        </h1>
                        <p className="mt-2 text-[var(--muted-foreground)]">
                            Overview of your learning platform
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <StatsSkeleton key={i} />)
                        ) : (
                            <>
                                <Card padding="md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                                            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted-foreground)]">Students</p>
                                            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.students}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card padding="md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-success-100 dark:bg-success-900/50 rounded-xl">
                                            <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted-foreground)]">Courses</p>
                                            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.courses}</p>
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
                                            <p className="text-sm text-[var(--muted-foreground)]">Enrollments</p>
                                            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.enrollments}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card padding="md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-warning-100 dark:bg-warning-900/50 rounded-xl">
                                            <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted-foreground)]">Revenue</p>
                                            <p className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(stats.revenue)}</p>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Enrollments */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Recent Enrollments</h2>
                                <Link href="/admin/students">
                                    <Button variant="ghost" size="sm">View all</Button>
                                </Link>
                            </div>

                            {isLoading ? (
                                <Card>
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="skeleton w-10 h-10 rounded-full" />
                                                <div className="flex-1">
                                                    <div className="skeleton h-4 w-32 mb-1" />
                                                    <div className="skeleton h-3 w-48" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ) : recentEnrollments.length === 0 ? (
                                <Card className="text-center py-8">
                                    <p className="text-[var(--muted-foreground)]">No enrollments yet</p>
                                </Card>
                            ) : (
                                <Card>
                                    <div className="space-y-4">
                                        {recentEnrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                                                    {enrollment.profile?.avatar_url ? (
                                                        <img
                                                            src={enrollment.profile.avatar_url}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-primary-600 font-medium">
                                                            {(enrollment.profile?.full_name || enrollment.profile?.email || 'U')[0].toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--foreground)] truncate">
                                                        {enrollment.profile?.full_name || enrollment.profile?.email}
                                                    </p>
                                                    <p className="text-sm text-[var(--muted-foreground)] truncate">
                                                        Enrolled in {enrollment.course?.title}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    {formatDate(enrollment.enrolled_at)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Popular Courses */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Popular Courses</h2>
                                <Link href="/admin/courses">
                                    <Button variant="ghost" size="sm">Manage</Button>
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <CardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : popularCourses.length === 0 ? (
                                <Card className="text-center py-8">
                                    <p className="text-[var(--muted-foreground)]">No courses yet</p>
                                    <Link href="/admin/courses/new">
                                        <Button className="mt-4">Create Course</Button>
                                    </Link>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {popularCourses.map((course, idx) => (
                                        <Card key={course.id} padding="none" className="overflow-hidden">
                                            <div className="flex items-center gap-4 p-4">
                                                <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center text-xl font-bold text-primary-600">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-[var(--foreground)] truncate">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-sm text-[var(--muted-foreground)]">
                                                        {course.enrolled_count} students enrolled
                                                    </p>
                                                </div>
                                                <Link href={`/admin/courses/${course.id}`}>
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/admin/courses/new">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Create Course</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Add new course</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/admin/courses">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-success-100 dark:bg-success-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Manage Courses</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Edit & publish</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/admin/students">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Students</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">View all students</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/admin/payments">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-warning-100 dark:bg-warning-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Payments</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">View transactions</p>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>

            <MobileNav role="admin" />
        </div>
    );
}
