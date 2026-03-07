import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import crypto from 'crypto';

// Hardcoded credentials per user request
// Password is stored as SHA-256 hash
const MANAGER_ACCOUNTS: Record<string, { passwordHash: string; fullNameMatch: string }> = {
    noor: {
        passwordHash: crypto.createHash('sha256').update('Noor@123').digest('hex'),
        fullNameMatch: 'Noor Kayastha',
    },
};

export function setupAuthHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('auth:login', async (_, username: string, password: string) => {
        const lowerUsername = username.toLowerCase().trim();
        const account = MANAGER_ACCOUNTS[lowerUsername];

        if (!account) {
            throw new Error('Invalid username or password');
        }

        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        if (inputHash !== account.passwordHash) {
            throw new Error('Invalid username or password');
        }

        // Find the matching developer record in the DB
        const developer = await prisma.developer.findFirst({
            where: { fullName: { contains: account.fullNameMatch } },
            select: { id: true, fullName: true, email: true, role: true },
        });

        if (!developer) {
            throw new Error(`Developer record for "${account.fullNameMatch}" not found in database`);
        }

        return {
            id: developer.id,
            username: lowerUsername,
            fullName: developer.fullName,
            email: developer.email,
            role: developer.role,
        };
    });

    console.log('✅ Auth handlers registered');
}
