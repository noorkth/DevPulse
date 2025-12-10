import { useState, useCallback } from 'react';

export interface PaginationState {
    page: number;
    pageSize: number;
    cursor: string | null;
}

export interface UsePaginationResult {
    page: number;
    pageSize: number;
    cursor: string | null;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setCursor: (cursor: string | null) => void;
    nextPage: () => void;
    prevPage: () => void;
    reset: () => void;
    getPaginationParams: () => { limit: number; cursor?: string };
}

interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    initialCursor?: string | null;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
    const {
        initialPage = 1,
        initialPageSize = 20,
        initialCursor = null,
    } = options;

    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [cursor, setCursor] = useState<string | null>(initialCursor);

    const nextPage = useCallback(() => {
        setPage((prev) => prev + 1);
    }, []);

    const prevPage = useCallback(() => {
        setPage((prev) => Math.max(1, prev - 1));
    }, []);

    const reset = useCallback(() => {
        setPage(initialPage);
        setPageSize(initialPageSize);
        setCursor(initialCursor);
    }, [initialPage, initialPageSize, initialCursor]);

    const getPaginationParams = useCallback(() => {
        const params: { limit: number; cursor?: string } = {
            limit: pageSize,
        };
        if (cursor) {
            params.cursor = cursor;
        }
        return params;
    }, [pageSize, cursor]);

    return {
        page,
        pageSize,
        cursor,
        setPage,
        setPageSize,
        setCursor,
        nextPage,
        prevPage,
        reset,
        getPaginationParams,
    };
}
