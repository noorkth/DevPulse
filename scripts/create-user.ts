import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:' + (process.env.HOME || '') + '/Library/Application%20Support/devpulse/devpulse.db'
        }
    }
});

async function main() {
    const passwordHash = bcrypt.hashSync('noor123', 10);

    const user = await prisma.developer.upsert({
        where: { username: 'noor' },
        update: {
            passwordHash,
            role: 'manager',
            isActive: true,
        },
        create: {
            username: 'noor',
            passwordHash,
            fullName: 'Noor',
            email: 'noor@devpulse.com',
            role: 'manager',
            seniorityLevel: 'senior',
            skills: '["Management", "Agile"]',
            isActive: true,
        }
    });

    console.log('✅ User created:', user.fullName, '| role:', user.role, '| username:', user.username);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
