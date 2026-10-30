import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Party,
  JobCard,
  Payment,
  Demand,
  SystemSettings,
  AuditLog,
  DriveDocument,
  PartyFinancialSummary,
  BulkUploadRow,
} from '../types';
import { DatabaseService } from '../services/db';
import { GoogleSheetsService } from '../services/sheetsApi';
import { GoogleDriveService } from '../services/driveApi';
import { getAccessToken } from '../config/googleAuth';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface DataContextValue {
  parties: Party[];
  jobCards: JobCard[];
  payments: Payment[];
  demands: Demand[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
  documents: DriveDocument[];
  lastSyncedTime: string;
  isSyncing: boolean;
  refreshData: () => Promise<void>;

  // Party actions
  addParty: (partyData: Omit<Party, 'partyId' | 'createdDate' | 'createdBy'>, allowDuplicate?: boolean) => Promise<Party>;
  editParty: (partyId: string, updates: Partial<Party>) => Promise<Party>;
  togglePartyStatus: (partyId: string, newStatus: Party['status']) => Promise<void>;
  getPartySummary: (partyId: string) => PartyFinancialSummary;

  // Job Card actions
  addJobCard: (cardData: Omit<JobCard, 'transactionId' | 'createdDate' | 'createdBy' | 'billAmount'>) => Promise<JobCard>;
  editJobCard: (transactionId: string, updates: Partial<JobCard>) => Promise<JobCard>;
  bulkImportJobCards: (rows: BulkUploadRow[], serviceType: 'New Job Card' | 'Member Add') => Promise<{ importedCount: number }>;
  getCardFinancials: (card: JobCard) => { billAmount: number; paid: number; outstanding: number };

  // Payment actions
  recordPayment: (paymentData: {
    partyId: string;
    transactionId?: string;
    amount: number;
    paymentMode: Payment['paymentMode'];
    referenceNumber: string;
    remarks: string;
    paymentDate: string;
  }) => Promise<Payment>;

  // Demand actions (Requirements #15 & #16)
  addDemand: (demandData: Omit<Demand, 'demandId' | 'createdDate' | 'createdBy'>) => Promise<Demand>;

  // Price actions (Requirements #20 - #23)
  updatePrice: (category: 'New Job Card' | 'Add Member' | 'Work Demand' | 'PMAY-G', newPrice: number) => Promise<void>;

  // User credentials management (Requirements #25 & #26)
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  changeUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;

  // Backup & Restore (Requirement #27)
  restoreBackup: (jsonContent: string) => Promise<{ success: boolean; error?: string }>;

  // Settings
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;

  // Documents
  uploadDocument: (file: File, relatedJobCardNo?: string, relatedPartyId?: string) => Promise<DriveDocument>;

  // Sheets DB Setup
  connectOrCreateGoogleSpreadsheet: () => Promise<{ success: boolean; spreadsheetId?: string; error?: string }>;

  // Form Editing Flag
  isEditingForm: boolean;
  setIsEditingForm: (editing: boolean) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [parties, setParties] = useState<Party[]>(() => DatabaseService.getParties());
  const [jobCards, setJobCards] = useState<JobCard[]>(() => DatabaseService.getJobCards());
  const [payments, setPayments] = useState<Payment[]>(() => DatabaseService.getPayments());
  const [demands, setDemands] = useState<Demand[]>(() => DatabaseService.getDemands());
  const [settings, setSettings] = useState<SystemSettings>(() => DatabaseService.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DatabaseService.getAuditLogs());
  const [documents, setDocuments] = useState<DriveDocument[]>(() => DatabaseService.getDocuments());

  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => DatabaseService.getLastSyncTime());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const syncLockRef = useRef<boolean>(false);

  // Load fresh local state
  const reloadFromLocal = useCallback(() => {
    setParties(DatabaseService.getParties());
    setJobCards(DatabaseService.getJobCards());
    setPayments(DatabaseService.getPayments());
    setDemands(DatabaseService.getDemands());
    setSettings(DatabaseService.getSettings());
    setAuditLogs(DatabaseService.getAuditLogs());
    setDocuments(DatabaseService.getDocuments());
    setLastSyncedTime(DatabaseService.getLastSyncTime());
  }, []);

  const [isEditingForm, setIsEditingForm] = useState<boolean>(false);
  const isEditingFormRef = useRef<boolean>(false);
  isEditingFormRef.current = isEditingForm;

  /**
   * Sync from Google Sheets if OAuth access token and spreadsheet ID are present (Requirement #28: Read/Sync only)
   */
  const syncWithGoogleSheets = useCallback(async (showNotification = false) => {
    if (syncLockRef.current) return;
    if (isEditingFormRef.current) return; // Do not refresh while user is editing form

    const token = await getAccessToken();
    const spreadsheetId = DatabaseService.getSpreadsheetId() || settings.spreadsheetId;

    if (!token || !spreadsheetId) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLastSyncedTime(timeStr);
      DatabaseService.setLastSyncTime(timeStr);
      return;
    }

    try {
      syncLockRef.current = true;
      setIsSyncing(true);

      const success = await DatabaseService.pullFromSheets(token, spreadsheetId);
      if (success) {
        reloadFromLocal();
        if (showNotification) {
          showToast('Google Sheets synchronized successfully', 'success');
        }
      }
    } catch (e: any) {
      console.warn('Sync cycle notice:', e);
      if (showNotification) {
        showToast(`Google Sheets sync notice: ${e.message}`, 'warning');
      }
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  }, [settings.spreadsheetId, reloadFromLocal, showToast]);

  /**
   * Automatic background fetch every 10 seconds while the application is active (Requirement #28: Read only)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      syncWithGoogleSheets(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [syncWithGoogleSheets]);

  /**
   * Manual refresh handler
   */
  const refreshData = async () => {
    await syncWithGoogleSheets(true);
    showToast('Data refreshed', 'info');
  };

  /**
   * Helper to push immediately after write operations
   */
  const pushImmediatelyToSheets = async () => {
    const token = await getAccessToken();
    const spreadsheetId = DatabaseService.getSpreadsheetId() || settings.spreadsheetId;
    if (token && spreadsheetId) {
      try {
        await DatabaseService.pushToSheets(token, spreadsheetId);
      } catch (err: any) {
        console.error('Instant push to sheets error:', err);
        showToast(`Google Sheets sync notice: ${err.message || 'Write failed'}`, 'warning');
      }
    }
  };

  /**
   * Calculate financial metrics for a specific JobCard (FIFO allocation of general payments)
   */
  const getCardFinancials = useCallback(
    (card: JobCard) => {
      const directPaid = payments
        .filter((p) => p.transactionId === card.transactionId)
        .reduce((sum, p) => sum + p.amount, 0);

      const directRemaining = Math.max(0, card.billAmount - directPaid);

      const generalPaymentsTotal = payments
        .filter((p) => p.partyId === card.partyId && !p.transactionId)
        .reduce((sum, p) => sum + p.amount, 0);

      if (generalPaymentsTotal <= 0) {
        return {
          billAmount: card.billAmount,
          paid: directPaid,
          outstanding: directRemaining,
        };
      }

      // Chronological FIFO allocation across cards of this party
      const partyCardsSorted = [...jobCards]
        .filter((c) => c.partyId === card.partyId)
        .sort((a, b) => (a.cardCreatedDate || a.dateReceived).localeCompare(b.cardCreatedDate || b.dateReceived));

      let unallocated = generalPaymentsTotal;
      let generalAllocatedToThisCard = 0;

      for (const c of partyCardsSorted) {
        const cDirect = payments
          .filter((p) => p.transactionId === c.transactionId)
          .reduce((sum, p) => sum + p.amount, 0);
        const cNeed = Math.max(0, c.billAmount - cDirect);

        const allocate = Math.min(unallocated, cNeed);
        unallocated -= allocate;

        if (c.transactionId === card.transactionId) {
          generalAllocatedToThisCard = allocate;
          break;
        }
      }

      const totalPaidOnCard = directPaid + generalAllocatedToThisCard;
      const outstanding = Math.max(0, card.billAmount - totalPaidOnCard);

      return {
        billAmount: card.billAmount,
        paid: totalPaidOnCard,
        outstanding,
      };
    },
    [payments, jobCards]
  );

  /**
   * Calculate financial summary for a Party
   */
  const getPartySummary = useCallback(
    (partyId: string): PartyFinancialSummary => {
      const party = parties.find((p) => p.partyId === partyId);
      const partyName = party ? party.partyName : partyId;
      const partyCards = jobCards.filter((c) => c.partyId === partyId);
      const partyPayments = payments.filter((p) => p.partyId === partyId);

      const totalCards = partyCards.length;
      const newJobCardsCount = partyCards.filter((c) => c.serviceType === 'New Job Card').length;
      const memberAddCount = partyCards.filter((c) => c.serviceType === 'Member Add').length;

      const totalBusiness = partyCards.reduce((sum, c) => sum + c.billAmount, 0);
      const totalPaid = partyPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, totalBusiness - totalPaid);

      return {
        partyId,
        partyName,
        totalCards,
        newJobCardsCount,
        memberAddCount,
        totalBusiness,
        totalPaid,
        outstanding,
      };
    },
    [parties, jobCards, payments]
  );

  // Party Actions
  const addParty = async (
    partyData: Omit<Party, 'partyId' | 'createdDate' | 'createdBy'>,
    allowDuplicate = false
  ): Promise<Party> => {
    const existing = DatabaseService.getParties();

    // Duplicate check on exact Party Name + Phone Number (Requirement #17)
    if (!allowDuplicate) {
      const duplicate = existing.find(
        (p) =>
          p.partyName.trim().toLowerCase() === partyData.partyName.trim().toLowerCase() &&
          p.mobile.trim() === partyData.mobile.trim()
      );
      if (duplicate) {
        throw new Error(
          `A party named "${partyData.partyName}" with phone number "${partyData.mobile}" already exists.`
        );
      }
    }

    const nextNum = (existing.length + 1).toString().padStart(3, '0');
    const partyId = `PTY-${nextNum}`;

    const newParty: Party = {
      ...partyData,
      partyId,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'Administrator',
    };

    const updated = [newParty, ...existing];
    DatabaseService.setParties(updated);
    setParties(updated);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Party Creation',
      'Parties',
      partyId,
      `Added new party ${newParty.partyName} (Phone: ${newParty.mobile})`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Party "${newParty.partyName}" created successfully (${partyId})`, 'success');
    return newParty;
  };

  const editParty = async (partyId: string, updates: Partial<Party>): Promise<Party> => {
    const existing = DatabaseService.getParties();
    const idx = existing.findIndex((p) => p.partyId === partyId);
    if (idx === -1) throw new Error('Party not found');

    const updatedParty = {
      ...existing[idx],
      ...updates,
      modifiedDate: new Date().toISOString().split('T')[0],
    };
    existing[idx] = updatedParty;

    DatabaseService.setParties([...existing]);
    setParties([...existing]);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Party Edit',
      'Parties',
      partyId,
      `Updated details for party ${updatedParty.partyName}`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Party "${updatedParty.partyName}" updated`, 'success');
    return updatedParty;
  };

  const togglePartyStatus = async (partyId: string, newStatus: Party['status']) => {
    const existing = DatabaseService.getParties();
    const idx = existing.findIndex((p) => p.partyId === partyId);
    if (idx === -1) return;

    existing[idx].status = newStatus;
    existing[idx].modifiedDate = new Date().toISOString().split('T')[0];
    DatabaseService.setParties([...existing]);
    setParties([...existing]);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      `Party Status Change (${newStatus})`,
      'Parties',
      partyId,
      `Changed party ${existing[idx].partyName} status to ${newStatus}`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Party status changed to ${newStatus}`, 'info');
  };

  // Job Card Actions
  const addJobCard = async (
    cardData: Omit<JobCard, 'transactionId' | 'createdDate' | 'createdBy' | 'billAmount'>
  ): Promise<JobCard> => {
    const existing = DatabaseService.getJobCards();
    const dup = existing.find((c) => c.jobCardNo.toLowerCase() === cardData.jobCardNo.trim().toLowerCase());
    if (dup) {
      throw new Error(`Job Card Number "${cardData.jobCardNo}" already exists in the system.`);
    }

    // Auto price calculation: New Job Card = newJobCardPrice, Member Add = memberAddPrice (Requirements #7 & #9)
    const billAmount =
      cardData.serviceType === 'New Job Card' ? settings.newJobCardPrice : settings.memberAddPrice;

    const party = parties.find((p) => p.partyId === cardData.partyId);
    const partyName = party ? party.partyName : cardData.partyName || '';

    const txnId = `TXN-${new Date().getFullYear()}-${(existing.length + 1).toString().padStart(4, '0')}`;
    const now = new Date();
    const timeFormatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const newCard: JobCard = {
      ...cardData,
      transactionId: txnId,
      partyName,
      billAmount,
      createdBy: currentUser?.name || 'Administrator',
      createdDate: timeFormatted,
    };

    const updated = [newCard, ...existing];
    DatabaseService.setJobCards(updated);
    setJobCards(updated);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Job Card Entry',
      'JobCards',
      txnId,
      `Created ${newCard.serviceType} ${newCard.jobCardNo} for ${newCard.applicantName} (Bill: ₹${billAmount})`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`${newCard.serviceType} ${newCard.jobCardNo} registered successfully (₹${billAmount})`, 'success');
    return newCard;
  };

  const editJobCard = async (transactionId: string, updates: Partial<JobCard>): Promise<JobCard> => {
    const existing = DatabaseService.getJobCards();
    const idx = existing.findIndex((c) => c.transactionId === transactionId);
    if (idx === -1) throw new Error('Job Card record not found');

    const original = existing[idx];
    const now = new Date();
    const timeFormatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const updatedCard: JobCard = {
      ...original,
      ...updates,
      // Historical price immutability
      billAmount: original.billAmount,
      modifiedBy: currentUser?.name || 'Admin',
      modifiedDate: timeFormatted,
    };

    existing[idx] = updatedCard;
    DatabaseService.setJobCards([...existing]);
    setJobCards([...existing]);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Job Card Edit',
      'JobCards',
      transactionId,
      `Modified Job Card ${updatedCard.jobCardNo} (${updatedCard.applicantName})`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Job Card ${updatedCard.jobCardNo} updated`, 'success');
    return updatedCard;
  };

  const bulkImportJobCards = async (
    rows: BulkUploadRow[],
    serviceType: 'New Job Card' | 'Member Add'
  ): Promise<{ importedCount: number }> => {
    const existing = DatabaseService.getJobCards();
    const validRows = rows.filter((r) => r.isValid);

    if (validRows.length === 0) {
      throw new Error('No valid records to import.');
    }

    const unitPrice =
      serviceType === 'New Job Card' ? settings.newJobCardPrice : settings.memberAddPrice;

    const newCards: JobCard[] = [];
    const now = new Date();
    const year = now.getFullYear();

    validRows.forEach((r, idx) => {
      const txnId = `TXN-${year}-${(existing.length + idx + 1).toString().padStart(4, '0')}`;
      const party = parties.find((p) => p.partyId === r.party || p.partyName.toLowerCase() === r.party.toLowerCase());

      newCards.push({
        transactionId: txnId,
        jobCardNo: r.jobCardNo,
        applicantName: r.applicantName,
        aadhaarNo: r.aadhaarNo,
        aadhaarStatus: (r.aadhaarStatus as any) || 'Fetched',
        serviceType: serviceType,
        partyId: party?.partyId || r.party,
        partyName: party?.partyName || '',
        dateReceived: r.dateReceived,
        cardCreatedDate: r.cardCreatedDate,
        billAmount: unitPrice,
        status: (r.status as any) || 'Pending',
        remarks: r.remarks,
        createdBy: currentUser?.name || 'Bulk Import Engine',
        createdDate: `${r.cardCreatedDate} 10:00:00`,
      });
    });

    const combined = [...newCards, ...existing];
    DatabaseService.setJobCards(combined);
    setJobCards(combined);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Bulk Import',
      'BulkUpload',
      `BATCH-${Date.now().toString().slice(-4)}`,
      `Imported ${newCards.length} ${serviceType} records via CSV upload`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Bulk upload completed: ${newCards.length} ${serviceType} records imported!`, 'success');
    return { importedCount: newCards.length };
  };

  // Payment Actions
  const recordPayment = async (paymentData: {
    partyId: string;
    transactionId?: string;
    amount: number;
    paymentMode: Payment['paymentMode'];
    referenceNumber: string;
    remarks: string;
    paymentDate: string;
  }): Promise<Payment> => {
    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const existingPayments = DatabaseService.getPayments();
    const paymentId = `PAY-${(existingPayments.length + 1001).toString()}`;
    const now = new Date();
    const timeFormatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const party = parties.find((p) => p.partyId === paymentData.partyId);
    let cardNo = '';
    if (paymentData.transactionId) {
      const card = jobCards.find((c) => c.transactionId === paymentData.transactionId);
      if (card) cardNo = card.jobCardNo;
    }

    const newPayment: Payment = {
      paymentId,
      transactionId: paymentData.transactionId || undefined,
      partyId: paymentData.partyId,
      partyName: party?.partyName || '',
      jobCardNo: cardNo || undefined,
      amount: paymentData.amount,
      paymentMode: paymentData.paymentMode,
      referenceNumber: paymentData.referenceNumber,
      remarks: paymentData.remarks,
      paymentDate: paymentData.paymentDate || now.toISOString().split('T')[0],
      enteredBy: currentUser?.name || 'Administrator',
      createdDate: timeFormatted,
    };

    const updated = [newPayment, ...existingPayments];
    DatabaseService.setPayments(updated);
    setPayments(updated);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Payment Entry',
      'Payments',
      paymentId,
      `Recorded ₹${newPayment.amount} via ${newPayment.paymentMode} for Party ${party?.partyName || newPayment.partyId} (Ref: ${newPayment.referenceNumber || 'N/A'})`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Payment of ₹${newPayment.amount.toLocaleString('en-IN')} recorded successfully`, 'success');
    return newPayment;
  };

  // Demand Actions (Requirements #15 & #16)
  const addDemand = async (
    demandData: Omit<Demand, 'demandId' | 'createdDate' | 'createdBy'>
  ): Promise<Demand> => {
    if (demandData.amount <= 0) {
      throw new Error('Demand amount must be greater than zero.');
    }

    const existingDemands = DatabaseService.getDemands();
    const demandId = `DMD-${(existingDemands.length + 1001).toString()}`;
    const now = new Date();
    const timeFormatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const party = parties.find((p) => p.partyId === demandData.partyId);
    const partyName = party ? party.partyName : demandData.partyName;

    const newDemand: Demand = {
      ...demandData,
      demandId,
      partyName,
      createdBy: currentUser?.name || 'Administrator',
      createdDate: timeFormatted,
    };

    const updated = [newDemand, ...existingDemands];
    DatabaseService.setDemands(updated);
    setDemands(updated);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      `${newDemand.demandType} Entry`,
      'Demands',
      demandId,
      `Recorded ₹${newDemand.amount} ${newDemand.demandType} for ${partyName}`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`${newDemand.demandType} of ₹${newDemand.amount.toLocaleString('en-IN')} saved successfully`, 'success');
    return newDemand;
  };

  // Price Actions (Requirements #20 - #23)
  // Historical price immutability: changing current price NEVER alters previous transactions!
  const updatePrice = async (
    category: 'New Job Card' | 'Add Member' | 'Work Demand' | 'PMAY-G',
    newPrice: number
  ) => {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative.');
    }

    const current = DatabaseService.getSettings();
    let updates: Partial<SystemSettings> = {};

    if (category === 'New Job Card') updates = { newJobCardPrice: newPrice };
    else if (category === 'Add Member') updates = { memberAddPrice: newPrice };
    else if (category === 'Work Demand') updates = { workDemandPrice: newPrice };
    else if (category === 'PMAY-G') updates = { pmaygPrice: newPrice };

    const updatedSettings = { ...current, ...updates };
    DatabaseService.setSettings(updatedSettings);
    setSettings(updatedSettings);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Price Update',
      'Price',
      `PRICE-${category.replace(/\s+/g, '-').toUpperCase()}`,
      `Updated ${category} current standard rate to ₹${newPrice}. Existing transactions remain unchanged.`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`${category} price updated to ₹${newPrice.toLocaleString('en-IN')}`, 'success');
  };

  // User credentials management (Requirements #25 & #26)
  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    const users = DatabaseService.getUsers();
    const adminUser = users.find((u) => u.username === (currentUser?.username || 'admin')) || users[0];

    const currentActualPass = adminUser?.password || 'admin123';
    if (currentPass !== currentActualPass) {
      return { success: false, error: 'Current password does not match.' };
    }

    adminUser.password = newPass.trim();
    adminUser.passwordHash = newPass.trim();
    adminUser.modifiedDate = new Date().toISOString().split('T')[0];

    DatabaseService.setUsers([...users]);
    DatabaseService.logAudit(currentUser?.name || 'Admin', 'Change Password', 'Auth', adminUser.userId, 'Admin password was updated');
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast('Password changed successfully. Please remember your new password.', 'success');
    return { success: true };
  };

  const changeUsername = async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
    const clean = newUsername.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      return { success: false, error: 'New username must be at least 3 characters long.' };
    }

    const users = DatabaseService.getUsers();
    const adminUser = users.find((u) => u.username === (currentUser?.username || 'admin')) || users[0];

    const oldUsername = adminUser.username;
    adminUser.username = clean;
    adminUser.name = clean.toUpperCase();
    adminUser.modifiedDate = new Date().toISOString().split('T')[0];

    DatabaseService.setUsers([...users]);
    DatabaseService.logAudit(currentUser?.name || 'Admin', 'Change Username', 'Auth', adminUser.userId, `Username changed from ${oldUsername} to ${clean}`);
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast(`Username updated to "${clean}". Use this for your next login.`, 'success');
    return { success: true };
  };

  // Backup & Restore (Requirement #27)
  const restoreBackup = async (jsonContent: string): Promise<{ success: boolean; error?: string }> => {
    const res = DatabaseService.restoreBackup(jsonContent);
    if (res.success) {
      reloadFromLocal();
      await pushImmediatelyToSheets();
      showToast('System database restored successfully!', 'success');
    }
    return res;
  };

  // Settings Action
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const current = DatabaseService.getSettings();
    const updated = { ...current, ...newSettings };
    DatabaseService.setSettings(updated);
    setSettings(updated);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Settings Update',
      'Settings',
      'SET-GLOBAL',
      `Updated portal settings`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    await pushImmediatelyToSheets();
    showToast('Settings saved successfully', 'success');
  };

  // Documents
  const uploadDocument = async (
    file: File,
    relatedJobCardNo?: string,
    relatedPartyId?: string
  ): Promise<DriveDocument> => {
    const token = await getAccessToken();
    let driveDoc: DriveDocument;

    if (token) {
      try {
        const folders = await GoogleDriveService.setupAppFolders(token);
        const targetFolder = folders.subfolders['Job Cards'] || folders.rootId;
        driveDoc = await GoogleDriveService.uploadFile(
          token,
          file,
          targetFolder,
          `Related Card: ${relatedJobCardNo || 'N/A'}, Party: ${relatedPartyId || 'N/A'}`
        );
      } catch (e) {
        console.warn('Direct drive upload failed, falling back to local file reference:', e);
        driveDoc = {
          id: `DOC-${Date.now().toString().slice(-4)}`,
          name: file.name,
          type: file.type || 'Document',
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: currentUser?.name || 'User',
          driveLink: 'https://drive.google.com/drive/my-drive',
          fileSize: `${Math.round(file.size / 1024)} KB`,
        };
      }
    } else {
      driveDoc = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        name: file.name,
        type: file.type || 'Document',
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser?.name || 'User',
        driveLink: 'https://drive.google.com/drive/my-drive',
        fileSize: `${Math.round(file.size / 1024)} KB`,
      };
    }

    driveDoc.relatedJobCardNo = relatedJobCardNo;
    driveDoc.relatedPartyId = relatedPartyId;

    const existingDocs = DatabaseService.getDocuments();
    const updatedDocs = [driveDoc, ...existingDocs];
    DatabaseService.setDocuments(updatedDocs);
    setDocuments(updatedDocs);

    DatabaseService.logAudit(
      currentUser?.name || 'Admin',
      'Document Upload',
      'Documents',
      driveDoc.id,
      `Uploaded file "${file.name}" linked to ${relatedJobCardNo || relatedPartyId || 'General'}`
    );
    setAuditLogs(DatabaseService.getAuditLogs());

    showToast(`Document "${file.name}" attached successfully`, 'success');
    return driveDoc;
  };

  /**
   * Connect or Create the Google Sheets Database JOB_CARD_SYSTEM_DB
   */
  const connectOrCreateGoogleSpreadsheet = async (): Promise<{
    success: boolean;
    spreadsheetId?: string;
    error?: string;
  }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Google Account is not connected. Please sign in with Google first.' };
    }

    try {
      setIsSyncing(true);
      let sheetId = await GoogleSheetsService.findExistingSpreadsheet(token, 'JOB_CARD_SYSTEM_DB');
      if (!sheetId) {
        sheetId = await GoogleSheetsService.createSpreadsheet(token, 'JOB_CARD_SYSTEM_DB');
        const allData = DatabaseService.getAllData();
        await GoogleSheetsService.initializeSheetData(token, sheetId, allData);
      } else {
        await DatabaseService.pullFromSheets(token, sheetId);
        reloadFromLocal();
      }

      DatabaseService.setSpreadsheetId(sheetId);
      await updateSettings({ spreadsheetId: sheetId });

      showToast(`Google Sheets connected: JOB_CARD_SYSTEM_DB (${sheetId.slice(0, 10)}...)`, 'success');
      return { success: true, spreadsheetId: sheetId };
    } catch (e: any) {
      console.error('Setup spreadsheet error:', e);
      return { success: false, error: e.message || 'Failed to bind spreadsheet' };
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        parties,
        jobCards,
        payments,
        demands,
        settings,
        auditLogs,
        documents,
        lastSyncedTime,
        isSyncing,
        refreshData,
        addParty,
        editParty,
        togglePartyStatus,
        getPartySummary,
        addJobCard,
        editJobCard,
        bulkImportJobCards,
        getCardFinancials,
        recordPayment,
        addDemand,
        updatePrice,
        changePassword,
        changeUsername,
        restoreBackup,
        updateSettings,
        uploadDocument,
        connectOrCreateGoogleSpreadsheet,
        isEditingForm,
        setIsEditingForm,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
