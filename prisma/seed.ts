import { PrismaClient } from '@prisma/client';
import { sub } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.issue.deleteMany();
    await prisma.developerProject.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();
    await prisma.product.deleteMany();
    await prisma.developer.deleteMany();
    await prisma.analyticsCache.deleteMany();

    console.log('✅ Database cleared');
    console.log('\n🎉 Seed completed successfully!');
    console.log(`
Database is now empty and ready for your data!

Getting Started:
  1. Go to Products page → Create your product lines
  2. Go to Clients page → Add clients under products
  3. Go to Projects page → Create projects for clients
  4. Go to Developers page → Add your team members
  5. Track issues and productivity!
  `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
