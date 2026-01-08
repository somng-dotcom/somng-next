import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'


// Routes that require authentication
const protectedRoutes = ['/dashboard', '/courses', '/my-courses', '/profile', '/support']
// Routes that require admin role
const adminRoutes = ['/admin']
// Routes only for non-authenticated users
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
    try {
        let supabaseResponse = NextResponse.next({
            request,
        })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Refresh session if expired - required for Server Components
        const { data: { user } } = await supabase.auth.getUser()
        const pathname = request.nextUrl.pathname

        // Check if route is protected
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
        const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
        const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

        // Redirect unauthenticated users from protected routes
        if ((isProtectedRoute || isAdminRoute) && !user) {
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Redirect authenticated users away from auth pages
        if (isAuthRoute && user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Check admin access - verify user has admin role from database
        if (isAdminRoute && user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            // If profile fetch failed or user is not admin, redirect to dashboard
            if (error || profile?.role !== 'admin') {
                console.warn(`[Middleware] Non-admin user ${user.id} attempted to access admin route: ${pathname}`)
                const redirectUrl = new URL('/dashboard', request.url)
                redirectUrl.searchParams.set('unauthorized', 'admin')
                return NextResponse.redirect(redirectUrl)
            }
        }

        return supabaseResponse
    } catch (error: unknown) {
        // Handle Supabase Auth errors gracefully
        const err = error as { code?: string; message?: string };
        if (err?.code === 'refresh_token_not_found' ||
            err?.message?.includes('Refresh Token Not Found') ||
            (err?.code === '400' && err?.message?.includes('Refresh Token'))) {

            console.warn('Invalid refresh token detected. Clearing session and redirecting to login.');

            // Create response to clear cookies and redirect
            const response = NextResponse.redirect(new URL('/login', request.url));

            // Clear all Supabase cookies
            const cookies = request.cookies.getAll();
            cookies.forEach(cookie => {
                if (cookie.name.startsWith('sb-')) {
                    response.cookies.delete(cookie.name);
                }
            });

            return response;
        }

        console.error('Middleware execution failed:', error);

        const errorMessage = err?.message || 'Unknown middleware error';
        const errorStack = (error as Error)?.stack;

        return new NextResponse(
            JSON.stringify({
                error: 'Middleware Error',
                message: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
            }),
            { status: 500, headers: { 'content-type': 'application/json' } }
        );
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
