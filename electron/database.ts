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

/**
 * Run incremental schema migrations that aren't covered by the initial seed copy.
 * Uses try/catch per column so we can safely re-run on every startup.
 */
async function runSchemaMigrations(dbPath: string): Promise<void> {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);

    const addColumnSafe = (table: string, column: string, type: string) => {
        try {
            db.prepare(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`).run();
            console.log(`[Migration] Added column ${table}.${column}`);
        } catch {
            // Column already exists — safe to ignore
        }
    };

    // v4.1 — SLA Acknowledgement feature
    addColumnSafe('SharedIssue', 'acknowledgedAt', 'DATETIME');
    addColumnSafe('SharedIssue', 'acknowledgedById', 'TEXT');
    addColumnSafe('SharedIssue', 'slaStartedAt', 'DATETIME');

    // v4.2 - Feature Request Tracking
    addColumnSafe('FeatureRequest', 'createdById', 'TEXT');

    db.prepare(`
        CREATE TABLE IF NOT EXISTS "FeatureRequestActivity" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "featureRequestId" TEXT NOT NULL,
            "userId" TEXT,
            "activityType" TEXT NOT NULL,
            "details" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FeatureRequestActivity_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "FeatureRequestActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Developer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS "FeatureRequestComment" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "featureRequestId" TEXT NOT NULL,
            "authorId" TEXT NOT NULL,
            "text" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "FeatureRequestComment_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "FeatureRequestComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
    `).run();

    db.close();
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
        if (!dbExists) {
            console.log('🔄 First time setup - copying seed database...');
            const bundledDbPath = isDev
                ? path.join(process.cwd(), 'prisma', 'devpulse.db')
                : path.join(__dirname, '..', 'prisma', 'devpulse.db');

            if (fs.existsSync(bundledDbPath)) {
                fs.copyFileSync(bundledDbPath, dbPath);
                console.log('✅ Database copied successfully from bundle.');
            } else {
                console.warn('⚠️ Bundled database not found at:', bundledDbPath);
            }
        } else {
            console.log('✅ Database already exists.');
        }

        // Apply incremental schema migrations on every startup (safe to re-run)
        await runSchemaMigrations(dbPath);

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
    }
}

