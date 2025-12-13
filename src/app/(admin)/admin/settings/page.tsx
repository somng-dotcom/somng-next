'use client';

import { useState, useEffect } from 'react';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUploader } from '@/components/ui/FileUploader';
import { useToast } from '@/components/ui/Toast';
import { getSiteSettings, updateSiteSettings } from '@/lib/api/settings';
import { uploadSiteLogo } from '@/lib/api/storage';
import { SiteSettings } from '@/types/settings';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function SettingsPage() {
    const { addToast } = useToast();
    const { user, profile, isLoading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    // Form states
    const [siteName, setSiteName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [timezone, setTimezone] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        loadSettings();
    }, [user, authLoading]);

    const loadSettings = async () => {
        try {
            const data = await getSiteSettings();
            if (data) {
                setSettings(data);
                setSiteName(data.site_name);
                setContactEmail(data.contact_email);
                setTimezone(data.timezone);
                setLogoUrl(data.site_logo_url);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to load site settings'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) {
            console.error('Cannot save settings: No settings loaded');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await updateSiteSettings(settings.id, {
                site_name: siteName,
                contact_email: contactEmail,
                timezone: timezone,
                site_logo_url: logoUrl
            });

            if (error) throw error;

            addToast({
                type: 'success',
                title: 'Success',
                message: 'Settings saved successfully'
            });

            // Reload to ensure sync
            loadSettings();

            // Notify other components (Sidebar)
            window.dispatchEvent(new Event('site_settings_updated'));
        } catch (error) {
            console.error('Failed to save settings:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to save settings'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return <PageLoader role="admin" />;
    }

    return (
        <AdminGuard profile={profile} isLoading={authLoading}>
            <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
                <Sidebar role="admin" />

                {/* Main Content */}
                <main className="flex-1 h-full overflow-y-auto lg:ml-64">
                    <div className="p-8 max-w-4xl mx-auto">
                        {/* Breadcrumbs */}


                        {/* PageHeading */}
                        <div className="flex flex-wrap justify-between gap-3 mb-8">
                            <div className="flex min-w-72 flex-col gap-2">
                                <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">General Site Settings</h1>
                                <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Manage general LMS site information.</p>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-xl shadow-sm">
                            {/* Form Sections */}
                            <div className="space-y-10">
                                {/* Section 1: Branding */}
                                <div>
                                    <h2 className="text-text-primary-light dark:text-text-primary-dark text-xl font-bold leading-tight tracking-tight border-b border-border-light dark:border-border-dark pb-4 mb-6">Branding</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1">
                                            <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">Site Name</p>
                                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">The public name of your LMS.</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input
                                                value={siteName}
                                                onChange={(e) => setSiteName(e.target.value)}
                                                placeholder="e.g. School of Mathematics Nigeria"
                                                className="bg-background-light dark:bg-background-dark"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div className="md:col-span-1">
                                            <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">Site Logo</p>
                                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Recommended size: 300x80px, PNG format.</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <FileUploader
                                                label="Upload Logo"
                                                accept="image/*"
                                                currentUrl={logoUrl || undefined}
                                                onUploadComplete={(url) => setLogoUrl(url)}
                                                uploadFunction={uploadSiteLogo}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Contact & Localization */}
                                <div>
                                    <h2 className="text-text-primary-light dark:text-text-primary-dark text-xl font-bold leading-tight tracking-tight border-b border-border-light dark:border-border-dark pb-4 mb-6">Contact & Localization</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1">
                                            <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">Contact Email</p>
                                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">The primary contact email for users.</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input
                                                type="email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                placeholder="e.g. contact@example.com"
                                                className="bg-background-light dark:bg-background-dark"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div className="md:col-span-1">
                                            <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">Default Time Zone</p>
                                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Set the default time zone for the LMS.</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Select
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                                options={[
                                                    { value: 'UTC+01:00', label: '(UTC+01:00) West Africa Time' },
                                                    { value: 'UTC', label: '(UTC) Coordinated Universal Time' },
                                                    { value: 'UTC+02:00', label: '(UTC+02:00) Central Africa Time' },
                                                ]}
                                                className="bg-background-light dark:bg-background-dark"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-border-light dark:border-border-dark">
                                <Button
                                    variant="ghost"
                                    onClick={() => loadSettings()} // Reset changes
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
                <MobileNav role="admin" />
            </div>
        </AdminGuard>
    );
}
