// Database types for School of Mathematics Nigeria LMS
// These types match the Supabase schema

export type UserRole = 'student' | 'admin' | 'instructor';
export type CourseLevel = 'JAMB' | 'WAEC' | 'SS1' | 'SS2' | 'Others';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'video' | 'pdf' | 'quiz' | 'text';
export type QuestionType = 'mcq' | 'short_answer';
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentType = 'one_time' | 'subscription';
export type PaymentProvider = 'paystack';
export type SubscriptionPlan = 'monthly' | 'quarterly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// ============================================
// Database Tables
// ============================================

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    order_index: number;
    created_at: string;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    category_id: string | null;
    level: CourseLevel | null;
    is_premium: boolean;
    price: number;
    duration_hours: number | null;
    instructor_id: string | null;
    status: CourseStatus;
    created_at: string;
    updated_at: string;
}

export interface Module {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order_index: number;
    created_at: string;
}

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    content_type: ContentType | null;
    content_url: string | null;
    content_text: string | null;
    thumbnail_url: string | null;
    duration_minutes: number | null;
    order_index: number;
    is_free_preview: boolean;
    created_at: string;
}

export interface Quiz {
    id: string;
    lesson_id: string;
    title: string;
    passing_score: number;
    time_limit_minutes: number | null;
    created_at: string;
}

export interface QuizOption {
    text: string;
    is_correct: boolean;
}

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: QuestionType;
    options: QuizOption[] | null;
    correct_answer: string | null;
    points: number;
    order_index: number;
    created_at: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string;
    expires_at: string | null;
    status: EnrollmentStatus;
}

export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
    last_position: number;
    created_at: string;
}

export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number | null;
    max_score: number | null;
    passed: boolean | null;
    answers: Record<string, unknown> | null;
    started_at: string;
    completed_at: string | null;
}

export interface Payment {
    id: string;
    user_id: string;
    course_id: string | null;
    amount: number;
    currency: string;
    payment_type: PaymentType | null;
    subscription_plan: string | null;
    provider: PaymentProvider | null;
    provider_reference: string | null;
    status: PaymentStatus;
    created_at: string;
    paid_at: string | null;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan: SubscriptionPlan;
    amount: number;
    status: SubscriptionStatus;
    current_period_start: string | null;
    current_period_end: string | null;
    created_at: string;
}

export interface SupportTicket {
    id: string;
    user_id: string | null;
    subject: string;
    message: string;
    status: TicketStatus;
    created_at: string;
    resolved_at: string | null;
}

// ============================================
// Extended Types (with relations)
// ============================================

export interface CourseWithDetails extends Course {
    category?: Category;
    instructor?: Profile;
    modules?: ModuleWithLessons[];
    enrollment_count?: number;
}

export interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

export interface LessonWithProgress extends Lesson {
    progress?: LessonProgress;
    quiz?: Quiz;
}

export interface EnrollmentWithCourse extends Enrollment {
    course: Course;
}

export interface CourseProgress {
    course_id: string;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
}

// ============================================
// Form Types
// ============================================

export interface CreateCourseInput {
    title: string;
    slug?: string;
    description?: string;
    thumbnail_url?: string;
    category_id?: string;
    level?: CourseLevel;
    is_premium?: boolean;
    price?: number;
    duration_hours?: number;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
    status?: CourseStatus;
}

export interface CreateModuleInput {
    course_id: string;
    title: string;
    description?: string;
    order_index?: number;
}

export interface CreateLessonInput {
    module_id: string;
    title: string;
    content_type?: ContentType;
    content_url?: string;
    content_text?: string;
    duration_minutes?: number;
    order_index?: number;
    is_free_preview?: boolean;
    thumbnail_url?: string;
}

export interface CreateQuizInput {
    lesson_id: string;
    title: string;
    passing_score?: number;
    time_limit_minutes?: number;
}

export interface CreateQuestionInput {
    quiz_id: string;
    question_text: string;
    question_type: QuestionType;
    options?: QuizOption[];
    correct_answer?: string;
    points?: number;
    order_index?: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ============================================
// Dashboard Stats
// ============================================

export interface AdminStats {
    total_students: number;
    total_courses: number;
    total_enrollments: number;
    total_revenue: number;
    recent_enrollments: EnrollmentWithCourse[];
    popular_courses: CourseWithDetails[];
}

export interface StudentStats {
    enrolled_courses: number;
    completed_courses: number;
    total_lessons_completed: number;
    average_quiz_score: number;
}

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Partial<Profile>;
                Update: Partial<Profile>;
            };
            categories: {
                Row: Category;
                Insert: Partial<Category>;
                Update: Partial<Category>;
            };
            courses: {
                Row: Course;
                Insert: CreateCourseInput;
                Update: UpdateCourseInput;
            };
            modules: {
                Row: Module;
                Insert: CreateModuleInput;
                Update: Partial<CreateModuleInput>;
            };
            lessons: {
                Row: Lesson;
                Insert: CreateLessonInput;
                Update: Partial<CreateLessonInput>;
            };
            quizzes: {
                Row: Quiz;
                Insert: CreateQuizInput;
                Update: Partial<CreateQuizInput>;
            };
            quiz_options: {
                Row: QuizOption;
                Insert: Partial<QuizOption>;
                Update: Partial<QuizOption>;
            };
            quiz_questions: {
                Row: QuizQuestion;
                Insert: CreateQuestionInput;
                Update: Partial<CreateQuestionInput>;
            };
            enrollments: {
                Row: Enrollment;
                Insert: Partial<Enrollment>;
                Update: Partial<Enrollment>;
            };
            lesson_progress: {
                Row: LessonProgress;
                Insert: Partial<LessonProgress>;
                Update: Partial<LessonProgress>;
            };
            quiz_attempts: {
                Row: QuizAttempt;
                Insert: Partial<QuizAttempt>;
                Update: Partial<QuizAttempt>;
            };
            payments: {
                Row: Payment;
                Insert: Partial<Payment>;
                Update: Partial<Payment>;
            };
            subscriptions: {
                Row: Subscription;
                Insert: Partial<Subscription>;
                Update: Partial<Subscription>;
            };
            support_tickets: {
                Row: SupportTicket;
                Insert: Partial<SupportTicket>;
                Update: Partial<SupportTicket>;
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
