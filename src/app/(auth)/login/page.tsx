'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Map error codes to user-friendly messages
const errorMessages: Record<string, { title: string; message: string }> = {
    otp_expired: {
        title: 'Link Expired',
        message: 'Your email verification link has expired. Please request a new one by signing up again.',
    },
    access_denied: {
        title: 'Access Denied',
        message: 'Unable to verify your account. Please try signing up again.',
    },
    invalid_request: {
        title: 'Invalid Request',
        message: 'The verification link is invalid. Please request a new one.',
    },
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [authError, setAuthError] = useState<{ title: string; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn, signInWithGoogle } = useAuth();
    const router = useRouter();

    // Check for auth errors in URL hash on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash) {
                const params = new URLSearchParams(hash.substring(1));
                const errorCode = params.get('error_code');
                const errorDescription = params.get('error_description');

                if (errorCode && errorMessages[errorCode]) {
                    setAuthError(errorMessages[errorCode]);
                } else if (errorDescription) {
                    setAuthError({
                        title: 'Authentication Error',
                        message: decodeURIComponent(errorDescription.replace(/\+/g, ' ')),
                    });
                }

                // Clean the URL
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAuthError(null);
        setIsLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Check user role for redirection
            // We need to fetch the profile manually here to get the role immediately
            // because the context update might be slightly delayed or we want ensure redirect logic is self-contained
            import('@/lib/supabase/client').then(async ({ createClient }) => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (profile?.role === 'admin') {
                        router.push('/admin'); // Redirect to admin dashboard
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    router.push('/dashboard'); // Fallback
                }
            });
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-[var(--background)] overflow-x-hidden font-display">
            <div className="layout-container flex h-full grow flex-col">
                <main className="flex min-h-screen w-full flex-col">
                    <div className="grid flex-grow grid-cols-1 lg:grid-cols-2">
                        {/* Left Column: Image */}
                        <div
                            className="hidden lg:flex flex-col bg-center bg-no-repeat bg-cover relative"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAw0a3NzOGQb88EkA2UtPZBAFe_gU2mOuHDgQV5t8L9eD_9unYb3-cpTxDPTsKDqNtYHWCSSewzDiiMmYVYPaYePfXOxlBU7YOGAVljYJkKgzgGHydnBCjiRi6C0s6M-Z5N3GSIupCSk833GEmNLyzt4f1makycNyeQHkxEzSi7cXdZMYC840791qV8Vod18mymrwh0DulKkzf1jKubamxPxTiOp2cePzFUYjrPxizjBqWPJkmnHTfEyV1AqnymDE5xy9btogZJrSUv")' }}
                        >
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>

                        {/* Right Column: Login Form */}
                        <div className="flex flex-col justify-center items-center bg-[var(--background)] p-8 sm:p-12 lg:p-16">
                            <div className="w-full max-w-md flex flex-col gap-8">
                                {/* Logo and Header */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        <img
                                            src="/somng%20logo.jpeg"
                                            alt="School of Mathematics Nigeria Logo"
                                            className="w-16 h-16 rounded-xl object-contain"
                                        />
                                        <p className="text-2xl font-bold text-[var(--foreground)]">School of Mathematics Nigeria</p>
                                    </div>
                                    <div className="flex flex-col gap-3 w-full">
                                        <p className="text-primary-600 dark:text-primary-400 text-4xl font-black leading-tight tracking-[-0.033em]">Welcome Back</p>
                                        <p className="text-[var(--muted-foreground)] text-base font-normal leading-normal">Log in to your student account to continue learning.</p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    {/* Auth error from URL */}
                                    {authError && (
                                        <div className="p-4 rounded-lg bg-warning-50 border border-warning-200 dark:bg-warning-900/50 dark:border-warning-800">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <div>
                                                    <h3 className="font-semibold text-warning-800 dark:text-warning-200">
                                                        {authError.title}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-warning-700 dark:text-warning-300">
                                                        {authError.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Regular login error */}
                                    {error && (
                                        <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm dark:bg-error-900/50 dark:border-error-800 dark:text-error-200">
                                            {error}
                                        </div>
                                    )}

                                    <label className="flex flex-col w-full text-left">
                                        <p className="text-[var(--foreground)] text-base font-medium leading-normal pb-2">Email Address</p>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--foreground)] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[var(--border)] bg-[var(--background)] focus:border-primary h-14 placeholder:text-[var(--muted-foreground)] p-[15px] text-base font-normal leading-normal"
                                            placeholder="Enter your email address"
                                            type="email"
                                        />
                                    </label>

                                    <label className="flex flex-col w-full text-left">
                                        <p className="text-[var(--foreground)] text-base font-medium leading-normal pb-2">Password</p>
                                        <div className="relative flex w-full flex-1 items-stretch">
                                            <input
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--foreground)] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[var(--border)] bg-[var(--background)] focus:border-primary h-14 placeholder:text-[var(--muted-foreground)] p-[15px] text-base font-normal leading-normal pr-12"
                                                placeholder="Enter your password"
                                                type={showPassword ? "text" : "password"}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                                <span className="material-symbols-outlined">
                                                    {showPassword ? (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        </svg>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </label>

                                    <div className="flex justify-between items-center">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-[var(--border)] text-primary-600 focus:ring-primary-500 bg-[var(--background)]"
                                            />
                                            <span className="text-sm text-[var(--muted-foreground)]">Remember me</span>
                                        </label>
                                        <Link href="/forgot-password" className="text-primary-600 dark:text-primary-400 text-sm font-medium leading-normal hover:underline">
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    {/* CTA and Sign Up Link */}
                                    <div className="flex flex-col gap-6 items-center mt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex items-center justify-center text-center font-bold text-base h-14 w-full rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Signing in...' : 'Access My Account'}
                                        </button>
                                        <p className="text-[var(--muted-foreground)] text-base font-normal">
                                            Don't have an account? <Link href="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">Sign Up</Link>
                                        </p>
                                    </div>
                                </form>

                                <div className="relative mt-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[var(--border)]" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-[var(--background)] text-[var(--muted-foreground)]">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--foreground)] disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span className="text-sm font-medium">Google</span>
                                    </button>
                                    {/* <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span className="text-sm font-medium">GitHub</span>
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
