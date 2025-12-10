// Test setup file
// This runs before all tests

// Mock Electron
jest.mock('electron', () => ({
    ipcMain: {
        handle: jest.fn(),
        on: jest.fn(),
    },
    app: {
        getPath: jest.fn(() => '/mock/path'),
    },
}));

// Suppress console output during tests (optional)
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
