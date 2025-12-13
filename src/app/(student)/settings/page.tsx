'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PersonalInfoPage() {
    const { profile, updateProfile, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await updateProfile({
                full_name: fullName,
                // Note: 'bio' and 'username' are not currently in the profile schema
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    if (isAuthLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Dashboard</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <Link href="/settings" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Settings</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">Personal Info</span>
            </div>

            <div className="bg-white dark:bg-[#101922] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                {/* PageHeading */}
                <div className="flex flex-wrap justify-between gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-[-0.033em]">Personal Information</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Update your photo and personal details here.</p>
                    </div>
                </div>

                {/* ProfileHeader */}
                <div className="flex py-6 border-b border-gray-200 dark:border-gray-800 @container">
                    <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex gap-4 items-center">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-24 h-24"
                                style={{ backgroundImage: `url("${profile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9tMZhbeNg5PahSdVCMkjCbRs6b90wRFhrSVjxb6en5WRlHo6tMbWHjjnWmKww1JfeNZBY8JYUurlVVbMAPu1NPqhkxRkr_OA7lVqNCJBuPLkvpN7CsKCs2zJ7iXMSCBp__q4-L0uTTvWTF9kIm6BfS5MrUfb-f_0mniwa-lVLKGeAEIiY21MpMKfxa4BVTDkyJZlR40hM1O858IUpcLqNsXBR_dU1qiXseVgs03Si4BhCY5bV37z_UAcM2gpBeWhmy4Ws2hkf_rO3'}")` }}
                            ></div>
                            <div className="flex flex-col justify-center">
                                <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Your Avatar</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">PNG or JPG no bigger than 800px wide and tall.</p>
                            </div>
                        </div>
                        <div className="flex w-full max-w-[480px] gap-3 sm:w-auto">
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] flex-1 sm:flex-auto hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                <span className="truncate">Upload</span>
                            </button>
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400 text-sm font-bold leading-normal tracking-[0.015em] flex-1 sm:flex-auto hover:bg-error-100 dark:hover:bg-error-900/40 transition-colors">
                                <span className="truncate">Delete</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="full-name">Full Name</label>
                            <input
                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                id="full-name"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="username">Email (Username)</label>
                            <input
                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                disabled
                                id="username"
                                type="text"
                                value={profile?.email || ''}
                            />
                        </div>
                    </div>

                    {/* Note: 'Bio' field is commented out as it is not in the schema. Un-comment if added to DB. */}
                    {/*
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="about-me">About Me</label>
                        <textarea 
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] p-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none" 
                            id="about-me" 
                            placeholder="Write a brief bio about yourself..." 
                            rows={4}
                        ></textarea>
                    </div>
                    */}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="truncate">Cancel</span>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <span className="truncate">{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
