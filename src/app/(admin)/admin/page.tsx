'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsSkeleton, ListSkeleton } from '@/components/ui/Skeleton';

// Mock admin data
const mockStats = {
    totalStudents: 2456,
    totalCourses: 18,
    totalEnrollments: 4892,
    totalRevenue: 1245000,
    monthlyGrowth: {
        students: 12.5,
        enrollments: 8.3,
        revenue: 15.2,
    },
};

const mockRecentEnrollments = [
    { id: '1', student: 'Adebayo Ogundimu', course: 'JAMB Mathematics', date: '2 hours ago', amount: 5000 },
    { id: '2', student: 'Chioma Eze', course: 'WAEC Further Math', date: '5 hours ago', amount: 0 },
    { id: '3', student: 'Ibrahim Musa', course: 'SS2 Algebra', date: 'Yesterday', amount: 3500 },
    { id: '4', student: 'Ngozi Obi', course: 'JAMB Past Questions', date: 'Yesterday', amount: 4500 },
    { id: '5', student: 'Segun Adeleke', course: 'WAEC Core Math', date: '2 days ago', amount: 4000 },
];

const mockPopularCourses = [
    { id: '1', title: 'JAMB Mathematics', enrollments: 1250, revenue: 625000 },
    { id: '2', title: 'WAEC Further Math', enrollments: 890, revenue: 0 },
    { id: '3', title: 'JAMB Past Questions', enrollments: 2100, revenue: 945000 },
    { id: '4', title: 'SS2 Algebra', enrollments: 456, revenue: 159600 },
];

export default function AdminDashboardPage() {
    const { profile, signOut, isLoading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Sidebar role="admin" />
                <div className="lg:ml-64">
                    <Header user={null} />
                    <main className="p-4 lg:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <StatsSkeleton key={i} />
                            ))}
                        </div>
                    </main>
                </div>
                <MobileNav role="admin" />
            </div>
        );
    }

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
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                                Admin Dashboard
                            </h1>
                            <p className="mt-1 text-[var(--muted-foreground)]">
                                Overview of your LMS performance
                            </p>
                        </div>
                        <Link href="/admin/courses/new">
                            <Button>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Course
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Students</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">
                                        {mockStats.totalStudents.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-success-600">
                                        +{mockStats.monthlyGrowth.students}% this month
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-xl">
                                    <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Courses</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">
                                        {mockStats.totalCourses}
                                    </p>
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
                                    <p className="text-sm text-[var(--muted-foreground)]">Enrollments</p>
                                    <p className="text-2xl font-bold text-[var(--foreground)]">
                                        {mockStats.totalEnrollments.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-success-600">
                                        +{mockStats.monthlyGrowth.enrollments}% this month
                                    </p>
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
                                    <p className="text-2xl font-bold text-[var(--foreground)]">
                                        {formatCurrency(mockStats.totalRevenue)}
                                    </p>
                                    <p className="text-xs text-success-600">
                                        +{mockStats.monthlyGrowth.revenue}% this month
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Enrollments */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Recent Enrollments</CardTitle>
                                    <Link href="/admin/students">
                                        <Button variant="ghost" size="sm">View All</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockRecentEnrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                                                    {enrollment.student.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--foreground)]">{enrollment.student}</p>
                                                    <p className="text-sm text-[var(--muted-foreground)]">{enrollment.course}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-[var(--foreground)]">
                                                    {enrollment.amount > 0 ? formatCurrency(enrollment.amount) : 'Free'}
                                                </p>
                                                <p className="text-sm text-[var(--muted-foreground)]">{enrollment.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Popular Courses */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Popular Courses</CardTitle>
                                    <Link href="/admin/courses">
                                        <Button variant="ghost" size="sm">View All</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockPopularCourses.map((course, index) => (
                                        <div key={course.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--muted)] text-[var(--foreground)] flex items-center justify-center font-medium text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--foreground)]">{course.title}</p>
                                                    <p className="text-sm text-[var(--muted-foreground)]">
                                                        {course.enrollments.toLocaleString()} students
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-medium text-[var(--foreground)]">
                                                {formatCurrency(course.revenue)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6">
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
                                        <p className="font-medium text-[var(--foreground)]">Add Course</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Create new course</p>
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
                                        <p className="text-sm text-[var(--muted-foreground)]">Manage users</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/admin/payments">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-success-100 dark:bg-success-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Payments</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">View transactions</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href="/admin/settings">
                                <Card hover padding="md" className="flex items-center gap-4">
                                    <div className="p-3 bg-warning-100 dark:bg-warning-900/50 rounded-xl">
                                        <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Settings</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">Configure LMS</p>
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
