/**
 * Standard error codes for DevPulse application
 * Format: [CATEGORY]_[SPECIFIC_ERROR]
 */

export enum ErrorCode {
    // ========== Validation Errors (1xxx) ==========
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
    VALIDATION_INVALID_UUID = 'VALIDATION_INVALID_UUID',
    VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',
    VALIDATION_INVALID_TIME = 'VALIDATION_INVALID_TIME',
    VALIDATION_INVALID_ENUM = 'VALIDATION_INVALID_ENUM',

    // ========== Database Errors (2xxx) ==========
    DB_NOT_FOUND = 'DB_NOT_FOUND',
    DB_DUPLICATE = 'DB_DUPLICATE',
    DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
    DB_QUERY_FAILED = 'DB_QUERY_FAILED',
    DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',

    // ========== Rate Limit Errors (3xxx) ==========
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // ========== Authorization Errors (4xxx) ==========
    AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
    AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',

    // ========== Internal Errors (9xxx) ==========
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Error metadata including user-friendly messages
 */
export const ErrorMetadata: Record<ErrorCode, { message: string; httpStatus?: number }> = {
    // Validation Errors
    [ErrorCode.VALIDATION_FAILED]: {
        message: 'The provided data is invalid. Please check your input and try again.',
        httpStatus: 400,
    },
    [ErrorCode.VALIDATION_INVALID_EMAIL]: {
        message: 'The email address format is invalid.',
        httpStatus: 400,
    },
    [ErrorCode.VALIDATION_INVALID_UUID]: {
        message: 'The provided ID is invalid.',
        httpStatus: 400,
    },
    [ErrorCode.VALIDATION_MISSING_FIELD]: {
        message: 'Required field is missing.',
        httpStatus: 400,
    },
    [ErrorCode.VALIDATION_INVALID_TIME]: {
        message: 'The time format is invalid. Use HH:MM (24-hour format).',
        httpStatus: 400,
    },
    [ErrorCode.VALIDATION_INVALID_ENUM]: {
        message: 'The provided value is not allowed.',
        httpStatus: 400,
    },

    // Database Errors
    [ErrorCode.DB_NOT_FOUND]: {
        message: 'The requested resource was not found.',
        httpStatus: 404,
    },
    [ErrorCode.DB_DUPLICATE]: {
        message: 'This record already exists.',
        httpStatus: 409,
    },
    [ErrorCode.DB_CONNECTION_ERROR]: {
        message: 'Unable to connect to the database. Please try again later.',
        httpStatus: 503,
    },
    [ErrorCode.DB_QUERY_FAILED]: {
        message: 'Database operation failed. Please try again.',
        httpStatus: 500,
    },
    [ErrorCode.DB_CONSTRAINT_VIOLATION]: {
        message: 'This operation violates data integrity constraints.',
        httpStatus: 400,
    },

    // Rate Limit Errors
    [ErrorCode.RATE_LIMIT_EXCEEDED]: {
        message: 'Too many requests. Please slow down and try again.',
        httpStatus: 429,
    },

    // Authorization Errors
    [ErrorCode.AUTH_UNAUTHORIZED]: {
        message: 'You are not authorized to perform this action.',
        httpStatus: 401,
    },
    [ErrorCode.AUTH_FORBIDDEN]: {
        message: 'You do not have permission to access this resource.',
        httpStatus: 403,
    },

    // Internal Errors
    [ErrorCode.INTERNAL_ERROR]: {
        message: 'An unexpected error occurred. Please try again later.',
        httpStatus: 500,
    },
    [ErrorCode.NOT_IMPLEMENTED]: {
        message: 'This feature is not yet implemented.',
        httpStatus: 501,
    },
};

/**
 * Get user-friendly error message for an error code
 */
export function getErrorMessage(code: ErrorCode): string {
    return ErrorMetadata[code]?.message || 'An unknown error occurred.';
}

/**
 * Get HTTP status code for an error code (if applicable)
 */
export function getErrorStatus(code: ErrorCode): number {
    return ErrorMetadata[code]?.httpStatus || 500;
}
