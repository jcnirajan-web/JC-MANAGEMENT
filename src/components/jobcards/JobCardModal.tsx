import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  User,
  Shield,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { JobCard, ServiceType, AadhaarStatus, JobCardStatus } from '../../types';

interface JobCardModalProps {
  isPage?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  editCard?: JobCard | null;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({
  isPage = false,
  isOpen = true,
  onClose,
  editCard,
}) => {
  const { parties, settings, addJobCard, editJobCard } = useData();
  const { params, navigate, goBack } = useNavigation();

  // Form Fields
  const [jobCardNo, setJobCardNo] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('New Job Card');
  const [partyId, setPartyId] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarStatus>('Fetched');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [cardCreatedDate, setCardCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobCardStatus>('Pending');
  const [remarks, setRemarks] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Initialize from props or route params
  useEffect(() => {
    if (editCard) {
      setJobCardNo(editCard.jobCardNo);
      setApplicantName(editCard.applicantName);
      setAadhaarNo(editCard.aadhaarNo);
      setServiceType(editCard.serviceType);
      setPartyId(editCard.partyId);
      setAadhaarStatus(editCard.aadhaarStatus);
      setDateReceived(editCard.dateReceived);
      setCardCreatedDate(editCard.cardCreatedDate);
      setStatus(editCard.status);
      setRemarks(editCard.remarks);
    } else {
      if (params.initialPartyId) setPartyId(params.initialPartyId);
      else if (parties.length > 0 && !partyId) setPartyId(parties[0].partyId);

      if (params.serviceType === 'Member Add') setServiceType('Member Add');
      else if (params.serviceType === 'New Job Card') setServiceType('New Job Card');
    }
  }, [editCard, params, parties]);

  // Automated pricing rule (Requirement #17)
  const currentPrice =
    serviceType === 'New Job Card' ? settings.newJobCardPrice : settings.memberAddPrice;

  const handleValidateAndReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobCardNo.trim()) {
      setError('Job Card Number is required.');
      return;
    }
    if (!applicantName.trim()) {
      setError('Applicant Name is required.');
      return;
    }
    if (!partyId) {
      setError('Please select an active Party.');
      return;
    }

    const cleanAadhaar = aadhaarNo.replace(/\D/g, '');
    if (aadhaarNo.trim() && cleanAadhaar.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    setShowReviewModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editCard) {
        await editJobCard(editCard.transactionId, {
          jobCardNo: jobCardNo.trim(),
          applicantName: applicantName.trim(),
          aadhaarNo: aadhaarNo.trim(),
          serviceType,
          partyId,
          aadhaarStatus,
          dateReceived,
          cardCreatedDate,
          status,
          remarks: remarks.trim(),
        });
      } else {
        await addJobCard({
          jobCardNo: jobCardNo.trim(),
          applicantName: applicantName.trim(),
          aadhaarNo: aadhaarNo.trim(),
          serviceType,
          partyId,
          aadhaarStatus,
          dateReceived,
          cardCreatedDate,
          status,
          remarks: remarks.trim(),
        });
      }

      setShowReviewModal(false);
      if (onClose) {
        onClose();
      } else {
        navigate('jobcards');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save Job Card.');
      setShowReviewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isPage) return null;

  const selectedParty = parties.find((p) => p.partyId === partyId);

  return (
    <div className={isPage ? 'max-w-3xl mx-auto space-y-6' : 'p-1'}>
      {/* Header if standalone page */}
      {isPage && (
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <button
            onClick={() => goBack()}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {editCard ? 'Edit Job Card Record' : 'Register Single Job Card'}
            </h1>
            <p className="text-xs text-slate-500">
              Work intake, service rate calculation &amp; ledger posting
            </p>
          </div>
        </div>
      )}

      {/* Main Entry Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleValidateAndReview} className="space-y-4">
          {/* Party Selection (Step 1) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              1. Select Party / Agency <span className="text-red-500">*</span>
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              required
            >
              <option value="">-- Choose Party / CSC Agency --</option>
              {parties
                .filter((p) => p.status === 'Active' || p.partyId === partyId)
                .map((p) => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.partyName} ({p.partyId}) {p.mobile ? `- ${p.mobile}` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Service Type Selection & Price preview (Step 2) */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                2. Select Service Type &amp; Rate
              </label>
              <span className="text-xs font-extrabold text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300">
                Billed Amount: ₹{currentPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setServiceType('New Job Card')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  serviceType === 'New Job Card'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">New Job Card</div>
                  <div className={`text-[11px] ${serviceType === 'New Job Card' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Fresh registration
                  </div>
                </div>
                <div className="font-extrabold text-sm">₹{settings.newJobCardPrice}</div>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('Member Add')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  serviceType === 'Member Add'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Member Add</div>
                  <div className={`text-[11px] ${serviceType === 'Member Add' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Add family member
                  </div>
                </div>
                <div className="font-extrabold text-sm">₹{settings.memberAddPrice}</div>
              </button>
            </div>
            <p className="text-[11px] text-blue-700">
              * The transaction amount is calculated automatically according to current pricing settings.
            </p>
          </div>

          {/* Job Card Details (Step 3) */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobCardNo}
                  onChange={(e) => setJobCardNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-04-001-002-00999"
                  className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applicant Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Full name as per Aadhaar"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhaar Number (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNo}
                  onChange={(e) => setAadhaarNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="12 digit number"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Status</label>
                <select
                  value={aadhaarStatus}
                  onChange={(e) => setAadhaarStatus(e.target.value as AadhaarStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Date Received</label>
                <input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Created Date</label>
                <input
                  type="date"
                  value={cardCreatedDate}
                  onChange={(e) => setCardCreatedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Card Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobCardStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Dispatched">Dispatched</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks &amp; Notes</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Discrepancies, tracking number, or notes..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goBack()}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>Review &amp; Post Transaction</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Review Modal before final save (Requirement #18) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Confirm Job Card Transaction</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Party:</span>
                <span className="font-bold text-slate-900">{selectedParty?.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-blue-700">{serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Job Card No:</span>
                <span className="font-mono font-bold text-slate-900">{jobCardNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-medium text-slate-800">{applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aadhaar:</span>
                <span className="font-mono text-slate-700">
                  {aadhaarNo ? `XXXX-XXXX-${aadhaarNo.slice(-4)}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-800">Bill Amount:</span>
                <span className="text-blue-700">₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Saving will register this transaction, update Party outstanding, and sync to Google Sheets.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
