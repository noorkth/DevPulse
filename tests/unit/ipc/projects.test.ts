import { setupProjectHandlers } from '../../../electron/ipc/projects';
import { getPrisma } from '../../../electron/prisma';

jest.mock('../../../electron/prisma');

const mockPrisma = {
    project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
};

(getPrisma as jest.Mock).mockReturnValue(mockPrisma);

describe('Projects IPC Handlers', () => {
    let mockIpcMain: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockIpcMain = {
            handle: jest.fn((channel, handler) => {
                mockIpcMain[channel] = handler;
            }),
        };

        require('electron').ipcMain = mockIpcMain;
        setupProjectHandlers();
    });

    describe('projects:getAll', () => {
        it('should return all projects without pagination', async () => {
            const mockProjects = [
                {
                    id: 'p1',
                    name: 'Project 1',
                    status: 'active',
                    client: {
                        name: 'Client 1',
                        product: { name: 'Product 1' },
                    },
                    _count: { issues: 5, developers: 3 },
                },
            ];

            mockPrisma.project.findMany.mockResolvedValue(mockProjects);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['projects:getAll'](mockEvent);

            expect(result).toEqual(mockProjects);
            expect(mockPrisma.project.findMany).toHaveBeenCalled();
        });

        it('should return paginated results', async () => {
            const mockProjects = [{ id: 'p1', name: 'Project 1' }];

            mockPrisma.project.count.mockResolvedValue(25);
            mockPrisma.project.findMany.mockResolvedValue(mockProjects);

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['projects:getAll'](mockEvent, {}, { limit: 10 });

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('pagination');
            expect(result.pagination.total).toBe(25);
        });

        it('should filter by status', async () => {
            mockPrisma.project.findMany.mockResolvedValue([]);

            const mockEvent = { sender: { id: 1 } };
            await mockIpcMain['projects:getAll'](mockEvent, { status: 'active' });

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'active' },
                })
            );
        });
    });

    describe('projects:create', () => {
        it('should create a new project', async () => {
            const newProject = {
                name: 'New Project',
                clientId: 'c1',
                projectType: 'web',
                startDate: '2024-01-01',
                status: 'active',
            };

            mockPrisma.project.create.mockResolvedValue({ id: 'new', ...newProject });

            const mockEvent = { sender: { id: 1 } };
            const result = await mockIpcMain['projects:create'](mockEvent, newProject);

            expect(result).toHaveProperty('id');
            expect(mockPrisma.project.create).toHaveBeenCalled();
        });
    });
});
