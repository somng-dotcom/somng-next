'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/PageLoader';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { createCourse } from '@/lib/api/courses';
import { Button } from '@/components/ui/Button';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function NewCoursePage() {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    // Form State
    const [isSaving, setIsSaving] = useState(false);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        level: 'JAMB',
        is_premium: false,
        price: 0,
        status: 'draft' as 'draft' | 'published' | 'archived',
        thumbnail_url: ''
    });

    if (isLoading) {
        return <PageLoader role="admin" />;
    }

    const handleCreate = async (statusOverride?: 'published' | 'draft') => {
        if (!user) {
            addToast({ type: 'error', title: 'Error', message: 'You must be logged in.' });
            return;
        }

        // Validation
        if (courseForm.is_premium && courseForm.price <= 0) {
            addToast({ type: 'error', title: 'Validation Error', message: 'Premium courses must have a price greater than 0.' });
            return;
        }

        setIsSaving(true);
        try {
            // Generate a basic slug from the title
            const slug = courseForm.title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const courseData = {
                ...courseForm,
                slug,
                instructor_id: user.id,
                status: statusOverride || courseForm.status
            };

            const newCourse = await createCourse(courseData);

            addToast({
                type: 'success',
                title: 'Course Created',
                message: 'Redirecting to editor...'
            });

            // Redirect to the editor page to add content
            router.push(`/admin/courses/${newCourse.id}`);
        } catch (error: unknown) {
            console.error('Failed to create course:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addToast({ type: 'error', title: 'Failed to create course', message: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminGuard profile={profile} isLoading={isLoading}>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar role="admin" />

                {/* Main Content */}
                <div className="flex-1 lg:ml-64">
                    <div className="p-8">
                        {/* PageHeading */}
                        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Create New Course</p>
                                <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Fill in the details below to create a new course for the platform.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleCreate('draft')}
                                    disabled={isSaving}
                                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-background-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/10 transition-colors"
                                >
                                    <span className="truncate">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                                </button>
                                <button
                                    onClick={() => handleCreate('published')}
                                    disabled={isSaving}
                                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-success text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-success/90 transition-colors"
                                >
                                    <span className="truncate">Publish Course</span>
                                </button>
                            </div>
                        </header>

                        {/* Form Layout */}
                        <div className="mt-8 grid grid-cols-3 gap-8">
                            {/* Left Column: Course Settings */}
                            <div className="col-span-3 lg:col-span-1 flex flex-col gap-6">
                                <div className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4">Course Settings</h3>
                                    <div className="flex flex-col gap-6">
                                        <label className="flex flex-col">
                                            <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Title</p>
                                            <input
                                                value={courseForm.title}
                                                onChange={e => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark px-4 text-base font-normal leading-normal"
                                                placeholder="e.g. Introduction to Algebra"
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Description</p>
                                            <textarea
                                                value={courseForm.description}
                                                onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark min-h-36 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark p-4 text-base font-normal leading-normal"
                                                placeholder="Provide a detailed description of the course..."
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Level</p>
                                            <select
                                                value={courseForm.level}
                                                onChange={e => setCourseForm(prev => ({ ...prev, level: e.target.value }))}
                                                className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4 text-base font-normal leading-normal"
                                            >
                                                <option value="JAMB">JAMB</option>
                                                <option value="WAEC">WAEC</option>
                                                <option value="SS1">SS1</option>
                                                <option value="SS2">SS2</option>
                                                <option value="SS3">SS3</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">Course Type</p>
                                            <div className="flex items-center justify-between rounded-lg p-1 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                                                <button
                                                    onClick={() => setCourseForm(prev => ({ ...prev, is_premium: false }))}
                                                    className={`flex-1 text-center text-sm font-semibold py-2 rounded-md transition-all ${!courseForm.is_premium ? 'bg-surface-light dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                                >
                                                    Free
                                                </button>
                                                <button
                                                    onClick={() => setCourseForm(prev => ({ ...prev, is_premium: true }))}
                                                    className={`flex-1 text-center text-sm font-semibold py-2 rounded-md transition-all ${courseForm.is_premium ? 'bg-surface-light dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                                >
                                                    Premium
                                                </button>
                                            </div>
                                        </div>

                                        {courseForm.is_premium && (
                                            <label className="flex flex-col">
                                                <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Price (NGN)</p>
                                                <input
                                                    type="number"
                                                    value={courseForm.price}
                                                    onChange={e => setCourseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4 text-base font-normal leading-normal"
                                                />
                                            </label>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">Course Status</p>
                                            <div className="inline-flex items-center gap-2">
                                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 capitalize">
                                                    {courseForm.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Placeholder for Modules */}
                            <div className="col-span-3 lg:col-span-2 flex flex-col gap-6">
                                <div className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark opacity-75">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Course Modules</h3>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl text-primary">school</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                                            Start Your Course
                                        </h4>
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-sm mb-6">
                                            Fill in the course details on the left and click &quot;Save Draft&quot; or &quot;Publish&quot; to start adding modules and lessons.
                                        </p>
                                        <Button onClick={() => handleCreate()} isLoading={isSaving} size="md">
                                            Create Course
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <MobileNav role="admin" />
            </div>
        </AdminGuard>
    );
}

