'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CourseForm } from '@/components/admin/CourseForm';
import { useToast } from '@/components/ui/Toast';
import { createCourse } from '@/lib/api/courses';

export default function NewCoursePage() {
    const { profile, signOut } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await createCourse(data);
            addToast({
                type: 'success',
                title: 'Course Created',
                message: 'The course has been created successfully.',
            });
            router.push('/admin/courses');
        } catch (error) {
            console.error('Failed to create course:', error);
            addToast({
                type: 'error',
                title: 'Creation Failed',
                message: 'Failed to create the course. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
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
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                            Create New Course
                        </h1>
                        <p className="mt-1 text-[var(--muted-foreground)]">
                            Add a new course to your catalog
                        </p>
                    </div>

                    <CourseForm onSubmit={handleSubmit} isLoading={isLoading} />
                </main>
            </div>

            <MobileNav role="admin" />
        </div>
    );
}
