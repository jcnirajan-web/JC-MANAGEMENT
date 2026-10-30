import React, { useState, useRef } from 'react';
import {
  CreditCard,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCw,
  Plus,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { BulkUploadValidator } from '../../services/bulkValidator';
import { AadhaarStatus, JobCardStatus, BulkUploadRow, ValidationErrorDetail } from '../../types';

export const NewJobCardView: React.FC = () => {
  const { parties, jobCards, settings, addJobCard, bulkImportJobCards, setIsEditingForm } = useData();
  const { navigate } = useNavigation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'form' | 'bulk'>('form');

  // Form State
  const [jobCardNo, setJobCardNo] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarStatus>('Fetched');
  const [partyId, setPartyId] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [cardCreatedDate, setCardCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobCardStatus>('Pending');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validatedRows, setValidatedRows] = useState<BulkUploadRow[]>([]);
  const [errorDetails, setErrorDetails] = useState<ValidationErrorDetail[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  const activeParties = parties.filter((p) => p.status === 'Active');

  const handleFormChange = () => {
    setIsEditingForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobCardNo.trim()) {
      showToast('Please enter a valid Job Card Number.', 'warning');
      return;
    }
    if (!applicantName.trim()) {
      showToast('Please enter the Applicant Name.', 'warning');
      return;
    }
    const cleanAadhaar = aadhaarNo.replace(/\D/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      showToast('Aadhaar number must be exactly 12 digits.', 'warning');
      return;
    }
    if (!partyId) {
      showToast('Please select a Party.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await addJobCard({
        jobCardNo: jobCardNo.trim(),
        applicantName: applicantName.trim(),
        aadhaarNo: cleanAadhaar,
        aadhaarStatus,
        serviceType: 'New Job Card',
        partyId,
        dateReceived,
        cardCreatedDate,
        status,
        remarks: remarks.trim(),
      });

      setIsEditingForm(false);
      navigate('jobcards');
    } catch (err: any) {
      showToast(err.message || 'Failed to register Job Card.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Upload Handlers
  const handleDownloadTemplate = () => {
    const csvContent = BulkUploadValidator.generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'New_Job_Card_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Template downloaded', 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsValidated(false);
    setValidatedRows([]);
    setErrorDetails([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    if (!fileContent) return;

    const rawRows = BulkUploadValidator.parseCsv(fileContent);
    if (rawRows.length === 0) {
      showToast('The uploaded file is empty or missing headers.', 'warning');
      return;
    }

    const result = BulkUploadValidator.validateRows(rawRows, parties, jobCards, settings);
    setValidatedRows(result.validatedRows);
    setValidCount(result.validCount);
    setInvalidCount(result.invalidCount);
    setErrorDetails(result.errorDetails);
    setIsValidated(true);
  };

  const handleConfirmImport = async () => {
    if (validCount === 0) {
      showToast('Cannot import: There are no valid records in the upload.', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      await bulkImportJobCards(validatedRows, 'New Job Card');
      navigate('jobcards');
    } catch (err: any) {
      showToast(err.message || 'Import failed.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const displayedRows = validatedRows.filter((r) => {
    if (bulkFilter === 'valid') return r.isValid;
    if (bulkFilter === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            New Job Card
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register individual applicant Job Cards or upload records via CSV batch
          </p>
        </div>

        {/* Tab Toggle Buttons (Section 7) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>NEW JOB CARD FORM</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>BULK UPLOAD</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Single Form */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} onChange={handleFormChange} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Automatic Pricing Banner (Requirement #7) */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div>
              <span className="font-bold">Service Type: </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold uppercase text-[10px]">
                NEW JOB CARD
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span className="text-slate-500">Automated Bill Amount:</span>
              <span className="text-sm text-blue-700 bg-white px-2.5 py-0.5 rounded border border-blue-200">
                ₹{settings.newJobCardPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Job Card No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={jobCardNo}
                onChange={(e) => setJobCardNo(e.target.value)}
                placeholder="e.g. MH-04-001-002-00124"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Applicant Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Full applicant name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aadhaar No. (12 Digits)
              </label>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit numeric Aadhaar"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Masked automatically in statements</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aadhaar Status
              </label>
              <select
                value={aadhaarStatus}
                onChange={(e) => setAadhaarStatus(e.target.value as AadhaarStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Fetched">Fetched</option>
                <option value="Registered Elsewhere">Registered Elsewhere</option>
                <option value="Not Available">Not Available</option>
                <option value="Pending Verification">Pending Verification</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Party / Seva Kendra <span className="text-rose-500">*</span>
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              >
                <option value="">-- Select Party --</option>
                {activeParties.map((p) => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyId})
                  </option>
                ))}
              </select>
              {activeParties.length === 0 && (
                <span className="text-[11px] text-amber-600 mt-1 block">
                  No parties found. Go to Party &rarr; Add New Party first.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Card Created Date
              </label>
              <input
                type="date"
                value={cardCreatedDate}
                onChange={(e) => setCardCreatedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobCardStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Pending">Pending</option>
                <option value="In Process">In Process</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Dispatched">Dispatched</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or reference numbers"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsEditingForm(false);
                navigate('jobcards');
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <RotateCw className="w-4 h-4 animate-spin" />}
              <span>Save New Job Card</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Bulk Upload (Requirement #8) */}
      {activeTab === 'bulk' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bulk CSV Upload — New Job Cards
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Amount is not required in the CSV file; system automatically applies current New Job Card price (₹{settings.newJobCardPrice})
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">Click to select CSV file</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Supports UTF-8 CSV with standard headers</div>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {fileContent && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleValidate}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Validate Records
                </button>
              </div>
            )}
          </div>

          {/* Validation Results & Preview */}
          {isValidated && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validCount} Valid</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{invalidCount} Invalid</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmImport}
                    disabled={validCount === 0 || isImporting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isImporting && <RotateCw className="w-4 h-4 animate-spin" />}
                    <span>Confirm Import ({validCount})</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Job Card No.</th>
                      <th className="p-2.5">Applicant Name</th>
                      <th className="p-2.5">Party</th>
                      <th className="p-2.5">Aadhaar</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.slice(0, 50).map((r) => (
                      <tr key={r.rowNumber} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-2.5 font-bold text-slate-500">{r.rowNumber}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{r.jobCardNo}</td>
                        <td className="p-2.5 text-slate-700">{r.applicantName}</td>
                        <td className="p-2.5 text-slate-600">{r.party}</td>
                        <td className="p-2.5 font-mono text-slate-600">{r.aadhaarNo}</td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Valid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title={r.errors.join('; ')}>
                              {r.errors[0] || 'Error'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
