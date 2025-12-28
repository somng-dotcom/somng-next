'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { LevelBadge, PremiumBadge, FreeBadge } from '@/components/ui/Badge';
import { CardSkeleton, CourseGridSkeleton } from '@/components/ui/Skeleton';
import { getCourses } from '@/lib/api/courses';
import { CourseLevel } from '@/types/database';

interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    level: CourseLevel;
    is_premium: boolean;
    price: number;
    duration_hours: number | null;
    lessons_count: number;
    enrolled_count: number;
}

const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'JAMB', label: 'JAMB' },
    { value: 'WAEC', label: 'WAEC' },
    { value: 'SS1', label: 'SS1' },
    { value: 'SS2', label: 'SS2' },
    { value: 'Others', label: 'Others' },
];

const typeOptions = [
    { value: '', label: 'All Pricing' },
    { value: 'free', label: 'Free Courses' },
    { value: 'premium', label: 'Paid Courses' },
];

function CoursesContent() {
    const { profile, signOut } = useAuth();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
    const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

    // Sync state with URL params when they change (e.g. navigation links)
    useEffect(() => {
        setSelectedLevel(searchParams.get('level') || '');
        setSelectedType(searchParams.get('type') || '');
    }, [searchParams]);

    useEffect(() => {
        async function loadCourses() {
            try {
                const data = await getCourses({
                    level: selectedLevel || undefined,
                    isPremium: selectedType === 'premium' ? true : selectedType === 'free' ? false : undefined,
                    search: searchQuery || undefined,
                });
                console.log('Fetched courses:', data);
                setCourses(data as Course[]);
            } catch (error: any) {
                console.error('Error loading courses:', {
                    message: error.message || 'Unknown error',
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: error
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadCourses();
    }, [selectedLevel, selectedType, searchQuery]);

    // Filter courses by search (client-side for instant feedback)
    const filteredCourses = courses.filter((course) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            course.title.toLowerCase().includes(query) ||
            (course.description && course.description.toLowerCase().includes(query))
        );
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

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

                <main className="p-4 lg:p-6 pt-16 pb-24 lg:pt-6 lg:pb-6">
                    <div id="catalog-filters" className="mb-6">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">All Courses</h2>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    }
                                />
                            </div>
                            <div className="flex gap-3">
                                <Select
                                    options={levelOptions}
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="w-36"
                                />
                                <Select
                                    options={typeOptions}
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-32"
                                />
                            </div>
                        </div>

                        {/* Results count */}
                        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                            Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                        </p>

                        {/* Course Grid */}
                        {isLoading ? (
                            <CourseGridSkeleton count={6} />
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-[var(--foreground)]">No courses found</h3>
                                <p className="mt-2 text-[var(--muted-foreground)]">Try adjusting your filters or search query</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCourses.map((course) => (
                                    <Link key={course.id} href={`/courses/${course.slug}`}>
                                        <Card hover padding="none" className="overflow-hidden h-full flex flex-col">
                                            {/* Thumbnail */}
                                            <div className="relative h-44">
                                                <img
                                                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <LevelBadge level={course.level} />
                                                </div>
                                                <div className="absolute top-3 right-3">
                                                    {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 mb-2">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4 flex-1">
                                                    {course.description}
                                                </p>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        {course.lessons_count || 0} lessons
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {course.duration_hours || 0}h
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        {course.enrolled_count.toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Price & CTA */}
                                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                                    <div>
                                                        {course.is_premium ? (
                                                            <p className="text-lg font-bold text-[var(--foreground)]">
                                                                {formatPrice(course.price)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-lg font-bold text-success-600">Free</p>
                                                        )}
                                                    </div>
                                                    <Button size="sm">View Course</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}

// Loading fallback component
function CoursesLoading() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar role="student" />
            <div className="lg:ml-64">
                <Header user={null} />
                <main className="p-4 lg:p-6 pt-16 pb-24 lg:pt-6 lg:pb-6">
                    <div className="mb-8">
                        <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-[var(--muted)] rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                </main>
            </div>
            <MobileNav role="student" />
        </div>
    );
}

// Main export wrapped in Suspense
export default function CoursesPage() {
    return (
        <Suspense fallback={<CoursesLoading />}>
            <CoursesContent />
        </Suspense>
    );
}
