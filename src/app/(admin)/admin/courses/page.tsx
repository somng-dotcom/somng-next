'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { MobileNav } from '@/components/layout/Sidebar';

import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getAdminCourses, deleteCourse } from '@/lib/api/courses';
import { TableSkeleton } from '@/components/ui/Skeleton';

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

export default function AdminCoursesPage() {
    const { profile, signOut, user, isLoading: authLoading } = useAuth();
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

    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        loadCourses();

        // Revalidate on focus
        const onFocus = () => loadCourses();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [searchQuery, statusFilter, levelFilter, user, authLoading, router]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };



    // ... existing code ...

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
                <main className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        <div className="flex justify-between mb-8">
                            <div className="h-16 w-64 bg-surface-light dark:bg-surface-dark rounded-lg animate-pulse" />
                            <div className="h-10 w-32 bg-primary/20 rounded-lg animate-pulse" />
                        </div>
                        <TableSkeleton columns={6} rows={8} />
                    </div>
                </main>
            </div>
        );
    }

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
        <>
            <main className="p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* PageHeading */}
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6 mb-8">
                        <div className="flex min-w-72 flex-col gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Courses</h1>
                            <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Manage your course catalog</p>
                        </div>
                        <Link href="/admin/courses/new">
                            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                <span className="material-symbols-outlined text-lg mr-2">add</span>
                                <span className="truncate">Add Course</span>
                            </button>
                        </Link>
                    </header>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark material-symbols-outlined">search</span>
                            <input
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark h-12 pl-12 pr-4 text-base font-normal leading-normal"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-select flex w-full sm:w-48 min-w-0 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark h-12 px-4 text-base font-normal leading-normal"
                        >
                            <option value="">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="form-select flex w-full sm:w-48 min-w-0 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark h-12 px-4 text-base font-normal leading-normal"
                        >
                            <option value="">All Levels</option>
                            <option value="JAMB">JAMB</option>
                            <option value="WAEC">WAEC</option>
                            <option value="SS1">SS1</option>
                            <option value="SS2">SS2</option>
                            <option value="SS3">SS3</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark">Course</th>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark hidden md:table-cell">Level</th>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark hidden sm:table-cell">Status</th>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark hidden lg:table-cell">Price</th>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark hidden xl:table-cell">Students</th>
                                        <th className="px-6 py-4 font-medium text-text-secondary-light dark:text-text-secondary-dark text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : courses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                                <p className="text-lg font-medium mb-1">No courses found</p>
                                                <p className="text-sm">Try adjusting your search or filters.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        courses.map((course) => (
                                            <tr key={course.id} className="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-text-primary-light dark:text-text-primary-dark text-base">{course.title}</p>
                                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono mt-0.5">/{course.slug}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        {course.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 hidden sm:table-cell">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${course.status === 'published' ? 'bg-success/10 text-success' :
                                                            course.status === 'draft' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                'bg-text-secondary-light/10 text-text-secondary-light'}`}>
                                                        {course.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-text-primary-light dark:text-text-primary-dark font-medium hidden lg:table-cell">
                                                    {course.is_premium ? formatPrice(course.price || 0) : 'Free'}
                                                </td>
                                                <td className="px-6 py-4 text-text-primary-light dark:text-text-primary-dark hidden xl:table-cell">
                                                    {(course.enrolled_count || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/courses/${course.id}`}>
                                                            <button className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                                                                <span className="material-symbols-outlined text-xl">edit</span>
                                                            </button>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(course)}
                                                            className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

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
        </>
    );
}
