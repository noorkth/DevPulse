import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface PerformanceData {
    developer: {
        fullName: string;
        email: string;
        seniorityLevel: string;
    };
    metrics: {
        productivityScore: number;
        completionRate: number;
        avgFixQuality: number;
        totalIssues: number;
        resolvedCount: number;
        avgResolutionTime: number;
    };
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export async function generatePerformancePDF(
    data: PerformanceData,
    dateRange: DateRange
): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // --- Page 1: Cover Page ---
    // Header
    pdf.setFillColor(99, 102, 241); // Primary color
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Report', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.developer.fullName, pageWidth / 2, 30, { align: 'center' });

    // Date range
    yPosition = 60;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.text(`Report Period: ${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`, pageWidth / 2, yPosition, { align: 'center' });

    // Developer Info
    yPosition = 80;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Developer Information', 20, yPosition);

    yPosition += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${data.developer.fullName}`, 20, yPosition);

    yPosition += 7;
    pdf.text(`Email: ${data.developer.email}`, 20, yPosition);

    yPosition += 7;
    pdf.text(`Seniority: ${data.developer.seniorityLevel.charAt(0).toUpperCase() + data.developer.seniorityLevel.slice(1)}`, 20, yPosition);

    // Key Metrics Summary
    yPosition += 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Metrics Summary', 20, yPosition);

    // Metrics table
    yPosition += 10;
    const metrics = [
        ['Productivity Score', data.metrics.productivityScore.toFixed(2)],
        ['Completion Rate', `${data.metrics.completionRate.toFixed(1)}%`],
        ['Average Fix Quality', `${data.metrics.avgFixQuality.toFixed(1)} / 5.0`],
        ['Total Issues', data.metrics.totalIssues.toString()],
        ['Resolved Issues', data.metrics.resolvedCount.toString()],
        ['Avg Resolution Time', `${data.metrics.avgResolutionTime.toFixed(1)} hours`]
    ];

    metrics.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'normal');
        pdf.text(label + ':', 25, yPosition);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, 120, yPosition);
        yPosition += 8;
    });

    // Footer
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on ${format(new Date(), 'PPP')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('DevPulse - Developer Performance System', pageWidth / 2, pageHeight - 5, { align: 'center' });

    // --- Page 2: Charts ---
    pdf.addPage();
    yPosition = 20;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Visualizations', 20, yPosition);

    // Capture charts from the DOM
    try {
        const chartsGrid = document.querySelector('.charts-grid') as HTMLElement;
        if (chartsGrid) {
            yPosition += 10;

            // Capture all chart cards
            const chartCards = chartsGrid.querySelectorAll('.card');
            let chartY = yPosition;

            for (let i = 0; i < Math.min(chartCards.length, 6); i++) {
                const card = chartCards[i] as HTMLElement;

                // Capture card as image
                const canvas = await html2canvas(card, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 40;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Add new page if needed
                if (chartY + imgHeight > pageHeight - 20) {
                    pdf.addPage();
                    chartY = 20;
                }

                pdf.addImage(imgData, 'PNG', 20, chartY, imgWidth, imgHeight);
                chartY += imgHeight + 10;
            }
        }
    } catch (error) {
        console.error('Error capturing charts:', error);
        pdf.setFontSize(11);
        pdf.text('Error capturing charts. Please try again.', 20, yPosition + 20);
    }

    // Save PDF
    const fileName = `${data.developer.fullName.replace(/\s+/g, '_')}_Performance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
}

export async function generateQuickPDF(elementId: string, fileName: string): Promise<void> {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID ${elementId} not found`);
        }

        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10;

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add more pages if content is too long
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
