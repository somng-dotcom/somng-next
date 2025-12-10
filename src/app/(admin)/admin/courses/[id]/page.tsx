'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import {
    getCourseById,
    updateCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson
} from '@/lib/api/courses';
import { FileUploader } from '@/components/ui/FileUploader';
import { QuizBuilder } from '@/components/admin/QuizBuilder';

// Helper for class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile, signOut } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    // State
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        level: 'JAMB',
        is_premium: false,
        price: 0,
        status: 'draft' as 'draft' | 'published' | 'archived',
        thumbnail_url: ''
    });

    // Module State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [moduleFormData, setModuleFormData] = useState({ title: '', description: '' });
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Lesson State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [editingLesson, setEditingLesson] = useState<any>(null);
    const [lessonFormData, setLessonFormData] = useState<{
        title: string;
        content_type: 'video' | 'text' | 'pdf' | 'quiz';
        content_url: string;
        content_text: string;
        duration_minutes: number;
        is_free_preview: boolean;
    }>({
        title: '',
        content_type: 'video',
        content_url: '',
        content_text: '',
        duration_minutes: 0,
        is_free_preview: false,
    });
    const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

    // Quiz State
    const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
    const [currentQuizLesson, setCurrentQuizLesson] = useState<{ id: string; title: string } | null>(null);

    // Initial Load
    useEffect(() => {
        loadCourse();
    }, [id]);

    const loadCourse = async () => {
        try {
            const data = await getCourseById(id);
            setCourse(data);
            setCourseForm({
                title: data.title || '',
                description: data.description || '',
                level: data.level || 'JAMB',
                is_premium: data.is_premium || false,
                price: data.price || 0,
                status: data.status || 'draft',
                thumbnail_url: data.thumbnail_url || ''
            });
            if (data.modules && expandedModules.size === 0) {
                setExpandedModules(new Set(data.modules.map((m: any) => m.id)));
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to load course' });
        } finally {
            setIsLoading(false);
        }
    };

    const saveCourse = async (statusOverride?: 'published' | 'draft') => {
        setIsSaving(true);
        try {
            const updates = {
                ...courseForm,
                status: statusOverride || courseForm.status
            };
            await updateCourse(id, updates);
            setCourseForm(prev => ({ ...prev, ...updates }));
            addToast({ type: 'success', title: 'Course saved successfully' });
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to save course' });
        } finally {
            setIsSaving(false);
        }
    };

    // Module Actions
    const handleModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await updateModule(editingModule.id, moduleFormData);
            } else {
                await createModule({
                    course_id: id,
                    title: moduleFormData.title,
                    description: moduleFormData.description,
                    order_index: (course?.modules?.length || 0) + 1
                });
            }
            loadCourse();
            setIsModuleModalOpen(false);
            addToast({ type: 'success', title: editingModule ? 'Module updated' : 'Module created' });
        } catch (error) {
            addToast({ type: 'error', title: 'Operation failed' });
        }
    };

    const deleteModuleItem = async (moduleId: string) => {
        if (!confirm('Are you sure you want to delete this module?')) return;
        try {
            await deleteModule(moduleId);
            loadCourse();
            addToast({ type: 'success', title: 'Module deleted' });
        } catch (error) {
            addToast({ type: 'error', title: 'Delete failed' });
        }
    };

    // Lesson Actions
    const handleLessonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingLesson(true);
        try {
            if (editingLesson) {
                await updateLesson(editingLesson.id, lessonFormData);
            } else {
                if (!activeModuleId) throw new Error('No module selected');
                const module = course.modules.find((m: any) => m.id === activeModuleId);
                await createLesson({
                    module_id: activeModuleId,
                    ...lessonFormData,
                    order_index: (module?.lessons?.length || 0) + 1
                });
            }
            loadCourse();
            setIsLessonModalOpen(false);
            addToast({ type: 'success', title: editingLesson ? 'Lesson updated' : 'Lesson created' });
        } catch (error) {
            addToast({ type: 'error', title: 'Operation failed' });
        } finally {
            setIsSubmittingLesson(false);
        }
    };

    const deleteLessonItem = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await deleteLesson(lessonId);
            loadCourse();
            addToast({ type: 'success', title: 'Lesson deleted' });
        } catch (error) {
            addToast({ type: 'error', title: 'Delete failed' });
        }
    };

    const toggleModuleExpand = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
            {/* SideNavBar - Replacing Sidebar component with inline implementation from HTML for exact match */}
            <aside className="flex w-64 flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hidden lg:flex">
                <div className="flex h-full flex-col justify-between p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-2">
                            {/* Logo placeholder - keeping dynamic if needed, but using static style for now */}
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/10 flex items-center justify-center text-primary font-bold">
                                SM
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">Admin</h1>
                                <p className="text-sm font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">School of Mathematics</p>
                            </div>
                        </div>
                        <nav className="mt-4 flex flex-col gap-2">
                            <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">dashboard</span>
                                <p className="text-sm font-medium leading-normal">Dashboard</p>
                            </Link>
                            <Link href="/admin/courses" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-colors">
                                <span className="material-symbols-outlined fill">school</span>
                                <p className="text-sm font-medium leading-normal">Courses</p>
                            </Link>
                            <Link href="/admin/students" className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">group</span>
                                <p className="text-sm font-medium leading-normal">Students</p>
                            </Link>
                            <Link href="/admin/analytics" className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">analytics</span>
                                <p className="text-sm font-medium leading-normal">Analytics</p>
                            </Link>
                            <Link href="/admin/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">settings</span>
                                <p className="text-sm font-medium leading-normal">Settings</p>
                            </Link>
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link href="/admin/courses/new">
                            <button className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                <span className="truncate">Create New Course</span>
                            </button>
                        </Link>
                        <button onClick={() => signOut()} className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">logout</span>
                            <p className="text-sm font-medium leading-normal">Logout</p>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {/* PageHeading */}
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6">
                        <div className="flex min-w-72 flex-col gap-2">
                            <p className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">{courseForm.title || 'Create New Course'}</p>
                            <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Fill in the details below to create a new course for the platform.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => saveCourse('draft')}
                                disabled={isSaving}
                                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-background-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/10 transition-colors"
                            >
                                <span className="truncate">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                            </button>
                            <button
                                onClick={() => saveCourse('published')}
                                disabled={isSaving}
                                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-success text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-success/90 transition-colors"
                            >
                                <span className="truncate">Publish Course</span>
                            </button>
                        </div>
                    </header>

                    {/* Form Layout */}
                    <div className="mt-8 grid grid-cols-3 gap-8">
                        {/* Left Column: Course Settings */}
                        <div className="col-span-3 lg:col-span-1 flex flex-col gap-6">
                            <div className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4">Course Settings</h3>
                                <div className="flex flex-col gap-6">
                                    <label className="flex flex-col">
                                        <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Title</p>
                                        <input
                                            value={courseForm.title}
                                            onChange={e => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark px-4 text-base font-normal leading-normal"
                                            placeholder="e.g. Introduction to Algebra"
                                        />
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Description</p>
                                        <textarea
                                            value={courseForm.description}
                                            onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark min-h-36 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark p-4 text-base font-normal leading-normal"
                                            placeholder="Provide a detailed description of the course..."
                                        />
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Course Level</p>
                                        <select
                                            value={courseForm.level}
                                            onChange={e => setCourseForm(prev => ({ ...prev, level: e.target.value }))}
                                            className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4 text-base font-normal leading-normal"
                                        >
                                            <option value="JAMB">JAMB</option>
                                            <option value="WAEC">WAEC</option>
                                            <option value="SS1">SS1</option>
                                            <option value="SS2">SS2</option>
                                            <option value="SS3">SS3</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">Course Type</p>
                                        <div className="flex items-center justify-between rounded-lg p-1 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                                            <button
                                                onClick={() => setCourseForm(prev => ({ ...prev, is_premium: false }))}
                                                className={`flex-1 text-center text-sm font-semibold py-2 rounded-md transition-all ${!courseForm.is_premium ? 'bg-surface-light dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                            >
                                                Free
                                            </button>
                                            <button
                                                onClick={() => setCourseForm(prev => ({ ...prev, is_premium: true }))}
                                                className={`flex-1 text-center text-sm font-semibold py-2 rounded-md transition-all ${courseForm.is_premium ? 'bg-surface-light dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                            >
                                                Premium
                                            </button>
                                        </div>
                                    </div>

                                    {courseForm.is_premium && (
                                        <label className="flex flex-col">
                                            <p className="text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Price (NGN)</p>
                                            <input
                                                type="number"
                                                value={courseForm.price}
                                                onChange={e => setCourseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4 text-base font-normal leading-normal"
                                            />
                                        </label>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">Course Status</p>
                                        <div className="inline-flex items-center gap-2">
                                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 capitalize">
                                                {courseForm.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t border-border-light dark:border-border-dark pt-6 mt-2">
                                        <button className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-danger/10 text-danger text-sm font-bold leading-normal tracking-[0.015em] hover:bg-danger/20 transition-colors">
                                            <span className="truncate">Delete Course</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Course Content Builder */}
                        <div className="col-span-3 lg:col-span-2 flex flex-col gap-6">
                            <div className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Course Modules</h3>
                                    <button
                                        onClick={() => {
                                            setEditingModule(null);
                                            setModuleFormData({ title: '', description: '' });
                                            setIsModuleModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">add_circle</span>
                                        <span className="truncate">Add New Module</span>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {course?.modules?.map((module: any, index: number) => (
                                        <div key={module.id} className="border border-border-light dark:border-border-dark rounded-lg p-4 bg-surface-light dark:bg-surface-dark">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined cursor-grab text-text-secondary-light dark:text-text-secondary-dark">drag_indicator</span>
                                                    <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">Module {index + 1}: {module.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingModule(module);
                                                            setModuleFormData({ title: module.title, description: module.description });
                                                            setIsModuleModalOpen(true);
                                                        }}
                                                        className="p-1 rounded-md hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteModuleItem(module.id)}
                                                        className="p-1 rounded-md hover:bg-danger/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleModuleExpand(module.id)}
                                                        className="p-1 rounded-md hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">
                                                            {expandedModules.has(module.id) ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedModules.has(module.id) && (
                                                <div className="pl-8 pt-4 flex flex-col gap-3 border-t border-border-light dark:border-border-dark mt-4">
                                                    {module.lessons?.map((lesson: any) => (
                                                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-md bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined cursor-grab text-text-secondary-light dark:text-text-secondary-dark">drag_indicator</span>
                                                                <span className="material-symbols-outlined text-primary">
                                                                    {lesson.content_type === 'video' ? 'play_circle' :
                                                                        lesson.content_type === 'quiz' ? 'quiz' : 'description'}
                                                                </span>
                                                                <p className="text-sm text-text-primary-light dark:text-text-primary-dark font-medium">{lesson.title}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {lesson.content_type === 'quiz' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCurrentQuizLesson(lesson);
                                                                            setIsQuizBuilderOpen(true);
                                                                        }}
                                                                        className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded hover:bg-primary/20 mr-2 transition-colors"
                                                                    >
                                                                        Manage Questions
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveModuleId(module.id);
                                                                        setEditingLesson(lesson);
                                                                        setLessonFormData({
                                                                            title: lesson.title,
                                                                            content_type: lesson.content_type,
                                                                            content_url: lesson.content_url || '',
                                                                            content_text: lesson.content_text || '',
                                                                            duration_minutes: lesson.duration_minutes || 0,
                                                                            is_free_preview: lesson.is_free_preview
                                                                        });
                                                                        setIsLessonModalOpen(true);
                                                                    }}
                                                                    className="p-1 rounded-md hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteLessonItem(lesson.id)}
                                                                    className="p-1 rounded-md hover:bg-danger/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => {
                                                                setActiveModuleId(module.id);
                                                                setEditingLesson(null);
                                                                setLessonFormData({
                                                                    title: '',
                                                                    content_type: 'video',
                                                                    content_url: '',
                                                                    content_text: '',
                                                                    duration_minutes: 0,
                                                                    is_free_preview: false
                                                                });
                                                                setIsLessonModalOpen(true);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg hover:bg-primary/5 hover:border-primary text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">add</span>
                                                            <span className="text-sm font-medium">Add Content</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!course?.modules || course.modules.length === 0) && (
                                        <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg border-dashed">
                                            No modules yet. Click "Add New Module" to get started.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals - Keeping existing functional modals but updating classes where relevant */}
            <Modal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                title={editingModule ? 'Edit Module' : 'Create Module'}
            >
                <form onSubmit={handleModuleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Module Title</span>
                        <input
                            required
                            value={moduleFormData.title}
                            onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4"
                            placeholder="e.g. Algebra Basics"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Description</span>
                        <textarea
                            value={moduleFormData.description}
                            onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-3 min-h-[100px]"
                            placeholder="Module description..."
                        />
                    </label>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModuleModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingModule ? 'Save Changes' : 'Create Module'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                title={editingLesson ? 'Edit Lesson' : 'Add Content'}
                size="lg"
            >
                <form onSubmit={handleLessonSubmit} className="space-y-4">
                    <label className="block">
                        <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Title</span>
                        <input
                            required
                            value={lessonFormData.title}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4"
                            placeholder="Lesson Title"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Content Type</span>
                            <select
                                value={lessonFormData.content_type}
                                onChange={(e) => setLessonFormData(prev => ({ ...prev, content_type: e.target.value as 'video' | 'text' | 'pdf' | 'quiz' }))}
                                className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4"
                            >
                                <option value="video">Video</option>
                                <option value="text">Text/Article</option>
                                <option value="pdf">PDF Document</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Duration (min)</span>
                            <input
                                type="number"
                                min="0"
                                value={lessonFormData.duration_minutes}
                                onChange={(e) => setLessonFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4"
                            />
                        </label>
                    </div>

                    {(lessonFormData.content_type === 'video' || lessonFormData.content_type === 'pdf') && (
                        <>
                            <FileUploader
                                label={`Upload ${lessonFormData.content_type === 'video' ? 'Video' : 'PDF'}`}
                                accept={lessonFormData.content_type === 'video' ? 'video/*' : 'application/pdf'}
                                currentUrl={lessonFormData.content_url}
                                onUploadComplete={(url) => setLessonFormData(prev => ({ ...prev, content_url: url }))}
                            />
                            <label className="block">
                                <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Or URL</span>
                                <input
                                    value={lessonFormData.content_url}
                                    onChange={(e) => setLessonFormData(prev => ({ ...prev, content_url: e.target.value }))}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 px-4"
                                    placeholder="https://..."
                                />
                            </label>
                        </>
                    )}

                    {lessonFormData.content_type === 'text' && (
                        <label className="block">
                            <span className="block text-base font-medium leading-normal pb-2 text-text-primary-light dark:text-text-primary-dark">Content</span>
                            <textarea
                                value={lessonFormData.content_text}
                                onChange={(e) => setLessonFormData(prev => ({ ...prev, content_text: e.target.value }))}
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-3 min-h-[200px]"
                                placeholder="Write content..."
                            />
                        </label>
                    )}

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={lessonFormData.is_free_preview}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, is_free_preview: e.target.checked }))}
                            className="rounded border-border-light dark:border-border-dark text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Free Preview</span>
                    </label>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsLessonModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmittingLesson}>
                            {editingLesson ? 'Save Changes' : 'Add Content'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {isQuizBuilderOpen && currentQuizLesson && (
                <QuizBuilder
                    lessonId={currentQuizLesson.id}
                    lessonTitle={currentQuizLesson.title}
                    onClose={() => setIsQuizBuilderOpen(false)}
                />
            )}
        </div>
    );
}
