// Global type definitions for DevPulse

export interface Project {
    id: string;
    name: string;
    clientName: string;
    projectType: string;
    description?: string;
    startDate: Date | string;
    endDate?: Date | string | null;
    status: 'active' | 'completed' | 'archived' | 'on-hold';
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Developer {
    id: string;
    fullName: string;
    email: string;
    skills: string; // JSON string
    seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Feature {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    featureId?: string | null;
    projectId: string;
    assignedToId?: string | null;
    createdAt: Date | string;
    resolvedAt?: Date | string | null;
    resolutionTime?: number | null;
    fixQuality?: number | null;
    isRecurring: boolean;
    recurrenceCount: number;
    parentIssueId?: string | null;
    notes?: string | null;
    attachments?: string | null;

    // Relations
    project?: Project;
    assignedTo?: Developer;
    feature?: Feature;
    parentIssue?: Issue;
    childIssues?: Issue[];
}

export interface DashboardStats {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    recurringIssues: number;
    avgResolutionTime: number;
    severityDistribution: { severity: string; _count: number }[];
    statusDistribution: { status: string; _count: number }[];
}

export interface ProductivityRanking {
    developerId: string;
    developerName: string;
    productivityScore: number;
    resolvedCount: number;
    recurringCount: number;
    avgResolutionTime: number;
}

export interface FeatureStability {
    featureId: string;
    featureName: string;
    projectName: string;
    stabilityScore: number;
    totalBugs: number;
    recurringBugs: number;
    criticalBugs: number;
}

// Window API types
declare global {
    interface Window {
        api: {
            products: {
                getAll: () => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                delete: (id: string) => Promise<any>;
            };
            clients: {
                getAll: (filters?: any) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<any>;
                update: (id: string, data: any) => Promise<any>;
                delete: (id: string) => Promise<any>;
            };
            projects: {
                getAll: (filters?: any) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<Project>;
                update: (id: string, data: any) => Promise<Project>;
                delete: (id: string) => Promise<Project>;
                getStats: (id: string) => Promise<any>;
            };
            developers: {
                getAll: () => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<Developer>;
                update: (id: string, data: any) => Promise<Developer>;
                delete: (id: string) => Promise<any>;
                getProductivityScore: (id: string, timeframe?: any) => Promise<any>;
            };
            issues: {
                getAll: (filters?: any) => Promise<any[]>;
                getById: (id: string) => Promise<any>;
                create: (data: any) => Promise<Issue>;
                update: (id: string, data: any) => Promise<Issue>;
                resolve: (id: string, fixQuality: number) => Promise<Issue>;
                detectRecurrence: (issueId: string) => Promise<any>;
            };
            analytics: {
                getDashboardStats: () => Promise<DashboardStats>;
                getProductivityRankings: (timeframe?: any) => Promise<ProductivityRanking[]>;
                getFeatureStability: (projectId?: string) => Promise<FeatureStability[]>;
                getRecurrenceAnalysis: () => Promise<any>;
                getTimeToFixData: (filters?: any) => Promise<any>;
                getProjectComparison: () => Promise<any>;
            };
            theme: {
                get: () => Promise<'light' | 'dark'>;
                set: (theme: 'light' | 'dark' | 'system') => Promise<string>;
            };
            export: {
                toCSV: (data: any, filename: string) => Promise<any>;
                toPDF: (data: any, filename: string) => Promise<any>;
            };
        };
    }
}

export { };
