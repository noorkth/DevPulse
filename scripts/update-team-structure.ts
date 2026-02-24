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

async function updateTeamStructure() {
    console.log('👥 Updating team structure...\n');

    try {
        // Step 1: Find Noor and update to Project Manager
        console.log('📝 Updating Noor Kayastha to Project Manager...');

        const noor = await prisma.developer.findFirst({
            where: {
                OR: [
                    { email: { contains: 'noor' } },
                    { fullName: { contains: 'Noor' } }
                ]
            },
            include: {
                issues: {
                    where: {
                        status: { not: 'resolved' }
                    }
                }
            }
        });

        if (noor) {
            // Update Noor's profile
            await prisma.developer.update({
                where: { id: noor.id },
                data: {
                    fullName: 'Noor Kayastha',
                    email: 'noor.kayastha@devpulse.local',
                    skills: 'Project Management, Agile, Scrum, Team Leadership, Resource Planning, Stakeholder Management, JIRA, Strategic Planning',
                    seniorityLevel: 'lead', // Project Manager is lead level
                }
            });
            console.log('  ✅ Updated: Noor Kayastha - Project Manager (Lead)');

            // Reassign Noor's open issues to other developers
            if (noor.issues.length > 0) {
                console.log(`  🔄 Reassigning ${noor.issues.length} open issues from Noor...`);

                // Get other developers to distribute issues to
                const otherDevs = await prisma.developer.findMany({
                    where: {
                        id: { not: noor.id },
                        seniorityLevel: { in: ['senior', 'principal', 'lead'] }
                    }
                });

                if (otherDevs.length > 0) {
                    for (let i = 0; i < noor.issues.length; i++) {
                        const targetDev = otherDevs[i % otherDevs.length];
                        await prisma.issue.update({
                            where: { id: noor.issues[i].id },
                            data: { assignedToId: targetDev.id }
                        });
                    }
                    console.log('  ✅ Issues reassigned to team members');
                }
            }
        }

        // Step 2: Add Dipesh Chaudhary
        console.log('\n👨‍💻 Adding Dipesh Chaudhary...');

        const dipesh = await prisma.developer.upsert({
            where: { email: 'dipesh.chaudhary@devpulse.local' },
            update: {
                fullName: 'Dipesh Chaudhary',
                skills: 'DevOps, AWS, Azure, Docker, Kubernetes, Jenkins, CI/CD, Terraform, Ansible, Network Architecture, Server Management, Linux, Nginx',
                seniorityLevel: 'principal',
            },
            create: {
                fullName: 'Dipesh Chaudhary',
                email: 'dipesh.chaudhary@devpulse.local',
                skills: 'DevOps, AWS, Azure, Docker, Kubernetes, Jenkins, CI/CD, Terraform, Ansible, Network Architecture, Server Management, Linux, Nginx',
                seniorityLevel: 'principal',
            }
        });
        console.log('  ✅ Added: Dipesh Chaudhary - Principal Network Engineer');

        // Step 3: Assign Dipesh to all projects
        console.log('\n🔗 Assigning Dipesh to all projects...');

        const projects = await prisma.project.findMany();

        for (const project of projects) {
            // Check if not already assigned
            const existing = await prisma.developerProject.findFirst({
                where: {
                    developerId: dipesh.id,
                    projectId: project.id
                }
            });

            if (!existing) {
                await prisma.developerProject.create({
                    data: {
                        developerId: dipesh.id,
                        projectId: project.id,
                    }
                });
            }
        }
        console.log(`  ✅ Assigned Dipesh to ${projects.length} projects`);

        // Step 4: Create some DevOps-related issues for Dipesh
        console.log('\n🐛 Creating DevOps issues for Dipesh...');

        let devopsIssuesCreated = 0;

        for (const project of projects.slice(0, 3)) { // First 3 projects
            const features = await prisma.feature.findMany({
                where: { projectId: project.id }
            });

            if (features.length > 0) {
                const backendFeature = features.find(f => f.name.toLowerCase().includes('backend') || f.name.toLowerCase().includes('core')) || features[0];

                // Create DevOps-related issues
                const devopsIssues = [
                    {
                        title: `[${project.name}] CI/CD pipeline optimization needed`,
                        description: 'Build and deployment pipeline taking too long',
                        severity: 'medium',
                        status: 'in_progress',
                    },
                    {
                        title: `[${project.name}] Server resource monitoring setup`,
                        description: 'Need to implement comprehensive server monitoring',
                        severity: 'high',
                        status: 'open',
                    },
                ];

                for (const issue of devopsIssues) {
                    await prisma.issue.create({
                        data: {
                            ...issue,
                            projectId: project.id,
                            featureId: backendFeature.id,
                            assignedToId: dipesh.id,
                            createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
                        }
                    });
                    devopsIssuesCreated++;
                }
            }
        }
        console.log(`  ✅ Created ${devopsIssuesCreated} DevOps issues for Dipesh`);

        // Final Summary
        const allDevelopers = await prisma.developer.findMany({
            orderBy: { seniorityLevel: 'desc' }
        });

        console.log('\n' + '='.repeat(70));
        console.log('👥 UPDATED TEAM STRUCTURE');
        console.log('='.repeat(70));

        console.log('\n🎯 Team Roster:\n');

        for (const dev of allDevelopers) {
            const issueCount = await prisma.issue.count({
                where: {
                    assignedToId: dev.id,
                    status: { not: 'resolved' }
                }
            });

            const roleMap: Record<string, string> = {
                'Noor Kayastha': '📋 Project Manager',
                'Dipesh Chaudhary': '🌐 Principal Network Engineer (DevOps)',
                'Kabina Suwal': '⚙️ Lead Backend Developer',
                'Rojil Shrestha': '🎨 Lead Frontend Developer',
                'Ananda Rai': '📱 Principal iOS Developer',
                'Niroj Maharjan': '📱 Principal Mobile App Developer',
            };

            const role = roleMap[dev.fullName] || `${dev.seniorityLevel} Developer`;
            const issueInfo = dev.fullName === 'Noor Kayastha'
                ? '(Manages team, no assignments)'
                : `(${issueCount} active issues)`;

            console.log(`  ${role}`);
            console.log(`    Name: ${dev.fullName}`);
            console.log(`    Email: ${dev.email}`);
            console.log(`    Status: ${issueInfo}\n`);
        }

        console.log('='.repeat(70));
        console.log('\n💡 Role Changes:');
        console.log('  ✅ Noor Kayastha → Project Manager (no bug assignments)');
        console.log('  ✅ Dipesh Chaudhary → New team member (DevOps focus)');

        console.log('\n📊 Issue Distribution:');
        for (const dev of allDevelopers) {
            if (dev.fullName !== 'Noor Kayastha') {
                const count = await prisma.issue.count({
                    where: {
                        assignedToId: dev.id,
                        status: { not: 'resolved' }
                    }
                });
                console.log(`  ${dev.fullName}: ${count} active issues`);
            }
        }

        console.log('\n\n🎉 Team structure updated successfully!');
        console.log('\n🚀 Refresh the app to see changes!');
        console.log('  - 👨‍💻 Developers page: See new team structure');
        console.log('  - 📊 Dashboards: Updated metrics');
        console.log('  - 🐛 Issues: Reassigned from Noor\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateTeamStructure();
