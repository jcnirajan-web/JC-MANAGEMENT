import { BulkUploadRow, ValidationErrorDetail, Party, JobCard, SystemSettings } from '../types';

export class BulkUploadValidator {
  /**
   * Generates sample CSV template file content for download
   */
  static generateCsvTemplate(): string {
    return this.getCsvTemplate();
  }

  static getCsvTemplate(): string {
    const headers = [
      'Job Card No.',
      'Applicant Name',
      'Aadhaar No.',
      'Service Type',
      'Aadhaar Status',
      'Date Received',
      'Card Created Date',
      'Party',
      'Status',
      'Remarks',
    ];

    const sampleRow1 = [
      'MH-04-001-002-00991',
      'Sachin Tukaram More',
      '981234567890',
      'New Job Card',
      'Fetched',
      '2026-10-28',
      '2026-10-28',
      'PTY-101',
      'Pending',
      'Verified at village meeting',
    ];

    const sampleRow2 = [
      'MH-04-001-002-00992',
      'Kavita Sachin More',
      '771234567891',
      'Member Add',
      'Fetched',
      '2026-10-28',
      '2026-10-28',
      'PTY-101',
      'Completed',
      'Wife added to husband card',
    ];

    return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\r\n');
  }

  /**
   * Parse CSV text into raw row objects
   */
  static parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV regex that respects quoted commas
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values: string[] = [];
      let match;
      while ((match = regex.exec(lines[i])) !== null) {
        let val = match[1] ?? '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        values.push(val.trim());
        if (regex.lastIndex >= lines[i].length) break;
      }

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      result.push(rowObj);
    }

    return result;
  }

  /**
   * Validate rows against rules, party list, existing job cards, and pricing settings
   */
  static validateRows(
    rawRows: Record<string, string>[],
    parties: Party[],
    existingJobCards: JobCard[],
    settings: SystemSettings
  ): {
    validatedRows: BulkUploadRow[];
    validCount: number;
    invalidCount: number;
    errorDetails: ValidationErrorDetail[];
  } {
    const partyMap = new Map<string, Party>();
    parties.forEach((p) => {
      partyMap.set(p.partyId.toLowerCase(), p);
      partyMap.set(p.partyName.toLowerCase(), p);
    });

    const existingCardNumbers = new Set(existingJobCards.map((c) => c.jobCardNo.toLowerCase()));
    const seenInFileCardNumbers = new Set<string>();

    const validatedRows: BulkUploadRow[] = [];
    const errorDetails: ValidationErrorDetail[] = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // +1 for 0-index, +1 for header
      const errors: string[] = [];

      // Extract values with flexible header aliases
      const jobCardNo =
        row['job card no.'] ||
        row['job card no'] ||
        row['jobcardno'] ||
        row['card no'] ||
        row['job card number'] ||
        '';

      const applicantName =
        row['applicant name'] || row['applicant'] || row['name'] || '';

      const aadhaarNo =
        row['aadhaar no.'] || row['aadhaar no'] || row['aadhaar'] || row['aadhaar number'] || '';

      const serviceTypeRaw =
        row['service type'] || row['servicetype'] || row['type'] || 'New Job Card';

      const aadhaarStatus =
        row['aadhaar status'] || row['aadhaarstatus'] || 'Fetched';

      const dateReceived =
        row['date received'] || row['received date'] || row['date'] || new Date().toISOString().split('T')[0];

      const cardCreatedDate =
        row['card created date'] || row['created date'] || dateReceived;

      const partyRaw =
        row['party'] || row['party id'] || row['party name'] || '';

      const status =
        row['status'] || 'Pending';

      const remarks =
        row['remarks'] || row['note'] || '';

      // Validation 1: Required Job Card No
      if (!jobCardNo.trim()) {
        errors.push('Job Card No is required');
        errorDetails.push({
          rowNumber,
          field: 'Job Card No.',
          error: 'Missing Job Card Number',
          suggestedFix: 'Provide a valid unique Job Card number (e.g., MH-04-001-...)',
        });
      } else {
        const lowerNo = jobCardNo.trim().toLowerCase();
        // Duplicate check against existing database
        if (existingCardNumbers.has(lowerNo)) {
          errors.push(`Duplicate: Card No ${jobCardNo} already exists in database`);
          errorDetails.push({
            rowNumber,
            field: 'Job Card No.',
            error: 'Duplicate in Database',
            suggestedFix: 'Verify if this card was already imported or update the number',
          });
        }
        // Duplicate check within file
        if (seenInFileCardNumbers.has(lowerNo)) {
          errors.push(`Duplicate: Card No ${jobCardNo} appears multiple times in upload file`);
          errorDetails.push({
            rowNumber,
            field: 'Job Card No.',
            error: 'Duplicate in File',
            suggestedFix: 'Remove duplicate rows from file before importing',
          });
        }
        seenInFileCardNumbers.add(lowerNo);
      }

      // Validation 2: Required Applicant Name
      if (!applicantName.trim()) {
        errors.push('Applicant Name is required');
        errorDetails.push({
          rowNumber,
          field: 'Applicant Name',
          error: 'Missing Applicant Name',
          suggestedFix: 'Enter the full name of the job card applicant',
        });
      }

      // Validation 3: Service Type
      let serviceType: 'New Job Card' | 'Member Add' = 'New Job Card';
      const normService = serviceTypeRaw.trim().toLowerCase();
      if (normService === 'member add' || normService === 'member addition' || normService === 'member') {
        serviceType = 'Member Add';
      } else if (
        normService === 'new job card' ||
        normService === 'new' ||
        normService === 'new card'
      ) {
        serviceType = 'New Job Card';
      } else {
        errors.push(`Invalid Service Type: "${serviceTypeRaw}"`);
        errorDetails.push({
          rowNumber,
          field: 'Service Type',
          error: `Invalid value "${serviceTypeRaw}"`,
          suggestedFix: 'Use either "New Job Card" or "Member Add"',
        });
      }

      // Validation 4: Party exists
      let matchedPartyId = '';
      if (!partyRaw.trim()) {
        errors.push('Party is required');
        errorDetails.push({
          rowNumber,
          field: 'Party',
          error: 'Party ID or Name missing',
          suggestedFix: 'Specify an active registered Party ID (e.g. PTY-101) or Party Name',
        });
      } else {
        const matched = partyMap.get(partyRaw.trim().toLowerCase());
        if (!matched) {
          errors.push(`Party "${partyRaw}" not found in Party master`);
          errorDetails.push({
            rowNumber,
            field: 'Party',
            error: `Unrecognized Party "${partyRaw}"`,
            suggestedFix: 'Add the party to Party Management first or correct Party ID',
          });
        } else if (matched.status === 'Archived') {
          errors.push(`Party "${matched.partyName}" is archived`);
          errorDetails.push({
            rowNumber,
            field: 'Party',
            error: 'Party is archived',
            suggestedFix: 'Activate party in Party Management before adding transactions',
          });
        } else {
          matchedPartyId = matched.partyId;
        }
      }

      // Validation 5: Aadhaar No (if provided, should be 12 digits)
      const cleanAadhaar = aadhaarNo.replace(/\D/g, '');
      if (aadhaarNo.trim() && cleanAadhaar.length !== 12) {
        errors.push('Aadhaar must be 12 digits');
        errorDetails.push({
          rowNumber,
          field: 'Aadhaar No.',
          error: 'Invalid length',
          suggestedFix: 'Enter 12-digit Aadhaar number or leave empty if status is Not Available',
        });
      }

      // Calculate automated price based on active Settings
      const calculatedAmount =
        serviceType === 'New Job Card' ? settings.newJobCardPrice : settings.memberAddPrice;

      const isValid = errors.length === 0;

      validatedRows.push({
        rowNumber,
        jobCardNo: jobCardNo.trim(),
        applicantName: applicantName.trim(),
        aadhaarNo: cleanAadhaar || aadhaarNo.trim(),
        serviceType,
        aadhaarStatus: aadhaarStatus.trim() || 'Fetched',
        dateReceived: dateReceived.trim(),
        cardCreatedDate: cardCreatedDate.trim(),
        party: matchedPartyId || partyRaw.trim(),
        status: status.trim() || 'Pending',
        remarks: remarks.trim(),
        isValid,
        errors,
        calculatedAmount,
      });
    });

    const validCount = validatedRows.filter((r) => r.isValid).length;
    const invalidCount = validatedRows.length - validCount;

    return {
      validatedRows,
      validCount,
      invalidCount,
      errorDetails,
    };
  }
}
