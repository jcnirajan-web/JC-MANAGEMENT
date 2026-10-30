import { Party, JobCard, Payment, Demand, User, SystemSettings, AuditLog } from '../types';

export interface SheetsSyncData {
  users: User[];
  parties: Party[];
  jobCards: JobCard[];
  payments: Payment[];
  demands: Demand[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
}

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';

export class GoogleSheetsService {
  /**
   * Search for an existing spreadsheet named JOB_CARD_SYSTEM_DB in Google Drive
   */
  static async findExistingSpreadsheet(accessToken: string, title = 'JOB_CARD_SYSTEM_DB'): Promise<string | null> {
    try {
      const q = encodeURIComponent(`name = '${title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
      const res = await fetch(`${DRIVE_BASE}?q=${q}&fields=files(id,name)&pageSize=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn('Drive search error:', errText);
        throw new Error(`Google Drive API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    } catch (e: any) {
      console.error('Error finding spreadsheet:', e);
      throw e;
    }
  }

  /**
   * Create a new spreadsheet with all 7 required tabs (Requirement #3):
   * 1. Users, 2. Parties, 3. JobCards, 4. Payments, 5. Demands, 6. Settings, 7. AuditLog
   */
  static async createSpreadsheet(accessToken: string, title = 'JOB_CARD_SYSTEM_DB'): Promise<string> {
    const body = {
      properties: { title },
      sheets: [
        { properties: { title: 'Users' } },
        { properties: { title: 'Parties' } },
        { properties: { title: 'JobCards' } },
        { properties: { title: 'Payments' } },
        { properties: { title: 'Demands' } },
        { properties: { title: 'Settings' } },
        { properties: { title: 'AuditLog' } },
      ],
    };

    const res = await fetch(SHEETS_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create Google Sheet (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.spreadsheetId;
  }

  /**
   * Seed exact headers and data into the 7 sheets (Requirement #3 & #4)
   * ZERO DEMO RECORDS - only headers + initial admin user + current price settings
   */
  static async initializeSheetData(
    accessToken: string,
    spreadsheetId: string,
    initialData: SheetsSyncData
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const valueRanges = [
      {
        range: 'Users!A1:H',
        values: [
          ['User ID', 'Username', 'Password/Password Hash', 'Name', 'Role', 'Status', 'Created Date', 'Modified Date'],
          ...initialData.users.map((u) => [
            u.userId,
            u.username,
            u.passwordHash || u.password || 'admin123',
            u.name,
            u.role,
            u.status,
            u.createdDate,
            u.modifiedDate || '',
          ]),
        ],
      },
      {
        range: 'Parties!A1:G',
        values: [
          ['Party ID', 'Party Name', 'Address', 'Phone Number', 'Status', 'Created Date', 'Modified Date'],
          ...initialData.parties.map((p) => [
            p.partyId,
            p.partyName,
            p.address,
            p.mobile,
            p.status,
            p.createdDate,
            p.modifiedDate || '',
          ]),
        ],
      },
      {
        range: 'JobCards!A1:Q',
        values: [
          [
            'Transaction ID',
            'Job Card No.',
            'Applicant Name',
            'Aadhaar No.',
            'Aadhaar Status',
            'Service Type',
            'Party ID',
            'Party Name',
            'Date Received',
            'Card Created Date',
            'Bill Amount',
            'Status',
            'Remarks',
            'Created By',
            'Created Date',
            'Modified By',
            'Modified Date',
          ],
          ...initialData.jobCards.map((j) => [
            j.transactionId,
            j.jobCardNo,
            j.applicantName,
            j.aadhaarNo,
            j.aadhaarStatus,
            j.serviceType,
            j.partyId,
            j.partyName || '',
            j.dateReceived,
            j.cardCreatedDate,
            j.billAmount,
            j.status,
            j.remarks,
            j.createdBy,
            j.createdDate,
            j.modifiedBy || '',
            j.modifiedDate || '',
          ]),
        ],
      },
      {
        range: 'Payments!A1:L',
        values: [
          [
            'Payment ID',
            'Transaction ID',
            'Party ID',
            'Party Name',
            'Job Card No.',
            'Payment Date',
            'Amount',
            'Payment Mode',
            'Reference Number',
            'Remarks',
            'Entered By',
            'Created Date',
          ],
          ...initialData.payments.map((p) => [
            p.paymentId,
            p.transactionId || '',
            p.partyId,
            p.partyName || '',
            p.jobCardNo || '',
            p.paymentDate,
            p.amount,
            p.paymentMode,
            p.referenceNumber,
            p.remarks,
            p.enteredBy,
            p.createdDate,
          ]),
        ],
      },
      {
        range: 'Demands!A1:J',
        values: [
          [
            'Demand ID',
            'Demand Type',
            'Party ID',
            'Party Name',
            'Demand Date',
            'Amount',
            'Remarks',
            'Created By',
            'Created Date',
            'Modified Date',
          ],
          ...initialData.demands.map((d) => [
            d.demandId,
            d.demandType,
            d.partyId,
            d.partyName,
            d.demandDate,
            d.amount,
            d.remarks,
            d.createdBy,
            d.createdDate,
            d.modifiedDate || '',
          ]),
        ],
      },
      {
        range: 'Settings!A1:F',
        values: [
          ['Setting ID', 'Setting Name', 'Setting Value', 'Effective Date', 'Modified By', 'Modified Date'],
          ['SET-001', 'newJobCardPrice', String(initialData.settings.newJobCardPrice), today, 'Admin', today],
          ['SET-002', 'memberAddPrice', String(initialData.settings.memberAddPrice), today, 'Admin', today],
          ['SET-003', 'workDemandPrice', String(initialData.settings.workDemandPrice || 500), today, 'Admin', today],
          ['SET-004', 'pmaygPrice', String(initialData.settings.pmaygPrice || 500), today, 'Admin', today],
          ['SET-005', 'applicationName', initialData.settings.applicationName, today, 'Admin', today],
          ['SET-006', 'organizationName', initialData.settings.organizationName, today, 'Admin', today],
          ['SET-007', 'organizationAddress', initialData.settings.organizationAddress, today, 'Admin', today],
          ['SET-008', 'organizationContact', initialData.settings.organizationContact, today, 'Admin', today],
          ['SET-009', 'inactivityTimeoutMinutes', String(initialData.settings.inactivityTimeoutMinutes), today, 'Admin', today],
          ['SET-010', 'currencySymbol', initialData.settings.currencySymbol, today, 'Admin', today],
        ],
      },
      {
        range: 'AuditLog!A1:G',
        values: [
          ['Log ID', 'Username', 'Action', 'Module', 'Record ID', 'Date/Time', 'Description'],
          ...initialData.auditLogs.map((a) => [
            a.logId,
            a.user,
            a.action,
            a.module,
            a.recordId,
            a.dateTime,
            a.description,
          ]),
        ],
      },
    ];

    const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Sheets batch update failed (${res.status}): ${errText}`);
    }
  }

  /**
   * Fetch all records across all 7 sheets
   */
  static async fetchAllData(accessToken: string, spreadsheetId: string): Promise<Partial<SheetsSyncData>> {
    const ranges = [
      'Users!A2:H',
      'Parties!A2:G',
      'JobCards!A2:Q',
      'Payments!A2:L',
      'Demands!A2:J',
      'Settings!A2:F',
      'AuditLog!A2:G',
    ];

    const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}/values:batchGet?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Sheets batchGet failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const [usersRange, partiesRange, jobCardsRange, paymentsRange, demandsRange, settingsRange, auditLogRange] =
      data.valueRanges || [];

    const users: User[] = (usersRange?.values || []).map((row: string[]) => ({
      userId: row[0] || '',
      username: row[1] || '',
      password: row[2] || 'admin123',
      name: row[3] || row[1] || 'User',
      role: (row[4] as any) || 'Admin',
      status: (row[5] as any) || 'Active',
      createdDate: row[6] || '',
      modifiedDate: row[7] || '',
    }));

    const parties: Party[] = (partiesRange?.values || []).map((row: string[]) => ({
      partyId: row[0] || '',
      partyName: row[1] || '',
      address: row[2] || '',
      mobile: row[3] || '',
      status: (row[4] as any) || 'Active',
      createdDate: row[5] || '',
      modifiedDate: row[6] || '',
      remarks: '',
    }));

    const jobCards: JobCard[] = (jobCardsRange?.values || []).map((row: string[]) => ({
      transactionId: row[0] || '',
      jobCardNo: row[1] || '',
      applicantName: row[2] || '',
      aadhaarNo: row[3] || '',
      aadhaarStatus: (row[4] as any) || 'Fetched',
      serviceType: (row[5] as any) || 'New Job Card',
      partyId: row[6] || '',
      partyName: row[7] || '',
      dateReceived: row[8] || '',
      cardCreatedDate: row[9] || '',
      billAmount: Number(row[10]) || 0,
      status: (row[11] as any) || 'Pending',
      remarks: row[12] || '',
      createdBy: row[13] || '',
      createdDate: row[14] || '',
      modifiedBy: row[15] || undefined,
      modifiedDate: row[16] || undefined,
    }));

    const payments: Payment[] = (paymentsRange?.values || []).map((row: string[]) => ({
      paymentId: row[0] || '',
      transactionId: row[1] || undefined,
      partyId: row[2] || '',
      partyName: row[3] || '',
      jobCardNo: row[4] || '',
      paymentDate: row[5] || '',
      amount: Number(row[6]) || 0,
      paymentMode: (row[7] as any) || 'Cash',
      referenceNumber: row[8] || '',
      remarks: row[9] || '',
      enteredBy: row[10] || '',
      createdDate: row[11] || '',
    }));

    const demands: Demand[] = (demandsRange?.values || []).map((row: string[]) => ({
      demandId: row[0] || '',
      demandType: (row[1] as any) || 'Work Demand',
      partyId: row[2] || '',
      partyName: row[3] || '',
      demandDate: row[4] || '',
      amount: Number(row[5]) || 0,
      remarks: row[6] || '',
      createdBy: row[7] || '',
      createdDate: row[8] || '',
      modifiedDate: row[9] || '',
    }));

    const auditLogs: AuditLog[] = (auditLogRange?.values || []).map((row: string[]) => ({
      logId: row[0] || '',
      user: row[1] || '',
      action: row[2] || '',
      module: (row[3] as any) || 'JobCards',
      recordId: row[4] || '',
      dateTime: row[5] || '',
      description: row[6] || '',
    }));

    return {
      users: users.length > 0 ? users : undefined,
      parties,
      jobCards,
      payments,
      demands,
      auditLogs,
    };
  }

  /**
   * Sync all modified local tables back to Google Sheets
   */
  static async pushFullData(accessToken: string, spreadsheetId: string, data: SheetsSyncData): Promise<void> {
    await this.initializeSheetData(accessToken, spreadsheetId, data);
  }
}
