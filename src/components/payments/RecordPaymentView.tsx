import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Receipt,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PaymentMode } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const RecordPaymentView: React.FC = () => {
  const { parties, jobCards, recordPayment, getPartySummary, getCardFinancials } = useData();
  const { params, navigate, goBack } = useNavigation();

  const [partyId, setPartyId] = useState(params.partyId || '');
  const [transactionId, setTransactionId] = useState(params.initialTxnId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverpaymentWarning, setShowOverpaymentWarning] = useState(false);
  const [showSummaryConfirmation, setShowSummaryConfirmation] = useState(false);

  useEffect(() => {
    if (!partyId && parties.length > 0) {
      setPartyId(parties[0].partyId);
    }
  }, [parties, partyId]);

  // Selected party's financial summary
  const partySummary = useMemo(() => {
    if (!partyId) return null;
    return getPartySummary(partyId);
  }, [partyId, getPartySummary]);

  // Party's job cards that have pending balance or all
  const partyCards = useMemo(() => {
    if (!partyId) return [];
    return jobCards.filter((c) => c.partyId === partyId);
  }, [jobCards, partyId]);

  // If a specific transaction is selected, get its financials
  const selectedCard = useMemo(() => {
    return partyCards.find((c) => c.transactionId === transactionId);
  }, [partyCards, transactionId]);

  const selectedCardFin = useMemo(() => {
    if (!selectedCard) return null;
    return getCardFinancials(selectedCard);
  }, [selectedCard, getCardFinancials]);

  // Validation & Calculation values (Requirement #23)
  const numericAmount = Number(amount) || 0;
  const currentOutstanding = selectedCardFin
    ? selectedCardFin.outstanding
    : partySummary
    ? partySummary.outstanding
    : 0;

  const currentTotalBilled = selectedCardFin
    ? selectedCardFin.billAmount
    : partySummary
    ? partySummary.totalBusiness
    : 0;

  const currentAlreadyPaid = selectedCardFin
    ? selectedCardFin.paid
    : partySummary
    ? partySummary.totalPaid
    : 0;

  const remainingOutstanding = Math.max(0, currentOutstanding - numericAmount);
  const isOverpaying = numericAmount > currentOutstanding;

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partyId) {
      setError('Please select a Party.');
      return;
    }

    if (numericAmount <= 0) {
      setError('Payment amount must be greater than zero (Requirement #23).');
      return;
    }

    // If payment exceeds outstanding, trigger clear warning (Requirement #23)
    if (isOverpaying) {
      setShowOverpaymentWarning(true);
      return;
    }

    // Normal summary confirmation before final save
    setShowSummaryConfirmation(true);
  };

  const handleExecutePayment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await recordPayment({
        partyId,
        transactionId: transactionId || undefined,
        amount: numericAmount,
        paymentMode,
        referenceNumber: referenceNumber.trim(),
        remarks: remarks.trim(),
        paymentDate,
      });

      setShowSummaryConfirmation(false);
      setShowOverpaymentWarning(false);
      navigate('party-detail', { partyId, tab: 'hisab' });
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParty = parties.find((p) => p.partyId === partyId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <button
          onClick={() => goBack()}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Record Payment Transaction
          </h1>
          <p className="text-xs text-slate-500">
            Post payment received from party or apply to specific job card
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitAttempt} className="space-y-4">
          {/* Party Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Party / Agency <span className="text-red-500">*</span>
            </label>
            <select
              value={partyId}
              onChange={(e) => {
                setPartyId(e.target.value);
                setTransactionId('');
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              required
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p) => (
                <option key={p.partyId} value={p.partyId}>
                  {p.partyName} ({p.partyId})
                </option>
              ))}
            </select>
          </div>

          {/* Optional: Apply to Specific Job Card or General Balance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Apply Payment To (Optional)
            </label>
            <select
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">General Party Account (Reduces Overall Outstanding)</option>
              {partyCards.map((c) => {
                const fin = getCardFinancials(c);
                return (
                  <option key={c.transactionId} value={c.transactionId}>
                    Card {c.jobCardNo} ({c.applicantName}) — Bill: ₹{fin.billAmount} | Due: ₹{fin.outstanding}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Financial Breakdown Preview (Requirement #23) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Current Financial Ledger Context
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Bill Amount
                </span>
                <span className="text-sm font-bold text-slate-900">
                  ₹{currentTotalBilled.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Already Paid
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  ₹{currentAlreadyPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Current Due
                </span>
                <span className="text-sm font-bold text-red-600">
                  ₹{currentOutstanding.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 font-semibold uppercase block">
                  Balance After Pay
                </span>
                <span className="text-sm font-extrabold text-blue-800">
                  ₹{remainingOutstanding.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Amount & Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 500 or 1000"
                  className="w-full pl-8 pr-3.5 py-2.5 text-base font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              {numericAmount > 0 && (
                <div className="flex gap-2 mt-1.5">
                  {currentOutstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(currentOutstanding)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      Fill Exact Due (₹{currentOutstanding})
                    </button>
                  )}
                  {selectedCardFin && selectedCardFin.billAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(selectedCardFin.billAmount)}
                      className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200"
                    >
                      Full Bill (₹{selectedCardFin.billAmount})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Payment Mode & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction Ref / UTR / Receipt No.
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI/2026/9981 or Cash Receipt #104"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks &amp; Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Settlement notes, payer details, or notes..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => goBack()}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Requirement #23 Mandatory Breakdown Dialog before confirmation */}
      <ConfirmDialog
        isOpen={showSummaryConfirmation}
        title="Confirm Payment Transaction"
        message="Please verify the financial breakdown before submitting this payment to the ledger:"
        details={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Party:</span>
              <span className="font-bold text-slate-900">{selectedParty?.partyName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Bill Amount:</span>
              <span className="font-mono text-slate-800">₹{currentTotalBilled.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Already Paid:</span>
              <span className="font-mono text-emerald-600">₹{currentAlreadyPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-800 font-bold">
              <span>New Payment:</span>
              <span className="font-mono text-sm">₹{numericAmount.toLocaleString('en-IN')} ({paymentMode})</span>
            </div>
            <div className="flex justify-between py-1 text-slate-800 font-bold">
              <span>Remaining Outstanding:</span>
              <span className="font-mono text-sm text-red-600">
                ₹{remainingOutstanding.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        }
        confirmLabel="Yes, Post Payment"
        variant="info"
        onConfirm={handleExecutePayment}
        onCancel={() => setShowSummaryConfirmation(false)}
        isLoading={isSubmitting}
      />

      {/* Requirement #23 Overpayment Warning Dialog */}
      <ConfirmDialog
        isOpen={showOverpaymentWarning}
        title="Warning: Payment Exceeds Outstanding Due"
        message={`The entered payment amount (₹${numericAmount.toLocaleString('en-IN')}) is greater than the current outstanding due balance (₹${currentOutstanding.toLocaleString('en-IN')}).`}
        details={
          <div className="text-xs text-amber-800 space-y-1">
            <p>
              Current Outstanding: <strong>₹{currentOutstanding.toLocaleString('en-IN')}</strong>
            </p>
            <p>
              New Payment: <strong>₹{numericAmount.toLocaleString('en-IN')}</strong>
            </p>
            <p className="text-red-700 font-bold mt-2">
              Excess Advance Credit: ₹{(numericAmount - currentOutstanding).toLocaleString('en-IN')}
            </p>
            <p className="mt-1">
              Do you explicitly want to allow this overpayment advance scenario?
            </p>
          </div>
        }
        confirmLabel="Allow Exceptional Overpayment"
        variant="warning"
        onConfirm={() => {
          setShowOverpaymentWarning(false);
          setShowSummaryConfirmation(true);
        }}
        onCancel={() => setShowOverpaymentWarning(false)}
      />
    </div>
  );
};
