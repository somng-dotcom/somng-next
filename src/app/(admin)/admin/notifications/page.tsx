'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getNotificationTemplates, updateNotificationTemplate, getNotificationLogs } from '@/lib/api/notifications';
import { NotificationTemplate, NotificationLog } from '@/types/notifications';

export default function NotificationsPage() {
    const { addToast } = useToast();
    const { user, profile, isLoading: authLoading } = useAuth();

    // Top-level view: 'templates' or 'logs'
    const [mainView, setMainView] = useState<'templates' | 'logs'>('templates');

    // Templates State
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // Logs State
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [logSearchQuery, setLogSearchQuery] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        loadTemplates();
        loadLogs();
    }, [user, authLoading]);

    useEffect(() => {
        if (selectedTemplate) {
            setSubject(selectedTemplate.subject);
            setContent(selectedTemplate.content);
        }
    }, [selectedTemplate]);

    const loadTemplates = async () => {
        try {
            const data = await getNotificationTemplates();
            setTemplates(data);
            if (data.length > 0 && !selectedTemplate) {
                setSelectedTemplate(data[0]);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load templates' });
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await getNotificationLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load notification logs' });
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;

        setIsSaving(true);
        try {
            const { error } = await updateNotificationTemplate(selectedTemplate.id, {
                subject,
                content
            });

            if (error) throw error;

            addToast({ type: 'success', title: 'Success', message: 'Template saved successfully' });

            setTemplates(prev => prev.map(t =>
                t.id === selectedTemplate.id
                    ? { ...t, subject, content }
                    : t
            ));
        } catch (error) {
            console.error('Failed to save template:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to save template' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (selectedTemplate) {
            setSubject(selectedTemplate.subject);
            setContent(selectedTemplate.content);
            addToast({ type: 'info', title: 'Reset', message: 'Changes discarded' });
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.label.toLowerCase().includes(templateSearchQuery.toLowerCase())
    );

    const filteredLogs = logs.filter(log =>
        log.recipient_name?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.recipient_email.toLowerCase().includes(logSearchQuery.toLowerCase())
    );

    const getIcon = (key: string) => {
        switch (key) {
            case 'welcome-email': return 'mail';
            case 'payment-confirmation': return 'credit_card';
            case 'new-course': return 'campaign';
            case 'progress-reminder': return 'schedule';
            case 'certificate': return 'workspace_premium';
            default: return 'notifications';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'welcome-email': return 'Welcome';
            case 'payment-confirmation': return 'Payment';
            case 'new-course': return 'New Course';
            case 'progress-reminder': return 'Reminder';
            case 'certificate': return 'Certificate';
            case 'announcement': return 'Announcement';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isLoading = authLoading || isLoadingTemplates || isLoadingLogs;

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Notifications</h1>
                        <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark mt-1">Manage email templates and view notification history.</p>
                    </div>

                    {/* Top-Level Tabs */}
                    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setMainView('templates')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${mainView === 'templates'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <span className="material-symbols-outlined mr-2 align-middle text-lg">edit_note</span>
                                Templates
                            </button>
                            <button
                                onClick={() => setMainView('logs')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${mainView === 'logs'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <span className="material-symbols-outlined mr-2 align-middle text-lg">history</span>
                                Log History
                            </button>
                        </nav>
                    </div>

                    {/* TEMPLATES VIEW */}
                    {mainView === 'templates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* List Column */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search templates..."
                                                value={templateSearchQuery}
                                                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[600px] overflow-y-auto">
                                        {isLoadingTemplates ? (
                                            <div className="p-8 text-center text-gray-500">Loading...</div>
                                        ) : filteredTemplates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => setSelectedTemplate(template)}
                                                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-white/5 border-l-4 ${selectedTemplate?.id === template.id
                                                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500'
                                                    : 'border-transparent'
                                                    }`}
                                            >
                                                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${selectedTemplate?.id === template.id
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-xl">{getIcon(template.key)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${selectedTemplate?.id === template.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                        {template.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {template.description}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Editor Column */}
                            <div className="lg:col-span-2">
                                {selectedTemplate ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Template</h3>
                                            <div className="flex items-center gap-3">
                                                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>Reset</Button>
                                                <Button size="sm" onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                                            </div>
                                        </div>

                                        <div className="px-4 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex space-x-6">
                                                <button onClick={() => setActiveTab('editor')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'editor' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>Editor</button>
                                                <button onClick={() => setActiveTab('preview')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'preview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>Preview</button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            {activeTab === 'editor' ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                                                        <textarea
                                                            value={content}
                                                            onChange={(e) => setContent(e.target.value)}
                                                            className="w-full p-3 h-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono resize-none focus:ring-2 focus:ring-primary-500/50 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variables</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(typeof selectedTemplate.variables === 'string' ? JSON.parse(selectedTemplate.variables) : selectedTemplate.variables)?.map((v: string) => (
                                                                <button key={v} onClick={() => setContent(prev => prev + ` {{${v}}} `)} className="px-2 py-1 text-xs font-mono bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-full border border-primary-200 dark:border-primary-800 hover:bg-primary-100">{`{{${v}}}`}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">Subject</p>
                                                    <p className="font-bold text-gray-900 dark:text-white mb-4">{subject}</p>
                                                    <p className="text-xs text-gray-500 mb-1">Content</p>
                                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{content}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">touch_app</span>
                                        <p className="text-lg font-medium">Select a template</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LOGS VIEW */}
                    {mainView === 'logs' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            {/* Search Bar */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[250px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search by recipient name or email..."
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50">
                                        Type: All <span className="material-symbols-outlined text-base">expand_more</span>
                                    </button>
                                    <button className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50">
                                        Date Range <span className="material-symbols-outlined text-base">expand_more</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Type</th>
                                            <th className="px-6 py-3 font-medium">Recipient</th>
                                            <th className="px-6 py-3 font-medium">Date/Time Sent</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingLogs ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div></div>
                                                </td>
                                            </tr>
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No logs found</td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map(log => (
                                                <tr key={log.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{getTypeLabel(log.type)}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900 dark:text-white">{log.recipient_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500">{log.recipient_email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(log.sent_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${log.status === 'delivered' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                            <span className={`text-sm capitalize ${log.status === 'delivered' ? 'text-green-700 dark:text-green-400' : log.status === 'failed' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                                                {log.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (visual only for now) */}
                            <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50" disabled>
                                    <span className="material-symbols-outlined text-base">arrow_back</span> Previous
                                </button>
                                <div className="text-sm text-gray-500">Showing {filteredLogs.length} logs</div>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50" disabled>
                                    Next <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
