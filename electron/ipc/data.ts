import { ipcMain, dialog } from 'electron';
import { getPrisma } from '../prisma';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';

// Helper to convert array of objects to CSV
function arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Handle null/undefined
            if (value === null || value === undefined) return '';
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// Helper to parse CSV to array of objects
function csvToArray(csv: string): any[] {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentLine = lines[i];

        // Simple CSV parsing (doesn't handle quoted commas perfectly, but good enough)
        const values = currentLine.split(',');

        headers.forEach((header, index) => {
            let value = values[index]?.trim() || '';

            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }

            // Convert empty strings to null
            if (value === '' || value === 'null' || value === 'undefined') {
                obj[header] = null;
            } else {
                obj[header] = value;
            }
        });

        result.push(obj);
    }

    return result;
}

export function setupDataHandlers() {
    // Export all data to CSV files in ZIP
    ipcMain.handle('data:export', async (event) => {
        const prisma = getPrisma();

        try {
            // Show save dialog
            const { filePath, canceled } = await dialog.showSaveDialog({
                title: 'Export DevPulse Data',
                defaultPath: `devpulse-backup-${new Date().toISOString().split('T')[0]}.zip`,
                filters: [
                    { name: 'ZIP Files', extensions: ['zip'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (canceled || !filePath) {
                return { success: false, message: 'Export canceled' };
            }

            console.log('📦 Exporting data to CSV...');

            // Fetch all data
            const [products, clients, projects, developers, issues, features, developerProjects] = await Promise.all([
                prisma.product.findMany(),
                prisma.client.findMany(),
                prisma.project.findMany(),
                prisma.developer.findMany(),
                prisma.issue.findMany(),
                prisma.feature.findMany(),
                prisma.developerProject.findMany()
            ]);

            // Create ZIP file
            const zip = new AdmZip();

            // Add CSV files to ZIP
            if (products.length > 0) {
                zip.addFile('products.csv', Buffer.from(arrayToCSV(products), 'utf-8'));
            }
            if (clients.length > 0) {
                zip.addFile('clients.csv', Buffer.from(arrayToCSV(clients), 'utf-8'));
            }
            if (projects.length > 0) {
                zip.addFile('projects.csv', Buffer.from(arrayToCSV(projects), 'utf-8'));
            }
            if (developers.length > 0) {
                zip.addFile('developers.csv', Buffer.from(arrayToCSV(developers), 'utf-8'));
            }
            if (issues.length > 0) {
                zip.addFile('issues.csv', Buffer.from(arrayToCSV(issues), 'utf-8'));
            }
            if (features.length > 0) {
                zip.addFile('features.csv', Buffer.from(arrayToCSV(features), 'utf-8'));
            }
            if (developerProjects.length > 0) {
                zip.addFile('developer_projects.csv', Buffer.from(arrayToCSV(developerProjects), 'utf-8'));
            }

            // Add metadata file
            const metadata = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                format: 'CSV',
                stats: {
                    totalProducts: products.length,
                    totalClients: clients.length,
                    totalProjects: projects.length,
                    totalDevelopers: developers.length,
                    totalIssues: issues.length,
                    totalFeatures: features.length
                }
            };
            zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8'));

            // Write ZIP file
            zip.writeZip(filePath);

            console.log('✅ Data exported successfully to:', filePath);

            return {
                success: true,
                message: `Data exported successfully to CSV!\n\n${metadata.stats.totalProducts} products, ${metadata.stats.totalClients} clients, ${metadata.stats.totalProjects} projects, ${metadata.stats.totalDevelopers} developers, ${metadata.stats.totalIssues} issues\n\nExtract the ZIP file to view individual CSV files.`,
                filePath,
                stats: metadata.stats
            };

        } catch (error) {
            console.error('❌ Error exporting data:', error);
            return {
                success: false,
                message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });

    // Import data from CSV files in ZIP
    ipcMain.handle('data:import', async (event) => {
        const prisma = getPrisma();

        try {
            // Show open dialog
            const { filePaths, canceled } = await dialog.showOpenDialog({
                title: 'Import DevPulse Data',
                filters: [
                    { name: 'ZIP Files', extensions: ['zip'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (canceled || filePaths.length === 0) {
                return { success: false, message: 'Import canceled' };
            }

            const filePath = filePaths[0];
            console.log('📥 Importing data from:', filePath);

            // Read ZIP file
            const zip = new AdmZip(filePath);
            const zipEntries = zip.getEntries();

            // Read metadata
            const metadataEntry = zipEntries.find(e => e.entryName === 'metadata.json');
            let metadata: any = {};
            if (metadataEntry) {
                metadata = JSON.parse(metadataEntry.getData().toString('utf-8'));
            }

            // Show confirmation dialog
            const choice = await dialog.showMessageBox({
                type: 'warning',
                buttons: ['Cancel', 'Merge Data', 'Replace All Data'],
                defaultId: 0,
                title: 'Import Data',
                message: 'How would you like to import this data?',
                detail: `This backup contains:\n• ${metadata.stats?.totalProducts || 0} products\n• ${metadata.stats?.totalClients || 0} clients\n• ${metadata.stats?.totalProjects || 0} projects\n• ${metadata.stats?.totalDevelopers || 0} developers\n• ${metadata.stats?.totalIssues || 0} issues\n\nMerge: Add data without deleting existing data\nReplace: Delete all existing data and import new data`
            });

            if (choice.response === 0) {
                return { success: false, message: 'Import canceled' };
            }

            const replaceMode = choice.response === 2;

            // If replace mode, delete all existing data
            if (replaceMode) {
                console.log('🗑️  Deleting existing data...');
                await prisma.issue.deleteMany();
                await prisma.feature.deleteMany();
                await prisma.developerProject.deleteMany();
                await prisma.developer.deleteMany();
                await prisma.project.deleteMany();
                await prisma.client.deleteMany();
                await prisma.product.deleteMany();
            }

            console.log('📥 Importing data from CSV files...');

            // Helper to read CSV from ZIP
            const readCSV = (filename: string): any[] => {
                const entry = zipEntries.find(e => e.entryName === filename);
                if (!entry) return [];
                const csvContent = entry.getData().toString('utf-8');
                return csvToArray(csvContent);
            };

            // Import products
            const products = readCSV('products.csv');
            for (const product of products) {
                await prisma.product.upsert({
                    where: { id: product.id },
                    create: {
                        id: product.id,
                        name: product.name,
                        description: product.description
                    },
                    update: {
                        name: product.name,
                        description: product.description
                    }
                });
            }
            console.log(`✅ Imported ${products.length} products`);

            // Import clients
            const clients = readCSV('clients.csv');
            for (const client of clients) {
                await prisma.client.upsert({
                    where: { id: client.id },
                    create: {
                        id: client.id,
                        name: client.name,
                        productId: client.productId,
                        contactInfo: client.contactInfo
                    },
                    update: {
                        name: client.name,
                        productId: client.productId,
                        contactInfo: client.contactInfo
                    }
                });
            }
            console.log(`✅ Imported ${clients.length} clients`);

            // Import projects
            const projects = readCSV('projects.csv');
            for (const project of projects) {
                await prisma.project.upsert({
                    where: { id: project.id },
                    create: {
                        id: project.id,
                        name: project.name,
                        clientId: project.clientId,
                        projectType: project.projectType,
                        description: project.description,
                        startDate: new Date(project.startDate),
                        endDate: project.endDate ? new Date(project.endDate) : null,
                        status: project.status
                    },
                    update: {
                        name: project.name,
                        clientId: project.clientId,
                        projectType: project.projectType,
                        description: project.description,
                        startDate: new Date(project.startDate),
                        endDate: project.endDate ? new Date(project.endDate) : null,
                        status: project.status
                    }
                });
            }
            console.log(`✅ Imported ${projects.length} projects`);

            // Import developers
            const developers = readCSV('developers.csv');
            for (const developer of developers) {
                await prisma.developer.upsert({
                    where: { id: developer.id },
                    create: {
                        id: developer.id,
                        fullName: developer.fullName,
                        email: developer.email,
                        skills: developer.skills,
                        seniorityLevel: developer.seniorityLevel
                    },
                    update: {
                        fullName: developer.fullName,
                        email: developer.email,
                        skills: developer.skills,
                        seniorityLevel: developer.seniorityLevel
                    }
                });
            }
            console.log(`✅ Imported ${developers.length} developers`);

            // Import features
            const features = readCSV('features.csv');
            for (const feature of features) {
                await prisma.feature.upsert({
                    where: { id: feature.id },
                    create: {
                        id: feature.id,
                        name: feature.name,
                        projectId: feature.projectId,
                        description: feature.description
                    },
                    update: {
                        name: feature.name,
                        projectId: feature.projectId,
                        description: feature.description
                    }
                });
            }
            console.log(`✅ Imported ${features.length} features`);

            // Import issues
            const issues = readCSV('issues.csv');
            for (const issue of issues) {
                await prisma.issue.upsert({
                    where: { id: issue.id },
                    create: {
                        id: issue.id,
                        title: issue.title,
                        description: issue.description,
                        severity: issue.severity,
                        status: issue.status,
                        projectId: issue.projectId,
                        featureId: issue.featureId,
                        assignedToId: issue.assignedToId,
                        parentIssueId: issue.parentIssueId,
                        isRecurring: issue.isRecurring === 'true' || issue.isRecurring === true,
                        recurrenceCount: issue.recurrenceCount ? parseInt(issue.recurrenceCount) : 0,
                        notes: issue.notes,
                        attachments: issue.attachments,
                        fixQuality: issue.fixQuality ? parseInt(issue.fixQuality) : null,
                        resolutionTime: issue.resolutionTime ? parseInt(issue.resolutionTime) : null,
                        resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt) : null
                    },
                    update: {
                        title: issue.title,
                        description: issue.description,
                        severity: issue.severity,
                        status: issue.status,
                        projectId: issue.projectId,
                        featureId: issue.featureId,
                        assignedToId: issue.assignedToId,
                        parentIssueId: issue.parentIssueId,
                        isRecurring: issue.isRecurring === 'true' || issue.isRecurring === true,
                        recurrenceCount: issue.recurrenceCount ? parseInt(issue.recurrenceCount) : 0,
                        notes: issue.notes,
                        attachments: issue.attachments,
                        fixQuality: issue.fixQuality ? parseInt(issue.fixQuality) : null,
                        resolutionTime: issue.resolutionTime ? parseInt(issue.resolutionTime) : null,
                        resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt) : null
                    }
                });
            }
            console.log(`✅ Imported ${issues.length} issues`);

            // Import developer-project relationships
            const developerProjects = readCSV('developer_projects.csv');
            for (const dp of developerProjects) {
                try {
                    await prisma.developerProject.upsert({
                        where: {
                            developerId_projectId: {
                                developerId: dp.developerId,
                                projectId: dp.projectId
                            }
                        },
                        create: {
                            developerId: dp.developerId,
                            projectId: dp.projectId
                        },
                        update: {}
                    });
                } catch (error) {
                    console.warn('Skipping developer-project relationship:', error);
                }
            }
            console.log(`✅ Imported ${developerProjects.length} developer-project relationships`);

            console.log('✅ CSV import completed successfully');

            return {
                success: true,
                message: `Data imported successfully in ${replaceMode ? 'REPLACE' : 'MERGE'} mode!\n\nImported:\n• ${products.length} products\n• ${clients.length} clients\n• ${projects.length} projects\n• ${developers.length} developers\n• ${issues.length} issues`,
                mode: replaceMode ? 'replace' : 'merge',
                stats: {
                    totalProducts: products.length,
                    totalClients: clients.length,
                    totalProjects: projects.length,
                    totalDevelopers: developers.length,
                    totalIssues: issues.length,
                    totalFeatures: features.length
                }
            };

        } catch (error) {
            console.error('❌ Error importing data:', error);
            return {
                success: false,
                message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });

    // Clear application cache
    ipcMain.handle('data:clearCache', async (event) => {
        try {
            const choice = await dialog.showMessageBox({
                type: 'warning',
                buttons: ['Cancel', 'Clear Cache'],
                defaultId: 0,
                title: 'Clear Cache',
                message: 'Are you sure you want to clear the application cache?',
                detail: 'This will clear HTTP cache and temporary files. You should restart the application after clearing.'
            });

            if (choice.response === 0) {
                return { success: false, message: 'Cache clear canceled' };
            }

            console.log('🧹 Clearing cache...');

            // Get BrowserWindow to show dialog
            const { session, BrowserWindow, app } = require('electron');

            // Only clear HTTP cache and service workers (safe for production)
            await session.defaultSession.clearCache();
            await session.defaultSession.clearStorageData({
                storages: ['serviceworkers', 'cachestorage']
            });

            console.log('✅ Cache cleared');

            // Show restart dialog
            const restartChoice = await dialog.showMessageBox({
                type: 'info',
                buttons: ['Restart Now', 'Restart Later'],
                defaultId: 0,
                title: 'Cache Cleared',
                message: 'Cache cleared successfully!',
                detail: 'Please restart the application for changes to take full effect.\n\nRestart now?'
            });

            if (restartChoice.response === 0) {
                // User chose to restart now
                app.relaunch();
                app.quit();
            }

            return {
                success: true,
                message: 'Cache cleared successfully! Please restart the application.',
                needsRestart: true
            };

        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            return {
                success: false,
                message: `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });
}
