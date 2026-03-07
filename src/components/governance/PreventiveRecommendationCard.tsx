import React from 'react';
import { useToast } from '../common/Toast';

interface Props {
    recommendation: any;
    onStatusChange: () => void;
}

export default function PreventiveRecommendationCard({ recommendation, onStatusChange }: Props) {
    const { success, error, info } = useToast();

    const handleAccept = async () => {
        try {
            await window.api.aiPreventive.updateStatus(recommendation.id, 'accepted', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2');
            success('Recommendation accepted. Remember to add it below!');
            onStatusChange();
        } catch (err: any) {
            error(err.message);
        }
    };

    const handleDismiss = async () => {
        try {
            await window.api.aiPreventive.updateStatus(recommendation.id, 'dismissed', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2');
            info('Recommendation dismissed.');
            onStatusChange();
        } catch (err: any) {
            error(err.message);
        }
    };

    return (
        <div className="ai-recommendation-card" style={{
            background: 'linear-gradient(to right, rgba(111, 66, 193, 0.1), transparent)',
            borderLeft: '4px solid #6F42C1',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span role="img" aria-label="ai">🤖</span>
                    {recommendation.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {recommendation.description}
                </p>
                <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
                    Client: {recommendation.client?.name}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                <button
                    onClick={handleAccept}
                    className="btn btn-primary btn-sm"
                >
                    Accept
                </button>
                <button
                    onClick={handleDismiss}
                    className="btn btn-secondary btn-sm"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
