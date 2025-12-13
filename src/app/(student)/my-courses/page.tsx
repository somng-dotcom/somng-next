'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { getUserEnrollments, getCourseProgress, getLessonProgress } from '@/lib/api/courses';
import { CourseLevel } from '@/types/database';

interface EnrolledCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    level: CourseLevel;
    is_premium: boolean;
    progress: {
        completed: number;
        total: number;
    };
    currentLessonId: string;
}

export default function MyLearningPage() {
    const { user, profile, signOut } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');

    useEffect(() => {
        async function loadData() {
            if (!user) return;

            try {
                // 1. Get enrolled courses
                const enrollments = await getUserEnrollments(user.id);

                // 2. Get progress for each enrolled course
                const coursesWithProgress = await Promise.all(
                    enrollments.map(async (enrollment) => {
                        const course = enrollment.course;
                        if (!course) return null;

                        const progress = await getCourseProgress(user.id, course.id);

                        // Smart Resume Logic: Find the first uncompleted lesson
                        let nextLessonId = '';

                        // accessing via 'any' because strict typing of deeply nested join might be tricky without full generation
                        const modules = (course as any).modules;

                        if (modules && modules.length > 0) {
                            // Flatten all lessons in order
                            const allLessons: any[] = [];
                            modules.forEach((m: any) => {
                                if (m.lessons && m.lessons.length > 0) {
                                    allLessons.push(...m.lessons);
                                }
                            });

                            if (allLessons.length > 0) {
                                // Default to first lesson
                                nextLessonId = allLessons[0].id;

                                // Check which ones are completed
                                const lessonIds = allLessons.map(l => l.id);
                                const completedLessons = await getLessonProgress(user.id, lessonIds);
                                const completedSet = new Set(completedLessons.map((p: any) => p.lesson_id));

                                // Find first uncompleted
                                const firstUncompleted = allLessons.find(l => !completedSet.has(l.id));

                                if (firstUncompleted) {
                                    nextLessonId = firstUncompleted.id;
                                } else {
                                    // All completed? Link to the first one for Review
                                    nextLessonId = allLessons[0].id;
                                }
                            }
                        }

                        return {
                            id: course.id,
                            title: course.title,
                            slug: course.slug,
                            thumbnail_url: course.thumbnail_url,
                            level: course.level as CourseLevel,
                            is_premium: course.is_premium,
                            progress: {
                                completed: progress.completed,
                                total: progress.total,
                            },
                            currentLessonId: nextLessonId
                        };
                    })
                );

                setEnrolledCourses(coursesWithProgress.filter(Boolean) as EnrolledCourse[]);
            } catch (error) {
                console.error('Error loading my courses:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [user]);

    const filteredCourses = enrolledCourses.filter(course => {
        const isCompleted = course.progress.completed === course.progress.total && course.progress.total > 0;
        const isInProgress = course.progress.completed > 0 && course.progress.completed < course.progress.total;

        // Also consider "not started" as in progress for the "all" tab, but maybe for strictly "in-progress" tab?
        // Let's define:
        // All: Everything
        // In Progress: Not completed (includes not started)
        // Completed: 100% completed

        if (activeTab === 'completed') return isCompleted;
        if (activeTab === 'in-progress') return !isCompleted;
        return true;
    });

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
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--foreground)]">
                            My Learning
                        </h1>
                        <p className="mt-2 text-[var(--muted-foreground)]">
                            Track your progress and continue learning
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border)] mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'all'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            All Courses ({enrolledCourses.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('in-progress')}
                            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'in-progress'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            In Progress ({enrolledCourses.filter(c => c.progress.completed < c.progress.total).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'completed'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            Completed ({enrolledCourses.filter(c => c.progress.completed === c.progress.total && c.progress.total > 0).length})
                        </button>
                    </div>

                    {/* Course List */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map((course) => (
                                <Card key={course.id} className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="aspect-video w-full bg-[var(--muted)] relative">
                                        <img
                                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/10" />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {course.progress.completed === course.progress.total && course.progress.total > 0 && (
                                                <span className="px-2 py-1 bg-success-500 text-white text-xs font-bold rounded-full shadow-sm">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="mb-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.level === 'Others' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    (course.level === 'SS1' || course.level === 'SS2') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                }`}>
                                                {course.level}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-[var(--foreground)] mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>

                                        <div className="mt-auto pt-4">
                                            <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)] mb-2">
                                                <span>{Math.round((course.progress.completed / (course.progress.total || 1)) * 100)}% Complete</span>
                                                <span>{course.progress.completed}/{course.progress.total} Lessons</span>
                                            </div>
                                            <div className="w-full bg-[var(--muted)] rounded-full h-2 mb-4 overflow-hidden">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(course.progress.completed / (course.progress.total || 1)) * 100}%` }}
                                                />
                                            </div>

                                            <Link href={course.currentLessonId ? `/courses/${course.slug}/learn/${course.currentLessonId}` : `/courses/${course.slug}`}>
                                                <Button
                                                    variant={course.progress.completed === course.progress.total && course.progress.total > 0 ? "outline" : "primary"}
                                                    size="sm"
                                                    className="w-full"
                                                >
                                                    {course.progress.completed === 0
                                                        ? 'Start Learning'
                                                        : course.progress.completed === course.progress.total && course.progress.total > 0
                                                            ? 'Review Course'
                                                            : 'Continue Learning'}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">No courses found</h3>
                            <p className="text-[var(--muted-foreground)] mb-6">
                                {activeTab === 'all'
                                    ? "You haven't enrolled in any courses yet."
                                    : activeTab === 'completed'
                                        ? "You haven't completed any courses yet."
                                        : "You don't have any courses in progress."}
                            </p>
                            <Link href="/courses">
                                <Button>Browse Course Catalog</Button>
                            </Link>
                        </div>
                    )}
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}
