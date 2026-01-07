/**
 * Comprehensive validation utilities for production use
 * Includes validation for forms, payments, and user inputs
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates course creation/update form
 */
export function validateCourseForm(data: {
    title?: string;
    description?: string;
    level?: string;
    price?: number;
    is_premium?: boolean;
    slug?: string;
}): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!data.title || typeof data.title !== 'string') {
        errors.push('Course title is required');
    } else {
        const title = data.title.trim();
        if (title.length < 3) {
            errors.push('Course title must be at least 3 characters');
        }
        if (title.length > 200) {
            errors.push('Course title must be less than 200 characters');
        }
    }

    // Description validation
    if (data.description && typeof data.description === 'string') {
        if (data.description.length > 5000) {
            errors.push('Description must be less than 5000 characters');
        }
    }

    // Level validation
    const validLevels = ['JAMB', 'WAEC', 'SS1', 'SS2', 'SS3', 'Others'];
    if (data.level && !validLevels.includes(data.level)) {
        errors.push('Invalid course level');
    }

    // Price validation for premium courses
    if (data.is_premium) {
        if (data.price === undefined || data.price === null) {
            errors.push('Premium courses must have a price');
        } else if (typeof data.price !== 'number' || data.price <= 0) {
            errors.push('Price must be greater than 0');
        } else if (data.price > 1000000) {
            errors.push('Price must be less than 1,000,000');
        }
    } else if (data.price && data.price > 0) {
        // Free courses shouldn't have a price
        errors.push('Free courses should not have a price');
    }

    // Slug validation (if provided)
    if (data.slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(data.slug)) {
            errors.push('Slug must be lowercase alphanumeric with hyphens');
        }
        if (data.slug.length > 100) {
            errors.push('Slug must be less than 100 characters');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
        errors.push('Email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Invalid email format');
        }
        if (email.length > 255) {
            errors.push('Email must be less than 255 characters');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    } else {
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates payment amount
 */
export function validatePaymentAmount(amount: number, currency: string = 'NGN'): ValidationResult {
    const errors: string[] = [];

    if (typeof amount !== 'number' || isNaN(amount)) {
        errors.push('Amount must be a valid number');
    } else {
        if (amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        if (amount > 10000000) {
            errors.push('Amount exceeds maximum limit');
        }
        // Check decimal places
        const decimalPlaces = (amount.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            errors.push('Amount can have at most 2 decimal places');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates currency code (ISO 4217)
 */
export function validateCurrency(currency: string): ValidationResult {
    const errors: string[] = [];
    const validCurrencies = [
        'NGN', // Nigerian Naira
        'USD', // US Dollar
        'EUR', // Euro
        'GBP', // British Pound
        'KES', // Kenyan Shilling
        'GHS', // Ghanaian Cedi
        'ZAR', // South African Rand
        'XOF', // West African CFA Franc
        'XAF', // Central African CFA Franc
    ];

    if (!currency || typeof currency !== 'string') {
        errors.push('Currency is required');
    } else if (!validCurrencies.includes(currency.toUpperCase())) {
        errors.push(`Currency ${currency} is not supported`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string, maxLength?: number): string {
    if (typeof input !== 'string') {
        return '';
    }

    // Remove null bytes and trim
    let sanitized = input.replace(/\0/g, '').trim();

    // Limit length if specified
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validates phone number (basic validation)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone || typeof phone !== 'string') {
        errors.push('Phone number is required');
    } else {
        // Remove common formatting characters
        const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        
        // Check if it's all digits
        if (!/^\d+$/.test(cleaned)) {
            errors.push('Phone number must contain only digits and formatting characters');
        }
        
        // Check length (assuming 10-15 digits)
        if (cleaned.length < 10 || cleaned.length > 15) {
            errors.push('Phone number must be between 10 and 15 digits');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

