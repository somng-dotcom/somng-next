'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SecurityPage() {
    const { updatePassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState(''); // Note: Supabase doesn't require current pwd for update usually, but it's good practice. However, we can't verify it easily client-side without re-auth. We'll simulate or skip verify for now if logic is complex.
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await updatePassword(newPassword);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Dashboard</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <Link href="/settings" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Settings</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">Password & Security</span>
            </div>

            <div className="bg-white dark:bg-[#101922] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap justify-between gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-[-0.033em]">Password & Security</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage your password and secure your account.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-b border-gray-200 dark:border-gray-800 pb-8">
                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h2>
                    {/*
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="current-password">Current Password</label>
                        <input 
                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" 
                            id="current-password" 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="new-password">New Password</label>
                        <input
                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="confirm-password">Confirm New Password</label>
                        <input
                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <span className="truncate">{loading ? 'Updating...' : 'Update Password'}</span>
                        </button>
                    </div>
                </form>

                <div className="pt-6 border-b border-gray-200 dark:border-gray-800 pb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Two-Factor Authentication (2FA)</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal mb-6">Add an extra layer of security to your account by requiring a second authentication step.</p>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Authenticator App</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">2FA is currently disabled.</p>
                            </div>
                        </div>
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <span className="truncate">Setup</span>
                        </button>
                    </div>
                </div>

                <div className="pt-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Login Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">desktop_windows</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Windows 11, Chrome - Current Session</p>
                                    <p className="text-sm text-green-600 dark:text-green-400">Active now</p>
                                </div>
                            </div>
                            <span className="text-primary text-sm font-bold cursor-default">Current</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
