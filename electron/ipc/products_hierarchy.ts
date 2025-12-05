import { ipcMain } from 'electron';
import { PrismaClient } from '@prisma/client';
import { getDatabasePath } from '../database';

// Lazy-initialize Prisma Client with correct database path
let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient {
    if (!prismaInstance) {
        const dbPath = getDatabasePath();
        prismaInstance = new PrismaClient({
            datasources: {
                db: {
                    url: `file:${dbPath}`
                }
            }
        });
        console.log(`✅ Prisma Client initialized with database: ${dbPath}`);
    }
    return prismaInstance;
}

export function setupProductHandlers() {
    // Get all products
    ipcMain.handle('products:getAll', async () => {
        try {
            const prisma = getPrisma();
            const products = await getPrisma().product.findMany({
                include: {
                    _count: {
                        select: {
                            clients: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });

            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    });

    // Get product by ID with clients
    ipcMain.handle('products:getById', async (_, id: string) => {
        try {
            const product = await getPrisma().product.findUnique({
                where: { id },
                include: {
                    clients: {
                        include: {
                            _count: {
                                select: {
                                    projects: true,
                                },
                            },
                        },
                    },
                },
            });

            return product;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    });

    // Create new product
    ipcMain.handle('products:create', async (_, data: any) => {
        try {
            const product = await getPrisma().product.create({
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            return product;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    });

    // Update product
    ipcMain.handle('products:update', async (_, id: string, data: any) => {
        try {
            const product = await getPrisma().product.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            return product;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    });

    // Delete product
    ipcMain.handle('products:delete', async (_, id: string) => {
        try {
            await getPrisma().product.delete({
                where: { id },
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    });
}
