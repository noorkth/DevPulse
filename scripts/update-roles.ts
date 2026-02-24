import { PrismaClient } from '@prisma/client';
import path from 'path';
import os from 'os';

const dbPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'devpulse',
    'devpulse.db'
);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function updateRoles() {
    console.log('🔄 Updating developer roles...\n');

    try {
        // Set Noor as manager
        const noor = await prisma.developer.update({
            where: { email: 'noor.kayastha@devpulse.local' },
            data: { role: 'manager' }
        });
        console.log(`✅ ${noor.fullName} → Manager (cannot be assigned issues)`);

        // Get all others and set as developers
        const developers = await prisma.developer.findMany({
            where: {
                email: { not: 'noor.kayastha@devpulse.local' }
            }
        });

        for (const dev of developers) {
            await prisma.developer.update({
                where: { id: dev.id },
                data: { role: 'developer' }
            });
            console.log(`✅ ${dev.fullName} → Developer`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Role Summary:');
        console.log('='.repeat(60));
        console.log(`\n👔 Managers (1): Cannot be assigned issues`);
        console.log(`  - ${noor.fullName}`);
        console.log(`\n👨‍💻 Developers (${developers.length}): Can be assigned issues`);
        for (const dev of developers) {
            console.log(`  - ${dev.fullName}`);
        }

        console.log('\n✅ Role separation complete!');
        console.log('📝 Issues can now only be assigned to developers\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateRoles();
