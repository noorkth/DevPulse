import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupProductHandlers } from './ipc/products_hierarchy';
import { setupClientHandlers } from './ipc/clients';
import { setupProjectHandlers } from './ipc/projects';
import { setupDeveloperHandlers } from './ipc/developers';
import { setupIssueHandlers } from './ipc/issues';
import { setupAnalyticsHandlers } from './ipc/analytics';
import { setupDataHandlers } from './ipc/data';
import { setupMLHandlers } from './ipc/ml';
import { setupPerformanceHandlers } from './ipc/performance';
import { setupGoalsHandlers } from './ipc/goals';
import { setupEmailHandlers } from './email/handlers';
import { initializeEmailScheduler } from './email/scheduler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('🔍 Preload path:', preloadPath);
    console.log('🔍 __dirname:', __dirname);

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1a1a1a',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,  // ✅ Enable sandbox for better security
            webSecurity: true,  // ✅ Ensure web security
            allowRunningInsecureContent: false  // ✅ Block insecure content
        }
    });

    // ✅ Set Content Security Policy headers (relaxed for development)
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

        // Relaxed CSP for development (Vite needs unsafe-eval and localhost)
        const devCSP =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' http://localhost:* ws://localhost:*";

        // Strict CSP for production
        const prodCSP =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "font-src 'self'; " +
            "connect-src 'self'";

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [isDev ? devCSP : prodCSP]
            }
        });
    });

    // Load app
    const devServerURL = process.env.VITE_DEV_SERVER_URL;
    const isDev = process.env.NODE_ENV === 'development';
    console.log('🔍 VITE_DEV_SERVER_URL:', devServerURL);
    console.log('🔍 Environment:', isDev ? 'development' : 'production');

    if (devServerURL) {
        console.log('🌐 Loading from dev server:', devServerURL);
        mainWindow.loadURL(devServerURL);

        // ✅ Only open DevTools in development
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    } else {
        console.log('📁 Loading from dist folder');
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// App ready
app.whenReady().then(async () => {
    console.log('🚀 App is ready');

    console.log('='.repeat(60));
    console.log('🚀 DEVPULSE STARTING - INITIALIZING DATABASE');
    console.log('='.repeat(60));

    try {
        const { initializeDatabase } = await import('./database');
        console.log('📦 Database module loaded successfully');
        await initializeDatabase();
        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('='.repeat(60));
        console.error('❌❌❌ CRITICAL: Database initialization FAILED ❌❌❌');
        console.error('='.repeat(60));
        console.error('Error:', error);
        console.error('Error stack:', (error as Error).stack);
        console.error('='.repeat(60));
        // Don't throw - allow app to continue but log prominently
    }

    console.log('🎨 Setting up IPC handlers...');
    // Set up IPC handlers
    setupProductHandlers();
    setupClientHandlers();
    setupProjectHandlers();
    setupDeveloperHandlers();
    setupIssueHandlers();
    setupAnalyticsHandlers();
    setupDataHandlers();
    setupMLHandlers();
    setupPerformanceHandlers();
    setupGoalsHandlers();
    setupEmailHandlers();
    console.log('🤖 ML handlers registered');

    // Initialize email scheduler
    initializeEmailScheduler();

    // Theme handlers
    ipcMain.handle('theme:get', () => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });

    ipcMain.handle('theme:set', (_event, theme: 'light' | 'dark' | 'system') => {
        if (theme === 'system') {
            nativeTheme.themeSource = 'system';
        } else {
            nativeTheme.themeSource = theme;
        }
    });

    // App version handler
    ipcMain.handle('app:getVersion', () => {
        try {
            // Use Electron's app.getVersion() which reads from package.json correctly in both dev and production
            const version = app.getVersion();
            console.log('✅ Version retrieved:', version);
            return version;
        } catch (error) {
            console.error('❌ Error getting version:', error);
            return '1.0.0';
        }
    });

    // Create window
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle app quit
app.on('will-quit', async () => {
    // Cleanup if needed
});
