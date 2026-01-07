# LMS System - Comprehensive Security & Code Quality Audit Report

**Date:** Generated on Review  
**System:** Learning Management System (Next.js + Supabase)  
**Reviewer:** Senior Developer Audit

---

## Executive Summary

This audit identifies critical and non-critical issues that could affect the smooth operation of the LMS system, particularly on the admin and student sides. Issues range from security vulnerabilities to code quality problems that could lead to runtime errors, data inconsistencies, and poor user experience.

### Severity Levels
- 🔴 **CRITICAL**: Must fix immediately - affects security, data integrity, or system stability
- 🟠 **HIGH**: Should fix soon - affects user experience or could lead to data loss
- 🟡 **MEDIUM**: Recommended to fix - affects code quality and maintainability
- 🔵 **LOW**: Nice to have - minor improvements

---

## 🔴 CRITICAL ISSUES

### 1. Race Condition in Payment Verification (Paystack & Flutterwave)

**Location:** 
- `src/app/api/paystack/verify/route.ts` (lines 138-202)
- `src/app/api/payments/verify/route.ts` (lines 117-169)

**Issue:**
Multiple simultaneous payment verification requests for the same transaction can result in:
- Duplicate enrollments
- Duplicate payment records
- Inconsistent database state

**Current Code Problem:**
```typescript
// Check if already enrolled - RACE CONDITION HERE
const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .single();

// Time gap where another request could pass the check
// Then create enrollment without proper locking
const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .insert({...})
```

**Professional Fix:**
```typescript
// Use database-level constraints and upsert with conflict resolution
// Add unique constraint on (user_id, course_id) in enrollments table
// Use INSERT ... ON CONFLICT DO NOTHING or use database transaction

// Better: Use database transaction or advisory locks
const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .insert({
        user_id: user.id,
        course_id: course_id,
        status: 'active',
    })
    .select()
    .single();

// Handle unique constraint violation gracefully
if (enrollmentError?.code === '23505') { // Unique violation
    // Already enrolled, return existing enrollment
    const { data: existing } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course_id)
        .single();
    return NextResponse.json({
        success: true,
        message: 'Already enrolled',
        enrollment_id: existing?.id
    });
}
```

**Database Fix Required:**
```sql
-- Add unique constraint to prevent duplicate enrollments
ALTER TABLE enrollments 
ADD CONSTRAINT unique_user_course_enrollment 
UNIQUE (user_id, course_id) 
WHERE status = 'active';
```

---

### 2. Missing Environment Variable Validation

**Location:** 
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/middleware.ts`
- All API routes

**Issue:**
Using non-null assertion (`!`) without validation. If environment variables are missing, the app will fail at runtime with unclear errors.

**Current Code:**
```typescript
return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Professional Fix:**
```typescript
// Create utility function
function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// Use it
export function createClient() {
    return createBrowserClient(
        getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
        getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
}
```

---

### 3. XSS Vulnerability - Unsanitized HTML Content

**Location:** `src/app/(student)/courses/[slug]/learn/[lessonId]/page.tsx` (line 391)

**Issue:**
Using `dangerouslySetInnerHTML` without sanitization allows XSS attacks if malicious content is stored in the database.

**Current Code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: currentLesson.content_text }} />
```

**Professional Fix:**
```typescript
// Install DOMPurify: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';

// Sanitize content before rendering
<div 
    dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(currentLesson.content_text, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
            ALLOWED_ATTR: ['href', 'target']
        })
    }} 
/>
```

---

### 4. Missing Idempotency in Payment Verification

**Location:** 
- `src/app/api/payments/verify/route.ts` (Flutterwave)
- `src/app/api/paystack/verify/route.ts` (Has partial check but not complete)

**Issue:**
Payment verification can be called multiple times for the same transaction, potentially creating duplicate payment records.

**Current Code (Flutterwave):**
```typescript
// No check for existing payment record
const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({...})
```

**Professional Fix:**
```typescript
// Check for existing payment first (Paystack does this, Flutterwave doesn't)
const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('provider_reference', transaction_id.toString())
    .single();

