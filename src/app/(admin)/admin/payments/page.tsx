'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface Payment {
    id: string;
    student_name: string;
    student_email: string;
    course_title: string;
    amount: number;
    status: 'successful' | 'pending' | 'failed';
    created_at: string;
    transaction_id: string;
}

export default function PaymentsPage() {
    const { profile, signOut, user, isLoading: authLoading } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data for now - replace with actual API call
    useEffect(() => {
        if (authLoading) return;
        if (!user) return;

        async function loadPayments() {
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
                    // Define type for the joined query result
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
                        status: item.status as 'successful' | 'pending' | 'failed', // Cast to known union type
                        created_at: item.created_at,
                        transaction_id: item.provider_reference || 'N/A'
                    }));
                    setPayments(formattedPayments);
                }
            } catch (error) {
                console.error('Failed to load payments:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPayments();
    }, [user, authLoading]);

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
            successful: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const totalRevenue = payments.filter(p => p.status === 'successful').reduce((sum, p) => sum + p.amount, 0);
    const successfulCount = payments.filter(p => p.status === 'successful').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;

    if (authLoading || isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex-1">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 sticky top-0 z-20">
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold">Payment History</h2>
                    <div className="flex items-center gap-4">
                        <button className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center cursor-pointer" onClick={signOut}>
                            <span className="text-primary-600 font-medium">{profile?.full_name?.charAt(0) || 'A'}</span>
                        </div>
                    </div>
                </header>

                <main className="p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                            <div>
                                <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">Payment History</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-base mt-1">Monitor all transactions within the learning management system.</p>
                            </div>
                            <button className="flex items-center gap-2 h-10 px-4 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-bold rounded-lg hover:bg-gray-300">
                                <span className="material-symbols-outlined text-base">download</span>
                                <span>Export as CSV</span>
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
                                <p className="text-gray-900 dark:text-white text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                                <p className="text-green-600 text-sm font-medium">+2.5%</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Successful Transactions</p>
                                <p className="text-gray-900 dark:text-white text-2xl font-bold">{successfulCount}</p>
                                <p className="text-green-600 text-sm font-medium">+1.2%</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pending Payments</p>
                                <p className="text-gray-900 dark:text-white text-2xl font-bold">{pendingCount}</p>
                                <p className="text-red-600 text-sm font-medium">-0.5%</p>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex-grow">
                                <div className="relative max-w-md">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search by student name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 h-10 px-4 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50">
                                    <span className="material-symbols-outlined text-base">filter_list</span>
                                    <span>Filter by Course</span>
                                </button>
                                <button className="flex items-center gap-2 h-10 px-4 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50">
                                    <span className="material-symbols-outlined text-base">paid</span>
                                    <span>Filter by Status</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3" scope="col">Student Name</th>
                                            <th className="px-6 py-3" scope="col">Course Title</th>
                                            <th className="px-6 py-3" scope="col">Transaction ID</th>
                                            <th className="px-6 py-3" scope="col">Amount</th>
                                            <th className="px-6 py-3" scope="col">Date</th>
                                            <th className="px-6 py-3" scope="col">Status</th>
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
                                        ) : payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payments found</td>
                                            </tr>
                                        ) : (
                                            payments.map((payment) => (
                                                <tr key={payment.id} className="bg-white dark:bg-gray-900/50 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{payment.student_name}</td>
                                                    <td className="px-6 py-4">{payment.course_title}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{payment.transaction_id}</td>
                                                    <td className="px-6 py-4 font-medium">{formatCurrency(payment.amount)}</td>
                                                    <td className="px-6 py-4">{formatDate(payment.created_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(payment.status)}`}>
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
            </div>
        </div>
    );
}
