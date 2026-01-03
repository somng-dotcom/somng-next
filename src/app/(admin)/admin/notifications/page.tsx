'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getNotificationTemplates, updateNotificationTemplate, getNotificationLogs } from '@/lib/api/notifications';
import { NotificationTemplate, NotificationLog } from '@/types/notifications';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function NotificationsPage() {
    const { addToast } = useToast();
    const { profile, isLoading: authLoading } = useAuth();

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
        if (!profile) return;
        loadTemplates();
        loadLogs();
    }, [profile, authLoading]);

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
            case 'course_purchase': return 'Course Purchase';
            case 'new_student': return 'New Student';
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
            <div className="flex-1 p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <>
            <main className="p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <header className="flex flex-col gap-2 border-b border-border-light dark:border-border-dark pb-6 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Notifications</h1>
                        <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark font-medium">Manage email templates and view notification history.</p>
                    </header>

                    {/* Top-Level Tabs */}
                    <div className="mb-8 border-b border-border-light dark:border-border-dark">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setMainView('templates')}
                                className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 ${mainView === 'templates'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">edit_note</span>
                                Templates
                            </button>
                            <button
                                onClick={() => setMainView('logs')}
                                className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 ${mainView === 'logs'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">history</span>
                                Log History
                            </button>
                        </nav>
                    </div>

                    {/* TEMPLATES VIEW */}
                    {mainView === 'templates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* List Column */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light/30 dark:bg-background-dark/30">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search templates..."
                                                value={templateSearchQuery}
                                                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary/50 outline-none text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light"
                                            />
                                        </div>
                                    </div>
                                    <div className="divide-y divide-border-light dark:divide-border-dark max-h-[600px] overflow-y-auto">
                                        {filteredTemplates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => setSelectedTemplate(template)}
                                                className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-background-light dark:hover:bg-background-dark border-l-4 ${selectedTemplate?.id === template.id
                                                    ? 'bg-primary/5 border-primary'
                                                    : 'border-transparent'
                                                    }`}
                                            >
                                                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${selectedTemplate?.id === template.id
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-background-light dark:bg-background-dark text-text-secondary-light'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-xl">{getIcon(template.key)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${selectedTemplate?.id === template.id ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'
                                                        }`}>
                                                        {template.label}
                                                    </p>
                                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
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
                                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col overflow-hidden">
                                        <div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light/30 dark:bg-background-dark/30 flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Edit Template</h3>
                                            <div className="flex items-center gap-3">
                                                <Button variant="ghost" onClick={handleReset} disabled={isSaving}>Reset</Button>
                                                <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                                            </div>
                                        </div>

                                        <div className="px-4 border-b border-border-light dark:border-border-dark">
                                            <div className="flex space-x-6">
                                                <button onClick={() => setActiveTab('editor')} className={`pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'editor' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light'}`}>Editor</button>
                                                <button onClick={() => setActiveTab('preview')} className={`pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light'}`}>Preview</button>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            {activeTab === 'editor' ? (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Subject</label>
                                                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-background-light dark:bg-background-dark" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Content</label>
                                                        <textarea
                                                            value={content}
                                                            onChange={(e) => setContent(e.target.value)}
                                                            className="w-full p-4 h-64 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm font-mono resize-none focus:ring-2 focus:ring-primary/50 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">Insert Variables</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(typeof selectedTemplate.variables === 'string' ? JSON.parse(selectedTemplate.variables) : selectedTemplate.variables)?.map((v: string) => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => setContent(prev => prev + ` {{${v}}} `)}
                                                                    className="px-3 py-1.5 text-xs font-mono bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
                                                                >
                                                                    {`{{${v}}}`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-border-dark">
                                                    <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-2">Subject</p>
                                                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark text-lg mb-6">{subject}</p>
                                                    <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-2">Message Body</p>
                                                    <pre className="whitespace-pre-wrap text-sm text-text-primary-light dark:text-text-primary-dark font-sans leading-relaxed">{content}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-surface-light dark:bg-surface-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark text-text-secondary-light">
                                        <span className="material-symbols-outlined text-5xl mb-4 opacity-30">touch_app</span>
                                        <p className="text-lg font-bold">Select a template to edit</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LOGS VIEW */}
                    {mainView === 'logs' && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light/30 dark:bg-background-dark/30 flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[250px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search by recipient..."
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary/50 outline-none text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light/50 dark:bg-background-dark/50">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Type</th>
                                            <th className="px-6 py-4 font-semibold">Recipient</th>
                                            <th className="px-6 py-4 font-semibold">Sent At</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-text-secondary-light">No logs found</td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors">
                                                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark font-medium">{getTypeLabel(log.type)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-text-primary-light dark:text-text-primary-dark">{log.recipient_name || 'Student'}</div>
                                                        <div className="text-xs text-text-secondary-light">{log.recipient_email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(log.sent_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${log.status === 'delivered' ? 'bg-success' : log.status === 'failed' ? 'bg-error' : 'bg-warning'}`}></div>
                                                            <span className={`text-sm font-bold capitalize ${log.status === 'delivered' ? 'text-success' : log.status === 'failed' ? 'text-error' : 'text-warning'}`}>
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
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
