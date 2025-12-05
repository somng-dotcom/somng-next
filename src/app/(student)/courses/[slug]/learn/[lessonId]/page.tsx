'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Progress, CourseProgress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

// Mock lesson data
const mockLessonData = {
    course: {
        title: 'JAMB Mathematics - Complete Course',
        slug: 'jamb-mathematics-complete',
    },
    modules: [
        {
            id: 'm1',
            title: 'Introduction to JAMB Mathematics',
            lessons: [
                { id: 'l1', title: 'Course Overview', duration: 15, content_type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: true },
                { id: 'l2', title: 'JAMB Exam Format', duration: 20, content_type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: true },
                { id: 'l3', title: 'Study Strategies', duration: 25, content_type: 'pdf', content_url: '/sample.pdf', completed: false },
            ],
        },
        {
            id: 'm2',
            title: 'Number and Numeration',
            lessons: [
                { id: 'l4', title: 'Number Bases', duration: 30, content_type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: false },
                { id: 'l5', title: 'Indices and Logarithms', duration: 35, content_type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: false },
                { id: 'l6', title: 'Fractions and Decimals', duration: 25, content_type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: false },
                { id: 'l7', title: 'Practice Quiz: Numbers', duration: 15, content_type: 'quiz', content_url: '', completed: false },
            ],
        },
    ],
};

export default function LessonViewerPage() {
    const { slug, lessonId } = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const { addToast } = useToast();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentLesson, setCurrentLesson] = useState<{
        id: string;
        title: string;
        duration: number;
        content_type: string;
        content_url: string;
        completed: boolean;
    } | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Find current lesson
    useEffect(() => {
        for (const module of mockLessonData.modules) {
            const lesson = module.lessons.find((l) => l.id === lessonId);
            if (lesson) {
                setCurrentLesson(lesson);
                setIsCompleted(lesson.completed);
                break;
            }
        }
    }, [lessonId]);

    // Calculate progress
    const allLessons = mockLessonData.modules.flatMap((m) => m.lessons);
    const completedLessons = allLessons.filter((l) => l.completed).length;
    const totalLessons = allLessons.length;

    // Find next lesson
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

    const markComplete = () => {
        setIsCompleted(true);
        addToast({
            type: 'success',
            title: 'Lesson completed!',
            message: 'Great job! Keep up the good work.',
        });
    };

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

    if (!currentLesson) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--muted-foreground)]">Loading lesson...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-white">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-dark-800 border-b border-dark-700">
                <div className="flex items-center justify-between h-14 px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/courses/${slug}`}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div className="hidden sm:block">
                            <p className="text-sm text-dark-400">Course</p>
                            <p className="font-medium line-clamp-1">{mockLessonData.course.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3">
                            <span className="text-sm text-dark-400">
                                {completedLessons}/{totalLessons} lessons
                            </span>
                            <Progress
                                value={(completedLessons / totalLessons) * 100}
                                size="sm"
                                className="w-32"
                            />
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
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
                <main className={`flex-1 overflow-hidden transition-all ${sidebarOpen ? 'lg:mr-80' : ''}`}>
                    {/* Video Player Area */}
                    <div className="relative bg-black aspect-video max-h-[calc(100vh-12rem)]">
                        {currentLesson.content_type === 'video' ? (
                            <iframe
                                src={currentLesson.content_url}
                                title={currentLesson.title}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : currentLesson.content_type === 'pdf' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-lg font-medium mb-2">PDF Document</p>
                                    <Button variant="primary">
                                        Open PDF
                                    </Button>
                                </div>
                            </div>
                        ) : currentLesson.content_type === 'quiz' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-lg font-medium mb-2">Practice Quiz</p>
                                    <Button variant="secondary">
                                        Start Quiz
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Lesson Info */}
                    <div className="p-4 lg:p-6">
                        <div className="max-w-4xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold">{currentLesson.title}</h1>
                                    <p className="text-dark-400 mt-1">{currentLesson.duration} minutes</p>
                                </div>
                                {isCompleted ? (
                                    <Badge variant="success" size="md">
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </Badge>
                                ) : (
                                    <Button onClick={markComplete} size="sm">
                                        Mark as Complete
                                    </Button>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                                <Button
                                    variant="ghost"
                                    onClick={goToPrevLesson}
                                    disabled={!prevLesson}
                                    className="text-white"
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
                    <aside className="fixed right-0 top-14 bottom-0 w-80 bg-dark-800 border-l border-dark-700 overflow-y-auto custom-scrollbar hidden lg:block">
                        <div className="p-4">
                            <h2 className="font-semibold mb-4">Course Content</h2>
                            <CourseProgress
                                completedLessons={completedLessons}
                                totalLessons={totalLessons}
                                className="mb-6"
                            />

                            {mockLessonData.modules.map((module) => (
                                <div key={module.id} className="mb-4">
                                    <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-2">
                                        {module.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {module.lessons.map((lesson) => (
                                            <Link
                                                key={lesson.id}
                                                href={`/courses/${slug}/learn/${lesson.id}`}
                                                className={`
                          flex items-center gap-3 p-3 rounded-lg transition-colors
                          ${lesson.id === lessonId
                                                        ? 'bg-primary-600 text-white'
                                                        : 'hover:bg-dark-700'
                                                    }
                        `}
                                            >
                                                {lesson.completed ? (
                                                    <svg className="w-5 h-5 text-success-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 flex-shrink-0 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm line-clamp-1 ${lesson.id === lessonId ? 'font-medium' : ''}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <p className="text-xs text-dark-400">{lesson.duration} min</p>
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
