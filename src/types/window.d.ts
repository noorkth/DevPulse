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
            // Governance Layer
            sharedIssues: {
                getAll: (filters?: any) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any, updatedById: string) => Promise<any>;
                updateStatus: (id: string, status: string, updatedById: string) => Promise<any>;
                escalate: (id: string, escalatedById: string) => Promise<any>;
                setEscalation: (id: string, newLevel: number, updatedById: string) => Promise<any>;
                toggleVisibility: (id: string, updatedById: string) => Promise<any>;
                markFirstResponse: (id: string, respondedById: string) => Promise<any>;
                delete: (id: string) => Promise<void>;
            };
            sla: {
                getRules: () => Promise<any[]>;
                updateRule: (severity: string, data: any) => Promise<any>;
                getBreaches: (clientId?: string) => Promise<any[]>;
                getMetrics: (clientId: string, startDate: string, endDate: string) => Promise<any>;
                getStatus: (issueId: string) => Promise<any>;
                runMonitor: () => Promise<any>;
                getComplianceTrend: (clientId: string, weeks?: number) => Promise<any[]>;
            };
            incidents: {
                getUpdates: (sharedIssueId: string) => Promise<any[]>;
                addUpdate: (data: any) => Promise<any>;
                uploadRca: (sharedIssueId: string, authorId: string, text: string, filePath?: string) => Promise<any>;
                markClientNotified: (updateId: string) => Promise<any>;
                getSummary: (sharedIssueId: string) => Promise<any>;
            };
            clientHealth: {
                getDashboard: (clientId?: string) => Promise<any[]>;
                getHistory: (clientId: string, weeks?: number) => Promise<any[]>;
                getIncidentTrend: (clientId: string, weeks?: number) => Promise<any[]>;
                generateSnapshot: (clientId: string) => Promise<any>;
            };
            officeVisits: {
                getAll: (clientId?: string) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                delete: (id: string) => Promise<void>;
            };
            resets: {
                getAll: (clientId?: string) => Promise<any[]>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                close: (id: string) => Promise<any>;
                delete: (id: string) => Promise<void>;
            };
            mbr: {
                getAll: (clientId?: string) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                publish: (id: string) => Promise<any>;
                delete: (id: string) => Promise<void>;
                autoPopulate: (clientId: string, reviewMonth: string) => Promise<any>;
            };
            monitoring: {
                getAll: (clientId?: string) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                complete: (id: string) => Promise<any>;
                delete: (id: string) => Promise<void>;
                getStats: (clientId: string) => Promise<any>;
            };
            featureRequests: {
                getAll: (clientId?: string, requestedById?: string) => Promise<any[]>;
                create: (data: any, createdById: string) => Promise<any>;
                update: (id: string, data: any, updatedById: string) => Promise<any>;
                delete: (id: string, deletedById: string) => Promise<void>;
            };
            aiPreventive: {
                getAll: (clientId?: string, requestedById?: string) => Promise<any[]>;
                generate: () => Promise<any>;
                updateStatus: (id: string, status: string, updatedById: string) => Promise<any>;
            };
            goals: any;
            auth: {
                login: (username: string, password: string) => Promise<{
                    id: string;
                    username: string;
                    fullName: string;
                    email: string;
                    role: string;
                }>;
            };
        };
    }
}

export { };
