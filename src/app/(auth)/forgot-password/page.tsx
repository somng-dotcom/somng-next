'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await resetPasswordForEmail(email);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">
                            Check your email
                        </h2>
                        <p className="mt-2 text-[var(--muted-foreground)]">
                            We&apos;ve sent a password reset link to <strong>{email}</strong>.
                            Please check your inbox and click the link to reset your password.
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
                                <h1 className="text-white/90 tracking-light text-[32px] font-bold leading-tight max-w-md">Forgot your password?</h1>
                                <p className="text-white/70 text-base font-normal leading-normal pt-2 max-w-md">No worries, we&apos;ll send you reset instructions.</p>
                            </div>
                            <div className="z-10 h-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <img
                                className="absolute inset-0 size-full object-cover -z-10"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9YmoxJyPfAAdB7kGmqrydD5iRxx-WJJF3SLgwyh1XlSzeoW9fLPUY4-HqZZ2KH9l9FAR-l0C0cXSTaoORRf3rd41rfESbN508eLD003GPkDGcfmg9_SzR_VFWVXu_Hv4W3M5WoOagtj_mwPA5DesiyPVVo8yNWlYY-ShLIHvRcdZIOumATKVFipWqBQp4n0dnEL55aFzQUwkM49yEP0FkVzyZIjE_7uwmY7FWOEY91w611WLbJNVyv7P0k507fVIIe6D6ssvrQhQ"
                                alt="Background"
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

                                <h1 className="text-[var(--foreground)] text-[22px] font-bold leading-tight tracking-[-0.015em] w-full pb-2 pt-5">Reset Your Password</h1>
                                <p className="text-[var(--muted-foreground)] text-sm mb-6">Enter your email address and we&apos;ll send you a link to reset your password.</p>

                                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 py-3">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
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

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-base font-bold leading-normal text-white hover:bg-primary/90 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>

                                <p className="text-[var(--muted-foreground)] text-center text-sm font-normal leading-normal pt-6 w-full">
                                    Remember your password? <Link href="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
