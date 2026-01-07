/**
 * Internationalization (i18n) utilities for global use
 * Basic implementation - can be extended with libraries like next-intl or i18next
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'sw';

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'es', 'fr', 'pt', 'ar', 'sw'];

/**
 * Currency formatting for different locales
 */
export interface CurrencyConfig {
    code: string;
    symbol: string;
    decimalPlaces: number;
    thousandsSeparator: string;
    decimalSeparator: string;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
    NGN: {
        code: 'NGN',
        symbol: '₦',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
    },
    USD: {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        decimalPlaces: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
    },
    GBP: {
        code: 'GBP',
        symbol: '£',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
    },
    KES: {
        code: 'KES',
        symbol: 'KSh',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
    },
    GHS: {
        code: 'GHS',
        symbol: '₵',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
    },
    ZAR: {
        code: 'ZAR',
        symbol: 'R',
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        decimalSeparator: ',',
    },
};

/**
 * Formats a currency amount for display
 */
export function formatCurrency(
    amount: number,
    currency: string = 'NGN',
    locale: SupportedLocale = DEFAULT_LOCALE
): string {
    const config = CURRENCY_CONFIGS[currency.toUpperCase()] || CURRENCY_CONFIGS['NGN'];
    
    const formatter = new Intl.NumberFormat(
        locale === 'en' ? 'en-US' : locale,
        {
            style: 'currency',
            currency: config.code,
            minimumFractionDigits: config.decimalPlaces,
            maximumFractionDigits: config.decimalPlaces,
        }
    );

    return formatter.format(amount);
}

/**
 * Formats a number with locale-specific formatting
 */
export function formatNumber(
    value: number,
    locale: SupportedLocale = DEFAULT_LOCALE,
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat(
        locale === 'en' ? 'en-US' : locale,
        options
    ).format(value);
}

/**
 * Formats a date with locale-specific formatting
 */
export function formatDate(
    date: Date | string,
    locale: SupportedLocale = DEFAULT_LOCALE,
    options?: Intl.DateTimeFormatOptions
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(
        locale === 'en' ? 'en-US' : locale,
        options || {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    ).format(dateObj);
}

/**
 * Detects user locale from browser or request headers
 */
export function detectLocale(acceptLanguage?: string | null): SupportedLocale {
    if (!acceptLanguage) {
        return DEFAULT_LOCALE;
    }

    // Parse Accept-Language header
    const languages = acceptLanguage
        .split(',')
        .map(lang => {
            const [code, q = '1'] = lang.trim().split(';q=');
            return { code: code.split('-')[0] as SupportedLocale, priority: parseFloat(q) };
        })
        .sort((a, b) => b.priority - a.priority);

    // Find first supported locale
    for (const { code } of languages) {
        if (SUPPORTED_LOCALES.includes(code)) {
            return code;
        }
    }

    return DEFAULT_LOCALE;
}

/**
 * Gets locale from request headers or defaults
 */
export function getLocaleFromRequest(request: Request | { headers: Headers }): SupportedLocale {
    const headers = request instanceof Request ? request.headers : request.headers;
    const acceptLanguage = headers.get('accept-language');
    return detectLocale(acceptLanguage);
}

/**
 * Time zone utilities
 */
export function getUserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Formats date/time in user's timezone
 */
export function formatDateTime(
    date: Date | string,
    locale: SupportedLocale = DEFAULT_LOCALE,
    timeZone?: string
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(
        locale === 'en' ? 'en-US' : locale,
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timeZone || getUserTimeZone(),
        }
    ).format(dateObj);
}

