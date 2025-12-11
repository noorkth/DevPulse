// Window API Type Definitions for DevPulse

interface PerformanceAPI {
    getDeveloperDetail: (developerId: string, timeframe?: { weeks?: number }) => Promise<{
        developer: {
            id: string;
            fullName: string;
            email: string;
            skills: string;
            seniorityLevel: string;
            role: string;
        };
        metrics: {
            totalIssues: number;
            resolvedCount: number;
            openCount: number;
            inProgressCount: number;
            recurringCount: number;
            completionRate: number;
            avgResolutionTime: number;
            avgFixQuality: number;
            productivityScore: number;
        };
        currentProjects: number;
    }>;

    getVelocityTrend: (developerId: string, weeks?: number) => Promise<{
        trendData: Array<{
            week: string;
            resolved: number;
        }>;
        currentVelocity: number;
        totalResolved: number;
    }>;

    getResolutionTimeBreakdown: (developerId: string) => Promise<{
        bySeverity: Array<{
            severity: string;
            avgTime: number;
            count: number;
        }>;
        byProject: Array<{
            project: string;
            avgTime: number;
            count: number;
        }>;
    }>;

    getSkillsUtilization: (developerId: string) => Promise<Array<{
        skill: string;
        count: number;
        percentage: number;
    }>>;

    getReopenedIssues: (developerId: string) => Promise<Array<{
        id: string;
        title: string;
        project: string;
        feature?: string;
        severity: string;
        recurrenceCount: number;
        status: string;
    }>>;

    getQualityTrend: (developerId: string, weeks?: number) => Promise<Array<{
        week: string;
        avgQuality: number;
        count: number;
    }>>;

    getWorkloadDistribution: (developerId?: string) => Promise<any>;

    getTeamComparison: (developerId: string) => Promise<{
        comparisons: Array<{
            developerId: string;
            name: string;
            resolvedCount: number;
            avgResolutionTime: number;
            avgQuality: number;
            completionRate: number;
            isTarget: boolean;
        }>;
        teamAverage: {
            avgResolutionTime: number;
            avgQuality: number;
            completionRate: number;
        };
    }>;
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
            developers: {
                getAll: (paginationParams?: any) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                delete: (id: string) => Promise<void>;
                getById: (id: string) => Promise<any>;
            };
            issues: {
                getAll: (filters?: any, paginationParams?: any) => Promise<any>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                resolve: (id: string, fixQuality: number) => Promise<any>;
                detectRecurrence: (issueId: string) => Promise<any>;
                bulkImport: (issues: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
            };
            analytics: any;
            ml: any;
            performance: PerformanceAPI;
            data: any;
            export: any;
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
