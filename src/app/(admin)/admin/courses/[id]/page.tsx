'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import {
    getCourseById,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson
} from '@/lib/api/courses';

export default function CourseCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile, signOut } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Module State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [moduleFormData, setModuleFormData] = useState({ title: '', description: '' });

    // Lesson State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<any>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [lessonFormData, setLessonFormData] = useState({
        title: '',
        content_type: 'video',
        content_url: '',
        content_text: '', // For text lessons
        duration_minutes: 0,
        is_free_preview: false
    });

    // Delete State
    const [deleteType, setDeleteType] = useState<'module' | 'lesson' | null>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const loadCourse = async () => {
        try {
            const data = await getCourseById(id);
            setCourse(data);
        } catch (error) {
            console.error('Failed to load course:', error);
            addToast({ type: 'error', title: 'Error loading course' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCourse();
    }, [id]);

    // Module Handlers
    const openModuleModal = (module?: any) => {
        if (module) {
            setEditingModule(module);
            setModuleFormData({ title: module.title, description: module.description || '' });
        } else {
            setEditingModule(null);
            setModuleFormData({ title: '', description: '' });
        }
        setIsModuleModalOpen(true);
    };

    const handleModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await updateModule(editingModule.id, moduleFormData);
                addToast({ type: 'success', title: 'Module updated' });
            } else {
                await createModule({
                    course_id: id,
                    title: moduleFormData.title,
                    description: moduleFormData.description,
                    order_index: (course?.modules?.length || 0) + 1,
                });
                addToast({ type: 'success', title: 'Module created' });
            }
            loadCourse();
            setIsModuleModalOpen(false);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Operation failed' });
        }
    };

    // Lesson Handlers
    const openLessonModal = (moduleId: string, lesson?: any) => {
        setActiveModuleId(moduleId);
        if (lesson) {
            setEditingLesson(lesson);
            setLessonFormData({
                title: lesson.title,
                content_type: lesson.content_type,
                content_url: lesson.content_url || '',
                content_text: lesson.content_text || '',
                duration_minutes: lesson.duration_minutes || 0,
                is_free_preview: lesson.is_free_preview,
            });
        } else {
            setEditingLesson(null);
            setLessonFormData({
                title: '',
                content_type: 'video',
                content_url: '',
                content_text: '',
                duration_minutes: 0,
                is_free_preview: false,
            });
        }
        setIsLessonModalOpen(true);
    };

    const handleLessonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeModuleId) return;

        try {
            if (editingLesson) {
                await updateLesson(editingLesson.id, lessonFormData);
                addToast({ type: 'success', title: 'Lesson updated' });
            } else {
                // Find visible lessons count in this module to determine order
                const module = course.modules.find((m: any) => m.id === activeModuleId);
                const orderIndex = (module?.lessons?.length || 0) + 1;

                await createLesson({
                    module_id: activeModuleId,
                    title: lessonFormData.title,
                    content_type: lessonFormData.content_type as any,
                    content_url: lessonFormData.content_url,
                    content_text: lessonFormData.content_text,
                    duration_minutes: Number(lessonFormData.duration_minutes),
                    is_free_preview: lessonFormData.is_free_preview,
                    order_index: orderIndex,
                });
                addToast({ type: 'success', title: 'Lesson created' });
            }
            loadCourse();
            setIsLessonModalOpen(false);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Operation failed' });
        }
    };

    // Delete Handlers
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (deleteType === 'module') {
                await deleteModule(itemToDelete.id);
                addToast({ type: 'success', title: 'Module deleted' });
            } else {
                await deleteLesson(itemToDelete.id);
                addToast({ type: 'success', title: 'Lesson deleted' });
            }
            loadCourse();
            setItemToDelete(null);
            setDeleteType(null);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Delete failed' });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar role="admin" />

            <div className="lg:ml-64">
                <Header
                    user={profile ? {
                        name: profile.full_name || '',
                        email: profile.email,
                        avatar: profile.avatar_url || undefined,
                        role: 'admin',
                    } : null}
                    onLogout={signOut}
                />

                <main className="p-4 lg:p-6 pb-20 lg:pb-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/admin/courses" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                                    Courses
                                </Link>
                                <span className="text-[var(--muted-foreground)]">/</span>
                                <h1 className="text-xl font-bold text-[var(--foreground)]">{course.title}</h1>
                            </div>
                            <p className="text-[var(--muted-foreground)] text-sm">
                                Manage curriculum content
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/admin/courses/${course.id}/edit`}>
                                <Button variant="outline">Edit Details</Button>
                            </Link>
                            <Button onClick={() => openModuleModal()}>
                                + Add Module
                            </Button>
                        </div>
                    </div>

                    {/* Modules List */}
                    <div className="space-y-6">
                        {course.modules?.map((module: any, mIndex: number) => (
                            <Card key={module.id} className="overflow-hidden">
                                <div className="bg-[var(--muted)]/30 p-4 border-b border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center font-medium text-[var(--muted-foreground)]">
                                            {mIndex + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">{module.title}</h3>
                                            {module.description && (
                                                <p className="text-sm text-[var(--muted-foreground)]">{module.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openModuleModal(module)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-error-500 hover:text-error-600"
                                            onClick={() => {
                                                setItemToDelete(module);
                                                setDeleteType('module');
                                            }}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => openLessonModal(module.id)}
                                        >
                                            + Lesson
                                        </Button>
                                    </div>
                                </div>

                                {/* Lessons List */}
                                <div className="divide-y divide-[var(--border)]">
                                    {module.lessons?.length === 0 ? (
                                        <div className="p-8 text-center text-[var(--muted-foreground)] text-sm">
                                            No lessons yet. Add one to get started.
                                        </div>
                                    ) : (
                                        module.lessons.map((lesson: any, lIndex: number) => (
                                            <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-[var(--muted)]/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-[var(--muted-foreground)] text-sm">
                                                        {mIndex + 1}.{lIndex + 1}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-[var(--foreground)]">{lesson.title}</p>
                                                            {lesson.is_free_preview && (
                                                                <Badge variant="success" size="sm">Preview</Badge>
                                                            )}
                                                            <Badge variant="outline" size="sm" className="uppercase text-xs">
                                                                {lesson.content_type}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                                            {lesson.duration_minutes} min • {lesson.content_type === 'quiz' ? 'Assessment' : 'Learning Content'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openLessonModal(module.id, lesson)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-error-500 hover:text-error-600"
                                                        onClick={() => {
                                                            setItemToDelete(lesson);
                                                            setDeleteType('lesson');
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        ))}

                        {course.modules?.length === 0 && (
                            <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] border-dashed">
                                <p className="text-[var(--muted-foreground)] mb-4">This course has no content yet.</p>
                                <Button onClick={() => openModuleModal()}>
                                    Create First Module
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <MobileNav role="admin" />

            {/* Module Modal */}
            <Modal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                title={editingModule ? 'Edit Module' : 'Create Module'}
            >
                <form onSubmit={handleModuleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={moduleFormData.title}
                        onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                        placeholder="Module Title"
                    />
                    <Textarea
                        label="Description"
                        value={moduleFormData.description}
                        onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of what students will learn..."
                        rows={3}
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModuleModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingModule ? 'Save Changes' : 'Create Module'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Lesson Modal */}
            <Modal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                title={editingLesson ? 'Edit Lesson' : 'Create Lesson'}
            >
                <form onSubmit={handleLessonSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={lessonFormData.title}
                        onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                        placeholder="Lesson Title"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Type"
                            value={lessonFormData.content_type}
                            onChange={(e: any) => setLessonFormData(prev => ({ ...prev, content_type: e.target.value }))}
                            options={[
                                { value: 'video', label: 'Video' },
                                { value: 'text', label: 'Text/Article' },
                                { value: 'quiz', label: 'Quiz' },
                                { value: 'pdf', label: 'PDF Document' }
                            ]}
                        />
                        <Input
                            label="Duration (min)"
                            type="number"
                            value={lessonFormData.duration_minutes}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                            min={0}
                        />
                    </div>

                    {lessonFormData.content_type === 'video' && (
                        <Input
                            label="Video URL (YouTube/Vimeo)"
                            value={lessonFormData.content_url}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, content_url: e.target.value }))}
                            placeholder="https://..."
                        />
                    )}

                    {lessonFormData.content_type === 'text' && (
                        <Textarea
                            label="Content Text"
                            value={lessonFormData.content_text}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, content_text: e.target.value }))}
                            placeholder="Type markdown content here..."
                            rows={10}
                        />
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={lessonFormData.is_free_preview}
                            onChange={(e) => setLessonFormData(prev => ({ ...prev, is_free_preview: e.target.checked }))}
                            className="w-4 h-4 rounded border-[var(--border)] text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-[var(--foreground)]">Free Preview</span>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsLessonModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingLesson ? 'Save Changes' : 'Create Lesson'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                title={`Delete ${deleteType === 'module' ? 'Module' : 'Lesson'}`}
                message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={confirmDelete}
                variant="danger"
            />
        </div>
    );
}
