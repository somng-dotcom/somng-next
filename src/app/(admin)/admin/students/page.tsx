'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createStudent, updateStudent, deleteStudent } from '@/lib/api/students';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface Student {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    last_sign_in_at?: string;
}

export default function StudentsPage() {
    const { profile, signOut, user, isLoading: authLoading } = useAuth();
    const { addToast } = useToast();

    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Form/Action State
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({ full_name: '', email: '', role: 'student' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        loadStudents();
    }, [user, authLoading]);

    async function loadStudents() {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['student', 'admin', 'instructor'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Failed to load students:', error);
            addToast({ type: 'error', title: 'Failed to load students' });
        } finally {
            setIsLoading(false);
        }
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createStudent(formData);
            addToast({ type: 'success', title: 'Student added successfully' });
            setIsAddModalOpen(false);
            setFormData({ full_name: '', email: '', role: 'student' });
            loadStudents();
        } catch (error: any) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to add student', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        setIsSubmitting(true);
        try {
            await updateStudent(selectedStudent.id, formData);
            addToast({ type: 'success', title: 'Student updated successfully' });
            setIsEditModalOpen(false);
            loadStudents();
        } catch (error: any) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to update student', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedStudent) return;

        try {
            await deleteStudent(selectedStudent.id);
            addToast({ type: 'success', title: 'Student deleted successfully' });
            setDeleteDialogOpen(false);
            loadStudents();
        } catch (error: any) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to delete student', message: error.message });
        }
    };

    const openEditModal = (student: Student) => {
        setSelectedStudent(student);
        setFormData({
            full_name: student.full_name || '',
            email: student.email || '',
            role: student.role || 'student'
        });
        setIsEditModalOpen(true);
    };

    const openDeleteDialog = (student: Student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const filteredStudents = students.filter(student =>
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleExport = () => {
        const headers = ['Full Name', 'Email', 'Role', 'Joined Date', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredStudents.map(student => [
                `"${student.full_name || ''}"`,
                `"${student.email}"`,
                student.role,
                formatDate(student.created_at),
                'Active'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex-1 p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="h-10 bg-surface-light dark:bg-surface-dark rounded-lg animate-pulse w-full max-w-sm" />
                    <TableSkeleton columns={6} rows={8} />
                </div>
            </div>
        );
    }

    return (
        <>
            <main className="p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6 mb-8">
                        <div className="flex min-w-72 flex-col gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Student Management</h1>
                            <p className="text-sm sm:text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">View, edit, and manage all student accounts.</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ full_name: '', email: '', role: 'student' });
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Add New Student</span>
                        </button>
                    </header>

                    {/* Table Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light/30 dark:bg-background-dark/30">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                                    {/* Search */}
                                    <div className="relative flex-grow">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark text-xl">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-10 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 h-10 px-4 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm font-bold rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">download</span>
                                    <span>Export List</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light/50 dark:bg-background-dark/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold" scope="col">Student Name</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Email</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Role</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Joined</th>
                                        <th className="px-6 py-4 font-semibold text-center" scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-text-secondary-light">
                                                No students found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden">
                                                            {student.avatar_url ? (
                                                                <img src={student.avatar_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-primary text-xs font-bold">{student.full_name?.charAt(0) || 'U'}</span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-text-primary-light dark:text-text-primary-dark whitespace-nowrap">
                                                            {student.full_name || 'Unnamed Student'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{student.email}</td>
                                                <td className="px-6 py-4 capitalize text-text-secondary-light dark:text-text-secondary-dark">{student.role}</td>
                                                <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(student.created_at)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(student)}
                                                            className="p-1.5 rounded-md text-text-secondary-light hover:bg-primary/10 hover:text-primary transition-colors"
                                                            title="Edit Student"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteDialog(student)}
                                                            className="p-1.5 rounded-md text-text-secondary-light hover:bg-error/10 hover:text-error transition-colors"
                                                            title="Delete Student"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Student">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Full Name</label>
                        <input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>Add Student</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Full Name</label>
                        <input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Student"
                message={`Are you sure you want to delete "${selectedStudent?.full_name}"? This action cannot be undone.`}
                confirmText="Delete Student"
                variant="danger"
            />
        </>
    );
}
