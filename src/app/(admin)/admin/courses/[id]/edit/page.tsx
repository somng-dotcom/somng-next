'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CourseForm } from '@/components/admin/CourseForm';
import { useToast } from '@/components/ui/Toast';
import { getCourseById, updateCourse } from '@/lib/api/courses';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile, signOut } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        async function loadCourse() {
            try {
                const data = await getCourseById(id);
                setInitialData(data);
            } catch (error) {
                console.error('Failed to load course:', error);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to load course details.',
                });
                router.push('/admin/courses');
            }
        }
        loadCourse();
    }, [id, router, addToast]);

    const handleSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await updateCourse(id, data);
            addToast({
                type: 'success',
                title: 'Course Updated',
                message: 'The course has been updated successfully.',
            });
            router.push('/admin/courses');
        } catch (error) {
            console.error('Failed to update course:', error);
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update the course. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!initialData) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
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
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                            Edit Course
                        </h1>
                        <p className="mt-1 text-[var(--muted-foreground)]">
                            Update course details and settings
                        </p>
                    </div>

                    <CourseForm
                        initialData={initialData}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        isEdit
                    />
                </main>
            </div>

            <MobileNav role="admin" />
        </div>
    );
}
