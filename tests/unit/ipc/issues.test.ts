import { setupIssueHandlers } from '../../../electron/ipc/issues';
import { getPrisma } from '../../../electron/prisma';
import { RateLimitError } from '../../../electron/security/rate-limiter';

// Mock dependencies
jest.mock('../../../electron/prisma');
jest.mock('../../../electron/security/rate-limiter');

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
    let mockIpcMain: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock ipcMain
        mockIpcMain = {
            handle: jest.fn((channel, handler) => {
                mockIpcMain[channel] = handler;
            }),
        };

        // Mock electron
        jest.mock('electron', () => ({
            ipcMain: mockIpcMain,
        }));

        // Setup handlers
        require('electron').ipcMain = mockIpcMain;
        setupIssueHandlers();
    });

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
            const result = await mockIpcMain['issues:getAll'](mockEvent);

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
            const result = await mockIpcMain['issues:getAll'](mockEvent, {}, paginationParams);

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
            await mockIpcMain['issues:getAll'](mockEvent, filters);

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

            // Mock rate limiter to deny request
            const { RateLimiter } = require('../../../electron/security/rate-limiter');
            RateLimiter.prototype.isAllowed = jest.fn().mockReturnValue(false);

            await expect(mockIpcMain['issues:getAll'](mockEvent)).rejects.toThrow(RateLimitError);
        });
    });

    describe('issues:getById', () => {
        it('should return issue by id', async () => {
            const mockIssue = {
                id: '123',
                title: 'Test Issue',
                severity: 'high',
                project: { name: 'Test Project' },
                assignedTo: { fullName: 'John Doe' },
            };

            mockPrisma.issue.findUnique.mockResolvedValue(mockIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['issues:getById'](mockEvent, '123');

            expect(result).toEqual(mockIssue);
            expect(mockPrisma.issue.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '123' },
                })
            );
        });

        it('should throw error for invalid UUID', async () => {
            const mockEvent = { sender: { id: 1 } };

            await expect(mockIpcMain['issues:getById'](mockEvent, 'invalid')).rejects.toThrow();
        });
    });

    describe('issues:create', () => {
        it('should create a new issue', async () => {
            const newIssueData = {
                title: 'New Issue',
                description: 'Description',
                severity: 'high',
                projectId: 'p1',
                assignedToId: 'd1',
            };

            const createdIssue = {
                id: 'new-id',
                ...newIssueData,
            };

            mockPrisma.issue.create.mockResolvedValue(createdIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['issues:create'](mockEvent, newIssueData);

            expect(result).toEqual(createdIssue);
            expect(mockPrisma.issue.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: 'New Issue',
                        severity: 'high',
                    }),
                })
            );
        });

        it('should validate issue data', async () => {
            const invalidData = {
                title: '', // Invalid - empty title
                severity: 'invalid', // Invalid severity
            };

            const mockEvent = { sender: { id: 1 } };

            await expect(mockIpcMain['issues:create'](mockEvent, invalidData)).rejects.toThrow();
        });
    });

    describe('issues:update', () => {
        it('should update an existing issue', async () => {
            const updateData = {
                title: 'Updated Title',
                severity: 'critical',
            };

            const updatedIssue = {
                id: '123',
                ...updateData,
            };

            mockPrisma.issue.update.mockResolvedValue(updatedIssue);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['issues:update'](mockEvent, '123', updateData);

            expect(result).toEqual(updatedIssue);
            expect(mockPrisma.issue.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '123' },
                    data: expect.objectContaining(updateData),
                })
            );
        });
    });
});
