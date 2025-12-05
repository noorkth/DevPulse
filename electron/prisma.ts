import { PrismaClient } from '@prisma/client';
import { getDatabasePath } from './database';

// Shared Prisma Client instance - lazy initialized
let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
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

export async function disconnectPrisma(): Promise<void> {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
}
