import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    error?: string;
    isTextarea?: boolean;
    rows?: number;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    isTextarea = false,
    className = '',
    rows = 4,
    ...props
}) => {
    const inputClass = `input ${error ? 'input-error' : ''} ${className}`;

    return (
        <div className="input-container">
            {label && <label className="input-label">{label}</label>}

            {isTextarea ? (
                <textarea
                    className={inputClass}
                    rows={rows}
                    {...(props as InputHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : (
                <input
                    className={inputClass}
                    {...(props as InputHTMLAttributes<HTMLInputElement>)}
                />
            )}

            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;
