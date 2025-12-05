'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelBadge, PremiumBadge, FreeBadge, Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

// Mock course data
const mockCourseDetail = {
    id: '1',
    title: 'JAMB Mathematics - Complete Course',
    slug: 'jamb-mathematics-complete',
    description: 'Master all JAMB mathematics topics with comprehensive lessons, practice questions, and mock exams. This course covers everything you need to score high in your JAMB examination including Algebra, Trigonometry, Calculus, Statistics, and more.',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    level: 'JAMB' as const,
    is_premium: true,
    price: 5000,
    duration_hours: 40,
    instructor: {
        name: 'Dr. Adebayo Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        title: 'Mathematics Professor',
    },
    modules: [
        {
            id: 'm1',
            title: 'Introduction to JAMB Mathematics',
            lessons: [
                { id: 'l1', title: 'Course Overview', duration: 15, is_free_preview: true },
                { id: 'l2', title: 'JAMB Exam Format', duration: 20, is_free_preview: true },
                { id: 'l3', title: 'Study Strategies', duration: 25, is_free_preview: false },
            ],
        },
        {
            id: 'm2',
            title: 'Number and Numeration',
            lessons: [
                { id: 'l4', title: 'Number Bases', duration: 30, is_free_preview: false },
                { id: 'l5', title: 'Indices and Logarithms', duration: 35, is_free_preview: false },
                { id: 'l6', title: 'Fractions and Decimals', duration: 25, is_free_preview: false },
                { id: 'l7', title: 'Practice Quiz: Numbers', duration: 15, is_free_preview: false },
            ],
        },
        {
            id: 'm3',
            title: 'Algebra',
            lessons: [
                { id: 'l8', title: 'Linear Equations', duration: 30, is_free_preview: false },
                { id: 'l9', title: 'Quadratic Equations', duration: 40, is_free_preview: false },
                { id: 'l10', title: 'Simultaneous Equations', duration: 35, is_free_preview: false },
                { id: 'l11', title: 'Inequalities', duration: 25, is_free_preview: false },
                { id: 'l12', title: 'Practice Quiz: Algebra', duration: 20, is_free_preview: false },
            ],
        },
        {
            id: 'm4',
            title: 'Geometry',
            lessons: [
                { id: 'l13', title: 'Angles and Lines', duration: 30, is_free_preview: false },
                { id: 'l14', title: 'Triangles', duration: 35, is_free_preview: false },
                { id: 'l15', title: 'Circles', duration: 40, is_free_preview: false },
                { id: 'l16', title: 'Practice Quiz: Geometry', duration: 20, is_free_preview: false },
            ],
        },
    ],
    enrolled_count: 1250,
    rating: 4.8,
    reviews_count: 342,
    features: [
        '40 hours of video content',
        '30 comprehensive lessons',
        'Downloadable PDF notes',
        'Practice quizzes after each module',
        'Certificate on completion',
        'Lifetime access',
    ],
};

export default function CourseDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { profile, signOut, isLoading: authLoading } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<string[]>(['m1']);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleEnroll = () => {
        if (mockCourseDetail.is_premium) {
            // Redirect to payment
            router.push(`/payment/${mockCourseDetail.slug}`);
        } else {
            // Free enrollment
            setIsEnrolled(true);
            addToast({
                type: 'success',
                title: 'Enrolled successfully!',
                message: 'You can now access all course materials.',
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const totalLessons = mockCourseDetail.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Sidebar role="student" />
                <div className="lg:ml-64">
                    <Header user={null} />
                    <main className="p-4 lg:p-6 pb-20 lg:pb-6">
                        <div className="max-w-5xl mx-auto">
                            <Skeleton className="h-64 w-full rounded-xl mb-6" />
                            <Skeleton className="h-8 w-2/3 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </main>
                </div>
                <MobileNav role="student" />
            </div>
        );
    }

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

                <main className="pb-20 lg:pb-6">
                    {/* Hero Section */}
                    <div className="relative h-64 lg:h-80 overflow-hidden">
                        <img
                            src={mockCourseDetail.thumbnail_url}
                            alt={mockCourseDetail.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="max-w-5xl mx-auto">
                                <div className="flex gap-2 mb-3">
                                    <LevelBadge level={mockCourseDetail.level} />
                                    {mockCourseDetail.is_premium ? <PremiumBadge /> : <FreeBadge />}
                                </div>
                                <h1 className="text-2xl lg:text-4xl font-display font-bold text-white mb-2">
                                    {mockCourseDetail.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {mockCourseDetail.rating} ({mockCourseDetail.reviews_count} reviews)
                                    </span>
                                    <span>{mockCourseDetail.enrolled_count.toLocaleString()} enrolled</span>
                                    <span>{totalLessons} lessons</span>
                                    <span>{mockCourseDetail.duration_hours} hours</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto p-4 lg:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <Card>
                                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">About this course</h2>
                                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                                        {mockCourseDetail.description}
                                    </p>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[var(--border)]">
                                        <img
                                            src={mockCourseDetail.instructor.avatar}
                                            alt={mockCourseDetail.instructor.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-[var(--foreground)]">
                                                {mockCourseDetail.instructor.name}
                                            </p>
                                            <p className="text-sm text-[var(--muted-foreground)]">
                                                {mockCourseDetail.instructor.title}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Curriculum */}
                                <Card>
                                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Curriculum</h2>
                                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                                        {mockCourseDetail.modules.length} modules • {totalLessons} lessons • {mockCourseDetail.duration_hours} hours total
                                    </p>

                                    <div className="space-y-3">
                                        {mockCourseDetail.modules.map((module, index) => (
                                            <div key={module.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleModule(module.id)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--muted)] transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 flex items-center justify-center font-medium text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-medium text-[var(--foreground)]">{module.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-[var(--muted-foreground)]">
                                                            {module.lessons.length} lessons
                                                        </span>
                                                        <svg
                                                            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''
                                                                }`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>

                                                {expandedModules.includes(module.id) && (
                                                    <div className="border-t border-[var(--border)]">
                                                        {module.lessons.map((lesson) => (
                                                            <div
                                                                key={lesson.id}
                                                                className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="text-[var(--foreground)]">{lesson.title}</span>
                                                                    {lesson.is_free_preview && (
                                                                        <Badge variant="success" size="sm">Free Preview</Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-[var(--muted-foreground)]">
                                                                    {lesson.duration} min
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-20">
                                    <Card>
                                        {/* Price */}
                                        <div className="text-center mb-6">
                                            {mockCourseDetail.is_premium ? (
                                                <p className="text-3xl font-bold text-[var(--foreground)]">
                                                    {formatPrice(mockCourseDetail.price)}
                                                </p>
                                            ) : (
                                                <p className="text-3xl font-bold text-success-600">Free</p>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        {isEnrolled ? (
                                            <Link href={`/courses/${slug}/learn`}>
                                                <Button fullWidth size="lg">
                                                    Start Learning
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button fullWidth size="lg" onClick={handleEnroll}>
                                                {mockCourseDetail.is_premium ? 'Enroll Now' : 'Start Free Course'}
                                            </Button>
                                        )}

                                        {/* Features */}
                                        <div className="mt-6 pt-6 border-t border-[var(--border)]">
                                            <h3 className="font-medium text-[var(--foreground)] mb-4">This course includes:</h3>
                                            <ul className="space-y-3">
                                                {mockCourseDetail.features.map((feature, index) => (
                                                    <li key={index} className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-sm text-[var(--muted-foreground)]">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}
