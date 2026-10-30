import {
  Party,
  JobCard,
  Payment,
  Demand,
  User,
  SystemSettings,
  AuditLog,
  DriveDocument,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_USERS,
  INITIAL_PARTIES,
  INITIAL_JOB_CARDS,
  INITIAL_PAYMENTS,
  INITIAL_DEMANDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DOCUMENTS,
} from '../config/defaults';
import { GoogleSheetsService, SheetsSyncData } from './sheetsApi';

// v2 storage keys ensure a fresh, completely empty database with zero demo records
const STORAGE_KEYS = {
  USERS: 'jcms_users_v2',
  PARTIES: 'jcms_parties_v2',
  JOB_CARDS: 'jcms_job_cards_v2',
  PAYMENTS: 'jcms_payments_v2',
  DEMANDS: 'jcms_demands_v2',
  SETTINGS: 'jcms_settings_v2',
  AUDIT_LOGS: 'jcms_audit_logs_v2',
  DOCUMENTS: 'jcms_documents_v2',
  SPREADSHEET_ID: 'jcms_spreadsheet_id_v2',
  LAST_SYNC: 'jcms_last_sync_v2',
  SAFETY_SNAPSHOT: 'jcms_safety_snapshot_v2',
};

export class DatabaseService {
  private static getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private static setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage (${key}):`, e);
    }
  }

  // Users
  static getUsers(): User[] {
    return this.getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static setUsers(users: User[]): void {
    this.setStored(STORAGE_KEYS.USERS, users);
  }

  // Parties (Starts at 0 Parties)
  static getParties(): Party[] {
    return this.getStored<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
  }

  static setParties(parties: Party[]): void {
    this.setStored(STORAGE_KEYS.PARTIES, parties);
  }

  // Job Cards (Starts at 0 Job Cards)
  static getJobCards(): JobCard[] {
    return this.getStored<JobCard[]>(STORAGE_KEYS.JOB_CARDS, INITIAL_JOB_CARDS);
  }

  static setJobCards(jobCards: JobCard[]): void {
    this.setStored(STORAGE_KEYS.JOB_CARDS, jobCards);
  }

  // Payments (Starts at 0 Payments)
  static getPayments(): Payment[] {
    return this.getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  static setPayments(payments: Payment[]): void {
    this.setStored(STORAGE_KEYS.PAYMENTS, payments);
  }

  // Demands (Starts at 0 Demands)
  static getDemands(): Demand[] {
    return this.getStored<Demand[]>(STORAGE_KEYS.DEMANDS, INITIAL_DEMANDS);
  }

  static setDemands(demands: Demand[]): void {
    this.setStored(STORAGE_KEYS.DEMANDS, demands);
  }

  // Settings
  static getSettings(): SystemSettings {
    return this.getStored<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static setSettings(settings: SystemSettings): void {
    this.setStored(STORAGE_KEYS.SETTINGS, settings);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return this.getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static setAuditLogs(logs: AuditLog[]): void {
    this.setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Documents
  static getDocuments(): DriveDocument[] {
    return this.getStored<DriveDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  }

  static setDocuments(docs: DriveDocument[]): void {
    this.setStored(STORAGE_KEYS.DOCUMENTS, docs);
  }

  // Spreadsheet ID
  static getSpreadsheetId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
  }

  static setSpreadsheetId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
  }

  // Sync Timestamp
  static getLastSyncTime(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'Never';
  }

  static setLastSyncTime(timeStr: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timeStr);
  }

  // Full Bundle for Export & Sheets Sync
  static getAllData(): SheetsSyncData {
    return {
      users: this.getUsers(),
      parties: this.getParties(),
      jobCards: this.getJobCards(),
      payments: this.getPayments(),
      demands: this.getDemands(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
  }

  /**
   * Log an audit event
   */
  static logAudit(user: string, action: string, module: AuditLog['module'], recordId: string, description: string): void {
    const logs = this.getAuditLogs();
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const newLog: AuditLog = {
      logId: `AUD-${Date.now().toString().slice(-6)}`,
      user: user || 'System',
      action,
      module,
      recordId,
      dateTime: formattedDate,
      description,
    };
    this.setAuditLogs([newLog, ...logs]);
  }

  /**
   * Backup & Restore Engine (Requirement #27)
   */
  static createBackupJson(): string {
    const bundle = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'JOB CARD MANAGEMENT SYSTEM',
      data: this.getAllData(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  static createSafetySnapshot(): void {
    try {
      const current = this.createBackupJson();
      localStorage.setItem(STORAGE_KEYS.SAFETY_SNAPSHOT, current);
    } catch (e) {
      console.warn('Could not save safety snapshot:', e);
    }
  }

  static restoreBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, error: 'Invalid backup file format. Missing data bundle.' };
      }

      // Automatically create snapshot of current data before overwriting (Requirement #27)
      this.createSafetySnapshot();

      const { users, parties, jobCards, payments, demands, settings, auditLogs } = parsed.data;

      if (Array.isArray(users)) this.setUsers(users);
      if (Array.isArray(parties)) this.setParties(parties);
      if (Array.isArray(jobCards)) this.setJobCards(jobCards);
      if (Array.isArray(payments)) this.setPayments(payments);
      if (Array.isArray(demands)) this.setDemands(demands);
      if (settings) this.setSettings(settings);
      if (Array.isArray(auditLogs)) this.setAuditLogs(auditLogs);

      this.logAudit('Admin', 'Restore Backup', 'Settings', 'RESTORE', 'Restored system database from backup file');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON backup file.' };
    }
  }

  /**
   * Sync with Google Sheets: Pull latest data from Sheets
   */
  static async pullFromSheets(accessToken: string, spreadsheetId: string): Promise<boolean> {
    try {
      const fetched = await GoogleSheetsService.fetchAllData(accessToken, spreadsheetId);
      if (fetched.users) this.setUsers(fetched.users);
      if (fetched.parties) this.setParties(fetched.parties);
      if (fetched.jobCards) this.setJobCards(fetched.jobCards);
      if (fetched.payments) this.setPayments(fetched.payments);
      if (fetched.demands) this.setDemands(fetched.demands);
      if (fetched.auditLogs) this.setAuditLogs(fetched.auditLogs);

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      this.setLastSyncTime(timeStr);
      return true;
    } catch (e) {
      console.warn('Pull from Google Sheets skipped or failed:', e);
      return false;
    }
  }

  /**
   * Sync with Google Sheets: Push local mutations to Sheets
   */
  static async pushToSheets(accessToken: string, spreadsheetId: string): Promise<boolean> {
    try {
      const data = this.getAllData();
      await GoogleSheetsService.pushFullData(accessToken, spreadsheetId, data);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      this.setLastSyncTime(timeStr);
      return true;
    } catch (e: any) {
      console.error('Push to Google Sheets error:', e);
      throw new Error(`Google Sheets write failed: ${e.message || 'Network/Permission error'}`);
    }
  }
}
