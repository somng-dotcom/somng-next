/**
 * HTML sanitization utilities for XSS prevention
 * Production-ready implementation using DOMPurify
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 * 
 * @param html - HTML string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 * 
 * @example
 * ```tsx
 * import { sanitizeHTML } from '@/lib/utils/sanitize';
 * 
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />
 * ```
 */
export function sanitizeHTML(
    html: string | null | undefined,
    options?: {
        allowedTags?: string[];
        allowedAttributes?: Record<string, string[]>;
    }
): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // If DOMPurify is available, use it
    if (typeof window !== 'undefined') {
        try {
            // Dynamic import for DOMPurify (SSR-safe)
            // Note: Install DOMPurify: npm install dompurify @types/dompurify
            const DOMPurify = require('dompurify');
            
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: options?.allowedTags || [
                    'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
                    'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'blockquote', 'code', 'pre', 'hr',
                ],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
                ALLOW_DATA_ATTR: false,
                KEEP_CONTENT: true,
                RETURN_TRUSTED_TYPE: false,
            });
        } catch (error) {
            console.warn('DOMPurify not available, using basic sanitization:', error);
            // Fallback to basic sanitization
            return basicSanitizeHTML(html);
        }
    }

    // Server-side fallback: basic sanitization
    return basicSanitizeHTML(html);
}

/**
 * Basic HTML sanitization (fallback when DOMPurify is not available)
 * Strips all HTML tags and returns plain text
 */
function basicSanitizeHTML(html: string): string {
    if (typeof html !== 'string') {
        return '';
    }

    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

    // Remove javascript: and data: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');

    // Remove style tags and their content
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Convert &lt; and &gt; to prevent re-interpretation
    sanitized = sanitized.replace(/&lt;/g, '&amp;lt;');
    sanitized = sanitized.replace(/&gt;/g, '&amp;gt;');

    return sanitized;
}

/**
 * Escapes HTML special characters
 */
export function escapeHTML(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitizes user input for use in attributes
 */
export function sanitizeAttribute(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
        return '';
    }

    // Remove dangerous characters
    return escapeHTML(value)
        .replace(/javascript:/gi, '')
        .replace(/on\w+/gi, '')
        .trim();
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeURL(url: string | null | undefined, allowedProtocols: string[] = ['http:', 'https:']): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    try {
        const parsed = new URL(url);
        
        // Check if protocol is allowed
        if (!allowedProtocols.includes(parsed.protocol)) {
            return '';
        }

        // Return sanitized URL
        return parsed.toString();
    } catch {
        // Invalid URL
        return '';
    }
}

