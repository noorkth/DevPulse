import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Get user data path
export function getUserDataPath(): string {
    return app.getPath('userData');
}

// Get database file path
export function getDatabasePath(): string {
    const userDataPath = getUserDataPath();
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'devpulse.db');
}

// Initialize database (create tables using Prisma Client)
export async function initializeDatabase(): Promise<void> {
    const dbPath = getDatabasePath();
    const isDev = process.env.NODE_ENV !== 'production';

    console.log(`📁 Database path: ${dbPath}`);
    console.log(`🔧 Environment: ${isDev ? 'development' : 'production'}`);
    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = `file:${dbPath}`;

    // Check if database exists
    const dbExists = fs.existsSync(dbPath);
    console.log(`📊 Database exists: ${dbExists}`);

    if (!dbExists) {
        console.log('🆕 First launch detected - creating database...');

        try {
            // Create Prisma Client
            const prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: `file:${dbPath}`
                    }
                }
            });

            console.log('✅ Prisma Client created');

            // Create tables using raw SQL (SQLite)
            console.log('🔄 Creating database tables...');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Product" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "description" TEXT,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Product table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Client" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "productId" TEXT NOT NULL,
                    "contactInfo" TEXT,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
                );
            `);
            console.log('✅ Client table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Project" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "clientId" TEXT NOT NULL,
                    "projectType" TEXT NOT NULL,
                    "description" TEXT,
                    "startDate" DATETIME NOT NULL,
                    "endDate" DATETIME,
                    "status" TEXT NOT NULL DEFAULT 'active',
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
                );
            `);
            console.log('✅ Project table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Developer" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "email" TEXT NOT NULL UNIQUE,
                    "role" TEXT NOT NULL,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Developer table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Feature" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "projectId" TEXT NOT NULL,
                    "description" TEXT,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
                );
            `);
            console.log('✅ Feature table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Issue" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "title" TEXT NOT NULL,
                    "description" TEXT,
                    "featureId" TEXT NOT NULL,
                    "severity" TEXT NOT NULL,
                    "status" TEXT NOT NULL DEFAULT 'open',
                    "reportedBy" TEXT NOT NULL,
                    "assignedTo" TEXT,
                    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "resolvedAt" DATETIME,
                    "resolutionTime" INTEGER,
                    "fixQuality" INTEGER,
                    "isRecurring" BOOLEAN NOT NULL DEFAULT 0,
                    "recurringParentId" TEXT,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE,
                    FOREIGN KEY ("reportedBy") REFERENCES "Developer"("id"),
                    FOREIGN KEY ("assignedTo") REFERENCES "Developer"("id"),
                    FOREIGN KEY ("recurringParentId") REFERENCES "Issue"("id")
                );
            `);
            console.log('✅ Issue table created');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "AnalyticsCache" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "key" TEXT NOT NULL UNIQUE,
                    "value" TEXT NOT NULL,
                    "expiresAt" DATETIME NOT NULL,
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ AnalyticsCache table created');

            // Create DeveloperProject junction table (explicit model in schema)
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DeveloperProject" (
                    "id" TEXT NOT NULL PRIMARY KEY,
                    "developerId" TEXT NOT NULL,
                    "projectId" TEXT NOT NULL,
                    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "role" TEXT NOT NULL DEFAULT 'developer',
                    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE,
                    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
                );
            `);
            console.log('✅ Junction tables created');

            // Create indexes
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Client_productId_idx" ON "Client"("productId");`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project"("clientId");`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Feature_projectId_idx" ON "Feature"("projectId");`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Issue_featureId_idx" ON "Issue"("featureId");`);
            console.log('✅ Indexes created');

            await prisma.$disconnect();
            console.log('✅ Database initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error;
        }
    } else {
        console.log('✅ Database already exists');
    }
}
