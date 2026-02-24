import { PrismaClient } from '@prisma/client';
import { sub, add } from 'date-fns';

const prisma = new PrismaClient();

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

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

    console.log('🧹 Database cleared');

    // 1. Create Products
    const product1 = await prisma.product.create({ data: { name: 'Enterprise Suite' } });
    const product2 = await prisma.product.create({ data: { name: 'Consumer Apps' } });

    // 2. Create Clients
    const client1 = await prisma.client.create({
        data: { name: 'Acme Corp', contactInfo: 'contact@acme.com', productId: product1.id }
    });
    const client2 = await prisma.client.create({
        data: { name: 'Globex', contactInfo: 'info@globex.com', productId: product2.id }
    });

    // 3. Create Projects
    const project1 = await prisma.project.create({
        data: {
            name: 'CRM Dashboard',
            status: 'active',
            clientId: client1.id,
            projectType: 'web',
            startDate: new Date()
        }
    });
    const project2 = await prisma.project.create({
        data: {
            name: 'Mobile Wallet',
            status: 'active',
            clientId: client2.id,
            projectType: 'mobile',
            startDate: new Date()
        }
    });
    const project3 = await prisma.project.create({
        data: {
            name: 'Analytics Platform',
            status: 'active',
            clientId: client1.id,
            projectType: 'web',
            startDate: new Date()
        }
    });
    const projects = [project1, project2, project3];

    // 4. Create Developers
    const developersData = [
        { fullName: 'Sarah Chen', email: 'sarah@devpulse.com', role: 'manager', seniorityLevel: 'senior', skills: '["Management", "Agile"]' },
        { fullName: 'Mike Ross', email: 'mike@devpulse.com', role: 'developer', seniorityLevel: 'mid', skills: '["React", "Node.js"]' },
        { fullName: 'Jessica Wu', email: 'jessica@devpulse.com', role: 'developer', seniorityLevel: 'senior', skills: '["Python", "AWS", "Architecture"]' },
        { fullName: 'David Kim', email: 'david@devpulse.com', role: 'developer', seniorityLevel: 'junior', skills: '["JavaScript", "CSS"]' },
        { fullName: 'Alex Morgan', email: 'alex@devpulse.com', role: 'developer', seniorityLevel: 'mid', skills: '["React Native", "iOS"]' },
        { fullName: 'James Wilson', email: 'james@devpulse.com', role: 'developer', seniorityLevel: 'senior', skills: '["DevOps", "Docker", "Kubernetes"]' },
        { fullName: 'Emily Blunt', email: 'emily@devpulse.com', role: 'developer', seniorityLevel: 'mid', skills: '["UI/UX", "Figma", "CSS"]' },
        { fullName: 'Tom Holland', email: 'tom@devpulse.com', role: 'developer', seniorityLevel: 'junior', skills: '["JavaScript", "HTML"]' },
    ];

    const developers = [];
    for (const dev of developersData) {
        const created = await prisma.developer.create({ data: dev });
        developers.push(created);
    }

    const assignableDevs = developers.filter(d => d.role === 'developer');

    console.log(`👥 Created ${developers.length} users (${assignableDevs.length} assignable developers)`);

    // 5. Create Issues
    const issuesToCreate = 100;
    console.log(`📝 Creating ${issuesToCreate} issues...`);

    const bugTitles = [
        "Button not clickable on mobile",
        "API rate limit exceeded",
        "Memory leak in dashboard",
        "Login timeout issue",
        "Incorrect total calculation",
        "Image upload fails for large files",
        "Dark mode contrast issue",
        "Navigation broken on Safari",
        "Database connection timeout",
        "Export to PDF crashing"
    ];

    for (let i = 0; i < issuesToCreate; i++) {
        const assignee = assignableDevs[Math.floor(Math.random() * assignableDevs.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];

        const isRecurring = Math.random() < 0.25; // 25% recurring
        const severityRaw = Math.random();
        let severity = 'low';
        if (severityRaw > 0.85) severity = 'critical';
        else if (severityRaw > 0.6) severity = 'high';
        else if (severityRaw > 0.3) severity = 'medium';

        const statusRaw = Math.random();
        let status = 'closed';
        if (statusRaw > 0.8) status = 'open';
        else if (statusRaw > 0.7) status = 'in-progress';
        else if (statusRaw > 0.5) status = 'resolved';

        const createdAt = sub(new Date(), { days: Math.floor(Math.random() * 90) });
        const resolvedAt = (status === 'resolved' || status === 'closed') ? add(createdAt, { hours: Math.floor(Math.random() * 48) + 1 }) : null;

        await prisma.issue.create({
            data: {
                title: `${bugTitles[Math.floor(Math.random() * bugTitles.length)]} - ${i + 1}`,
                description: `Automatically generated issue description for testing ML insights on project ${project.name}.`,
                status: status,
                severity: severity,
                projectId: project.id,
                assignedToId: assignee.id,
                createdAt: createdAt,
                resolvedAt: resolvedAt,
                updatedAt: resolvedAt || createdAt,
                isRecurring: isRecurring,
                recurrenceCount: isRecurring ? Math.floor(Math.random() * 5) + 1 : 0,
                resolutionTime: resolvedAt ? (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : null,
                fixQuality: (status === 'closed' || status === 'resolved') ? Math.floor(Math.random() * 5) + 1 : null,
            }
        });
    }

    console.log('🎉 Seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
