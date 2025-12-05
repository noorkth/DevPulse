import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupProductHandlers } from './ipc/products_hierarchy';
import { setupClientHandlers } from './ipc/clients';
import { setupProjectHandlers } from './ipc/projects';
import { setupDeveloperHandlers } from './ipc/developers';
import { setupIssueHandlers } from './ipc/issues';
import { setupAnalyticsHandlers } from './ipc/analytics';

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
            sandbox: false
        }
    });

    // Load app
    const devServerURL = process.env.VITE_DEV_SERVER_URL;
    console.log('🔍 VITE_DEV_SERVER_URL:', devServerURL);

    if (devServerURL) {
        console.log('🌐 Loading from dev server:', devServerURL);
        mainWindow.loadURL(devServerURL);
        mainWindow.webContents.openDevTools();
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

    // Initialize database first (sets DATABASE_URL and runs migrations)
    const { initializeDatabase } = await import('./database');
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Continue anyway - user can try restarting
    }

    // Set up IPC handlers
    setupProductHandlers();
    setupClientHandlers();
    setupProjectHandlers();
    setupDeveloperHandlers();
    setupIssueHandlers();
    setupAnalyticsHandlers();

    // Theme handler
    ipcMain.handle('theme:set', (_event, theme: 'light' | 'dark' | 'system') => {
        if (theme === 'system') {
            nativeTheme.themeSource = 'system';
        } else {
            nativeTheme.themeSource = theme;
        }
    });

    // App version handler
    ipcMain.handle('app:getVersion', () => {
        const packageJson = require('../package.json');
        return packageJson.version;
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
