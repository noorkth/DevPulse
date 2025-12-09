import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';

export function setupGoalsHandlers() {
    const prisma = getPrisma();

    // Create a new goal
    ipcMain.handle('goals:create', async (_, goalData: {
        developerId: string;
        goalType: string;
        targetValue: number;
        startDate: Date;
        endDate: Date;
        notes?: string;
    }) => {
        try {
            const goal = await prisma.developerGoal.create({
                data: {
                    developerId: goalData.developerId,
                    goalType: goalData.goalType,
                    targetValue: goalData.targetValue,
                    startDate: new Date(goalData.startDate),
                    endDate: new Date(goalData.endDate),
                    notes: goalData.notes,
                    status: 'active'
                }
            });
            return goal;
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    });

    // Get goals for a developer
    ipcMain.handle('goals:getForDeveloper', async (_, developerId: string) => {
        try {
            const goals = await prisma.developerGoal.findMany({
                where: { developerId },
                orderBy: [
                    { status: 'asc' }, // Active first
                    { endDate: 'asc' }
                ]
            });
            return goals;
        } catch (error) {
            console.error('Error getting goals:', error);
            throw error;
        }
    });

    // Update goal progress
    ipcMain.handle('goals:updateProgress', async (_, goalId: string, currentValue: number) => {
        try {
            // Get the goal first to check if target is met
            const goal = await prisma.developerGoal.findUnique({
                where: { id: goalId }
            });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // Determine if goal is achieved
            const isAchieved = currentValue >= goal.targetValue;
            const newStatus = isAchieved ? 'achieved' : 'active';

            const updatedGoal = await prisma.developerGoal.update({
                where: { id: goalId },
                data: {
                    currentValue,
                    status: newStatus
                }
            });

            return updatedGoal;
        } catch (error) {
            console.error('Error updating goal progress:', error);
            throw error;
        }
    });

    // Update goal
    ipcMain.handle('goals:update', async (_, goalId: string, updateData: {
        targetValue?: number;
        endDate?: Date;
        notes?: string;
        status?: string;
    }) => {
        try {
            const goal = await prisma.developerGoal.update({
                where: { id: goalId },
                data: {
                    ...updateData,
                    endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
                }
            });
            return goal;
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    });

    // Delete goal
    ipcMain.handle('goals:delete', async (_, goalId: string) => {
        try {
            await prisma.developerGoal.delete({
                where: { id: goalId }
            });
            return { success: true };
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    });

    // Check and update expired goals
    ipcMain.handle('goals:checkExpired', async () => {
        try {
            const now = new Date();

            // Find expired active goals
            const expiredGoals = await prisma.developerGoal.findMany({
                where: {
                    status: 'active',
                    endDate: { lt: now }
                }
            });

            // Update status to 'missed' if target not achieved
            for (const goal of expiredGoals) {
                if (!goal.currentValue || goal.currentValue < goal.targetValue) {
                    await prisma.developerGoal.update({
                        where: { id: goal.id },
                        data: { status: 'missed' }
                    });
                }
            }

            return { updated: expiredGoals.length };
        } catch (error) {
            console.error('Error checking expired goals:', error);
            throw error;
        }
    });
}
