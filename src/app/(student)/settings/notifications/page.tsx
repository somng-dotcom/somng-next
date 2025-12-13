'use client';

import Link from 'next/link';

export default function NotificationsPage() {
    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Dashboard</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <Link href="/settings" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary">Settings</Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">Notifications</span>
            </div>

            <div className="bg-white dark:bg-[#101922] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap justify-between gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-[-0.033em]">Notification Preferences</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage how and when you receive notifications.</p>
                    </div>
                </div>

                <div className="pt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Notification Type</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-center">In-App Alerts</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-center">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr className="align-top">
                                    <td className="py-4 px-4">
                                        <p className="font-medium text-gray-900 dark:text-white">New Course Updates</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new courses are added to the platform.</p>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input defaultChecked className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input defaultChecked className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="py-4 px-4">
                                        <p className="font-medium text-gray-900 dark:text-white">Quiz & Assignment Reminders</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive reminders for upcoming deadlines.</p>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input defaultChecked className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </td>
                                </tr>
                                {/* Additional rows could be added here similar to mockup */}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
