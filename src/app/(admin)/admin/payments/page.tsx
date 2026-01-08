'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface Payment {
    id: string;
    student_name: string;
    student_email: string;
    course_title: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    created_at: string;
    transaction_id: string;
}

export default function PaymentsPage() {
    const { profile, signOut, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    async function loadPayments(silent = false) {
        if (!silent) setIsLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    amount,
                    status,
                    created_at,
                    provider_reference,
                    profiles:user_id (full_name, email),
                    courses:course_id (title)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                type RawPaymentDetails = {
                    id: string;
                    amount: number;
                    status: string;
                    created_at: string;
                    provider_reference: string | null;
                    profiles: { full_name: string | null; email: string } | null;
                    courses: { title: string } | null;
                };

                const formattedPayments: Payment[] = (data as unknown as RawPaymentDetails[]).map((item) => ({
                    id: item.id,
                    student_name: item.profiles?.full_name || 'Unknown Student',
                    student_email: item.profiles?.email || 'No Email',
                    course_title: item.courses?.title || 'Unknown Course',
                    amount: item.amount,
                    status: item.status as 'success' | 'pending' | 'failed',
                    created_at: item.created_at,
                    transaction_id: item.provider_reference || 'N/A'
                }));
                setPayments(formattedPayments);
            }
        } catch (error) {
            console.error('Failed to load payments:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        loadPayments(false);

        // Revalidate on focus
        const onFocus = () => loadPayments(true);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user, authLoading, router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const totalRevenue = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
    const successfulCount = payments.filter(p => p.status === 'success').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;

    const downloadCSV = () => {
        const headers = ['Transaction ID', 'Student Name', 'Student Email', 'Course Title', 'Amount', 'Date', 'Status'];
        const csvContent = [
            headers.join(','),
            ...payments.map(payment => [
                payment.transaction_id,
                `"${payment.student_name}"`,
                payment.student_email,
                `"${payment.course_title}"`,
                payment.amount,
                new Date(payment.created_at).toLocaleDateString(),
                payment.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex-1 p-4 lg:p-8 pt-16 pb-24 lg:pt-8 lg:pb-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="h-32 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark animate-pulse" />
                        <div className="h-32 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark animate-pulse" />
                        <div className="h-32 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark animate-pulse" />
                    </div>
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
                            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">Payment History</h1>
                            <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">Monitor all transactions within the platform.</p>
                        </div>
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 h-10 px-4 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark text-sm font-bold rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            <span>Export as CSV</span>
                        </button>
                    </header>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Total Revenue</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                            <p className="text-success text-sm font-medium">+2.5%</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Successful Transactions</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold">{successfulCount}</p>
                            <p className="text-success text-sm font-medium">+1.2%</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Pending Payments</p>
                            <p className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold">{pendingCount}</p>
                            <p className="text-error text-sm font-medium">-0.5%</p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-grow">
                            <div className="relative max-w-md">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark text-xl">search</span>
                                <input
                                    type="text"
                                    placeholder="Search by student or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light/50 dark:bg-background-dark/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold" scope="col">Student</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Course</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Transaction ID</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Amount</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Date</th>
                                        <th className="px-6 py-4 font-semibold" scope="col">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-text-secondary-light">No payments found</td>
                                        </tr>
                                    ) : (
                                        payments
                                            .filter(p => p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.student_email.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((payment) => (
                                                <tr key={payment.id} className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark">{payment.student_name}</div>
                                                        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{payment.student_email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{payment.course_title}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">{payment.transaction_id}</td>
                                                    <td className="px-6 py-4 font-bold text-text-primary-light dark:text-text-primary-dark">{formatCurrency(payment.amount)}</td>
                                                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(payment.created_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusBadge(payment.status)}`}>
                                                            {payment.status}
                                                        </span>
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
        </>
    );
}
