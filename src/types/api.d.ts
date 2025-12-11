// API Type Definitions
export interface IssuesAPI {
    getAll(filters?: any, paginationParams?: any): Promise<any>;
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
            app: {
                getVersion: () => Promise<string>;
            };
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
            search: {
                global: (query: string, filters?: any) => Promise<any[]>;
            };
            emailSchedules: {
                getAll: () => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                delete: (id: string) => Promise<void>;
                toggle: (id: string, enabled: boolean) => Promise<any>;
            };
        };
    }
}

export { };
