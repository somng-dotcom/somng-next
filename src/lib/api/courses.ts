import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Course = Database['public']['Tables']['courses']['Row'];
type Enrollment = Database['public']['Tables']['enrollments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];

const supabase = createClient();

// ============================================
// COURSES
// ============================================

export async function getCourses(options?: {
    level?: string;
    isPremium?: boolean;
    status?: string;
    search?: string;
    limit?: number;
}) {
    try {
        let query = supabase
            .from('courses')
            .select(`
                *,
                modules:modules(count),
                enrollments:enrollments(count)
            `)
            .eq('status', options?.status || 'published')
            .order('created_at', { ascending: false });

        if (options?.level) {
            query = query.eq('level', options.level);
        }

        if (options?.isPremium !== undefined) {
            query = query.eq('is_premium', options.isPremium);
        }

        if (options?.search) {
            query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error fetching courses:', error.message, error.code);
            throw new Error(`Database error: ${error.message}`);
        }

        // Transform the count aggregations
        return data?.map(course => ({
            ...course,
            lessons_count: course.modules?.[0]?.count || 0,
            enrolled_count: course.enrollments?.[0]?.count || 0,
        })) || [];
    } catch (err: any) {
        console.error('getCourses failed with relations, trying simple fetch:', err);

        // Fallback: Try fetching just courses without relations
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('status', options?.status || 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('Fallback fetch successful, found:', data?.length);

            return data?.map(course => ({
                ...course,
                lessons_count: 0,
                enrolled_count: 0,
            })) || [];
        } catch (fallbackErr) {
            console.error('Fallback getCourses failed:', fallbackErr);
            throw fallbackErr;
        }
    }
}

export async function getCourseBySlug(slug: string) {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            modules (
                id,
                title,
                description,
                order_index,
                lessons (
                    id,
                    title,
                    content_type,
                    duration_minutes,
                    order_index,
                    is_free_preview,
                    content_url,
                    content_text
                )
            )
        `)
        .eq('slug', slug)
        .single();

    if (error) throw error;

    // Sort modules and lessons by order_index
    if (data?.modules) {
        data.modules.sort((a: any, b: any) => a.order_index - b.order_index);
        data.modules.forEach((module: any) => {
            module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index);
        });
    }

    return data;
}

export async function getCourseById(id: string) {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            modules (
                id,
                title,
                description,
                order_index,
                lessons (
                    id,
                    title,
                    content_type,
                    duration_minutes,
                    order_index,
                    is_free_preview,
                    content_url
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    // Sort modules and lessons by order_index
    if (data?.modules) {
        data.modules.sort((a: any, b: any) => a.order_index - b.order_index);
        data.modules.forEach((module: any) => {
            module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index);
        });
    }

    return data;
}

export async function getCourseStats() {
    const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

    const { count: premiumCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('is_premium', true);

    const { count: freeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('is_premium', false);

    return {
        total: totalCourses || 0,
        premium: premiumCourses || 0,
        free: freeCourses || 0,
    };
}

// ============================================
// ENROLLMENTS
// ============================================

export async function getUserEnrollments(userId: string) {
    const { data, error } = await supabase
        .from('enrollments')
        .select(`
            *,
            course:courses (
                id,
                title,
                slug,
                thumbnail_url,
                level,
                is_premium,
                modules (
                    id,
                    order_index,
                    lessons (
                        id,
                        order_index
                    )
                )
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });

    if (error) throw error;

    // Sort modules and lessons
    const enrolledCourses = data?.map(enrollment => {
        if (enrollment.course?.modules) {
            // Sort modules
            enrollment.course.modules.sort((a: any, b: any) => a.order_index - b.order_index);
            // Sort lessons in each module
            enrollment.course.modules.forEach((module: any) => {
                if (module.lessons) {
                    module.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
                }
            });
        }
        return enrollment;
    });

    return enrolledCourses || [];
}

export async function isUserEnrolled(userId: string, courseId: string) {
    const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return !!data;
}

export async function enrollUser(userId: string, courseId: string) {
    const { data, error } = await supabase
        .from('enrollments')
        .insert({
            user_id: userId,
            course_id: courseId,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// LESSON PROGRESS
// ============================================

export async function getLessonProgress(userId: string, lessonIds: string[]) {
    const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

    if (error) throw error;
    return data || [];
}

export async function getCourseProgress(userId: string, courseId: string) {
    // Get all lessons for the course
    const { data: modules } = await supabase
        .from('modules')
        .select('lessons(id)')
        .eq('course_id', courseId);

    const allLessonIds = modules?.flatMap(m => m.lessons?.map(l => l.id) || []) || [];

    if (allLessonIds.length === 0) {
        return { completed: 0, total: 0, percentage: 0 };
    }

    // Get completed lessons
    const { count: completed } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('lesson_id', allLessonIds)
        .eq('completed', true);

    return {
        completed: completed || 0,
        total: allLessonIds.length,
        percentage: Math.round(((completed || 0) / allLessonIds.length) * 100),
    };
}

export async function markLessonComplete(userId: string, lessonId: string) {
    const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
            user_id: userId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id, lesson_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// ADMIN STATS
// ============================================

export async function getAdminStats() {
    const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

    const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

    const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success');

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return {
        students: totalStudents || 0,
        courses: totalCourses || 0,
        enrollments: totalEnrollments || 0,
        revenue: totalRevenue,
    };
}

export async function getRecentEnrollments(limit = 5) {
    const { data, error } = await supabase
        .from('enrollments')
        .select(`
            *,
            profile:profiles(full_name, email, avatar_url),
            course:courses(title, slug)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function getPopularCourses(limit = 5) {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            slug,
            thumbnail_url,
            enrollments:enrollments(count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return data?.map(course => ({
        ...course,
        enrolled_count: course.enrollments?.[0]?.count || 0,
    })).sort((a, b) => b.enrolled_count - a.enrolled_count) || [];
}

// ============================================
// ADMIN COURSE MANAGEMENT
// ============================================

export async function getAdminCourses(options?: {
    status?: string;
    level?: string;
    search?: string;
}) {
    let query = supabase
        .from('courses')
        .select(`
            *,
            enrollments:enrollments(count)
        `)
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.level) {
        query = query.eq('level', options.level);
    }

    if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(course => ({
        ...course,
        enrolled_count: course.enrollments?.[0]?.count || 0,
    })) || [];
}

export async function deleteCourse(courseId: string) {
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

    if (error) throw error;
}

export async function updateCourseStatus(courseId: string, status: 'draft' | 'published' | 'archived') {
    const { error } = await supabase
        .from('courses')
        .update({ status })
        .eq('id', courseId);

    if (error) throw error;
}

export async function createCourse(course: {
    title: string;
    slug: string;
    description?: string;
    level?: string;
    price?: number;
    is_premium?: boolean;
    thumbnail_url?: string;
}) {
    const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCourse(id: string, updates: any) {
    const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// MODULES & LESSONS MANAGEMENT
// ============================================

export async function createModule(module: {
    course_id: string;
    title: string;
    description?: string;
    order_index: number;
}) {
    const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateModule(id: string, updates: any) {
    const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteModule(id: string) {
    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function createLesson(lesson: {
    module_id: string;
    title: string;
    content_type: 'video' | 'text' | 'pdf' | 'quiz';
    content_url?: string;
    content_text?: string;
    duration_minutes?: number;
    order_index: number;
    is_free_preview?: boolean;
}) {
    const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateLesson(id: string, updates: any) {
    const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteLesson(id: string) {
    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
