const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allDevs = await prisma.developer.findMany();
    const dev = allDevs.find(d => d.fullName.toLowerCase().includes('noor kayastha'));

    if (dev) {
        const res = await prisma.featureRequest.updateMany({
            where: { createdById: null },
            data: { createdById: dev.id }
        });
        console.log(`Successfully updated ${res.count} feature requests to belong to ${dev.fullName}`);
    } else {
        console.log('Could not find developer Noor Kayastha');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });
