import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAuthUser() {
    console.log('🔐 Seeding authentication test user...');

    try {
        // Find Noor Kayastha by email
        const user = await prisma.developer.findFirst({
            where: {
                OR: [
                    { email: 'noor.kayastha@geniussystems.com.np' },
                    { fullName: { contains: 'Noor' } }
                ]
            }
        });

        if (!user) {
            console.error('❌ User "Noor Kayastha" not found in database');
            console.log('Creating user...');

            const newUser = await prisma.developer.create({
                data: {
                    fullName: 'Noor Kayastha',
                    email: 'noor.kayastha@geniussystems.com.np',
                    skills: JSON.stringify(['Project Management', 'Leadership', 'Strategy']),
                    seniorityLevel: 'lead',
                    role: 'manager',
                    username: 'noor.kayastha',
                    passwordHash: bcrypt.hashSync('admin123', 10),
                    isActive: true,
                }
            });

            console.log('✅ Created and configured user:', newUser.fullName);
        } else {
            // Update existing user with auth credentials
            const updatedUser = await prisma.developer.update({
                where: { id: user.id },
                data: {
                    username: 'noor.kayastha',
                    passwordHash: bcrypt.hashSync('admin123', 10),
                    isActive: true,
                }
            });

            console.log('✅ Updated user with auth credentials:', updatedUser.fullName);
        }

        console.log('\n📝 Test Credentials:');
        console.log('   Username: noor.kayastha');
        console.log('   Password: admin123');
        console.log('   Role: PM (Manager)\n');

    } catch (error) {
        console.error('❌ Error seeding auth user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedAuthUser()
    .then(() => {
        console.log('✨ Auth seeding completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