if (existingPayment) {
    // Payment already recorded, use existing
    paymentId = existingPayment.id;
} else {
    // Create new payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({...})
        .select()
        .single();
    // Handle error...
}
```

---

### 5. Non-Atomic Payment + Enrollment Operations

**Location:** All payment verification routes

**Issue:**
Payment recording and enrollment creation are separate operations. If enrollment fails after payment is recorded, user is charged but not enrolled.

**Professional Fix:**
Use database transactions (Postgres transactions via Supabase):

```typescript
// Use Supabase RPC function to wrap in transaction
// Create SQL function:
/*
CREATE OR REPLACE FUNCTION process_payment_enrollment(
    p_user_id UUID,
    p_course_id UUID,
    p_amount DECIMAL,
    p_currency TEXT,
    p_provider TEXT,
    p_provider_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_payment_id UUID;
    v_enrollment_id UUID;
BEGIN
    -- Insert payment
    INSERT INTO payments (user_id, course_id, amount, currency, provider, provider_reference, status, paid_at)
    VALUES (p_user_id, p_course_id, p_amount, p_currency, p_provider, p_provider_reference, 'success', NOW())
    RETURNING id INTO v_payment_id;
    
    -- Insert enrollment (with conflict handling)
    INSERT INTO enrollments (user_id, course_id, status)
    VALUES (p_user_id, p_course_id, 'active')
    ON CONFLICT (user_id, course_id) WHERE status = 'active' DO NOTHING
    RETURNING id INTO v_enrollment_id;
    
    -- Return result
    RETURN json_build_object(
        'payment_id', v_payment_id,
        'enrollment_id', COALESCE(v_enrollment_id, (SELECT id FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id))
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

// Then call from API:
const { data, error } = await supabaseAdmin.rpc('process_payment_enrollment', {
    p_user_id: user.id,
    p_course_id: course_id,
    p_amount: paidAmount,
    p_currency: transaction.currency,
    p_provider: 'paystack',
    p_provider_reference: reference.toString()
});
```

---

## 🟠 HIGH PRIORITY ISSUES

### 6. Missing Error Boundaries

**Location:** All React pages

**Issue:**
Unhandled React errors crash the entire page instead of showing user-friendly error messages.

**Professional Fix:**
```typescript
// Create src/components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Send to error tracking service (e.g., Sentry)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                        <p className="text-gray-600 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Wrap layouts:
<ErrorBoundary>
    <AdminLayout>{children}</AdminLayout>
</ErrorBoundary>
```

---

### 7. Inconsistent Error Handling in API Routes

**Location:** All API routes

**Issue:**
Some routes return generic errors, some return detailed errors. Inconsistent error format makes frontend error handling difficult.

**Professional Fix:**
Create standardized error response utility:

```typescript
// src/lib/api/errors.ts
export interface ApiError {
    error: string;
    code?: string;
    details?: any;
    statusCode: number;
}

export function createErrorResponse(
    error: string,
    statusCode: number = 500,
    details?: any,
    code?: string
): Response {
    return NextResponse.json(
        {
            error,
            code,
            details: process.env.NODE_ENV === 'development' ? details : undefined,
        },
        { status: statusCode }
    );
}

export function createSuccessResponse(data: any, statusCode: number = 200): Response {
    return NextResponse.json({ success: true, data }, { status: statusCode });
}

// Use in routes:
if (!transaction_id || !course_id) {
    return createErrorResponse(
        'Missing required fields',
        400,
        { missing: ['transaction_id', 'course_id'] },
        'MISSING_FIELDS'
    );
}
```

---

### 8. Missing Input Validation on Admin Course Creation

**Location:** `src/app/(admin)/admin/courses/new/page.tsx`

**Issue:**
Minimal validation. Can create courses with empty titles, invalid prices, etc.

**Current Code:**
```typescript
// Only checks if premium course has price > 0
if (courseForm.is_premium && courseForm.price <= 0) {
    addToast({ type: 'error', title: 'Validation Error', message: 'Premium courses must have a price greater than 0.' });
    return;
}
```

**Professional Fix:**
```typescript
// Add comprehensive validation
const validateCourseForm = (form: typeof courseForm): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!form.title || form.title.trim().length < 3) {
        errors.push('Course title must be at least 3 characters');
    }
    
    if (form.title && form.title.length > 200) {
        errors.push('Course title must be less than 200 characters');
    }
    
    if (form.description && form.description.length > 5000) {
        errors.push('Description must be less than 5000 characters');
    }
    
    if (form.is_premium) {
        if (!form.price || form.price <= 0) {
            errors.push('Premium courses must have a price greater than 0');
        }
        if (form.price > 1000000) {
            errors.push('Price must be less than 1,000,000 NGN');
        }
    }
    
    if (!['JAMB', 'WAEC', 'SS1', 'SS2', 'SS3'].includes(form.level) && !form.level.trim()) {
        errors.push('Please select a valid course level');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Use in handleCreate:
const validation = validateCourseForm(courseForm);
if (!validation.isValid) {
    validation.errors.forEach(error => {
        addToast({ type: 'error', title: 'Validation Error', message: error });
    });
    return;
}
```

---

### 9. Duplicate Code in New Course Page

**Location:** `src/app/(admin)/admin/courses/new/page.tsx` (lines 28-36)

**Issue:**
Duplicate `if (isLoading)` check.

**Current Code:**
```typescript
if (isLoading) {
    if (isLoading) {  // Duplicate!
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }
}
```

**Professional Fix:**
```typescript
if (isLoading) {
    return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
    );
}
```

---

### 10. Missing Error Handling in Auth Callback

**Location:** `src/app/auth/callback/route.ts`

**Issue:**
If `exchangeCodeForSession` fails, user is redirected to login with error param, but no logging or error tracking.

**Professional Fix:**
```typescript
if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
        console.error('Auth callback error:', error);
        // Log to error tracking service
        // Send to analytics
        return NextResponse.redirect(`${origin}/login?error=auth_code_error&details=${encodeURIComponent(error.message)}`);
    }
    // ... rest of code
}
```

---

### 11. Missing Rate Limiting on Payment Verification

**Location:** All payment verification routes

**Issue:**
No rate limiting allows potential abuse and brute force attempts.

**Professional Fix:**
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
// Or use middleware-level rate limiting

// Simple in-memory rate limiting (for development)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);
    
    if (!record || now > record.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
        return true;
    }
    
    if (record.count >= limit) {
        return false;
    }
    
    record.count++;
    return true;
}

// In route handler:
const userIdentifier = `${user.id}:${course_id}`;
if (!checkRateLimit(userIdentifier, 5, 60000)) {
    return createErrorResponse(
        'Too many requests. Please try again later.',
        429,
        undefined,
        'RATE_LIMIT_EXCEEDED'
    );
}
```

---

### 12. Missing Transaction Retry Logic

**Location:** All database operations in payment routes

**Issue:**
If database operation fails due to temporary network issue, request fails completely. No retry mechanism.

**Professional Fix:**
```typescript
// src/lib/utils/retry.ts
export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry on client errors (4xx)
            if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) {
                    throw error;
                }
            }
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
            }
        }
    }
    
    throw lastError!;
}

// Use:
const { data: enrollment, error: enrollmentError } = await retryOperation(
    () => supabaseAdmin.from('enrollments').insert({...}).select().single()
);
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 13. Missing Type Safety - Using `any` Types

**Location:** Multiple files (e.g., `src/lib/api/courses.ts` line 480)

**Issue:**
Using `any` reduces type safety and can hide bugs.

**Professional Fix:**
```typescript
// Define proper types
export interface CourseUpdate {
    title?: string;
    description?: string;
    level?: string;
    price?: number;
    is_premium?: boolean;
    thumbnail_url?: string;
    status?: 'draft' | 'published' | 'archived';
    // ... other fields
}

export async function updateCourse(id: string, updates: CourseUpdate) {
    // ... implementation
}
```

---

### 14. Missing Loading States in Some Components

**Location:** Various pages

**Issue:**
Some async operations don't show loading states, causing confusion.

**Recommendation:** Ensure all async operations show appropriate loading indicators.

---

### 15. Missing User Feedback on Database Errors

**Location:** `src/lib/api/courses.ts` and other API files

**Issue:**
Database errors are thrown but not always caught and displayed to users properly.

**Professional Fix:**
```typescript
// Wrap database calls with proper error handling
export async function getCourses(options?: {...}) {
    try {
        // ... existing code
    } catch (error) {
        console.error('Error fetching courses:', error);
        // Transform Supabase errors to user-friendly messages
        if (error instanceof Error) {
            if (error.message.includes('JWT')) {
                throw new Error('Authentication required. Please log in again.');
            }
            if (error.message.includes('permission')) {
                throw new Error('You do not have permission to view courses.');
            }
        }
        throw new Error('Failed to load courses. Please try again later.');
    }
}
```

---

### 16. Potential Memory Leak in useAuth Hook

**Location:** `src/hooks/useAuth.tsx` (lines 88-124)

**Issue:**
Interval cleanup might not happen if component unmounts during async operation.

**Professional Fix:**
```typescript
useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    const handleRevalidation = async () => {
        if (!isMounted) return;
        // ... existing code
    };

    const onFocus = () => {
        if (isMounted) handleRevalidation();
    };

    window.addEventListener('focus', onFocus);
    intervalId = setInterval(handleRevalidation, 4 * 60 * 1000);

    return () => {
        isMounted = false;
        window.removeEventListener('focus', onFocus);
        if (intervalId) clearInterval(intervalId);
    };
}, [session]);
```

---

## 🔵 LOW PRIORITY ISSUES

### 17. Missing Comprehensive Logging

**Issue:** 
Limited logging makes debugging production issues difficult.

**Recommendation:** 
Implement structured logging with log levels (info, warn, error) and consider integrating logging service (e.g., Winston, Pino, or cloud logging).

---

### 18. Missing API Response Caching

**Issue:**
Course data is fetched on every page load, even when it hasn't changed.

**Recommendation:**
Implement React Query or SWR for client-side caching, or use Next.js revalidation.

---

### 19. Missing Database Query Optimization

**Issue:**
Some queries could benefit from indexes or better structure.

**Recommendation:**
Review database indexes on frequently queried columns (user_id, course_id, status, etc.).

---

### 20. Missing Comprehensive Unit Tests

**Issue:**
No test files visible in codebase structure.

**Recommendation:**
Add unit tests for critical functions, especially payment verification and enrollment logic.

---

## Summary of Recommended Actions

### Immediate (Critical)
1. ✅ Add unique constraint on enrollments table
2. ✅ Implement idempotency checks in payment verification
3. ✅ Add environment variable validation
4. ✅ Sanitize HTML content before rendering
5. ✅ Use database transactions for payment + enrollment

### Short Term (High Priority)
6. ✅ Add Error Boundaries to all layouts
7. ✅ Standardize error responses across API routes
8. ✅ Add comprehensive form validation
9. ✅ Fix duplicate code issues
10. ✅ Add rate limiting to payment routes
11. ✅ Improve error handling in auth callback

### Medium Term (Medium Priority)
12. ✅ Replace `any` types with proper TypeScript types
13. ✅ Add retry logic for database operations
14. ✅ Improve user feedback on errors
15. ✅ Fix potential memory leaks

### Long Term (Low Priority)
16. ✅ Implement comprehensive logging
17. ✅ Add API response caching
18. ✅ Optimize database queries
19. ✅ Add unit tests

---

## Additional Recommendations

1. **Security Audit**: Consider a professional security audit for payment processing
2. **Monitoring**: Set up error monitoring (e.g., Sentry) and performance monitoring
3. **Documentation**: Document API endpoints and expected error codes
4. **Code Review Process**: Establish code review process before merging
5. **Testing Strategy**: Implement E2E tests for critical user flows (login, payment, enrollment)

---

**End of Report**

