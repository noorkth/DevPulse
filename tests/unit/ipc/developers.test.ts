import { setupDeveloperHandlers } from '../../../electron/ipc/developers';
import { getPrisma } from '../../../electron/prisma';

jest.mock('../../../electron/prisma');

const mockPrisma = {
    developer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
};

(getPrisma as jest.Mock).mockReturnValue(mockPrisma);

describe('Developers IPC Handlers', () => {
    let mockIpcMain: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockIpcMain = {
            handle: jest.fn((channel, handler) => {
                mockIpcMain[channel] = handler;
            }),
        };

        require('electron').ipcMain = mockIpcMain;
        setupDeveloperHandlers();
    });

    describe('developers:getAll', () => {
        it('should return all developers without pagination', async () => {
            const mockDevelopers = [
                {
                    id: 'd1',
                    fullName: 'John Doe',
                    email: 'john@example.com',
                    seniorityLevel: 'senior',
                    _count: { issues: 10, projects: 3 },
                },
            ];

            mockPrisma.developer.findMany.mockResolvedValue(mockDevelopers);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['developers:getAll'](mockEvent);

            expect(result.data).toEqual(mockDevelopers);
        });

        it('should return paginated results', async () => {
            const mockDevelopers = [{ id: 'd1', fullName: 'John Doe' }];

            mockPrisma.developer.count.mockResolvedValue(50);
            mockPrisma.developer.findMany.mockResolvedValue(mockDevelopers);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['developers:getAll'](mockEvent, { limit: 20 });

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('pagination');
            expect(result.pagination.total).toBe(50);
        });
    });

    describe('developers:create', () => {
        it('should create a new developer', async () => {
            const newDeveloper = {
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                skills: 'React, TypeScript',
                seniorityLevel: 'mid',
            };

            mockPrisma.developer.create.mockResolvedValue({ id: 'new', ...newDeveloper });

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['developers:create'](mockEvent, newDeveloper);

            expect(result).toHaveProperty('id');
            expect(mockPrisma.developer.create).toHaveBeenCalled();
        });
    });

    describe('developers:update', () => {
        it('should update an existing developer', async () => {
            const updateData = {
                fullName: 'John Updated',
                seniorityLevel: 'lead',
            };

            mockPrisma.developer.update.mockResolvedValue({ id: 'd1', ...updateData });

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['developers:update'](mockEvent, 'd1', updateData);

            expect(result).toEqual(expect.objectContaining(updateData));
        });
    });
});
