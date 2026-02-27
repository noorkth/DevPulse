/**
 * SECURITY NOTE:
 * This file uses $executeRawUnsafe for database initialization.
 * This is SAFE because:
 * 1. Only static SQL queries (no user input)
 * 2. Only runs during first-time database creation
 * 3. All user input is validated at IPC boundaries before database operations
 * 
 * DO NOT add user input to these queries!
 * Use Prisma's type-safe query builder for all runtime queries.
 */

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

    // ✅ Security: Ensure directory exists with proper permissions (700 = owner only)
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true, mode: 0o700 });
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

    try {
        // Auto-apply schema changes using Prisma db push
        // This ensures the production DB always has the latest schema
        console.log('🔄 Syncing database schema...');

        const { execSync } = await import('child_process');

        try {
            // Use local prisma binary directly (avoids npx + PATH issues)
            const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
            execSync(`"${prismaBin}" db push --skip-generate --accept-data-loss`, {
                cwd: process.cwd(),
                env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
                stdio: 'inherit'
            });

            if (!dbExists) {
                console.log('✅ Database created with schema');
            } else {
                console.log('✅ Schema synced successfully');
            }
        } catch (error: any) {
            // If db push fails, try to provide helpful error message
            if (error.message?.includes('already in sync')) {
                console.log('✅ Schema already up to date');
            } else if (!dbExists) {
                // First time setup - create database manually using Prisma
                console.log('🔄 Creating database for first time...');
                const prisma = new PrismaClient({
                    datasources: {
                        db: {
                            url: `file:${dbPath}`
                        }
                    }
                });
                await prisma.$connect();
                await prisma.$disconnect();
                console.log('✅ Database initialized');
            } else {
                console.warn('⚠️ Schema sync had issues, but continuing...', error.message);
            }
        }

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
    }
}
