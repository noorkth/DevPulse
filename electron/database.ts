import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

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

// Initialize database (run migrations)
export async function initializeDatabase(): Promise<void> {
    const dbPath = getDatabasePath();
    const isDev = process.env.NODE_ENV !== 'production';

    console.log(`📁 Database path: ${dbPath}`);
    console.log(`🔧 Environment: ${isDev ? 'development' : 'production'}`);

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = `file:${dbPath}`;

    // Check if database exists
    const dbExists = fs.existsSync(dbPath);

    if (!dbExists) {
        console.log('🆕 First launch detected - initializing database...');

        try {
            // Get the path to prisma binary and schema
            const prismaPath = isDev
                ? path.join(process.cwd(), 'node_modules', '.bin', 'prisma')
                : path.join(process.resourcesPath, 'app', 'node_modules', '.prisma', 'client', 'query-engine-darwin-arm64');

            const schemaPath = isDev
                ? path.join(process.cwd(), 'prisma', 'schema.prisma')
                : path.join(process.resourcesPath, 'app', 'prisma', 'schema.prisma');

            // In production, use db push instead of migrate deploy
            // This creates tables directly from schema without needing migration files
            console.log('🔄 Creating database schema...');

            if (isDev) {
                // Dev: use migrate deploy
                const { stdout, stderr } = await execAsync(`"${prismaPath}" migrate deploy`, {
                    env: {
                        ...process.env,
                        DATABASE_URL: `file:${dbPath}`,
                    },
                });
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
            } else {
                // Production: use db push (no migration files needed)
                const prismaBinary = path.join(process.resourcesPath, 'app', 'node_modules', '.bin', 'prisma');
                const { stdout, stderr } = await execAsync(`"${prismaBinary}" db push --skip-generate --schema="${schemaPath}"`, {
                    env: {
                        ...process.env,
                        DATABASE_URL: `file:${dbPath}`,
                    },
                });
                if (stdout) console.log(stdout);
                if (stderr && !stderr.includes('warn')) console.error(stderr);
            }

            console.log('✅ Database initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            throw error;
        }
    } else {
        console.log('✅ Database already exists');
    }
}
