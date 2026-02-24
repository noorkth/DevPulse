import React from 'react';
import './Loading.css';

interface LoadingProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
    size = 'medium',
    text = 'Loading...',
    fullScreen = false
}) => {
    const content = (
        <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className={`loading-spinner ${size}`}>
                <div className="spinner"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );

    return content;
};

export default Loading;
