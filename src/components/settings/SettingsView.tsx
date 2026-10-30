import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  ShieldAlert,
  Database,
  CloudCheck,
  Building,
  RotateCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, connectOrCreateGoogleSpreadsheet, isSyncing } = useData();
  const { currentUser, isGoogleConnected } = useAuth();
  const { showToast } = useToast();

  const [newJobCardPrice, setNewJobCardPrice] = useState(settings.newJobCardPrice);
  const [memberAddPrice, setMemberAddPrice] = useState(settings.memberAddPrice);
  const [applicationName, setApplicationName] = useState(settings.applicationName);
  const [organizationName, setOrganizationName] = useState(settings.organizationName);
  const [organizationAddress, setOrganizationAddress] = useState(settings.organizationAddress);
  const [organizationContact, setOrganizationContact] = useState(settings.organizationContact);
  const [inactivityMinutes, setInactivityMinutes] = useState(settings.inactivityTimeoutMinutes);

  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingSheets, setIsConnectingSheets] = useState(false);

  // Admin access check (Requirement #35: Admin-only)
  const isAdmin = currentUser?.role === 'Admin';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Only administrators have permission to update system settings.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        newJobCardPrice: Number(newJobCardPrice),
        memberAddPrice: Number(memberAddPrice),
        applicationName: applicationName.trim(),
        organizationName: organizationName.trim(),
        organizationAddress: organizationAddress.trim(),
        organizationContact: organizationContact.trim(),
        inactivityTimeoutMinutes: Number(inactivityMinutes) || 30,
      });
      showToast('System settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetupGoogleSpreadsheet = async () => {
    setIsConnectingSheets(true);
    try {
      await connectOrCreateGoogleSpreadsheet();
    } catch (err: any) {
      showToast(err.message || 'Google Sheets setup failed', 'error');
    } finally {
      setIsConnectingSheets(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
            System Configuration &amp; Service Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Admin master control for service pricing, session security, and Google Workspace integration
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Read-Only (Requires Admin Role)
            </span>
          )}
        </div>
      </div>

      {/* Google Sheets Database Synchronization Section (Requirement #26) */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Google Sheets Structured Database
              </div>
              <div className="text-base font-bold text-white">JOB_CARD_SYSTEM_DB</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target sheets: Users, Parties, JobCards, Payments, Settings, AuditLog
              </p>
            </div>
          </div>

          <button
            onClick={handleSetupGoogleSpreadsheet}
            disabled={isConnectingSheets || isSyncing}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isConnectingSheets ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudCheck className="w-4 h-4" />
            )}
            <span>Connect / Bind JOB_CARD_SYSTEM_DB</span>
          </button>
        </div>

        {settings.spreadsheetId && (
          <div className="mt-2 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Spreadsheet ID: {settings.spreadsheetId}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Service Type Pricing Card (Requirement #17 & #35) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Standard Service Type Pricing
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated billing amounts calculated when registering new job card entries
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Job Card Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  disabled={!isAdmin}
                  value={newJobCardPrice}
                  onChange={(e) => setNewJobCardPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-base font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Default standard rate: ₹1,000</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Member Add Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  disabled={!isAdmin}
                  value={memberAddPrice}
                  onChange={(e) => setMemberAddPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-base font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Default standard rate: ₹500</span>
            </div>
          </div>

          {/* Mandatory Historical Price Safety Warning (Requirement #17 & #35) */}
          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Historical Transaction Protection Active: </strong>
              Changing service rates here will only apply to future work entries. Existing job card
              transactions retain their original billed amount permanently without automatic
              recalculation.
            </div>
          </div>
        </div>

        {/* Organization & Portal Branding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Organization &amp; Portal Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Appears on generated PDF statements, printed ledgers, and official documents
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Application Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organization / CSC Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Address (Printed on Statements)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={organizationAddress}
                onChange={(e) => setOrganizationAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone / Email</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={organizationContact}
                onChange={(e) => setOrganizationContact(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Security & Inactivity Timeout Configuration (Requirement #3) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Session Security Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Regulate inactivity automatic session termination to comply with commercial standards
            </p>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Inactivity Timeout (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              disabled={!isAdmin}
              value={inactivityMinutes}
              onChange={(e) => setInactivityMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg disabled:bg-slate-100 font-semibold"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Default: 30 minutes (shows warning 2 minutes prior to logout)
            </span>
          </div>
        </div>

        {/* Submit */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <RotateCw className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
