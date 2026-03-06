import React from 'react';
import './governance.css';

interface CheckItem {
    key: 'channelUptime' | 'geoIpValidation' | 'stbAudit' | 'techHealthCheck' | 'streamingQuality';
    label: string;
    obsKey: 'channelObservation' | 'geoIpObservation' | 'stbObservation' | 'techObservation' | 'streamingObservation';
}

const CHECKS: CheckItem[] = [
    { key: 'channelUptime', label: '📡 Channel Uptime Check', obsKey: 'channelObservation' },
    { key: 'geoIpValidation', label: '🌍 Geo-IP Validation', obsKey: 'geoIpObservation' },
    { key: 'stbAudit', label: '📺 STB Audit', obsKey: 'stbObservation' },
    { key: 'techHealthCheck', label: '🖥 Technical Health Check', obsKey: 'techObservation' },
    { key: 'streamingQuality', label: '🎬 Streaming Quality Verification', obsKey: 'streamingObservation' },
];

interface MonitoringChecklistFormProps {
    form: Record<string, any>;
    onChange: (form: Record<string, any>) => void;
    readonly?: boolean;
}

const MonitoringChecklistForm: React.FC<MonitoringChecklistFormProps> = ({ form, onChange, readonly = false }) => {
    const set = (key: string, value: any) => onChange({ ...form, [key]: value });
    const completed = CHECKS.filter(c => form[c.key]).length;

    return (
        <div className="gov-checklist-form">
            <div className="gov-checklist-form__progress">
                <div className="gov-checklist-form__progress-bar">
                    <div
                        className="gov-checklist-form__progress-fill"
                        style={{ width: `${(completed / CHECKS.length) * 100}%` }}
                    />
                </div>
                <span className="gov-checklist-form__progress-label">{completed} / {CHECKS.length} completed</span>
            </div>

            <div className="gov-checklist-form__items">
                {CHECKS.map(check => (
                    <div key={check.key} className={`gov-checklist-item ${form[check.key] ? 'gov-checklist-item--done' : ''}`}>
                        <label className="gov-checklist-item__label">
                            <input
                                type="checkbox"
                                checked={!!form[check.key]}
                                onChange={e => set(check.key, e.target.checked)}
                                disabled={readonly}
                                className="gov-checklist-item__checkbox"
                            />
                            <span className="gov-checklist-item__text">{check.label}</span>
                        </label>
                        <textarea
                            className="gov-checklist-item__obs"
                            placeholder="Observations (optional)…"
                            value={form[check.obsKey] ?? ''}
                            onChange={e => set(check.obsKey, e.target.value)}
                            rows={2}
                            disabled={readonly}
                        />
                    </div>
                ))}
            </div>

            <div className="gov-checklist-form__footer">
                <label className="gov-field-label">Recommendations
                    <textarea
                        className="gov-textarea"
                        rows={3}
                        placeholder="Overall recommendations…"
                        value={form.recommendations ?? ''}
                        onChange={e => set('recommendations', e.target.value)}
                        disabled={readonly}
                    />
                </label>
            </div>
        </div>
    );
};

export default MonitoringChecklistForm;
