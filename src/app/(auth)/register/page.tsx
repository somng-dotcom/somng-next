'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        const { error } = await signUp(email, password, fullName);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
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

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">
                            Check your email
                        </h2>
                        <p className="mt-2 text-[var(--muted-foreground)]">
                            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                            Please check your inbox and click the link to activate your account.
                        </p>
                        <Link href="/login">
                            <button className="mt-6 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]">
                                Back to login
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-[var(--background)] overflow-x-hidden font-display">
            <div className="layout-container flex h-full grow flex-col">
                <main className="flex min-h-screen w-full flex-col">
                    <div className="grid flex-grow grid-cols-1 lg:grid-cols-2">
                        {/* Left Side (Desktop) */}
                        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101922] p-10 text-white lg:flex">
                            <header className="z-10 flex items-center gap-4 text-white">
                                <img src="/somng%20logo.jpeg" alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">School of Mathematics Nigeria</h2>
                            </header>
                            <div className="z-10">
                                <h1 className="text-white/90 tracking-light text-[32px] font-bold leading-tight max-w-md">Welcome to the School of Mathematics Nigeria</h1>
                                <p className="text-white/70 text-base font-normal leading-normal pt-2 max-w-md">Your journey to mathematical excellence starts here.</p>
                            </div>
                            <div className="z-10 h-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <img
                                className="absolute inset-0 size-full object-cover -z-10"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9YmoxJyPfAAdB7kGmqrydD5iRxx-WJJF3SLgwyh1XlSzeoW9fLPUY4-HqZZ2KH9l9FAR-l0C0cXSTaoORRf3rd41rfESbN508eLD003GPkDGcfmg9_SzR_VFWVXu_Hv4W3M5WoOagtj_mwPA5DesiyPVVo8yNWlYY-ShLIHvRcdZIOumATKVFipWqBQp4n0dnEL55aFzQUwkM49yEP0FkVzyZIjE_7uwmY7FWOEY91w611WLbJNVyv7P0k507fVIIe6D6ssvrQhQ"
                                alt="Geometric patterns on a dark background"
                            />
                        </div>

                        {/* Right Side (Form) */}
                        <div className="flex flex-col items-center justify-center bg-[var(--background)] p-6 sm:p-10">
                            <div className="flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
                                {/* Mobile Header */}
                                <div className="lg:hidden flex items-center gap-3 text-[var(--foreground)] mb-8">
                                    <img src="/somng%20logo.jpeg" alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                                    <h2 className="text-[var(--foreground)] text-lg font-bold leading-tight tracking-[-0.015em]">School of Mathematics Nigeria</h2>
                                </div>
                                <h1 className="text-[var(--foreground)] text-[22px] font-bold leading-tight tracking-[-0.015em] w-full pb-2 pt-5">Create a New Student Account</h1>

                                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 py-3">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <label className="flex flex-col w-full text-left">
                                        <p className="text-[var(--foreground)] text-base font-medium leading-normal pb-2">Full Name</p>
                                        <input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--foreground)] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[var(--border)] bg-[var(--background)] focus:border-primary h-14 placeholder:text-[var(--muted-foreground)] p-[15px] text-base font-normal leading-normal"
                                            placeholder="John Doe"
                                            type="text"
                                        />
                                    </label>

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
                                        <p className="text-[var(--foreground)] text-base font-medium leading-normal pb-2">Create Password</p>
                                        <div className="relative flex items-center">
                                            <input
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--foreground)] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[var(--border)] bg-[var(--background)] focus:border-primary h-14 placeholder:text-[var(--muted-foreground)] p-[15px] text-base font-normal leading-normal pr-12"
                                                placeholder="Enter a strong password"
                                                type={showPassword ? "text" : "password"}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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

                                    <label className="flex flex-col w-full text-left">
                                        <p className="text-[var(--foreground)] text-base font-medium leading-normal pb-2">Confirm Password</p>
                                        <input
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--foreground)] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[var(--border)] bg-[var(--background)] focus:border-primary h-14 placeholder:text-[var(--muted-foreground)] p-[15px] text-base font-normal leading-normal"
                                            placeholder="Re-enter your password"
                                            type="password"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-base font-bold leading-normal text-white hover:bg-primary/90 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Creating account...' : 'Create My Account'}
                                    </button>
                                </form>

                                <p className="text-[var(--muted-foreground)] text-center text-sm font-normal leading-normal pt-6">
                                    Already a student? <Link href="/login" className="font-semibold text-primary hover:underline">Log in here</Link>
                                </p>

                                <div className="relative mt-8 w-full">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[var(--border)]" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-[var(--background)] text-[var(--muted-foreground)]">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 w-full">
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--foreground)] disabled:opacity-50"
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
                                </div>

                                <footer className="mt-12 w-full border-t border-[var(--border)] pt-6">
                                    <div className="flex items-center justify-center gap-6 text-sm">
                                        <Link href="/terms" className="text-[var(--muted-foreground)] hover:text-primary">Terms of Service</Link>
                                        <Link href="/privacy" className="text-[var(--muted-foreground)] hover:text-primary">Privacy Policy</Link>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
