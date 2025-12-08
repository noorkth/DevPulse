import * as ss from 'simple-statistics';
import { getPrisma } from '../prisma';

interface TrainingData {
    features: number[];
    target: number;
}

interface Prediction {
    value: number;
    confidence: number;
    factors: string[];
}

export class PredictionEngine {
    /**
     * Predict issue resolution time using K-NN algorithm
     */
    static async predictResolutionTime(issueData: {
        severity: string;
        projectId: string;
        assignedToId?: string;
        featureId?: string;
    }): Promise<Prediction> {
        const prisma = getPrisma();

        try {
            // Get historical data (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const historicalIssues = await prisma.issue.findMany({
                where: {
                    status: 'resolved',
                    resolutionTime: { not: null },
                    resolvedAt: { gte: sixMonthsAgo },
                },
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                },
            });

            if (historicalIssues.length < 10) {
                // Not enough data - return default estimate
                return {
                    value: this.getDefaultEstimate(issueData.severity),
                    confidence: 0.3,
                    factors: ['Insufficient historical data (< 10 resolved issues)'],
                };
            }

            // Prepare training data
            const trainingData: TrainingData[] = historicalIssues.map(issue => ({
                features: [
                    this.encodeSeverity(issue.severity),
                    issue.projectId === issueData.projectId ? 1 : 0,
                    issue.assignedToId === issueData.assignedToId ? 1 : 0,
                    issue.featureId === issueData.featureId ? 1 : 0,
                ],
                target: issue.resolutionTime || 0,
            }));

            // Current issue features
            const currentFeatures = [
                this.encodeSeverity(issueData.severity),
                1, // Same project
                issueData.assignedToId ? 1 : 0,
                issueData.featureId ? 1 : 0,
            ];

            // Calculate similarity with all historical issues
            const similarities = trainingData.map((data, index) => ({
                index,
                similarity: this.cosineSimilarity(currentFeatures, data.features),
                resolutionTime: data.target,
            }));

            // Get top 10 most similar issues (K-NN with K=10)
            const topSimilar = similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, Math.min(10, similarities.length));

            // Weighted average based on similarity
            const totalSimilarity = topSimilar.reduce((sum, s) => sum + s.similarity, 0);

            if (totalSimilarity === 0) {
                return {
                    value: this.getDefaultEstimate(issueData.severity),
                    confidence: 0.4,
                    factors: ['No similar issues found'],
                };
            }

            const prediction = topSimilar.reduce(
                (sum, s) => sum + (s.resolutionTime * s.similarity) / totalSimilarity,
                0
            );

            // Calculate confidence based on data quality
            const resolutionTimes = topSimilar.map(s => s.resolutionTime);
            const variance = ss.variance(resolutionTimes);
            const mean = ss.mean(resolutionTimes);
            const cv = Math.sqrt(variance) / mean; // Coefficient of variation

            // Lower CV = higher confidence
            const confidence = Math.max(0.4, Math.min(0.95, 1 - cv / 2));

            // Identify key factors
            const factors = this.identifyFactors(
                issueData,
                topSimilar.length,
                confidence,
                prediction
            );

            return {
                value: Math.round(prediction),
                confidence: Math.round(confidence * 100) / 100,
                factors,
            };
        } catch (error) {
            console.error('Prediction error:', error);
            return {
                value: this.getDefaultEstimate(issueData.severity),
                confidence: 0.3,
                factors: ['Error during prediction'],
            };
        }
    }

    /**
     * Get default time estimate based on severity
     */
    private static getDefaultEstimate(severity: string): number {
        const estimates: Record<string, number> = {
            critical: 12,
            high: 24,
            medium: 48,
            low: 72,
        };
        return estimates[severity] || 24;
    }

    /**
     * Encode severity as numerical value
     */
    private static encodeSeverity(severity: string): number {
        const map: Record<string, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
        };
        return map[severity] || 2;
    }

    /**
     * Calculate cosine similarity between two feature vectors
     */
    private static cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Identify contributing factors for the prediction
     */
    private static identifyFactors(
        issueData: any,
        similarCount: number,
        confidence: number,
        predictedTime: number
    ): string[] {
        const factors: string[] = [];

        // Severity factor
        if (issueData.severity === 'critical') {
            factors.push('🚨 Critical severity - requires immediate attention');
        } else if (issueData.severity === 'high') {
            factors.push('⚠️ High priority issue');
        }

        // Data quality factor
        factors.push(`📊 Based on ${similarCount} similar resolved issues`);

        // Confidence factor
        if (confidence > 0.8) {
            factors.push('✅ High confidence prediction');
        } else if (confidence > 0.6) {
            factors.push('⚡ Moderate confidence prediction');
        } else {
            factors.push('⚠️ Limited data - estimate may vary');
        }

        // Time estimate factor
        if (predictedTime < 24) {
            factors.push('Quick resolution expected');
        } else if (predictedTime > 72) {
            factors.push('Complex issue - may take longer');
        }

        return factors;
    }
}
