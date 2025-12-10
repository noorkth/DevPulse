import { getPrisma } from '../../../electron/prisma';

// Mock the ML classes
jest.mock('../../../electron/ml/prediction-engine');
jest.mock('../../../electron/ml/developer-matcher');
jest.mock('../../../electron/ml/hotspot-detector');
jest.mock('../../../electron/prisma');

const mockPrisma = {
    issue: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    developer: {
        findMany: jest.fn(),
    },
    feature: {
        findMany: jest.fn(),
    },
};

(getPrisma as jest.Mock).mockReturnValue(mockPrisma);

describe('ML Engine Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Prediction Engine', () => {
        it('should have predictResolutionTime method', async () => {
            // Basic test to ensure ML module structure exists
            const { PredictionEngine } = require('../../../electron/ml/prediction-engine');
            expect(PredictionEngine).toBeDefined();
            expect(typeof PredictionEngine.predictResolutionTime).toBe('function');
        });

        it('should return prediction with value and confidence', async () => {
            const { PredictionEngine } = require('../../../electron/ml/prediction-engine');

            // Mock historical data
            mockPrisma.issue.findMany.mockResolvedValue([
                { severity: 'critical', resolutionTime: 48, projectId: 'p1' },
                { severity: 'critical', resolutionTime: 36, projectId: 'p1' },
            ]);

            const result = await PredictionEngine.predictResolutionTime({
                severity: 'critical',
                projectId: 'p1',
            });

            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('confidence');
            expect(typeof result.value).toBe('number');
        });
    });

    describe('Developer Matcher', () => {
        it('should have recommendDeveloper method', () => {
            const { DeveloperMatcher } = require('../../../electron/ml/developer-matcher');
            expect(DeveloperMatcher).toBeDefined();
            expect(typeof DeveloperMatcher.recommendDeveloper).toBe('function');
        });

        it('should return array of developer recommendations', async () => {
            const { DeveloperMatcher } = require('../../../electron/ml/developer-matcher');

            mockPrisma.developer.findMany.mockResolvedValue([
                {
                    id: 'd1',
                    fullName: 'John Doe',
                    issues: [],
                    projects: [{ id: 'p1' }],
                },
            ]);

            mockPrisma.issue.count.mockResolvedValue(5);
            mockPrisma.issue.findMany.mockResolvedValue([]);

            const result = await DeveloperMatcher.recommendDeveloper({
                severity: 'high',
                projectId: 'p1',
            });

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Hotspot Detector', () => {
        it('should have detectHotspots method', () => {
            const { HotspotDetector } = require('../../../electron/ml/hotspot-detector');
            expect(HotspotDetector).toBeDefined();
            expect(typeof HotspotDetector.detectHotspots).toBe('function');
        });

        it('should return array of hotspots', async () => {
            const { HotspotDetector } = require('../../../electron/ml/hotspot-detector');

            const now = new Date();
            mockPrisma.feature.findMany.mockResolvedValue([
                {
                    id: 'f1',
                    name: 'Login',
                    createdAt: now,
                    issues: [
                        { id: '1', isRecurring: true, severity: 'critical', status: 'open' },
                    ],
                    project: { id: 'p1' },
                },
            ]);

            mockPrisma.issue.count.mockResolvedValue(2);

            const result = await HotspotDetector.detectHotspots();

            expect(Array.isArray(result)).toBe(true);
        });
    });
});
