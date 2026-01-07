/**
 * Environment variable utilities with validation
 */

/**
 * Gets a required environment variable or throws an error
 * @param key - Environment variable key
 * @param defaultValue - Optional default value (only used if env var is undefined)
 * @returns The environment variable value
 * @throws Error if the variable is missing and no default is provided
 */
export function getRequiredEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    
    if (!value) {
        const error = new Error(
            `Missing required environment variable: ${key}\n` +
            `Please ensure ${key} is set in your environment variables or .env file.`
        );
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error(error.message);
        }
        
        throw error;
    }
    
    return value;
}

/**
 * Gets an optional environment variable with a default value
 * @param key - Environment variable key
 * @param defaultValue - Default value to use if env var is not set
 * @returns The environment variable value or default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * Validates that all required environment variables are present
 * Called at application startup to fail fast if config is missing
 */
export function validateEnv(): void {
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    
    const missing: string[] = [];
    
    for (const key of requiredVars) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}\n` +
            'Please check your .env file or environment configuration.'
        );
    }
}

