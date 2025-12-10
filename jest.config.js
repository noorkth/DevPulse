/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^electron$': '<rootDir>/tests/mocks/electron.ts',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    collectCoverageFrom: [
        'electron/**/*.ts',
        'src/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/dist-electron/**',
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
};
