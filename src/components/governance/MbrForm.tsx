import React from 'react';
import './governance.css';

interface MbrFormProps {
    form: Record<string, any>;
    onChange: (form: Record<string, any>) => void;
    readonly?: boolean;
}

const MbrForm: React.FC<MbrFormProps> = ({ form, onChange, readonly = false }) => {
    const set = (key: string, value: any) => onChange({ ...form, [key]: value });

    return (
        <div className="gov-mbr-form">
            <section className="gov-mbr-form__section">
                <h4 className="gov-mbr-form__section-title">📊 Performance Metrics</h4>
                <div className="gov-form-grid">
                    <label className="gov-field-label">
                        Uptime %
                        <input
                            type="number" min="0" max="100" step="0.01"
                            className="gov-input"
                            placeholder="e.g. 99.8"
                            value={form.uptimePct ?? ''}
                            onChange={e => set('uptimePct', parseFloat(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        Downtime (minutes)
                        <input
                            type="number" min="0"
                            className="gov-input"
                            placeholder="e.g. 120"
                            value={form.downtimeMinutes ?? ''}
                            onChange={e => set('downtimeMinutes', parseInt(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        SLA Compliance %
                        <input
                            type="number" min="0" max="100" step="0.1"
                            className="gov-input"
                            placeholder="e.g. 95.5"
                            value={form.slaCompliancePct ?? ''}
                            onChange={e => set('slaCompliancePct', parseFloat(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        Escalation Count
                        <input
                            type="number" min="0"
                            className="gov-input"
                            value={form.escalationCount ?? ''}
                            onChange={e => set('escalationCount', parseInt(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        Total Issues
                        <input
                            type="number" min="0"
                            className="gov-input"
                            value={form.totalIssues ?? ''}
                            onChange={e => set('totalIssues', parseInt(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        Resolved Issues
                        <input
                            type="number" min="0"
                            className="gov-input"
                            value={form.resolvedIssues ?? ''}
                            onChange={e => set('resolvedIssues', parseInt(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                </div>
            </section>

            <section className="gov-mbr-form__section">
                <h4 className="gov-mbr-form__section-title">💰 Business Impact</h4>
                <div className="gov-form-grid">
                    <label className="gov-field-label">
                        Subscriber Impact (count)
                        <input
                            type="number" min="0"
                            className="gov-input"
                            value={form.subscriberImpact ?? ''}
                            onChange={e => set('subscriberImpact', parseInt(e.target.value))}
                            disabled={readonly}
                        />
                    </label>
                    <label className="gov-field-label">
                        Revenue Impact
                        <input
                            type="text"
                            className="gov-input"
                            placeholder="e.g. $12,000 estimated loss"
                            value={form.revenueImpact ?? ''}
                            onChange={e => set('revenueImpact', e.target.value)}
                            disabled={readonly}
                        />
                    </label>
                </div>
            </section>

            <section className="gov-mbr-form__section">
                <h4 className="gov-mbr-form__section-title">📝 Narrative</h4>
                <label className="gov-field-label">
                    Performance Summary
                    <textarea
                        className="gov-textarea"
                        rows={4}
                        placeholder="Overall performance narrative for this month…"
                        value={form.performanceSummary ?? ''}
                        onChange={e => set('performanceSummary', e.target.value)}
                        disabled={readonly}
                    />
                </label>
                <label className="gov-field-label" style={{ marginTop: '0.75rem' }}>
                    Improvement Roadmap
                    <textarea
                        className="gov-textarea"
                        rows={4}
                        placeholder="Planned improvements, feature requests, action items…"
                        value={form.improvementRoadmap ?? ''}
                        onChange={e => set('improvementRoadmap', e.target.value)}
                        disabled={readonly}
                    />
                </label>
            </section>
        </div>
    );
};

export default MbrForm;
