import { setupIssueHandlers } from '../../../electron/ipc/issues';
import { getPrisma } from '../../../electron/prisma';
import { RateLimitError } from '../../../electron/security/rate-limiter';

// 1. Define mocks
jest.mock('electron', () => ({
    ipcMain: {
        handle: jest.fn(),
    },
}));

jest.mock('../../../electron/prisma');

// Mock RateLimiter but keep RateLimitError real
jest.mock('../../../electron/security/rate-limiter', () => {
    const actual = jest.requireActual('../../../electron/security/rate-limiter');
    const sharedIsAllowed = jest.fn().mockReturnValue(true);
    const MockRateLimiter = jest.fn().mockImplementation(() => ({
        isAllowed: sharedIsAllowed,
    }));
    // Attach shared mock to the class so tests can access it
    (MockRateLimiter as any).__sharedIsAllowed = sharedIsAllowed;

    return {
        ...actual,
        RateLimiter: MockRateLimiter,
    };
});

const mockPrisma = {
    issue: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
};

(getPrisma as jest.Mock).mockReturnValue(mockPrisma);

describe('Issues IPC Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const mockIpcMain = require('electron').ipcMain;

        // Implement handle to store handlers on the mock object itself for easy access in tests
        mockIpcMain.handle.mockImplementation((channel: string, handler: any) => {
            mockIpcMain[channel] = handler;
        });

        // Re-run setup to register handlers with our fresh mock implementation
        setupIssueHandlers();
    });

    // Helper to get the current mock state
    const getMockIpcMain = () => require('electron').ipcMain;

    describe('issues:getAll', () => {
        it('should return all issues without pagination', async () => {
            const mockIssues = [
                {
                    id: '1',
                    title: 'Test Issue 1',
                    severity: 'high',
                    status: 'open',
                    projectId: 'p1',
                },
                {
                    id: '2',
                    title: 'Test Issue 2',
                    severity: 'medium',
                    status: 'resolved',
                    projectId: 'p2',
                },
            ];

            mockPrisma.issue.findMany.mockResolvedValue(mockIssues);

            const mockEvent = { sender: { id: 1 } };
            const result = await getMockIpcMain()['issues:getAll'](mockEvent);

            expect(result).toEqual(mockIssues);
            expect(mockPrisma.issue.findMany).toHaveBeenCalled();
        });

        it('should return paginated results when pagination params provided', async () => {
            const mockIssues = [
                { id: '1', title: 'Issue 1', severity: 'high' },
                { id: '2', title: 'Issue 2', severity: 'medium' },
            ];

            mockPrisma.issue.count.mockResolvedValue(10);
            mockPrisma.issue.findMany.mockResolvedValue(mockIssues);

            const mockEvent = { sender: { id: 1 } };
            const paginationParams = { limit: 20 };
            const result = await getMockIpcMain()['issues:getAll'](mockEvent, {}, paginationParams);

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('pagination');
            expect(result.data).toEqual(mockIssues);
            expect(result.pagination.total).toBe(10);
            expect(mockPrisma.issue.count).toHaveBeenCalled();
        });

        it('should apply filters correctly', async () => {
            const filters = {
                severity: 'critical',
                status: 'open',
            };

            mockPrisma.issue.findMany.mockResolvedValue([]);

            const mockEvent = { sender: { id: 1 } };
            await getMockIpcMain()['issues:getAll'](mockEvent, filters);

            expect(mockPrisma.issue.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        severity: 'critical',
                        status: 'open',
                    }),
                })
            );
        });

        it('should throw RateLimitError when rate limit exceeded', async () => {
            const mockEvent = { sender: { id: 1 } };

            // Use the shared mock to force failure
            const { RateLimiter } = require('../../../electron/security/rate-limiter');
            RateLimiter.__sharedIsAllowed.mockReturnValueOnce(false);

            await expect(getMockIpcMain()['issues:getAll'](mockEvent)).rejects.toThrow(RateLimitError);
        });
    });

    describe('issues:getById', () => {
        it('should return issue by id', async () => {
            const mockIssue = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Test Issue',
                severity: 'high',
                project: { name: 'Test Project' },
                assignedTo: { fullName: 'John Doe' },
            };

            mockPrisma.issue.findUnique.mockResolvedValue(mockIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await getMockIpcMain()['issues:getById'](mockEvent, '123e4567-e89b-12d3-a456-426614174000');

            expect(result).toEqual(mockIssue);
            expect(mockPrisma.issue.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '123e4567-e89b-12d3-a456-426614174000' },
                })
            );
        });

        it('should throw error for invalid UUID', async () => {
            const mockEvent = { sender: { id: 1 } };

            await expect(getMockIpcMain()['issues:getById'](mockEvent, 'invalid')).rejects.toThrow();
        });
    });

    describe('issues:create', () => {
        it('should create a new issue', async () => {
            const newIssueData = {
                title: 'New Issue',
                description: 'Description',
                severity: 'high',
                projectId: '123e4567-e89b-12d3-a456-426614174000',
                assignedToId: '123e4567-e89b-12d3-a456-426614174001',
            };

            const createdIssue = {
                id: '123e4567-e89b-12d3-a456-426614174002',
                ...newIssueData,
            };

            mockPrisma.issue.create.mockResolvedValue(createdIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await getMockIpcMain()['issues:create'](mockEvent, newIssueData);

            expect(result).toEqual(createdIssue);
            expect(mockPrisma.issue.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: 'New Issue',
                        severity: 'high',
                        project: { connect: { id: '123e4567-e89b-12d3-a456-426614174000' } },
                        assignedTo: { connect: { id: '123e4567-e89b-12d3-a456-426614174001' } }
                    }),
                })
            );
        });

        it('should validate issue data', async () => {
            const invalidData = {
                title: '', // Invalid - empty title
                severity: 'invalid', // Invalid severity
                projectId: '123e4567-e89b-12d3-a456-426614174000'
            };

            const mockEvent = { sender: { id: 1 } };

            await expect(getMockIpcMain()['issues:create'](mockEvent, invalidData)).rejects.toThrow();
        });
    });

    describe('issues:update', () => {
        it('should update an existing issue', async () => {
            const updateData = {
                title: 'Updated Title',
                severity: 'critical',
            };

            const updatedIssue = {
                id: '123e4567-e89b-12d3-a456-426614174003',
                ...updateData,
            };

            mockPrisma.issue.update.mockResolvedValue(updatedIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await getMockIpcMain()['issues:update'](mockEvent, '123e4567-e89b-12d3-a456-426614174003', updateData);

            expect(result).toEqual(updatedIssue);
            expect(mockPrisma.issue.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '123e4567-e89b-12d3-a456-426614174003' },
                    data: expect.objectContaining({
                        title: 'Updated Title',
                        severity: 'critical'
                    }),
                })
            );
        });
    });
});
