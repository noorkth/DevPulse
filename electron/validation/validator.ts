import { z } from 'zod';

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
    constructor(public readonly errors: z.ZodError) {
        super('Validation failed');
        this.name = 'ValidationError';
    }

    /**
     * Format validation errors for user-friendly display
     */
    getFormattedErrors(): Record<string, string> {
        const formatted: Record<string, string> = {};

        for (const error of this.errors.issues) {
            const path = error.path.join('.');
            formatted[path] = error.message;
        }

        return formatted;
    }

    /**
     * Get first error message
     */
    getFirstError(): string {
        return this.errors.issues[0]?.message || 'Validation failed';
    }
}

/**
 * Validate data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation error:', {
                errors: error.issues,
                data: JSON.stringify(data, null, 2)
            });
            throw new ValidationError(error);
        }
        throw error;
    }
}

/**
 * Validate data and return result without throwing
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and either data or error
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: new ValidationError(error) };
        }
        throw error;
    }
}
