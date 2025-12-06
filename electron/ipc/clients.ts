import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';

export function setupClientHandlers() {
    // Get all clients
    ipcMain.handle('clients:getAll', async (_, filters?: any) => {
        const prisma = getPrisma();
        try {
            const where: any = {};

            if (filters?.productId) {
                where.productId = filters.productId;
            }

            const clients = await prisma.client.findMany({
                where,
                include: {
                    product: true,
                    _count: {
                        select: {
                            projects: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });

            return clients;
        } catch (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
    });

    // Get client by ID
    ipcMain.handle('clients:getById', async (_, id: string) => {
        const prisma = getPrisma();
        try {
            const client = await prisma.client.findUnique({
                where: { id },
                include: {
                    product: true,
                    projects: {
                        include: {
                            _count: {
                                select: {
                                    issues: true,
                                    developers: true,
                                },
                            },
                        },
                    },
                },
            });

            return client;
        } catch (error) {
            console.error('Error fetching client:', error);
            throw error;
        }
    });

    // Create new client
    ipcMain.handle('clients:create', async (_, data: any) => {
        const prisma = getPrisma();
        try {
            const client = await prisma.client.create({
                data: {
                    name: data.name,
                    productId: data.productId,
                    contactInfo: data.contactInfo,
                },
            });

            return client;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    });

    // Update client
    ipcMain.handle('clients:update', async (_, id: string, data: any) => {
        const prisma = getPrisma();
        try {
            const client = await prisma.client.update({
                where: { id },
                data: {
                    name: data.name,
                    productId: data.productId,
                    contactInfo: data.contactInfo,
                },
            });

            return client;
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    });

    // Delete client
    ipcMain.handle('clients:delete', async (_, id: string) => {
        const prisma = getPrisma();
        try {
            await prisma.client.delete({
                where: { id },
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    });
}
