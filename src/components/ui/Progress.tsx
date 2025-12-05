interface ProgressProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    variant?: 'default' | 'success' | 'warning';
    className?: string;
}

const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

const variantStyles = {
    default: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
};

export function Progress({
    value,
    max = 100,
    size = 'md',
    showLabel = false,
    variant = 'default',
    className = '',
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[var(--muted-foreground)]">Progress</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-[var(--muted)] rounded-full overflow-hidden ${sizeStyles[size]}`}>
                <div
                    className={`h-full bg-gradient-to-r ${variantStyles[variant]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// Circular progress for stats
interface CircularProgressProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showValue?: boolean;
}

export function CircularProgress({
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    className = '',
    showValue = true,
}: CircularProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3373ff" />
                        <stop offset="100%" stopColor="#1a4ff5" />
                    </linearGradient>
                </defs>
            </svg>
            {showValue && (
                <span className="absolute text-sm font-semibold text-[var(--foreground)]">
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}

// Course progress card
interface CourseProgressProps {
    completedLessons: number;
    totalLessons: number;
    className?: string;
}

export function CourseProgress({
    completedLessons,
    totalLessons,
    className = '',
}: CourseProgressProps) {
    const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted-foreground)]">
                    {completedLessons} of {totalLessons} lessons
                </span>
                <span className="font-medium text-[var(--foreground)]">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} size="sm" variant={percentage === 100 ? 'success' : 'default'} />
        </div>
    );
}
