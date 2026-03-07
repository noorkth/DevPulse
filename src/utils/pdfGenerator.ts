import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

/** ─── MBR PDF export ───────────────────────────────────────────────── */
interface MbrData {
    client: { name: string };
    createdBy?: { fullName: string } | null;
    reviewMonth: string | Date;
    status: string;
    uptimePct?: number | null;
    downtimeMinutes?: number | null;
    slaCompliancePct?: number | null;
    escalationCount?: number | null;
    totalIssues?: number | null;
    resolvedIssues?: number | null;
    subscriberImpact?: number | null;
    revenueImpact?: string | null;
    performanceSummary?: string | null;
    improvementRoadmap?: string | null;
}

export function generateMbrPDF(data: MbrData): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = 0;

    // ── Cover band ──────────────────────────────────────────────────────
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, W, 48, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Monthly Business Review', W / 2, 20, { align: 'center' });
    pdf.setFontSize(13);
    pdf.text(data.client.name, W / 2, 31, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const monthLabel = format(new Date(data.reviewMonth), 'MMMM yyyy');
    pdf.text(monthLabel, W / 2, 41, { align: 'center' });

    // ── Meta row ─────────────────────────────────────────────────────────
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);
    y = 56;
    pdf.text(`Prepared by: ${data.createdBy?.fullName ?? '—'}`, margin, y);
    pdf.text(`Status: ${data.status}`, W - margin, y, { align: 'right' });
    pdf.text(`Generated: ${format(new Date(), 'PPP')}`, W / 2, y, { align: 'center' });

    // ── Section: Performance Metrics ─────────────────────────────────────
    y = 68;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(30, 30, 30);
    pdf.text('Performance Metrics', margin, y);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y + 2, W - margin, y + 2);
    y += 10;

    const metrics: [string, string][] = [
        ['Uptime %', data.uptimePct != null ? `${data.uptimePct}%` : '—'],
        ['Downtime', data.downtimeMinutes != null ? `${data.downtimeMinutes} min` : '—'],
        ['SLA Compliance', data.slaCompliancePct != null ? `${data.slaCompliancePct}%` : '—'],
        ['Total Issues', String(data.totalIssues ?? '—')],
        ['Resolved Issues', String(data.resolvedIssues ?? '—')],
        ['Escalations', String(data.escalationCount ?? '—')],
        ['Subscriber Impact', String(data.subscriberImpact ?? '—')],
        ['Revenue Impact', data.revenueImpact ?? '—'],
    ];

    // Draw 2-column metric boxes
    const colW = (W - margin * 2 - 8) / 2;
    metrics.forEach(([label, val], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = margin + col * (colW + 8);
        const by = y + row * 22;
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(bx, by, colW, 18, 3, 3, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, bx + 5, by + 6);
        pdf.setFontSize(11);
        pdf.setTextColor(20, 20, 20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(val, bx + 5, by + 14);
    });
    y += Math.ceil(metrics.length / 2) * 22 + 10;

    // ── SLA Bar (visual) ──────────────────────────────────────────────────
    if (data.slaCompliancePct != null) {
        const pct = Math.min(100, data.slaCompliancePct);
        const barW = W - margin * 2;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 30, 30);
        pdf.text('SLA Compliance', margin, y);
        y += 5;
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(margin, y, barW, 8, 2, 2, 'F');
        const fillColor = pct >= 90 ? [34, 197, 94] : pct >= 70 ? [245, 158, 11] : [239, 68, 68];
        pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        pdf.roundedRect(margin, y, barW * pct / 100, 8, 2, 2, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        if (pct > 10) pdf.text(`${pct}%`, margin + 4, y + 5.5);
        y += 16;
    }

    // ── Section: Narrative ────────────────────────────────────────────────
    const addTextSection = (title: string, body: string | null | undefined) => {
        if (!body) return;
        if (y > H - 50) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(30, 30, 30);
        pdf.text(title, margin, y);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y + 2, W - margin, y + 2);
        y += 10;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(body, W - margin * 2);
        lines.forEach((line: string) => {
            if (y > H - 20) { pdf.addPage(); y = 20; }
            pdf.text(line, margin, y);
            y += 6;
        });
        y += 6;
    };

    addTextSection('Performance Summary', data.performanceSummary);
    addTextSection('Improvement Roadmap', data.improvementRoadmap);

    // ── Footer ────────────────────────────────────────────────────────────
    const pages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text('DevPulse — Client Governance Platform', margin, H - 8);
        pdf.text(`Page ${i} of ${pages}`, W - margin, H - 8, { align: 'right' });
    }

    const fileName = `MBR_${data.client.name.replace(/\s+/g, '_')}_${monthLabel.replace(' ', '_')}.pdf`;

    // Attempt native save dialog via IPC, fallback to browser download
    if (window.api && window.api.mbr && window.api.mbr.exportPdf) {
        try {
            const dataUri = pdf.output('datauristring');
            window.api.mbr.exportPdf(dataUri, fileName).then((result: any) => {
                if (!result.success && result.reason !== 'cancelled') {
                    console.error('IPC Save failed:', result.reason);
                    pdf.save(fileName);
                }
            });
        } catch (e) {
            console.error('IPC save error:', e);
            pdf.save(fileName);
        }
    } else {
        pdf.save(fileName);
    }
}

/** ─── Shared Issues CSV export ─────────────────────────────────────── */
export function exportSharedIssuesCsv(issues: any[]): void {
    const headers = [
        'Title', 'Client', 'Severity', 'Status', 'SLA Status', 'Escalation Level',
        'Owner', 'Raised At', 'First Response', 'Resolution Deadline', 'Resolved At',
        'Visibility', 'Root Cause', 'Resolution Summary',
    ];

    const escapeCell = (v: any) => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    };

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US') : '';

    const rows = issues.map(i => [
        escapeCell(i.title),
        escapeCell(i.client?.name ?? ''),
        escapeCell(i.severity),
        escapeCell(i.status),
        escapeCell(i.slaStatus),
        escapeCell(i.escalationLevel),
        escapeCell(i.assignedOwner?.fullName ?? ''),
        fmt(i.raisedAt),
        fmt(i.firstResponseAt),
        fmt(i.resolutionDeadline),
        fmt(i.resolvedAt),
        escapeCell(i.visibility),
        escapeCell(i.rootCause ?? ''),
        escapeCell(i.resolutionSummary ?? ''),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SharedIssues_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}



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
