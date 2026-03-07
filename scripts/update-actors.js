const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    manager = await prisma.developer.findFirst({ where: { fullName: { contains: 'Noor Kayastha' } } });
    if (!manager) {
        console.log('Manager not found');
        return;
    }

    const devId = manager.id;

    await prisma.sharedIssue.updateMany({ data: { assignedOwnerId: devId } });
    await prisma.sharedIssueActivity.updateMany({ data: { userId: devId } });
    await prisma.incidentUpdate.updateMany({ data: { authorId: devId } });
    await prisma.officeVisit.updateMany({ data: { visitedById: devId } });
    await prisma.relationshipReset.updateMany({ data: { initiatedById: devId } });
    await prisma.monthlyBusinessReview.updateMany({ data: { createdById: devId } });

    console.log('Successfully attributed all existing relationship/governance records to Noor Kayastha!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
