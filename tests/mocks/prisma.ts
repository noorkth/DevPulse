import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
export const mockPrisma = {
    emailSchedule: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    issue: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    developer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    feature: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

// Mock getPrisma function
jest.mock('../../electron/prisma', () => ({
    getPrisma: () => mockPrisma as unknown as PrismaClient,
}));

export default mockPrisma;
