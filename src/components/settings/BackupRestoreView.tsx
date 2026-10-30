import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCw,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DatabaseService } from '../../services/db';
import { useToast } from '../../context/ToastContext';

export const BackupRestoreView: React.FC = () => {
  const { restoreBackup } = useData();
  const { showToast } = useToast();

  const [createdBackup, setCreatedBackup] = useState<string | null>(null);
  const [backupSize, setBackupSize] = useState<string>('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Create Backup
  const handleCreateBackup = () => {
    const json = DatabaseService.createBackupJson();
    setCreatedBackup(json);
    const bytes = new Blob([json]).size;
    setBackupSize(`${(bytes / 1024).toFixed(1)} KB`);
    showToast('Backup archive generated successfully', 'success');
  };

  // 2. Download Backup
  const handleDownloadBackup = () => {
    const json = createdBackup || DatabaseService.createBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `JCMS_Database_Backup_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup file downloaded', 'info');
  };

  // 3. File selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
    };
    reader.readAsText(file);
  };

  // 4. Execute Restore
  const handleExecuteRestore = async () => {
    if (!restoreFileContent) return;

    setIsRestoring(true);
    try {
      const res = await restoreBackup(restoreFileContent);
      if (res.success) {
        setShowConfirmModal(false);
        setRestoreFileContent(null);
        setRestoreFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(res.error || 'Restore failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Restore error', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-slate-700" />
            Backup &amp; Restore
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full export and restoration of all parties, job cards, payments, demands, settings and audit logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Create & Download Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Create Application Backup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export complete JSON bundle of all business entities
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800">Archive contains:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Parties Directory</li>
                <li>Job Cards &amp; Member Add Records</li>
                <li>Payments &amp; Collections</li>
                <li>Work Demand &amp; PMAY-G Records</li>
                <li>System Pricing &amp; Organization Settings</li>
                <li>Audit Logs</li>
              </ul>
            </div>

            {createdBackup && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Backup Ready ({backupSize})</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleCreateBackup}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Create Backup</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup</span>
            </button>
          </div>
        </div>

        {/* Card 2: Restore Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Restore Backup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import previously exported system JSON archive
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Automatic Pre-Restore Safety Snapshot</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Before any data is overwritten, the system automatically captures a safety snapshot of your current database state.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-700">Click to select backup .json file</div>
              {restoreFileName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{restoreFileName}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!restoreFileContent}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strong Confirmation Warning Modal (Requirement #27: Never silently overwrite) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">
                Confirm Database Restoration
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restoring this backup will replace current system records with the contents of <strong className="text-slate-800">{restoreFileName}</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong className="text-slate-800">Safety note: </strong>
              An automated snapshot of your current state will be preserved in emergency storage.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRestoring && <RotateCw className="w-4 h-4 animate-spin" />}
                <span>Yes, Overwrite &amp; Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
