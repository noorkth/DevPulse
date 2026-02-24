import Papa from 'papaparse';

export interface CSVIssue {
    title: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string; // email
    product?: string;
    client?: string;
    project?: string;
    feature?: string;
    estimatedTime?: number;
    tags?: string; // comma-separated
}

export interface ParseResult {
    success: boolean;
    data?: CSVIssue[];
    errors?: string[];
}

/**
 * Parse CSV file for bulk issue import
 */
export const parseIssuesCSV = (file: File): Promise<ParseResult> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                const errors: string[] = [];
                const data: CSVIssue[] = [];

                results.data.forEach((row: any, index: number) => {
                    const rowNum = index + 2; // +2 for header and 0-index

                    // Validate required fields
                    if (!row.title || row.title.trim() === '') {
                        errors.push(`Row ${rowNum}: Title is required`);
                        return;
                    }

                    // Validate severity
                    const validSeverities = ['low', 'medium', 'high', 'critical'];
                    if (row.severity && !validSeverities.includes(row.severity.toLowerCase())) {
                        errors.push(`Row ${rowNum}: Invalid severity "${row.severity}". Must be: ${validSeverities.join(', ')}`);
                        return;
                    }

                    // Validate status
                    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
                    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
                        errors.push(`Row ${rowNum}: Invalid status "${row.status}". Must be: ${validStatuses.join(', ')}`);
                        return;
                    }

                    // Parse and add valid row
                    data.push({
                        title: row.title.trim(),
                        description: row.description?.trim() || '',
                        severity: (row.severity?.toLowerCase() || 'medium') as any,
                        status: (row.status?.toLowerCase() || 'open') as any,
                        assignedTo: row.assignedTo?.trim() || undefined,
                        product: row.product?.trim() || undefined,
                        client: row.client?.trim() || undefined,
                        project: row.project?.trim() || undefined,
                        feature: row.feature?.trim() || undefined,
                        estimatedTime: row.estimatedTime ? parseInt(row.estimatedTime) : undefined,
                        tags: row.tags?.trim() || undefined,
                    });
                });

                if (errors.length > 0) {
                    resolve({ success: false, errors });
                } else {
                    resolve({ success: true, data });
                }
            },
            error: (error) => {
                resolve({
                    success: false,
                    errors: [`Failed to parse CSV: ${error.message}`],
                });
            },
        });
    });
};

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
    const template = `title,description,severity,status,assignedTo,project,feature,estimatedTime,tags
Login Bug,Users cannot login with correct credentials,high,open,john@example.com,Web App,,4,"bug,login,urgent"
Dashboard Loading Slow,Dashboard takes 10+ seconds to load,medium,in_progress,jane@example.com,Mobile App,,8,"performance,dashboard"
Payment Integration,Implement Stripe payment gateway,low,open,bob@example.com,Web App,,16,"feature,payment"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'issues-template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default {
    parseIssuesCSV,
    downloadCSVTemplate,
};
