import { ErrorCode, getErrorMessage } from './error-codes';

/**
 * Custom application error with error codes
 */
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly userMessage: string;
    public readonly technicalDetails?: any;
    public readonly timestamp: Date;

    constructor(
        code: ErrorCode,
        userMessage?: string,
        technicalDetails?: any
    ) {
        const message = userMessage || getErrorMessage(code);
        super(message);

        this.name = 'AppError';
        this.code = code;
        this.userMessage = message;
        this.technicalDetails = technicalDetails;
        this.timestamp = new Date();

        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON for IPC transmission
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.userMessage,
            technicalDetails: this.technicalDetails,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }

    /**
     * Check if error is of a specific code
     */
    is(code: ErrorCode): boolean {
        return this.code === code;
    }

    /**
     * Create from unknown error
     */
    static from(error: unknown, defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR): AppError {
        if (error instanceof AppError) {
            return error;
        }

        if (error instanceof Error) {
            return new AppError(defaultCode, error.message, { originalError: error.stack });
        }

        return new AppError(defaultCode, String(error));
    }
}

/**
 * Helper to throw AppError
 */
export function throwAppError(
    code: ErrorCode,
    userMessage?: string,
    technicalDetails?: any
): never {
    throw new AppError(code, userMessage, technicalDetails);
}
