/**
 * Pagination Utilities
 * 
 * Provides cursor-based pagination helpers for scalable data handling
 */

export interface PaginationParams {
    limit?: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
    total: number;
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: PaginationInfo;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(params?: PaginationParams): Required<PaginationParams> {
    const limit = params?.limit
        ? Math.min(Math.max(1, params.limit), MAX_LIMIT)
        : DEFAULT_LIMIT;

    return {
        limit,
        cursor: params?.cursor || '',
        sortBy: params?.sortBy || 'createdAt',
        sortOrder: params?.sortOrder || 'desc',
    };
}

/**
 * Build Prisma query object for cursor-based pagination
 */
export function buildPaginationQuery(params: PaginationParams) {
    const normalized = normalizePaginationParams(params);
    const query: any = {
        take: normalized.limit + 1, // Fetch one extra to determine hasMore
        orderBy: {
            [normalized.sortBy]: normalized.sortOrder,
        },
    };

    // Add cursor if provided
    if (normalized.cursor) {
        query.skip = 1; // Skip the cursor itself
        query.cursor = {
            id: normalized.cursor,
        };
    }

    return query;
}

/**
 * Create pagination response from query results
 */
export function createPaginationResponse<T extends { id: string }>(
    results: T[],
    total: number,
    params: PaginationParams
): PaginationResult<T> {
    const normalized = normalizePaginationParams(params);
    const hasMore = results.length > normalized.limit;

    // Remove the extra item if we fetched one
    const data = hasMore ? results.slice(0, -1) : results;

    const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1].id
        : null;

    const prevCursor = normalized.cursor || null;

    return {
        data,
        pagination: {
            total,
            hasMore,
            nextCursor,
            prevCursor,
        },
    };
}

/**
 * Build offset-based pagination query (alternative to cursor-based)
 * Use this for simpler cases where cursor-based isn't needed
 */
export function buildOffsetPaginationQuery(page: number = 1, limit: number = DEFAULT_LIMIT) {
    const normalizedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const normalizedPage = Math.max(1, page);
    const skip = (normalizedPage - 1) * normalizedLimit;

    return {
        take: normalizedLimit,
        skip,
    };
}

/**
 * Create offset-based pagination response
 */
export function createOffsetPaginationResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
) {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}
