import { ipcMain } from 'electron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupProductHandlers() {
    // Get all products
    ipcMain.handle('products:getAll', async () => {
        try {
            const products = await prisma.product.findMany({
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
            const product = await prisma.product.findUnique({
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
            const product = await prisma.product.create({
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
            const product = await prisma.product.update({
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
            await prisma.product.delete({
                where: { id },
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    });
}
