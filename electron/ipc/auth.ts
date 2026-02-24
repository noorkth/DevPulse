import { ipcMain } from 'electron';
import bcrypt from 'bcryptjs';
import Store from 'electron-store';
import { getPrisma } from '../prisma';
import { RateLimiter, RateLimitError, RateLimiterPresets } from '../security/rate-limiter';

// Session store with encryption
const sessionStore = new Store({
    name: 'session',
    encryptionKey: 'devpulse-secure-session-key-2024'
});

// Rate limiter for auth operations
const authLimiter = new RateLimiter(5, 60000); // 5 attempts per minute

export function setupAuthHandlers() {
    // Login handler
    ipcMain.handle('auth:login', async (event, username: string, password: string) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!authLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many login attempts. Please try again later.');
        }

        const prisma = getPrisma();

        try {
            // Find user by username
            const user = await prisma.developer.findUnique({
                where: { username },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    username: true,
                    passwordHash: true,
                    role: true,
                    seniorityLevel: true,
                    isActive: true,
                }
            });

            // Check if user exists
            if (!user) {
                throw new Error('Invalid username or password');
            }

            // Check if account is active
            if (!user.isActive) {
                throw new Error('Account is disabled. Please contact administrator.');
            }

            // Check password
            if (!user.passwordHash) {
                throw new Error('Account not configured for login. Please contact administrator.');
            }

            const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new Error('Invalid username or password');
            }

            // Update last login time
            await prisma.developer.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });

            // Create session
            const sessionData = {
                id: user.id, // Add id for frontend AuthContext
                userId: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                seniorityLevel: user.seniorityLevel,
                loginAt: new Date().toISOString(),
            };

            sessionStore.set('currentUser', sessionData);

            // Return user data (without password hash)
            const { passwordHash, ...userData } = user;
            return userData;
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    });

    // Logout handler
    ipcMain.handle('auth:logout', async () => {
        try {
            sessionStore.delete('currentUser');
            return { success: true };
        } catch (error: any) {
            console.error('Logout error:', error);
            throw error;
        }
    });

    // Get current user handler
    ipcMain.handle('auth:getCurrentUser', async () => {
        try {
            const session = sessionStore.get('currentUser') as any;
            return session || null;
        } catch (error: any) {
            console.error('Get current user error:', error);
            return null;
        }
    });

    // Update password handler
    ipcMain.handle('auth:updatePassword', async (event, currentPassword: string, newPassword: string) => {
        const prisma = getPrisma();

        try {
            const session = sessionStore.get('currentUser') as any;
            if (!session) {
                throw new Error('Not authenticated');
            }

            const user = await prisma.developer.findUnique({
                where: { id: session.userId },
                select: { id: true, passwordHash: true }
            });

            if (!user || !user.passwordHash) {
                throw new Error('User not found');
            }

            // Verify current password
            const isPasswordValid = bcrypt.compareSync(currentPassword, user.passwordHash);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const newPasswordHash = bcrypt.hashSync(newPassword, 10);

            // Update password
            await prisma.developer.update({
                where: { id: user.id },
                data: { passwordHash: newPasswordHash }
            });

            return { success: true };
        } catch (error: any) {
            console.error('Update password error:', error);
            throw error;
        }
    });

    console.log('🔐 Auth handlers registered');
}
