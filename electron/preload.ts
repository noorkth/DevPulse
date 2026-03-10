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

    // Search
    search: {
        global: (query: string, filters?: any) => ipcRenderer.invoke('search:global', query, filters),
    },

    // Email Schedules
    emailSchedules: {
        getAll: () => ipcRenderer.invoke('email-schedules:getAll'),
        getById: (id: string) => ipcRenderer.invoke('email-schedules:getById', id),
        create: (data: any) => ipcRenderer.invoke('email-schedules:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('email-schedules:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('email-schedules:delete', id),
        toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('email-schedules:toggle', id, enabled),
    },

    // ── Governance Layer ────────────────────────────────────────
    // Shared Issue Tracker
    sharedIssues: {
        getAll: (filters?: any) => ipcRenderer.invoke('sharedIssues:getAll', filters),
        getById: (id: string) => ipcRenderer.invoke('sharedIssues:getById', id),
        create: (data: any) => ipcRenderer.invoke('sharedIssues:create', data),
        update: (id: string, data: any, updatedById: string) => ipcRenderer.invoke('sharedIssues:update', id, data, updatedById),
        updateStatus: (id: string, status: string, updatedById: string) => ipcRenderer.invoke('sharedIssues:updateStatus', id, status, updatedById),
        escalate: (id: string, escalatedById: string) => ipcRenderer.invoke('sharedIssues:escalate', id, escalatedById),
        setEscalation: (id: string, newLevel: number, updatedById: string) => ipcRenderer.invoke('sharedIssues:setEscalation', id, newLevel, updatedById),
        toggleVisibility: (id: string, updatedById: string) => ipcRenderer.invoke('sharedIssues:toggleVisibility', id, updatedById),
        markFirstResponse: (id: string, respondedById: string) => ipcRenderer.invoke('sharedIssues:markFirstResponse', id, respondedById),
        acknowledge: (id: string, acknowledgedById: string) => ipcRenderer.invoke('sharedIssues:acknowledge', id, acknowledgedById),
        delete: (id: string) => ipcRenderer.invoke('sharedIssues:delete', id),
    },

    // SLA Engine
    sla: {
        getRules: () => ipcRenderer.invoke('sla:getRules'),
        updateRule: (severity: string, data: any) => ipcRenderer.invoke('sla:updateRule', severity, data),
        getBreaches: (clientId?: string) => ipcRenderer.invoke('sla:getBreaches', clientId),
        getMetrics: (clientId: string | undefined, startDate: string, endDate: string) => ipcRenderer.invoke('sla:getMetrics', clientId, startDate, endDate),
        getStatus: (issueId: string) => ipcRenderer.invoke('sla:getStatus', issueId),
        runMonitor: () => ipcRenderer.invoke('sla:runMonitor'),
        getComplianceTrend: (clientId?: string, weeks?: number) => ipcRenderer.invoke('sla:getComplianceTrend', clientId, weeks),
    },

    // Incidents
    incidents: {
        getUpdates: (sharedIssueId: string) => ipcRenderer.invoke('incidents:getUpdates', sharedIssueId),
        addUpdate: (data: any) => ipcRenderer.invoke('incidents:addUpdate', data),
        uploadRca: (sharedIssueId: string, authorId: string, text: string, filePath?: string) => ipcRenderer.invoke('incidents:uploadRca', sharedIssueId, authorId, text, filePath),
        markClientNotified: (updateId: string) => ipcRenderer.invoke('incidents:markClientNotified', updateId),
        getSummary: (sharedIssueId: string) => ipcRenderer.invoke('incidents:getSummary', sharedIssueId),
    },

    // Client Health
    clientHealth: {
        getDashboard: (clientId?: string) => ipcRenderer.invoke('clientHealth:getDashboard', clientId),
        getHistory: (clientId?: string, weeks?: number) => ipcRenderer.invoke('clientHealth:getHistory', clientId, weeks),
        getIncidentTrend: (clientId?: string, weeks?: number) => ipcRenderer.invoke('clientHealth:getIncidentTrend', clientId, weeks),
        getMTTRTrend: (clientId?: string, weeks?: number) => ipcRenderer.invoke('clientHealth:getMTTRTrend', clientId, weeks),
        generateSnapshot: (clientId: string) => ipcRenderer.invoke('clientHealth:generateSnapshot', clientId),
    },

    // Office Visits
    officeVisits: {
        getAll: (clientId?: string) => ipcRenderer.invoke('officeVisits:getAll', clientId),
        getById: (id: string) => ipcRenderer.invoke('officeVisits:getById', id),
        create: (data: any) => ipcRenderer.invoke('officeVisits:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('officeVisits:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('officeVisits:delete', id),
    },

    // Relationship Resets
    resets: {
        getAll: (clientId?: string) => ipcRenderer.invoke('resets:getAll', clientId),
        create: (data: any) => ipcRenderer.invoke('resets:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('resets:update', id, data),
        close: (id: string) => ipcRenderer.invoke('resets:close', id),
        delete: (id: string) => ipcRenderer.invoke('resets:delete', id),
    },

    // Monthly Business Review
    mbr: {
        getAll: (clientId?: string) => ipcRenderer.invoke('mbr:getAll', clientId),
        getById: (id: string) => ipcRenderer.invoke('mbr:getById', id),
        create: (data: any) => ipcRenderer.invoke('mbr:create', data),
        update: (id: string, data: any, updatedById: string) => ipcRenderer.invoke('mbr:update', id, data, updatedById),
        publish: (id: string, publishedById: string) => ipcRenderer.invoke('mbr:publish', id, publishedById),
        delete: (id: string, deletedById: string) => ipcRenderer.invoke('mbr:delete', id, deletedById),
        autoPopulate: (clientId: string, reviewMonth: string) => ipcRenderer.invoke('mbr:autoPopulate', clientId, reviewMonth),
        exportPdf: (base64Data: string, filename: string) => ipcRenderer.invoke('mbr:exportPdf', base64Data, filename),
    },

    // Monitoring Checklist
    monitoring: {
        getAll: (clientId?: string) => ipcRenderer.invoke('monitoring:getAll', clientId),
        getById: (id: string) => ipcRenderer.invoke('monitoring:getById', id),
        create: (data: any) => ipcRenderer.invoke('monitoring:create', data),
        update: (id: string, data: any) => ipcRenderer.invoke('monitoring:update', id, data),
        complete: (id: string) => ipcRenderer.invoke('monitoring:complete', id),
        delete: (id: string, deletedById: string) => ipcRenderer.invoke('monitoring:delete', id, deletedById),
        getStats: (clientId: string) => ipcRenderer.invoke('monitoring:getStats', clientId),
    },

    featureRequests: {
        getAll: (clientId?: string, requestedById?: string) => ipcRenderer.invoke('featureRequests:getAll', clientId, requestedById),
        create: (data: any, createdById: string) => ipcRenderer.invoke('featureRequests:create', data, createdById),
        update: (id: string, data: any, updatedById: string) => ipcRenderer.invoke('featureRequests:update', id, data, updatedById),
        delete: (id: string, deletedById: string) => ipcRenderer.invoke('featureRequests:delete', id, deletedById),
    },

    featureRequestActivity: {
        getActivities: (id: string) => ipcRenderer.invoke('featureRequests:getActivities', id),
        getComments: (id: string) => ipcRenderer.invoke('featureRequests:getComments', id),
        addComment: (id: string, authorId: string, text: string) => ipcRenderer.invoke('featureRequests:addComment', id, authorId, text),
    },

    // Auth
    auth: {
        login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    },

    // AI Preventive Features
    aiPreventive: {
        getAll: (clientId?: string, requestedById?: string) => ipcRenderer.invoke('aiPreventive:getAll', clientId, requestedById),
        generate: () => ipcRenderer.invoke('aiPreventive:generate'),
        updateStatus: (id: string, status: string, updatedById: string) => ipcRenderer.invoke('aiPreventive:updateStatus', id, status, updatedById),
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
