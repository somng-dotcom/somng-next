'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge, LevelBadge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getAdminCourses, deleteCourse } from '@/lib/api/courses';

interface Course {
    id: string;
    title: string;
    slug: string;
    level: string;
    status: string;
    is_premium: boolean;
    price: number | null;
    enrollments?: { count: number }[];
    enrolled_count?: number;
}

// Mock courses data
// Mock data removed

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
];

const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'JAMB', label: 'JAMB' },
    { value: 'WAEC', label: 'WAEC' },
    { value: 'SS1', label: 'SS1' },
    { value: 'SS2', label: 'SS2' },
];

export default function AdminCoursesPage() {
    const { profile, signOut } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const loadCourses = async () => {
        setIsLoading(true);
        try {
            const data = await getAdminCourses({
                search: searchQuery,
                status: statusFilter,
                level: levelFilter,
            });
            setCourses(data as Course[]);
        } catch (error) {
            console.error('Failed to load courses:', error);
            addToast({ type: 'error', title: 'Failed to load courses' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, [searchQuery, statusFilter, levelFilter]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleDelete = (course: Course) => {
        setSelectedCourse(course);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCourse) return;

        try {
            await deleteCourse(selectedCourse.id);
            addToast({
                type: 'success',
                title: 'Course deleted',
                message: `"${selectedCourse.title}" has been deleted.`,
            });
            loadCourses(); // Refresh list
        } catch (error) {
            console.error('Failed to delete course:', error);
            addToast({ type: 'error', title: 'Failed to delete course' });
        }
        setDeleteDialogOpen(false);
        setSelectedCourse(null);
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
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                                Courses
                            </h1>
                            <p className="mt-1 text-[var(--muted-foreground)]">
                                Manage your course catalog
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

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                }
                            />
                        </div>
                        <Select
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-36"
                        />
                        <Select
                            options={levelOptions}
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="w-32"
                        />
                    </div>

                    {/* Table */}
                    <Card padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Course</th>
                                        <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Level</th>
                                        <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Status</th>
                                        <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Price</th>
                                        <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Students</th>
                                        <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)] bg-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRowSkeleton key={i} columns={6} />
                                        ))
                                    ) : courses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                                                No courses found
                                            </td>
                                        </tr>
                                    ) : (
                                        courses.map((course) => (
                                            <tr key={course.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-[var(--foreground)]">{course.title}</p>
                                                        <p className="text-xs text-[var(--muted-foreground)]">/{course.slug}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <LevelBadge level={course.level as any} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            course.status === 'published' ? 'success' :
                                                                course.status === 'draft' ? 'warning' : 'default'
                                                        }
                                                    >
                                                        {course.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-[var(--foreground)]">
                                                    {course.is_premium ? formatPrice(course.price || 0) : 'Free'}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--foreground)]">
                                                    {(course.enrolled_count || 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/courses/${course.id}/edit`}>
                                                            <Button variant="ghost" size="sm">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(course)}>
                                                            <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </main>
            </div>

            <MobileNav role="admin" />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Course"
                message={`Are you sure you want to delete "${selectedCourse?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
