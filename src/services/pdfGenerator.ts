import { jsPDF } from 'jspdf';
import { JobCard, Party, Payment } from '../types';

export interface CardReportRow {
  jobCardNo: string;
  applicantName: string;
  maskedAadhaar: string;
  serviceType: string;
  cardDate: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: string;
}

export class PdfGeneratorService {
  /**
   * Helper to format currency
   */
  private static formatCurrency(val: number): string {
    return 'Rs. ' + Number(val).toLocaleString('en-IN');
  }

  /**
   * Helper to mask Aadhaar: 123456789012 -> XXXX-XXXX-9012
   */
  static maskAadhaar(aadhaar: string): string {
    const clean = (aadhaar || '').replace(/\D/g, '');
    if (clean.length >= 4) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    return 'XXXX-XXXX-XXXX';
  }

  /**
   * 1. Party Account Statement / Outstanding Statement (Mandatory Feature #32)
   */
  static generatePartyStatement(
    party: Party,
    items: {
      date: string;
      jobCardNo: string;
      applicant: string;
      serviceType: string;
      billAmount: number;
      paid: number;
      outstanding: number;
    }[],
    statementPeriod = 'All Transactions'
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    // Header Branding
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(14, y, pageWidth - 28, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('PARTY ACCOUNT STATEMENT / HISAB', pageWidth / 2, y + 16, { align: 'center' });

    y += 28;

    // Party Information Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 26, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Party Name:', 18, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(party.partyName, 42, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Mobile Number:', 18, y + 14);
    doc.setTextColor(15, 23, 42);
    doc.text(party.mobile || 'N/A', 42, y + 14);

    doc.setTextColor(71, 85, 105);
    doc.text('Address:', 18, y + 21);
    doc.setTextColor(15, 23, 42);
    doc.text(party.address || 'N/A', 42, y + 21);

    // Right side of Party box
    doc.setTextColor(71, 85, 105);
    doc.text('Party ID:', pageWidth - 80, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(party.partyId, pageWidth - 42, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Statement Period:', pageWidth - 80, y + 14);
    doc.setTextColor(15, 23, 42);
    doc.text(statementPeriod, pageWidth - 42, y + 14);

    doc.setTextColor(71, 85, 105);
    doc.text('Generated Date:', pageWidth - 80, y + 21);
    doc.setTextColor(15, 23, 42);
    doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - 42, y + 21);

    y += 32;

    // Financial Ledger Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const colX = {
      date: 16,
      jobCardNo: 36,
      applicant: 78,
      serviceType: 118,
      billAmount: 142,
      paid: 162,
      outstanding: 182,
    };

    doc.text('Date', colX.date, y + 5.5);
    doc.text('Job Card No.', colX.jobCardNo, y + 5.5);
    doc.text('Applicant', colX.applicant, y + 5.5);
    doc.text('Service Type', colX.serviceType, y + 5.5);
    doc.text('Bill (Rs)', colX.billAmount, y + 5.5);
    doc.text('Paid (Rs)', colX.paid, y + 5.5);
    doc.text('Due (Rs)', colX.outstanding, y + 5.5);

    y += 8;

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    let totalBill = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    items.forEach((item, index) => {
      // Check page overflow
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      totalBill += item.billAmount;
      totalPaid += item.paid;
      totalOutstanding += item.outstanding;

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(item.date || '-', colX.date, y + 4.8);
      doc.text(item.jobCardNo || '-', colX.jobCardNo, y + 4.8);
      doc.text(item.applicant.slice(0, 22), colX.applicant, y + 4.8);
      doc.text(item.serviceType, colX.serviceType, y + 4.8);
      doc.text(item.billAmount.toLocaleString('en-IN'), colX.billAmount, y + 4.8);
      doc.text(item.paid.toLocaleString('en-IN'), colX.paid, y + 4.8);

      if (item.outstanding > 0) {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(item.outstanding.toLocaleString('en-IN'), colX.outstanding, y + 4.8);
      doc.setTextColor(51, 65, 85);

      y += 7;
    });

    // Summary Section
    y += 6;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.rect(pageWidth - 95, y, 81, 24, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    doc.text('Total Business:', pageWidth - 91, y + 6);
    doc.text(this.formatCurrency(totalBill), pageWidth - 20, y + 6, { align: 'right' });

    doc.text('Total Paid:', pageWidth - 91, y + 13);
    doc.setTextColor(22, 101, 52); // green
    doc.text(this.formatCurrency(totalPaid), pageWidth - 20, y + 13, { align: 'right' });

    doc.setTextColor(185, 28, 28); // red
    doc.text('Total Outstanding:', pageWidth - 91, y + 20);
    doc.text(this.formatCurrency(totalOutstanding), pageWidth - 20, y + 20, { align: 'right' });

    y += 34;

    // Signature Area
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signatory', 20, y + 10);
    doc.line(20, y + 8, 65, y + 8);

    doc.text('Party / Client Signature', pageWidth - 65, y + 10);
    doc.line(pageWidth - 65, y + 8, pageWidth - 20, y + 8);

    doc.save(`Statement_${party.partyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * 2. Filtered or All Cards PDF Report
   */
  static generateCardsReport(
    cards: CardReportRow[],
    title = 'Job Cards Report',
    filterSubtitle?: string
  ): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, pageWidth - 28, 16, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 7, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`${title.toUpperCase()}  |  Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, y + 12, {
      align: 'center',
    });

    y += 20;

    if (filterSubtitle) {
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Active Filters: ${filterSubtitle}`, 14, y);
      y += 6;
    }

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const cols = {
      no: 16,
      cardNo: 26,
      applicant: 76,
      aadhaar: 122,
      serviceType: 154,
      date: 182,
      amount: 206,
      paid: 226,
      outstanding: 246,
      status: 266,
    };

    doc.text('#', cols.no, y + 4.8);
    doc.text('Job Card No.', cols.cardNo, y + 4.8);
    doc.text('Applicant Name', cols.applicant, y + 4.8);
    doc.text('Masked Aadhaar', cols.aadhaar, y + 4.8);
    doc.text('Service Type', cols.serviceType, y + 4.8);
    doc.text('Date', cols.date, y + 4.8);
    doc.text('Bill (Rs)', cols.amount, y + 4.8);
    doc.text('Paid (Rs)', cols.paid, y + 4.8);
    doc.text('Due (Rs)', cols.outstanding, y + 4.8);
    doc.text('Status', cols.status, y + 4.8);

    y += 7;

    doc.setFont('helvetica', 'normal');
    let totalBill = 0;
    let totalPaid = 0;
    let totalDue = 0;

    cards.forEach((row, i) => {
      if (y > 185) {
        doc.addPage();
        y = 15;
      }

      totalBill += row.amount;
      totalPaid += row.paid;
      totalDue += row.outstanding;

      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 6.5, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(String(i + 1), cols.no, y + 4.5);
      doc.text(row.jobCardNo, cols.cardNo, y + 4.5);
      doc.text(row.applicantName.slice(0, 25), cols.applicant, y + 4.5);
      doc.text(row.maskedAadhaar, cols.aadhaar, y + 4.5);
      doc.text(row.serviceType, cols.serviceType, y + 4.5);
      doc.text(row.cardDate, cols.date, y + 4.5);
      doc.text(row.amount.toLocaleString('en-IN'), cols.amount, y + 4.5);
      doc.text(row.paid.toLocaleString('en-IN'), cols.paid, y + 4.5);

      if (row.outstanding > 0) {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(row.outstanding.toLocaleString('en-IN'), cols.outstanding, y + 4.5);
      doc.setTextColor(51, 65, 85);

      doc.text(row.status, cols.status, y + 4.5);

      y += 6.5;
    });

    // Summary totals row
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL (${cards.length} Records)`, cols.applicant, y + 5);
    doc.text(totalBill.toLocaleString('en-IN'), cols.amount, y + 5);
    doc.text(totalPaid.toLocaleString('en-IN'), cols.paid, y + 5);
    doc.text(totalDue.toLocaleString('en-IN'), cols.outstanding, y + 5);

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`);
  }

  /**
   * 3. Payment History PDF Report
   */
  static generatePaymentCollectionsReport(
    payments: Payment[],
    partiesMap: Record<string, string>,
    title = 'Payment Collections Report'
  ): void {
    return this.generatePaymentReport(payments, partiesMap, title);
  }

  static generatePaymentReport(
    payments: Payment[],
    partiesMap: Record<string, string>,
    title = 'Payment Collections Report'
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, pageWidth - 28, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`${title.toUpperCase()}  |  ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, y + 15, {
      align: 'center',
    });

    y += 26;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const cols = {
      date: 18,
      payId: 42,
      party: 68,
      amount: 118,
      mode: 142,
      ref: 165,
    };

    doc.text('Date', cols.date, y + 5.5);
    doc.text('Payment ID', cols.payId, y + 5.5);
    doc.text('Party Name', cols.party, y + 5.5);
    doc.text('Amount (Rs)', cols.amount, y + 5.5);
    doc.text('Mode', cols.mode, y + 5.5);
    doc.text('Reference', cols.ref, y + 5.5);

    y += 8;

    let totalCollection = 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    payments.forEach((p, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      totalCollection += p.amount;

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(p.paymentDate, cols.date, y + 4.8);
      doc.text(p.paymentId, cols.payId, y + 4.8);
      const partyName = partiesMap[p.partyId] || p.partyId;
      doc.text(partyName.slice(0, 24), cols.party, y + 4.8);
      doc.text(p.amount.toLocaleString('en-IN'), cols.amount, y + 4.8);
      doc.text(p.paymentMode, cols.mode, y + 4.8);
      doc.text((p.referenceNumber || '-').slice(0, 16), cols.ref, y + 4.8);

      y += 7;
    });

    // Total row
    y += 4;
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Collected:', cols.party, y + 5.5);
    doc.text(`Rs. ${totalCollection.toLocaleString('en-IN')}`, cols.amount, y + 5.5);

    doc.save(`Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * 4. Outstanding Balances Report (Requirement #14)
   * Displays Total Business, Total Received, Total Outstanding + transaction breakdown
   */
  static generateOutstandingReport(
    items: {
      partyName: string;
      jobCardNo: string;
      applicant: string;
      serviceType: string;
      billAmount: number;
      paid: number;
      outstanding: number;
    }[],
    totalBusiness: number,
    totalReceived: number,
    totalOutstanding: number,
    filterLabel = 'All Parties'
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    // Header Branding
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, pageWidth - 28, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`OUTSTANDING BALANCES STATEMENT — ${filterLabel.toUpperCase()}`, pageWidth / 2, y + 16, { align: 'center' });

    y += 28;

    // Summary Box: Total Business, Total Received, Total Outstanding (Requirement #14)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 16, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Total Business:', 18, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${totalBusiness.toLocaleString('en-IN')}`, 46, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Received:', 86, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Rs. ${totalReceived.toLocaleString('en-IN')}`, 115, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Outstanding:', 148, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // red
    doc.text(`Rs. ${totalOutstanding.toLocaleString('en-IN')}`, 178, y + 10);

    y += 22;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const cols = {
      party: 16,
      cardNo: 58,
      applicant: 95,
      type: 130,
      bill: 152,
      paid: 168,
      due: 184,
    };

    doc.text('Party', cols.party, y + 5.5);
    doc.text('Job Card No.', cols.cardNo, y + 5.5);
    doc.text('Applicant', cols.applicant, y + 5.5);
    doc.text('Type', cols.type, y + 5.5);
    doc.text('Bill', cols.bill, y + 5.5);
    doc.text('Paid', cols.paid, y + 5.5);
    doc.text('Due', cols.due, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');

    if (items.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.text('No outstanding records found for the selected filter.', 18, y + 8);
    } else {
      items.forEach((item, idx) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 7, 'F');
        }

        doc.setTextColor(51, 65, 85);
        doc.text(item.partyName.slice(0, 20), cols.party, y + 4.8);
        doc.text(item.jobCardNo.slice(0, 18), cols.cardNo, y + 4.8);
        doc.text(item.applicant.slice(0, 18), cols.applicant, y + 4.8);
        doc.text(item.serviceType === 'New Job Card' ? 'New Card' : 'Member Add', cols.type, y + 4.8);
        doc.text(item.billAmount.toLocaleString('en-IN'), cols.bill, y + 4.8);
        doc.text(item.paid.toLocaleString('en-IN'), cols.paid, y + 4.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(225, 29, 72);
        doc.text(item.outstanding.toLocaleString('en-IN'), cols.due, y + 4.8);
        doc.setFont('helvetica', 'normal');

        y += 7;
      });
    }

    doc.save(`Outstanding_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * 5. Demand Statement (Work Demand & PMAY-G Demand) (Requirements #15 & #16)
   */
  static generateDemandReport(
    demandType: 'Work Demand' | 'PMAY-G Demand',
    demands: {
      demandDate: string;
      partyName: string;
      amount: number;
      remarks: string;
    }[],
    totalAmount: number,
    filterLabel = 'All Parties'
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    // Header Branding
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, pageWidth - 28, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`${demandType.toUpperCase()} REPORT — ${filterLabel.toUpperCase()}`, pageWidth / 2, y + 16, { align: 'center' });

    y += 28;

    // Summary Box: Total Demand
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 14, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`TOTAL ${demandType.toUpperCase()}:`, 18, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${totalAmount.toLocaleString('en-IN')}`, 80, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Records: ${demands.length}`, pageWidth - 55, y + 9);

    y += 20;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const cols = {
      date: 18,
      party: 50,
      amount: 110,
      remarks: 145,
    };

    doc.text('Demand Date', cols.date, y + 5.5);
    doc.text('Party Name', cols.party, y + 5.5);
    doc.text('Amount (Rs)', cols.amount, y + 5.5);
    doc.text('Remarks', cols.remarks, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    if (demands.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.text(`No ${demandType} records found for the selected filter.`, 18, y + 8);
    } else {
      demands.forEach((d, idx) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 7, 'F');
        }

        doc.setTextColor(51, 65, 85);
        doc.text(d.demandDate, cols.date, y + 4.8);
        doc.text(d.partyName.slice(0, 28), cols.party, y + 4.8);
        doc.text(d.amount.toLocaleString('en-IN'), cols.amount, y + 4.8);
        doc.text((d.remarks || '-').slice(0, 25), cols.remarks, y + 4.8);

        y += 7;
      });
    }

    doc.save(`${demandType.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * 6. Monthly Comprehensive Report (Requirement #24)
   */
  static generateMonthlyReport(
    year: number,
    month: number,
    summary: {
      totalCards: number;
      newJobCardsCount: number;
      memberAddCount: number;
      totalBusiness: number;
      totalPayments: number;
      workDemandTotal: number;
      pmaygDemandTotal: number;
      outstandingTotal: number;
    },
    hasData: boolean
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1] || `${month}`;

    // Header Branding
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, pageWidth - 28, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('JOB CARD MANAGEMENT SYSTEM', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`MONTHLY COMPREHENSIVE BUSINESS REPORT — ${monthName.toUpperCase()} ${year}`, pageWidth / 2, y + 16, { align: 'center' });

    y += 28;

    if (!hasData) {
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('No records found for the selected month.', pageWidth / 2, y + 20, { align: 'center' });
      doc.save(`Monthly_Report_${year}_${month}.pdf`);
      return;
    }

    // Grid of summary cards
    const cardData = [
      { title: 'JOB CARDS', val: `${summary.totalCards}` },
      { title: 'NEW JOB CARDS', val: `${summary.newJobCardsCount}` },
      { title: 'ADD MEMBER', val: `${summary.memberAddCount}` },
      { title: 'TOTAL BILLED', val: `Rs. ${summary.totalBusiness.toLocaleString('en-IN')}` },
      { title: 'PAYMENTS RECEIVED', val: `Rs. ${summary.totalPayments.toLocaleString('en-IN')}` },
      { title: 'WORK DEMAND', val: `Rs. ${summary.workDemandTotal.toLocaleString('en-IN')}` },
      { title: 'PMAY-G DEMAND', val: `Rs. ${summary.pmaygDemandTotal.toLocaleString('en-IN')}` },
      { title: 'OUTSTANDING', val: `Rs. ${summary.outstandingTotal.toLocaleString('en-IN')}` },
    ];

    const boxWidth = (pageWidth - 28 - 10) / 2;
    const boxHeight = 18;

    cardData.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 14 + col * (boxWidth + 10);
      const by = y + row * (boxHeight + 6);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(bx, by, boxWidth, boxHeight, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(c.title, bx + 6, by + 6);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(c.val, bx + 6, by + 14);
    });

    y += 4 * (boxHeight + 6) + 14;

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 14, y);

    doc.save(`Monthly_Report_${year}_${month}.pdf`);
  }
}
