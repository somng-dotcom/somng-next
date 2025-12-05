import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200',
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
    outline: 'border border-[var(--border)] text-[var(--foreground)]',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({
    children,
    variant = 'default',
    size = 'sm',
    className = ''
}: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}

// Level badge specifically for course levels
type LevelType = 'JAMB' | 'WAEC' | 'SS1' | 'SS2' | 'Others';

const levelColors: Record<LevelType, string> = {
    JAMB: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    WAEC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    SS1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    SS2: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    Others: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface LevelBadgeProps {
    level: LevelType;
    className?: string;
}

export function LevelBadge({ level, className = '' }: LevelBadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
        ${levelColors[level]}
        ${className}
      `}
        >
            {level}
        </span>
    );
}

// Premium badge
interface PremiumBadgeProps {
    className?: string;
}

export function PremiumBadge({ className = '' }: PremiumBadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full
        bg-gradient-to-r from-amber-500 to-orange-500 text-white
        ${className}
      `}
        >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium
        </span>
    );
}

// Free badge
interface FreeBadgeProps {
    className?: string;
}

export function FreeBadge({ className = '' }: FreeBadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
        bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200
        ${className}
      `}
        >
            Free
        </span>
    );
}
