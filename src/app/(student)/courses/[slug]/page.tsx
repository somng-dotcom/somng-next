'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelBadge, PremiumBadge, FreeBadge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { getCourseBySlug, isUserEnrolled, enrollUser } from '@/lib/api/courses';
import { useToast } from '@/components/ui/Toast';
import PaystackPayment from '@/components/paystack/PaystackPayment';

interface Lesson {
    id: string;
    title: string;
    content_type: string;
    duration_minutes: number | null;
    order_index: number;
    is_free_preview: boolean;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    lessons: Lesson[];
}

interface CourseDetails {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    level: string;
    is_premium: boolean;
    price: number;
    duration_hours: number | null;
    status: string;
    modules: Module[];
}

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const { addToast } = useToast();

    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    const slug = params.slug as string;

    useEffect(() => {
        async function loadCourseData() {
            try {
                const courseData = await getCourseBySlug(slug);
                setCourse(courseData as CourseDetails);

                // Check enrollment status
                if (user && courseData) {
                    const enrolled = await isUserEnrolled(user.id, courseData.id);
                    setIsEnrolled(enrolled);
                }

                // Expand first module by default
                if (courseData?.modules?.[0]) {
                    setExpandedModules([courseData.modules[0].id]);
                }
            } catch (error) {
                console.error('Error loading course:', error);
                addToast({ type: 'error', title: 'Course not found' });
                router.push('/courses');
            } finally {
                setIsLoading(false);
            }
        }

        if (slug) {
            loadCourseData();
        }
    }, [slug, user, router, addToast]);

    const handleFreeEnroll = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!course) return;

        // For free courses, enroll directly
        if (!course.is_premium) {
            setIsEnrolling(true);
            try {
                await enrollUser(user.id, course.id);
                setIsEnrolled(true);
                addToast({ type: 'success', title: 'Successfully enrolled!' });
            } catch (error: any) {
                console.error('Error enrolling:', error);
                addToast({ type: 'error', title: error.message || 'Failed to enroll' });
            } finally {
                setIsEnrolling(false);
            }
            return;
        }
    };

    const handlePaymentSuccess = () => {
        setIsEnrolled(true);
        addToast({ type: 'success', title: 'Payment successful! You are now enrolled.' });
        // Redirect to first lesson
        const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;
        if (firstLessonId) {
            router.push(`/courses/${course?.slug}/learn/${firstLessonId}`);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    const totalDuration = course?.modules?.reduce(
        (sum, m) => sum + (m.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0), 0
    ) || 0;

    const sidebarRole = profile?.role === 'admin' ? 'admin' : 'student';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Sidebar role="student" />
                <div className="lg:ml-64">
                    <Header user={null} />
                    <main className="p-4 lg:p-6">
                        <div className="space-y-6">
                            <div className="h-64 bg-[var(--muted)] rounded-xl animate-pulse" />
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <CardSkeleton key={i} />
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
                <MobileNav role="student" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Course not found</h1>
                    <Link href="/courses">
                        <Button className="mt-4">Back to Courses</Button>
                    </Link>
                </div>
            </div>
        );
    }

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

                <main className="pb-20 lg:pb-6">
                    {/* Hero Section */}
                    <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Course Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <LevelBadge level={course.level as any} />
                                        {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
                                    </div>
                                    <h1 className="text-2xl lg:text-4xl font-display font-bold mb-4">
                                        {course.title}
                                    </h1>
                                    <p className="text-lg text-white/90 mb-6 max-w-2xl">
                                        {course.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-6 text-white/80">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <span>{totalLessons} Lessons</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <span>{course.modules?.length || 0} Modules</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enrollment Card */}
                                <div className="lg:w-80">
                                    <Card className="overflow-hidden">
                                        <img
                                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                                            alt={course.title}
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="p-4">
                                            {course.is_premium && (
                                                <p className="text-3xl font-bold text-[var(--foreground)] mb-4">
                                                    {formatPrice(course.price)}
                                                </p>
                                            )}

                                            {isEnrolled ? (
                                                <Link href={`/courses/${course.slug}/learn/${course.modules?.[0]?.lessons?.[0]?.id || ''}`}>
                                                    <Button fullWidth size="lg">
                                                        Continue Learning
                                                    </Button>
                                                </Link>
                                            ) : course.is_premium ? (
                                                <PaystackPayment 
                                                    email={profile?.email || user?.email || ''}
                                                    amount={course.price}
                                                    courseId={course.id}
                                                    onSuccess={handlePaymentSuccess}
                                                    fullWidth
                                                    size="lg"
                                                >
                                                    Enroll Now
                                                </PaystackPayment>
                                            ) : (
                                                <Button
                                                    fullWidth
                                                    size="lg"
                                                    onClick={handleFreeEnroll}
                                                    isLoading={isEnrolling}
                                                >
                                                    Start Free Course
                                                </Button>
                                            )}

                                            <p className="text-sm text-center text-[var(--muted-foreground)] mt-3">
                                                {course.is_premium ? '30-day money-back guarantee' : 'Free forever'}
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Content */}
                    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Curriculum */}
                            <div className="lg:col-span-2">
                                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                                    Course Curriculum
                                </h2>

                                <div className="space-y-4">
                                    {course.modules?.map((module, idx) => (
                                        <Card key={module.id} padding="none">
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[var(--muted)] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center text-sm font-medium text-primary-600">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-medium text-[var(--foreground)]">
                                                            {module.title}
                                                        </h3>
                                                        <p className="text-sm text-[var(--muted-foreground)]">
                                                            {module.lessons?.length || 0} lessons
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''
                                                        }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {expandedModules.includes(module.id) && (
                                                <div className="border-t border-[var(--border)]">
                                                    {module.lessons?.map((lesson) => (
                                                        <div
                                                            key={lesson.id}
                                                            className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)] last:border-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {lesson.content_type === 'video' ? (
                                                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                ) : lesson.content_type === 'quiz' ? (
                                                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                )}
                                                                <span className="text-[var(--foreground)]">
                                                                    {lesson.title}
                                                                </span>
                                                                {lesson.is_free_preview && (
                                                                    <span className="px-2 py-0.5 text-xs bg-success-100 text-success-700 rounded-full">
                                                                        Free Preview
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-[var(--muted-foreground)]">
                                                                {lesson.duration_minutes}m
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="font-bold text-[var(--foreground)] mb-4">What you&apos;ll learn</h3>
                                    <ul className="space-y-3">
                                        {[
                                            'Master core mathematical concepts',
                                            'Solve exam-style questions confidently',
                                            'Understand step-by-step problem solving',
                                            'Practice with real past questions',
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                                                <svg className="w-5 h-5 text-success-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card>
                                    <h3 className="font-bold text-[var(--foreground)] mb-4">Requirements</h3>
                                    <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                                        <li>• Basic understanding of mathematics</li>
                                        <li>• Access to a computer or mobile device</li>
                                        <li>• Dedication to practice regularly</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}
