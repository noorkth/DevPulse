import { format } from 'date-fns';

interface WeeklyReportData {
    developer: {
        fullName: string;
        email: string;
    };
    period: {
        start: Date;
        end: Date;
    };
    metrics: {
        issuesResolved: number;
        productivityScore: number;
        avgResolutionTime: number;
        qualityScore: number;
    };
    goals: Array<{
        type: string;
        target: number;
        current: number;
        progress: number;
    }>;
    comparison: {
        issuesChange: number;
        productivityChange: number;
    };
}

export function generateWeeklyReportHTML(data: WeeklyReportData): string {
    const { developer, period, metrics, goals, comparison } = data;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Performance Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #6366f1;
        }
        .header h1 {
            color: #6366f1;
            margin: 0;
            font-size: 24px;
        }
        .period {
            text-align: center;
            color: #666;
            margin-top: 10px;
            font-size: 14px;
        }
        .greeting {
            margin: 20px 0;
            font-size: 16px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 25px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #6366f1;
            margin: 10px 0;
        }
        .metric-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-change {
            font-size: 12px;
            margin-top: 5px;
        }
        .metric-change.positive {
            color: #10b981;
        }
        .metric-change.negative {
            color: #ef4444;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        .goal-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        .goal-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .goal-name {
            font-weight: 600;
            color: #333;
        }
        .goal-progress {
            color: #6366f1;
            font-weight: 600;
        }
        .progress-bar {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            height: 100%;
            transition: width 0.3s;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .cta-button {
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Weekly Performance Report</h1>
            <div class="period">
                ${format(period.start, 'MMM d')} - ${format(period.end, 'MMM d, yyyy')}
            </div>
        </div>

        <div class="greeting">
            Hi <strong>${developer.fullName}</strong>,
            <br><br>
            Here's your weekly performance summary! 🎯
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Issues Resolved</div>
                <div class="metric-value">${metrics.issuesResolved}</div>
                <div class="metric-change ${comparison.issuesChange >= 0 ? 'positive' : 'negative'}">
                    ${comparison.issuesChange >= 0 ? '↑' : '↓'} ${Math.abs(comparison.issuesChange)} from last week
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Productivity Score</div>
                <div class="metric-value">${metrics.productivityScore.toFixed(1)}</div>
                <div class="metric-change ${comparison.productivityChange >= 0 ? 'positive' : 'negative'}">
                    ${comparison.productivityChange >= 0 ? '↑' : '↓'} ${Math.abs(comparison.productivityChange).toFixed(1)} from last week
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Avg Resolution Time</div>
                <div class="metric-value">${metrics.avgResolutionTime.toFixed(1)}h</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Quality Score</div>
                <div class="metric-value">${metrics.qualityScore.toFixed(1)}/5</div>
            </div>
        </div>

        ${goals.length > 0 ? `
        <div class="section">
            <div class="section-title">🎯 Goal Progress</div>
            ${goals.map(goal => `
                <div class="goal-item">
                    <div class="goal-header">
                        <span class="goal-name">${goal.type}</span>
                        <span class="goal-progress">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>📊 <strong>For detailed insights</strong>, open DevPulse on your desktop</p>
            <p style="margin-top: 15px;">This is an automated weekly report from DevPulse</p>
            <p style="margin-top: 10px;">
                <a href="#" style="color: #6366f1;">Update Preferences</a> | 
                <a href="#" style="color: #999;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

export function generateWeeklyReportText(data: WeeklyReportData): string {
    const { developer, period, metrics, goals } = data;

    return `
WEEKLY PERFORMANCE REPORT
${format(period.start, 'MMM d')} - ${format(period.end, 'MMM d, yyyy')}

Hi ${developer.fullName},

Here's your weekly performance summary:

METRICS:
- Issues Resolved: ${metrics.issuesResolved}
- Productivity Score: ${metrics.productivityScore.toFixed(1)}
- Avg Resolution Time: ${metrics.avgResolutionTime.toFixed(1)} hours
- Quality Score: ${metrics.qualityScore.toFixed(1)}/5

${goals.length > 0 ? `
GOAL PROGRESS:
${goals.map(g => `- ${g.type}: ${g.current}/${g.target} (${g.progress}%)`).join('\n')}
` : ''}

---
This is an automated report from DevPulse
    `.trim();
}
