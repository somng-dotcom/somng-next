interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`bg-[var(--muted)] animate-pulse rounded ${className}`}
        />
    );
}

// Text skeleton
interface TextSkeletonProps {
    lines?: number;
    className?: string;
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Card skeleton for course cards
export function CardSkeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`card p-0 ${className}`}>
            {/* Thumbnail */}
            <Skeleton className="h-40 w-full rounded-t-xl rounded-b-none" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Badge */}
                <Skeleton className="h-5 w-16 rounded-full" />

                {/* Title */}
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />

                {/* Info row */}
                <div className="flex items-center gap-4 mt-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>

                {/* Price/Button */}
                <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5, className = '' }: { columns?: number } & SkeletonProps) {
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

// Avatar skeleton
interface AvatarSkeletonProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function AvatarSkeleton({ size = 'md', className = '' }: AvatarSkeletonProps) {
    const sizeStyles = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <Skeleton className={`rounded-full ${sizeStyles[size]} ${className}`} />
    );
}

// Dashboard stats skeleton
export function StatsSkeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`card p-6 ${className}`}>
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

// List skeleton
export function ListSkeleton({ items = 5, className = '' }: { items?: number } & SkeletonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
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
