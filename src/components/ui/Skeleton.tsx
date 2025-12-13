// Enhanced Skeleton Component Library with Shadcn-style animations
// Provides consistent, animated loading states across the application

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

// Base Skeleton with pulse animation (Shadcn style)
export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/50",
                className
            )}
            {...props}
        />
    );
}

// Text skeleton with multiple lines
interface TextSkeletonProps {
    lines?: number;
    className?: string;
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
                />
            ))}
        </div>
    );
}

// Course Card skeleton - matches the actual course card layout
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn(
            "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden",
            className
        )}>
            {/* Thumbnail */}
            <Skeleton className="h-44 w-full rounded-none" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Badges row */}
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* Title */}
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />

                {/* Description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                {/* Stats row */}
                <div className="flex items-center gap-4 pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                </div>

                {/* Price/Button row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Course Grid Skeleton - multiple cards
export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5, className }: { columns?: number } & SkeletonProps) {
    return (
        <tr className={className}>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Table skeleton with header
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Avatar skeleton
interface AvatarSkeletonProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
    const sizeStyles = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <Skeleton className={cn("rounded-full", sizeStyles[size], className)} />
    );
}

// Dashboard stats card skeleton
export function StatsSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn(
            "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6",
            className
        )}>
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                </div>
            </div>
        </div>
    );
}

// Dashboard skeleton - full page loading state
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsSkeleton />
                <StatsSkeleton />
                <StatsSkeleton />
                <StatsSkeleton />
            </div>

            {/* Content sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <ListSkeleton items={4} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <ListSkeleton items={4} />
                </div>
            </div>
        </div>
    );
}

// List item skeleton
export function ListSkeleton({ items = 5, className }: { items?: number } & SkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Profile/Settings page skeleton
export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <AvatarSkeleton size="xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Course detail page skeleton
export function CourseDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="flex flex-col lg:flex-row gap-6">
                <Skeleton className="w-full lg:w-2/3 h-64 rounded-xl" />
                <div className="w-full lg:w-1/3 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg mt-4" />
                </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded" />
                            <div className="flex-1">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-3 w-24 mt-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Inline content skeleton (for within content areas)
export function InlineSkeleton({ width = 'w-24', height = 'h-4' }: { width?: string; height?: string }) {
    return <Skeleton className={cn(width, height, "inline-block")} />;
}
