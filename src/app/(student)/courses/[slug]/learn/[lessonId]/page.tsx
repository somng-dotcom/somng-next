'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Progress, CourseProgress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getCourseBySlug, getLessonProgress, markLessonComplete, getCourseProgress } from '@/lib/api/courses';
import { CourseWithDetails, Lesson, ModuleWithLessons } from '@/types/database';
import QuizPlayer from './QuizPlayer';

export default function LessonViewerPage() {
    const { slug, lessonId } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
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


    if (isLoading || !course || !currentLesson) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--muted-foreground)]">Loading lesson...</p>
                </div>
            </div>
        );
    }

    // Helper to render content based on type
    const renderContent = () => {
        switch (currentLesson.content_type) {
            case 'video':
                // Check if it's an embeddable URL or needs transformation
                let embedUrl = currentLesson.content_url;

                if (!embedUrl) {
                    return (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                            <p className="text-dark-400">No video URL provided for this lesson.</p>
                        </div>
                    );
                }

                if (embedUrl.includes('youtube.com/watch?v=')) {
                    // Extract video ID properly to handle query params like &t=
                    const videoId = embedUrl.split('v=')[1]?.split('&')[0];
                    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (embedUrl.includes('youtu.be/')) {
                    // Handle https://youtu.be/VIDEO_ID?si=...
                    const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }

                return (
                    <iframe
                        src={embedUrl}
                        title={currentLesson.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                );
            case 'pdf':
                return (
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium mb-2">PDF Document</p>
                            {currentLesson.content_url && (
                                <Button variant="primary" onClick={() => window.open(currentLesson.content_url || '', '_blank')}>
                                    Open PDF
                                </Button>
                            )}
                        </div>
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
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                        <p className="text-dark-400">Content type not supported yet: {currentLesson.content_type}</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center justify-between h-14 px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/courses/${slug}`}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-400">Course</p>
                            <p className="font-medium line-clamp-1">{course.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                                {courseProgress.completed}/{courseProgress.total} lessons
                            </span>
                            <Progress
                                value={courseProgress.percentage}
                                size="sm"
                                className="w-32"
                            />
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-3.5rem)]">
                {/* Main Content */}
                <main className={`flex-1 overflow-hidden transition-all flex flex-col ${sidebarOpen ? 'lg:mr-80' : ''}`}>
                    {/* Video Player Area */}
                    <div className="relative bg-black aspect-video max-h-[calc(100vh-16rem)] w-full">
                        {renderContent()}
                    </div>

                    {/* Lesson Info */}
                    <div className="p-4 lg:p-6 overflow-y-auto flex-1">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold">{currentLesson.title}</h1>
                                    <p className="text-gray-400 mt-1">{currentLesson.duration_minutes || 0} minutes</p>
                                </div>
                                {isCurrentCompleted ? (
                                    <Badge variant="success" size="md">
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </Badge>
                                ) : (
                                    <Button onClick={handleMarkComplete} size="sm">
                                        Mark as Complete
                                    </Button>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={goToPrevLesson}
                                    disabled={!prevLesson}
                                    className="text-white hover:text-white hover:bg-gray-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={goToNextLesson}
                                    disabled={!nextLesson}
                                >
                                    Next Lesson
                                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                {sidebarOpen && (
                    <aside className="fixed right-0 top-14 bottom-0 w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto custom-scrollbar hidden lg:block z-40">
                        <div className="p-4">
                            <h2 className="font-semibold mb-4 text-white">Course Content</h2>

                            <div className="mb-6 bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex justify-between text-sm text-gray-300 mb-2">
                                    <span>Course Progress</span>
                                    <span>{courseProgress.percentage}%</span>
                                </div>
                                <Progress
                                    value={courseProgress.percentage}
                                    size="sm"
                                    className="w-full"
                                />
                            </div>

                            {course.modules?.map((module, mIndex) => (
                                <div key={module.id} className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                        Module {mIndex + 1}: {module.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {module.lessons?.map((lesson, lIndex) => (
                                            <Link
                                                key={lesson.id}
                                                href={`/courses/${slug}/learn/${lesson.id}`}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-lg transition-colors border border-transparent
                                                    ${lesson.id === lessonId
                                                        ? 'bg-primary-600 text-white border-primary-500 shadow-sm'
                                                        : 'hover:bg-gray-700 text-gray-300'
                                                    }
                                                `}
                                            >
                                                {isLessonCompleted(lesson.id) ? (
                                                    <div className="bg-success-500/20 rounded-full p-1">
                                                        <svg className="w-4 h-4 text-success-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className={`
                                                        rounded-full p-1 border-2 w-6 h-6 flex items-center justify-center text-xs
                                                        ${lesson.id === lessonId ? 'border-white text-white' : 'border-gray-500 text-gray-500'}
                                                    `}>
                                                        {lIndex + 1}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm line-clamp-2 ${lesson.id === lessonId ? 'font-medium' : ''}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                                                        {lesson.content_type === 'video' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                        {lesson.content_type === 'quiz' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                                        {lesson.duration_minutes} min
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
