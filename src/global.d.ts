/// <reference types="vite/client" />

declare global {
    interface Window {
        api: {
            app: {
                getVersion: () => Promise<string>;
            };
            theme: {
                get: () => Promise<'light' | 'dark'>;
                set: (theme: 'light' | 'dark' | 'system') => Promise<void>;
            };
            products: any;
            clients: any;
            projects: any;
            developers: any;
            issues: any;
            analytics: any;
            export: any;
            goals: any;
            sharedIssues: any;
            sla: any;
            incidents: any;
            clientHealth: any;
            officeVisits: any;
            resets: any;
            mbr: any;
            monitoring: any;
            featureRequests: any;
            featureRequestActivity: any;
            aiPreventive: any;
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
