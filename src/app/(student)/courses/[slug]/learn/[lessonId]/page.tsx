'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Progress, CourseProgress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getCourseBySlug, getLessonProgress, markLessonComplete } from '@/lib/api/courses';
import { CourseWithDetails, Lesson } from '@/types/database';
import QuizPlayer from './QuizPlayer';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function LessonViewerPage() {
    const { slug, lessonId } = useParams();
    const router = useRouter();
    const { user, profile, isLoading: authLoading, signOut } = useAuth();
    const { addToast } = useToast();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [course, setCourse] = useState<CourseWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
    const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0, percentage: 0 });

    // 1. Load Course Content (Only depends on slug)
    useEffect(() => {
        let isMounted = true;

        const loadCourse = async () => {
            if (!slug) return;

            // If we already have the course and the slug matches, don't re-fetch
            if (course && course.slug === slug) return;

            try {
                // Only show full page loading if we don't have course data yet
                if (!course) setIsLoading(true);

                const courseData = await getCourseBySlug(slug as string) as CourseWithDetails | null;
                if (!isMounted) return;

                if (!courseData) {
                    addToast({ type: 'error', title: 'Course not found' });
                    // router.push('/courses');
                    return;
                }

                setCourse(courseData);
            } catch (error) {
                console.error('Error loading course:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadCourse();
        return () => { isMounted = false; };
    }, [slug, addToast]); // Removed deps that cause loops

    // 2. Update Current Lesson when lessonId or course changes
    useEffect(() => {
        if (!course || !lessonId) return;

        let foundLesson: Lesson | null = null;
        if (course.modules) {
            for (const module of course.modules) {
                if (module.lessons) {
                    foundLesson = module.lessons.find(l => l.id === lessonId) || null;
                    if (foundLesson) break;
                }
            }
        }

        if (foundLesson) {
            console.log('Found lesson:', foundLesson);
            setCurrentLesson(foundLesson);
        } else {
            console.error('Lesson not found:', lessonId);
        }
    }, [course, lessonId]);

    // 3. Load User Progress (Depends on user and course)
    useEffect(() => {
        let isMounted = true;

        const loadProgress = async () => {
            // Need user AND course structure to fetch progress
            if (!user || !course) return;

            try {
                const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
                const lessonIds = allLessons.map(l => l.id);

                if (lessonIds.length > 0) {
                    const progressData = await getLessonProgress(user.id, lessonIds);
                    if (!isMounted) return;

                    const completedSet = new Set(progressData.filter(p => p.completed).map(p => p.lesson_id));
                    setCompletedLessonIds(completedSet);

                    // Calculate overall progress
                    const completedCount = completedSet.size;
                    const totalCount = lessonIds.length;
                    setCourseProgress({
                        completed: completedCount,
                        total: totalCount,
                        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                    });
                }
            } catch (error) {
                console.error('Error loading progress:', error);
            }
        };

        loadProgress();
        return () => { isMounted = false; };
    }, [user?.id, course]); // Depend on user.id to avoid unnecessary re-runs on object ref change

    // Handle marking lesson as complete
    const handleMarkComplete = async () => {
        if (!user || !currentLesson) return;

        try {
            await markLessonComplete(user.id, currentLesson.id);

            // Update local state
            setCompletedLessonIds(prev => new Set(prev).add(currentLesson.id));

            // Update stats
            setCourseProgress(prev => ({
                ...prev,
                completed: prev.completed + 1,
                percentage: Math.round(((prev.completed + 1) / prev.total) * 100)
            }));

            addToast({
                type: 'success',
                title: 'Lesson completed!',
                message: 'Great job! Keep up the good work.',
            });
        } catch (error) {
            console.error('Error marking complete:', error);
            addToast({ type: 'error', title: 'Failed to save progress' });
        }
    };

    // Navigation logic
    const getAllLessons = useCallback(() => {
        if (!course?.modules) return [];
        return course.modules.flatMap(m => m.lessons || []);
    }, [course]);

    const getNavigation = () => {
        const allLessons = getAllLessons();
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);

        return {
            prevLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
            nextLesson: currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
        };
    };

    const { prevLesson, nextLesson } = getNavigation();

    const goToNextLesson = () => {
        if (nextLesson) {
            router.push(`/courses/${slug}/learn/${nextLesson.id}`);
        }
    };

    const goToPrevLesson = () => {
        if (prevLesson) {
            router.push(`/courses/${slug}/learn/${prevLesson.id}`);
        }
    };

    // Helper to check completion status
    const isLessonCompleted = (id: string) => completedLessonIds.has(id);
    const isCurrentCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;

    // Helper to render content based on type
    const renderContent = () => {
        if (!currentLesson) return null;

        switch (currentLesson.content_type) {
            case 'video':
                // Check if it's an embeddable URL or needs transformation
                let embedUrl = currentLesson.content_url;

                if (!embedUrl) {
                    return (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">No video URL provided for this lesson.</p>
                        </div>
                    );
                }

                if (embedUrl.includes('youtube.com/watch?v=')) {
                    // Extract video ID properly to handle query params like &t=
                    const videoId = embedUrl.split('v=')[1]?.split('&')[0];
                    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                } else if (embedUrl.includes('youtu.be/')) {
                    // Handle https://youtu.be/VIDEO_ID?si=...
                    const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                }

                return (
                    <iframe
                        src={embedUrl}
                        title={currentLesson.title}
                        className="absolute inset-0 w-full h-full rounded-lg shadow-sm bg-black"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                );
            case 'pdf':
                return (
                    <div className="flex flex-col items-center justify-center p-12 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4">description</span>
                        <p className="text-lg font-medium mb-2 text-text-primary">PDF Document</p>
                        <p className="text-text-secondary mb-6 text-center max-w-md">
                            This lesson contains a PDF document. You can view it by clicking the button below.
                        </p>
                        {currentLesson.content_url && (
                            <Button variant="primary" onClick={() => window.open(currentLesson.content_url || '', '_blank')}>
                                Open PDF
                            </Button>
                        )}
                    </div>
                );
            case 'quiz':
                return (
                    <QuizPlayer
                        lessonId={currentLesson.id}
                        onComplete={handleMarkComplete}
                    />
                );
            default:
                return (
                    <div className="flex items-center justify-center p-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500">Content type not supported yet: {currentLesson.content_type}</p>
                    </div>
                );
        }
    };

    if (isLoading || !course || !currentLesson) {
        return (
            <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-secondary">Loading lesson...</p>
                </div>
            </div>
        );
    }

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
    const sidebarRole = profile?.role === 'admin' ? 'admin' : 'student';

    return (
        <div className="min-h-screen bg-background font-display text-text-primary">
            <Sidebar role={sidebarRole} />

            <div className="lg:ml-64 flex flex-col min-h-screen">
                <Header
                    user={profile ? {
                        name: profile.full_name || '',
                        email: profile.email,
                        avatar: profile.avatar_url || undefined,
                        role: sidebarRole,
                    } : null}
                    onLogout={signOut}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col lg:flex-row h-full">
                        {/* Left: Main Content (Video/Lesson) */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            {/* Breadcrumb / Back Link */}
                            <div className="mb-4">
                                <Link
                                    href={`/courses/${slug}`}
                                    className="inline-flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg mr-1">arrow_back</span>
                                    Back to Course Review
                                </Link>
                            </div>

                            {/* Player / Content Area */}
                            <div className="w-full max-w-5xl mx-auto">
                                <div className={`relative w-full ${currentLesson.content_type === 'video' ? 'aspect-video' : 'min-h-[400px]'} mb-6`}>
                                    {renderContent()}
                                </div>

                                {/* Lesson Info & Controls */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6 mb-6">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-text-primary mb-2">{currentLesson.title}</h1>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-lg">schedule</span>
                                                {currentLesson.duration_minutes || 0} min
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                            <span>Module: {course.modules?.find(m => m.lessons?.some(l => l.id === currentLesson.id))?.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isCurrentCompleted ? (
                                            <Badge variant="success" size="md" className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                                Completed
                                            </Badge>
                                        ) : (
                                            <Button onClick={handleMarkComplete} size="md">
                                                Mark as Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={goToPrevLesson}
                                        disabled={!prevLesson}
                                        className="gap-2"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                        Previous Lesson
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={goToNextLesson}
                                        disabled={!nextLesson}
                                        className="gap-2"
                                    >
                                        Next Lesson
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </Button>
                                </div>

                                {/* Description / Content Text (if any) */}
                                {currentLesson.content_text && (
                                    <div className="mt-8 prose dark:prose-invert max-w-none">
                                        <h3>Lesson Notes</h3>
                                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content_text }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Course Curriculum Sidebar (Desktop) */}
                        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-surface h-[50vh] lg:h-auto flex flex-col">
                            <div className="p-4 border-b border-border bg-surface-highlight">
                                <h2 className="font-bold text-text-primary mb-1">Course Content</h2>
                                <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                                    <span>{courseProgress.completed} / {courseProgress.total} Lessons Completed</span>
                                    <span className="font-semibold">{courseProgress.percentage}%</span>
                                </div>
                                <Progress value={courseProgress.percentage} size="sm" className="w-full h-2" />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                                {course.modules?.map((module, mIndex) => (
                                    <div key={module.id} className="space-y-1">
                                        <h3 className="px-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                                            Module {mIndex + 1}: {module.title}
                                        </h3>
                                        <div className="space-y-0.5">
                                            {module.lessons?.map((lesson, lIndex) => (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/courses/${slug}/learn/${lesson.id}`}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border border-transparent
                                                        ${lesson.id === lessonId
                                                            ? 'bg-primary/10 text-primary border-primary/20 font-medium'
                                                            : 'hover:bg-background-hover text-text-secondary hover:text-text-primary'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex-shrink-0">
                                                        {isLessonCompleted(lesson.id) ? (
                                                            <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                                                        ) : (
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                                                                ${lesson.id === lessonId ? 'border-primary text-primary' : 'border-gray-400 text-gray-500'}
                                                            `}>
                                                                {lIndex + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm truncate leading-snug">{lesson.title}</p>
                                                        <div className="flex items-center gap-1 mt-0.5 text-xs opacity-70">
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {lesson.content_type === 'video' ? 'play_circle' :
                                                                    lesson.content_type === 'quiz' ? 'quiz' : 'description'}
                                                            </span>
                                                            {lesson.duration_minutes} min
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                </main>
                <MobileNav role={sidebarRole} />
            </div>
        </div>
    );
}

