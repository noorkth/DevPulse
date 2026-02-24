// Mock Electron module for testing
export const ipcMain = {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
};

export const app = {
    getPath: jest.fn((name: string) => `/mock/path/${name}`),
    whenReady: jest.fn(() => Promise.resolve()),
    quit: jest.fn(),
};

export const BrowserWindow = jest.fn();

export default {
    ipcMain,
    app,
    BrowserWindow,
};
