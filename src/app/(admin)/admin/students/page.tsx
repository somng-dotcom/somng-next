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
                .eq('role', 'student')
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
                'Active' // Hardcoded as per current UI logic
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



    // ... existing code ...

    if (authLoading || isLoading) {
        return (
            <>
                {/* Header Skeleton */}
                <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" />
                <main className="p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse w-full max-w-sm" />
                        <TableSkeleton columns={6} rows={8} />
                    </div>
                </main>
            </>
        );
    }

    return (

        <>
            {/* Top Header */}
            <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 sticky top-0 z-20">
                <h2 className="text-gray-900 dark:text-white text-lg font-bold">Student Management</h2>
                <div className="flex items-center gap-4">
                    <button className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div
                        className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center cursor-pointer"
                        onClick={signOut}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <span className="text-primary-600 font-medium">{profile?.full_name?.charAt(0) || 'A'}</span>
                        )}
                    </div>
                </div>
            </header>

            <main className="p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">Student Account Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-base">View, edit, and manage all student accounts.</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ full_name: '', email: '', role: 'student' });
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary-600 text-white text-sm font-bold hover:bg-primary-700"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Add New Student</span>
                        </button>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {/* Search */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-64"
                                        />
                                    </div>
                                    <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <span className="material-symbols-outlined">filter_list</span>
                                    </button>
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <span className="material-symbols-outlined text-base">download</span>
                                    <span>Export List</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th className="p-4" scope="col">
                                            <input type="checkbox" className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500" />
                                        </th>
                                        <th className="px-6 py-3 font-medium" scope="col">Student Name</th>
                                        <th className="px-6 py-3 font-medium" scope="col">Email</th>
                                        <th className="px-6 py-3 font-medium" scope="col">Status</th>
                                        <th className="px-6 py-3 font-medium" scope="col">Joined</th>
                                        <th className="px-6 py-3 font-medium text-center" scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="bg-white dark:bg-gray-900/50 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="w-4 p-4">
                                                    <input type="checkbox" className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500" />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                            {student.avatar_url ? (
                                                                <img src={student.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                            ) : (
                                                                <span className="text-primary-600 text-xs font-medium">{student.full_name?.charAt(0) || 'U'}</span>
                                                            )}
                                                        </div>
                                                        {student.full_name || 'Unnamed Student'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(student.created_at)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(student)}
                                                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                        </button>
                                                        <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600">
                                                            <span className="material-symbols-outlined text-base">key</span>
                                                        </button>
                                                        <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600">
                                                            <span className="material-symbols-outlined text-base">school</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteDialog(student)}
                                                            className="p-1.5 rounded-md text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600"
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

                        {/* Pagination */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">1-{filteredStudents.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{students.length}</span>
                            </span>
                            <div className="flex gap-1">
                                <button className="px-3 py-1.5 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-lg hover:bg-gray-50">Previous</button>
                                <button className="px-3 py-1.5 text-sm text-white bg-primary-600 border border-primary-600 hover:bg-primary-700">1</button>
                                <button className="px-3 py-1.5 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50">2</button>
                                <button className="px-3 py-1.5 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-r-lg hover:bg-gray-50">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Student"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</span>
                        <input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="John Doe"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</span>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="john@example.com"
                        />
                    </label>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>Add Student</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Student"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</span>
                        <input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</span>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</span>
                        <select
                            value={formData.role}
                            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                        </select>
                    </label>
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
