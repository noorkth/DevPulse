import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script is running!');

// Exposed API for renderer process
const api = {
    // Products
    products: {
        getAll: () => ipcRenderer.invoke('products:getAll'),
        getById: (id: string) => ipcRenderer.invoke('products:getById', id),
        create: (data: any) => ipcRenderer.invoke('products:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('products:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('products:delete', id),
    },

    // Clients
    clients: {
        getAll: (filters?: any) => ipcRenderer.invoke('clients:getAll', filters),
        getById: (id: string) => ipcRenderer.invoke('clients:getById', id),
        create: (data: any) => ipcRenderer.invoke('clients:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('clients:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('clients:delete', id),
    },

    // Projects
    projects: {
        getAll: (filters?: any) => ipcRenderer.invoke('projects:getAll', filters),
        getById: (id: string) => ipcRenderer.invoke('projects:getById', id),
        create: (data: any) => ipcRenderer.invoke('projects:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('projects:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
        getStats: (id: string) => ipcRenderer.invoke('projects:getStats', id),
    },

    // Developers
    developers: {
        getAll: () => ipcRenderer.invoke('developers:getAll'),
        getById: (id: string) => ipcRenderer.invoke('developers:getById', id),
        create: (data: any) => ipcRenderer.invoke('developers:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('developers:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('developers:delete', id),
        getProductivityScore: (id: string, timeframe?: any) =>
            ipcRenderer.invoke('developers:getProductivityScore', id, timeframe),
    },

    // Issues
    issues: {
        getAll: (filters?: any) => ipcRenderer.invoke('issues:getAll', filters),
        getById: (id: string) => ipcRenderer.invoke('issues:getById', id),
        create: (data: any) => ipcRenderer.invoke('issues:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('issues:update', id, data),
        resolve: (id: string, fixQuality: number) =>
            ipcRenderer.invoke('issues:resolve', id, fixQuality),
        detectRecurrence: (issueId: string) =>
            ipcRenderer.invoke('issues:detectRecurrence', issueId),
        bulkImport: (issues: any[]) =>
            ipcRenderer.invoke('issues:bulkImport', issues),
    },

    // Analytics
    analytics: {
        getDashboardStats: () => ipcRenderer.invoke('analytics:getDashboardStats'),
        getProductivityRankings: (timeframe?: any) =>
            ipcRenderer.invoke('analytics:getProductivityRankings', timeframe),
        getFeatureStability: (projectId?: string) =>
            ipcRenderer.invoke('analytics:getFeatureStability', projectId),
        getRecurrenceAnalysis: () =>
            ipcRenderer.invoke('analytics:getRecurrenceAnalysis'),
        getTimeToFixData: (filters?: any) =>
            ipcRenderer.invoke('analytics:getTimeToFixData', filters),
        getProjectComparison: () =>
            ipcRenderer.invoke('analytics:getProjectComparison'),
    },

    // ML / Predictive Analytics
    ml: {
        predictResolutionTime: (issueData: any) =>
            ipcRenderer.invoke('ml:predictResolutionTime', issueData),
        detectHotspots: () =>
            ipcRenderer.invoke('ml:detectHotspots'),
        recommendDeveloper: (issueData: any) =>
            ipcRenderer.invoke('ml:recommendDeveloper', issueData),
    },

    // Performance Analytics
    performance: {
        getDeveloperDetail: (developerId: string, timeframe?: any) =>
            ipcRenderer.invoke('performance:getDeveloperDetail', developerId, timeframe),
        getVelocityTrend: (developerId: string, weeks?: number, timeframe?: any) =>
            ipcRenderer.invoke('performance:getVelocityTrend', developerId, weeks, timeframe),
        getResolutionTimeBreakdown: (developerId: string, timeframe?: any) =>
            ipcRenderer.invoke('performance:getResolutionTimeBreakdown', developerId, timeframe),
        getSkillsUtilization: (developerId: string, timeframe?: any) =>
            ipcRenderer.invoke('performance:getSkillsUtilization', developerId, timeframe),
        getReopenedIssues: (developerId: string, timeframe?: any) =>
            ipcRenderer.invoke('performance:getReopenedIssues', developerId, timeframe),
        getQualityTrend: (developerId: string, weeks?: number, timeframe?: any) =>
            ipcRenderer.invoke('performance:getQualityTrend', developerId, weeks, timeframe),
        getWorkloadDistribution: (developerId?: string) =>
            ipcRenderer.invoke('performance:getWorkloadDistribution', developerId),
        getTeamComparison: (developerId: string, timeframe?: any) =>
            ipcRenderer.invoke('performance:getTeamComparison', developerId, timeframe),
    },

    // Goals Management
    goals: {
        create: (goalData: any) => ipcRenderer.invoke('goals:create', goalData),
        getForDeveloper: (developerId: string) => ipcRenderer.invoke('goals:getForDeveloper', developerId),
        updateProgress: (goalId: string, currentValue: number) =>
            ipcRenderer.invoke('goals:updateProgress', goalId, currentValue),
        update: (goalId: string, updateData: any) =>
            ipcRenderer.invoke('goals:update', goalId, updateData),
        delete: (goalId: string) => ipcRenderer.invoke('goals:delete', goalId),
        checkExpired: () => ipcRenderer.invoke('goals:checkExpired'),
    },

    // Email Management
    email: {
        testConnection: (config?: any) => ipcRenderer.invoke('email:testConnection', config),
        sendTest: (emailAddress: string, config?: any) => ipcRenderer.invoke('email:sendTest', emailAddress, config),
        sendWeeklyReport: (developerId: string) => ipcRenderer.invoke('email:sendWeeklyReport', developerId),
        triggerWeeklyReports: () => ipcRenderer.invoke('email:triggerWeeklyReports'),
        getSchedulerStatus: () => ipcRenderer.invoke('email:getSchedulerStatus'),
    },

    // Theme
    theme: {
        get: () => ipcRenderer.invoke('theme:get'),
        set: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', theme),
    },

    // Export
    // Export old - can be deprecated
    export: {
        toCSV: (data: any, filename: string) =>
            ipcRenderer.invoke('export:toCSV', data, filename),
        toPDF: (data: any, filename: string) =>
            ipcRenderer.invoke('export:toPDF', data, filename),
    },

    // Data Management (new)
    data: {
        export: () => ipcRenderer.invoke('data:export'),
        import: () => ipcRenderer.invoke('data:import'),
        clearCache: () => ipcRenderer.invoke('data:clearCache'),
    },

    // App
    app: {
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
    },
};

// Expose API to renderer
try {
    contextBridge.exposeInMainWorld('api', api);
    console.log('✅ API exposed via contextBridge to window.api');
} catch (error) {
    console.error('❌ contextBridge failed:', error);
    // Fallback: directly assign to window (only works if contextIsolation is false)
    (globalThis as any).window.api = api;
    console.log('⚠️ API exposed via direct window assignment (fallback)');
}
