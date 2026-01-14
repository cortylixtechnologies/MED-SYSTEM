import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReferralForPDF {
  id: string;
  patientName: string;
  patientAge: number;
  patientContact?: string | null;
  patientMedicalId?: string | null;
  patientCode?: string | null;
  fromHospitalName?: string;
  toHospitalName?: string;
  urgency: string;
  status: string;
  medicalSummary: string;
  reason: string;
  createdAt: string;
  rejectionReason?: string | null;
  assignedDoctorName?: string | null;
}

interface ActivityLog {
  action: string;
  details?: string | null;
  created_at: string;
  performed_by_name?: string;
}

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: (string | number)[][];
      theme?: string;
      headStyles?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      columnStyles?: Record<string, unknown>;
      margin?: { left?: number; right?: number };
    }) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getUrgencyColor = (urgency: string): [number, number, number] => {
  switch (urgency.toLowerCase()) {
    case 'emergency':
      return [220, 53, 69];
    case 'urgent':
      return [255, 193, 7];
    case 'routine':
    default:
      return [40, 167, 69];
  }
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_treatment: 'In Treatment',
    completed: 'Completed',
    more_info_requested: 'More Info Requested',
  };
  return statusMap[status] || status;
};

export const generateReferralPDF = (
  referral: ReferralForPDF,
  activityLogs?: ActivityLog[]
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // Header
  doc.setFillColor(20, 128, 122); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Referral Report', margin, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - margin, 28, { align: 'right' });

  yPosition = 55;

  // Referral ID and Status
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Referral ID: ${referral.id.substring(0, 8).toUpperCase()}`, margin, yPosition);

  if (referral.patientCode) {
    doc.text(`Patient Code: ${referral.patientCode}`, pageWidth - margin - 60, yPosition);
  }

  yPosition += 10;

  // Status badge
  const urgencyColor = getUrgencyColor(referral.urgency);
  doc.setFillColor(...urgencyColor);
  doc.roundedRect(margin, yPosition - 5, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(referral.urgency.toUpperCase(), margin + 3, yPosition);

  doc.setFillColor(100, 100, 100);
  doc.roundedRect(margin + 45, yPosition - 5, 45, 8, 2, 2, 'F');
  doc.text(getStatusText(referral.status), margin + 48, yPosition);

  yPosition += 15;

  // Patient Information Section
  doc.setTextColor(20, 128, 122);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(20, 128, 122);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  const patientInfo = [
    ['Name:', referral.patientName],
    ['Age:', `${referral.patientAge} years`],
    ['Contact:', referral.patientContact || 'Not provided'],
    ['Medical ID:', referral.patientMedicalId || 'Not provided'],
  ];

  patientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Referral Route Section
  doc.setTextColor(20, 128, 122);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Referral Route', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(20, 128, 122);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text('From:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(referral.fromHospitalName || 'Unknown Hospital', margin + 40, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('To:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(referral.toHospitalName || 'Unknown Hospital', margin + 40, yPosition);
  yPosition += 7;

  if (referral.assignedDoctorName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Assigned Doctor:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(referral.assignedDoctorName, margin + 40, yPosition);
    yPosition += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Created:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(referral.createdAt), margin + 40, yPosition);
  yPosition += 15;

  // Medical Summary Section
  doc.setTextColor(20, 128, 122);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Summary', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(20, 128, 122);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryLines = doc.splitTextToSize(referral.medicalSummary, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 10;

  // Reason for Referral
  doc.setTextColor(20, 128, 122);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reason for Referral', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(20, 128, 122);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const reasonLines = doc.splitTextToSize(referral.reason, pageWidth - 2 * margin);
  doc.text(reasonLines, margin, yPosition);
  yPosition += reasonLines.length * 5 + 10;

  // Rejection Reason (if applicable)
  if (referral.rejectionReason) {
    doc.setTextColor(220, 53, 69);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Rejection Reason', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(220, 53, 69);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const rejectionLines = doc.splitTextToSize(referral.rejectionReason, pageWidth - 2 * margin);
    doc.text(rejectionLines, margin, yPosition);
    yPosition += rejectionLines.length * 5 + 10;
  }

  // Activity Log (if provided)
  if (activityLogs && activityLogs.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(20, 128, 122);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Activity Log', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(20, 128, 122);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    const tableData = activityLogs.map((log) => [
      formatDate(log.created_at),
      log.action,
      log.details || '-',
      log.performed_by_name || 'System',
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Action', 'Details', 'By']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [20, 128, 122] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'CONFIDENTIAL - This document contains sensitive medical information.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`referral-${referral.id.substring(0, 8)}.pdf`);
};

export const generateBatchReferralsPDF = (referrals: ReferralForPDF[]): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header
  doc.setFillColor(20, 128, 122);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Referrals Summary Report', margin, 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Total Referrals: ${referrals.length}`, pageWidth - margin, 30, { align: 'right' });

  // Table data
  const tableData = referrals.map((r) => [
    r.id.substring(0, 8).toUpperCase(),
    r.patientName,
    r.fromHospitalName || 'Unknown',
    r.toHospitalName || 'Unknown',
    r.urgency,
    getStatusText(r.status),
    new Date(r.createdAt).toLocaleDateString(),
  ]);

  doc.autoTable({
    startY: 45,
    head: [['ID', 'Patient', 'From', 'To', 'Urgency', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [20, 128, 122] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 23 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'CONFIDENTIAL - This document contains sensitive medical information.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`referrals-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
