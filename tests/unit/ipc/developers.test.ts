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
    developerProject: {
        create: jest.fn(),
        deleteMany: jest.fn(),
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

            expect(result).toEqual(mockDevelopers);
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

        it('should create developer with role field', async () => {
            const newManager = {
                fullName: 'Project Manager',
                email: 'pm@example.com',
                skills: ['Leadership', 'Planning'],
                seniorityLevel: 'senior',
                role: 'manager',
            };

            mockPrisma.developer.create.mockResolvedValue({ id: 'pm1', ...newManager });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:create'](mockEvent, newManager);

            expect(mockPrisma.developer.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    role: 'manager',
                }),
            });
        });

        it('should default to developer role when not provided', async () => {
            const newDeveloper = {
                fullName: 'Dev User',
                email: 'dev@example.com',
                skills: ['React'],
                seniorityLevel: 'junior',
            };

            mockPrisma.developer.create.mockResolvedValue({ id: 'dev1', ...newDeveloper });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:create'](mockEvent, newDeveloper);

            expect(mockPrisma.developer.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    role: 'developer',
                }),
            });
        });

        it('should stringify skills array', async () => {
            const newDeveloper = {
                fullName: 'Developer',
                email: 'dev@example.com',
                skills: ['React', 'Node.js', 'TypeScript'],
                seniorityLevel: 'mid',
            };

            mockPrisma.developer.create.mockResolvedValue({ id: 'dev1', ...newDeveloper });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:create'](mockEvent, newDeveloper);

            expect(mockPrisma.developer.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    skills: JSON.stringify(['React', 'Node.js', 'TypeScript']),
                }),
            });
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

        it('should stringify skills array when updating', async () => {
            const updateData = {
                fullName: 'Developer',
                skills: ['React', 'Vue', 'Angular'],
            };

            mockPrisma.developer.update.mockResolvedValue({ id: 'd1', ...updateData });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:update'](mockEvent, 'd1', updateData);

            expect(mockPrisma.developer.update).toHaveBeenCalledWith({
                where: { id: 'd1' },
                data: expect.objectContaining({
                    skills: JSON.stringify(['React', 'Vue', 'Angular']),
                }),
            });
        });

        it('should not stringify skills if already string', async () => {
            const updateData = {
                fullName: 'Developer',
                skills: '["React", "Node"]',
            };

            mockPrisma.developer.update.mockResolvedValue({ id: 'd1', ...updateData });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:update'](mockEvent, 'd1', updateData);

            expect(mockPrisma.developer.update).toHaveBeenCalledWith({
                where: { id: 'd1' },
                data: expect.objectContaining({
                    skills: '["React", "Node"]',
                }),
            });
        });

        it('should update role field', async () => {
            const updateData = {
                fullName: 'Promoted Developer',
                role: 'manager',
            };

            mockPrisma.developer.update.mockResolvedValue({ id: 'd1', ...updateData });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:update'](mockEvent, 'd1', updateData);

            expect(mockPrisma.developer.update).toHaveBeenCalledWith({
                where: { id: 'd1' },
                data: expect.objectContaining({
                    role: 'manager',
                }),
            });
        });

        it('should filter out immutable fields', async () => {
            const updateData = {
                fullName: 'Updated Name',
                id: 'should-be-removed',
                createdAt: new Date(),
                updatedAt: new Date(),
                projectIds: ['p1', 'p2'],
            };

            mockPrisma.developer.update.mockResolvedValue({ id: 'd1', fullName: 'Updated Name' });

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['developers:update'](mockEvent, 'd1', updateData);

            const callArgs = mockPrisma.developer.update.mock.calls[0][0];
            expect(callArgs.data).not.toHaveProperty('id');
            expect(callArgs.data).not.toHaveProperty('createdAt');
            expect(callArgs.data).not.toHaveProperty('updatedAt');
            expect(callArgs.data).not.toHaveProperty('projectIds');
            expect(callArgs.data).toHaveProperty('fullName', 'Updated Name');
        });
    });
});
