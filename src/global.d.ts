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
        };
    }
}

export { };
