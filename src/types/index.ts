export type ServiceType = 'New Job Card' | 'Member Add';

export type AadhaarStatus =
  | 'Fetched'
  | 'Registered Elsewhere'
  | 'Not Available'
  | 'Pending Verification';

export type JobCardStatus =
  | 'Pending'
  | 'In Process'
  | 'Completed'
  | 'Rejected'
  | 'Dispatched';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Outstanding';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

export type PartyStatus = 'Active' | 'Inactive' | 'Archived';

export type UserRole = 'Admin' | 'Operator' | 'Viewer';

export interface User {
  userId: string;
  name: string;
  username: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdDate: string;
  modifiedDate?: string;
}

export interface Party {
  partyId: string;
  partyName: string;
  mobile: string;
  address: string;
  remarks: string;
  status: PartyStatus;
  createdDate: string;
  createdBy?: string;
  modifiedDate?: string;
}

export interface JobCard {
  transactionId: string;
  jobCardNo: string;
  applicantName: string;
  aadhaarNo: string;
  aadhaarStatus: AadhaarStatus;
  serviceType: ServiceType;
  partyId: string;
  partyName?: string;
  dateReceived: string; // YYYY-MM-DD
  cardCreatedDate: string; // YYYY-MM-DD
  billAmount: number; // Historical fixed amount
  status: JobCardStatus;
  remarks: string;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
  documentIds?: string[];
}

export interface Payment {
  paymentId: string;
  transactionId?: string;
  partyId: string;
  partyName?: string;
  jobCardNo?: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber: string;
  remarks: string;
  enteredBy: string;
  createdDate: string;
}

export type DemandType = 'Work Demand' | 'PMAY-G Demand';

export interface Demand {
  demandId: string;
  demandType: DemandType;
  partyId: string;
  partyName: string;
  demandDate: string;
  amount: number;
  remarks: string;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface SettingItem {
  settingName: string;
  settingValue: string;
}

export interface SystemSettings {
  newJobCardPrice: number;
  memberAddPrice: number;
  workDemandPrice: number;
  pmaygPrice: number;
  applicationName: string;
  organizationName: string;
  organizationAddress: string;
  organizationContact: string;
  inactivityTimeoutMinutes: number;
  currencySymbol: string;
  statusOptions: string[];
  aadhaarStatusOptions: string[];
  paymentModes: string[];
  spreadsheetId?: string;
  spreadsheetName?: string;
  driveFolderId?: string;
}

export interface AuditLog {
  logId: string;
  user: string;
  action: string;
  module:
    | 'Auth'
    | 'Parties'
    | 'JobCards'
    | 'Payments'
    | 'Demands'
    | 'Price'
    | 'BulkUpload'
    | 'Settings'
    | 'Documents';
  recordId: string;
  dateTime: string;
  description: string;
}

export interface DriveDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  driveLink: string;
  fileSize?: string;
  relatedJobCardNo?: string;
  relatedPartyId?: string;
}

export interface BulkUploadRow {
  rowNumber: number;
  jobCardNo: string;
  applicantName: string;
  aadhaarNo: string;
  serviceType: string;
  aadhaarStatus: string;
  dateReceived: string;
  cardCreatedDate: string;
  party: string;
  status: string;
  remarks: string;
  isValid: boolean;
  errors: string[];
  calculatedAmount?: number;
}

export interface ValidationErrorDetail {
  rowNumber: number;
  field: string;
  error: string;
  suggestedFix: string;
}

export interface PartyFinancialSummary {
  partyId: string;
  partyName: string;
  totalCards: number;
  newJobCardsCount: number;
  memberAddCount: number;
  totalBusiness: number;
  totalPaid: number;
  outstanding: number;
}
