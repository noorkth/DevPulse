import '@testing-library/jest-dom';

// Mock window.api for Electron IPC
global.window = global.window || {};
(global.window as any).api = {
    issues: {
        getAll: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        resolve: jest.fn(),
    },
    projects: {
        getAll: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    developers: {
        getAll: jest.fn(),
        getById: jest.fn(),
        getProductivityScore: jest.fn(),
    },
    products: {
        getAll: jest.fn(),
    },
    clients: {
        getAll: jest.fn(),
    },
};

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
}));

// Suppress console errors in tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};
