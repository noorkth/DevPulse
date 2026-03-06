import React from 'react';
import './governance.css';

interface Client {
    id: string;
    name: string;
}

interface ClientSelectorProps {
    clients: Client[];
    value: string;
    onChange: (clientId: string) => void;
    includeAll?: boolean;
    allLabel?: string;
    className?: string;
    disabled?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
    clients,
    value,
    onChange,
    includeAll = true,
    allLabel = 'All Clients',
    className = '',
    disabled = false,
}) => (
    <select
        className={`gov-client-selector ${className}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
    >
        {includeAll && <option value="">{allLabel}</option>}
        {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
        ))}
    </select>
);

export default ClientSelector;
