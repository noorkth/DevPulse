import { ipcMain } from 'electron';
import { PredictionEngine } from '../ml/prediction-engine';
import { HotspotDetector } from '../ml/hotspot-detector';
import { DeveloperMatcher } from '../ml/developer-matcher';

export function setupMLHandlers() {
    /**
     * Predict issue resolution time
     */
    ipcMain.handle('ml:predictResolutionTime', async (event, issueData: {
        severity: string;
        projectId: string;
        assignedToId?: string;
        featureId?: string;
    }) => {
        try {
            console.log('🤖 Predicting resolution time...', issueData);

            const prediction = await PredictionEngine.predictResolutionTime(issueData);

            console.log('✅ Prediction complete:', prediction);

            return { success: true, prediction };
        } catch (error) {
            console.error('❌ Prediction error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Prediction failed',
            };
        }
    });

    /**
     * Detect bug hotspots
     */
    ipcMain.handle('ml:detectHotspots', async () => {
        try {
            console.log('🔍 Detecting bug hotspots...');

            const hotspots = await HotspotDetector.detectHotspots();

            console.log(`✅ Found ${hotspots.length} hotspots`);

            return { success: true, hotspots };
        } catch (error) {
            console.error('❌ Hotspot detection error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Hotspot detection failed',
            };
        }
    });

    /**
     * Recommend best developer for issue
     */
    ipcMain.handle('ml:recommendDeveloper', async (event, issueData: {
        severity: string;
        projectId: string;
        featureId?: string;
    }) => {
        try {
            console.log('👨‍💻 Finding best developer match...', issueData);

            const recommendations = await DeveloperMatcher.recommendDeveloper(issueData);

            console.log(`✅ Found ${recommendations.length} developer recommendations`);

            return { success: true, recommendations };
        } catch (error) {
            console.error('❌ Developer recommendation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Recommendation failed',
            };
        }
    });

    console.log('🤖 ML handlers registered');
}
