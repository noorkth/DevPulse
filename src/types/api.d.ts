// API Type Definitions
export interface IssuesAPI {
    getAll(filters?: any): Promise<any[]>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    resolve(id: string, fixQuality: number): Promise<any>;
    detectRecurrence(issueId: string): Promise<any>;
    bulkImport(issues: any[]): Promise<{ success: number; failed: number; errors: string[] }>;
}

declare global {
    interface Window {
        api: {
            products: any;
            clients: any;
            projects: any;
            developers: any;
            issues: IssuesAPI;
            analytics: any;
            ml: any;
            performance: any;
            data: any;
            export: any;
            email: any;
            theme: {
                get: () => Promise<'light' | 'dark'>;
                set: (theme: 'light' | 'dark' | 'system') => Promise<void>;
            };
        };
    }
}

export { };
