import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
    filename?: string;
    format?: 'png' | 'pdf';
    quality?: number;
}

/**
 * Export a chart element as PNG or PDF
 */
export const exportChart = async (
    chartElement: HTMLElement,
    options: ExportOptions = {}
): Promise<void> => {
    const {
        filename = `chart-${Date.now()}`,
        format = 'png',
        quality = 1,
    } = options;

    try {
        // Capture the chart as canvas
        const canvas = await html2canvas(chartElement, {
            backgroundColor: null,
            scale: 2, // Higher resolution
            logging: false,
        });

        if (format === 'png') {
            // Export as PNG
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png', quality);
            link.click();
        } else if (format === 'pdf') {
            // Export as PDF
            const imgData = canvas.toDataURL('image/png', quality);
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
        }
    } catch (error) {
        console.error('Error exporting chart:', error);
        throw new Error('Failed to export chart');
    }
};

/**
 * Export chart data as CSV
 */
export const exportChartDataAsCSV = (
    data: any[],
    filename: string = `chart-data-${Date.now()}`
): void => {
    if (!data || data.length === 0) {
        throw new Error('No data to export');
    }

    // Get headers from first data object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Copy chart to clipboard as image
 */
export const copyChartToClipboard = async (
    chartElement: HTMLElement
): Promise<void> => {
    try {
        const canvas = await html2canvas(chartElement, {
            backgroundColor: null,
            scale: 2,
            logging: false,
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                throw new Error('Failed to create blob');
            }

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        });
    } catch (error) {
        console.error('Error copying chart to clipboard:', error);
        throw new Error('Failed to copy chart to clipboard');
    }
};

export default {
    exportChart,
    exportChartDataAsCSV,
    copyChartToClipboard,
};
