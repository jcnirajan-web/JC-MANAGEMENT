import { Party, JobCard, Payment, Demand, User, SystemSettings, AuditLog, DriveDocument } from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  newJobCardPrice: 1000,
  memberAddPrice: 500,
  workDemandPrice: 500,
  pmaygPrice: 500,
  applicationName: 'JOB CARD MANAGEMENT SYSTEM',
  organizationName: 'Digital Seva & CSC Kendra',
  organizationAddress: 'Main Market Road, Commercial Complex',
  organizationContact: '+91 98765 43210',
  inactivityTimeoutMinutes: 30,
  currencySymbol: '₹',
  statusOptions: ['Pending', 'In Process', 'Completed', 'Rejected', 'Dispatched'],
  aadhaarStatusOptions: ['Fetched', 'Registered Elsewhere', 'Not Available', 'Pending Verification'],
  paymentModes: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
  spreadsheetName: 'JOB_CARD_SYSTEM_DB',
};

// Initial system admin account
export const INITIAL_USERS: User[] = [
  {
    userId: 'USR-001',
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    status: 'Active',
    createdDate: '2026-01-01',
  },
];

// Requirement #2: ZERO DEMO / FAKE DATA
// The application starts with a completely EMPTY business database.
export const INITIAL_PARTIES: Party[] = [];
export const INITIAL_JOB_CARDS: JobCard[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_DEMANDS: Demand[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_DOCUMENTS: DriveDocument[] = [];
