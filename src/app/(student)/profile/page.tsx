'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input'; // Assuming we have this, or use standard input if not
import { useToast } from '@/components/ui/Toast';
import { updateProfile } from '@/lib/api/users';

export default function ProfilePage() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { addToast } = useToast();

    // Form state
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form when profile loads
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setIsLoading(false);
        } else if (user) {
            // Fallback if profile is still loading or doesn't exist fully
            setFullName(user.email?.split('@')[0] || '');
            setIsLoading(false);
        }
    }, [profile, user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            await updateProfile(user.id, {
                full_name: fullName,
            });

            await refreshProfile(); // Update context

            addToast({
                type: 'success',
                title: 'Profile updated',
                message: 'Your changes have been saved successfully.'
            });
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to update profile.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const sidebarRole = profile?.role === 'admin' ? 'admin' : 'student';

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar role={sidebarRole} />

            <div className="lg:ml-64">
                <Header
                    user={profile ? {
                        name: profile.full_name || '',
                        email: profile.email,
                        avatar: profile.avatar_url || undefined,
                        role: sidebarRole,
                    } : null}
                    onLogout={signOut}
                />

                <main className="p-4 lg:p-6 pt-16 pb-24 lg:pt-6 lg:pb-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-[var(--foreground)]">My Profile</h1>
                            <p className="text-[var(--muted-foreground)]">Manage your account settings and preferences.</p>
                        </div>

                        <Card padding="lg">
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Avatar Section (Read-only for now) */}
                                <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
                                        {fullName ? fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--foreground)]">Profile Picture</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] mb-2">
                                            Your avatar is currently generated from your name.
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[var(--muted-foreground)] cursor-not-allowed"
                                        />
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                            Email address cannot be changed.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSaving || isLoading}
                                        isLoading={isSaving}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </main>
            </div>

            <MobileNav role={sidebarRole} />
        </div>
    );
}
