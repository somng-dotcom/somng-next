'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    const [error, setError] = useState('');
    const [authError, setAuthError] = useState<{ title: string; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useAuth();
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-glow">
                            Σ
                        </div>
                    </Link>
                    <h1 className="mt-4 text-2xl font-display font-bold text-[var(--foreground)]">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-[var(--muted-foreground)]">
                        Sign in to continue learning mathematics
                    </p>
                </div>

                {/* Form */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Auth error from URL (e.g., expired link) */}
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

                        <Input
                            label="Email address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            leftIcon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[var(--border)] text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-[var(--muted-foreground)]">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                        >
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border)]" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[var(--card-bg)] text-[var(--muted-foreground)]">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
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
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                <span className="text-sm font-medium">GitHub</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sign up link */}
                <p className="mt-6 text-center text-[var(--muted-foreground)]">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/register"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
