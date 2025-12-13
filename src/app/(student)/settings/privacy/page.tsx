'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Dashboard</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <Link href="/settings" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Settings</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">Privacy & Data</span>
            </div>

            <div className="bg-white dark:bg-[#101922] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap justify-between gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-[-0.033em]">Privacy & Data</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage how your information is used and shared.</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="py-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Data Sharing</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Control how your data is shared with third-party applications and services for an enhanced learning experience.</p>
                        <div className="mt-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Analytics and Performance</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow us to collect data to improve our services and your learning experience.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input defaultChecked className="sr-only peer" type="checkbox" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Personalized Content</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enable personalized course recommendations based on your activity.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input className="sr-only peer" type="checkbox" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
