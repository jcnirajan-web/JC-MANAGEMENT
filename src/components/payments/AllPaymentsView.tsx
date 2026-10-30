import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Download,
  Plus,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';
import { PaymentMode } from '../../types';

export const AllPaymentsView: React.FC = () => {
  const { jobCards, payments, parties, getCardFinancials } = useData();
  const { navigate } = useNavigation();

  // Filters (Requirement #12)
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [paymentMode, setPaymentMode] = useState<string>('all');

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  // Actual financial calculations (Requirement #12: ONLY based on actual data)
  const filteredJobCards = useMemo(() => {
    return jobCards.filter((card) => {
      if (selectedParty !== 'all' && card.partyId !== selectedParty) return false;
      const cDate = card.cardCreatedDate || card.dateReceived;
      if (dateFrom && cDate < dateFrom) return false;
      if (dateTo && cDate > dateTo) return false;
      if (selectedMonth !== 'all' && !cDate.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [jobCards, selectedParty, dateFrom, dateTo, selectedMonth]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedParty !== 'all' && p.partyId !== selectedParty) return false;
      if (dateFrom && p.paymentDate < dateFrom) return false;
      if (dateTo && p.paymentDate > dateTo) return false;
      if (selectedMonth !== 'all' && !p.paymentDate.startsWith(selectedMonth)) return false;
      if (paymentMode !== 'all' && p.paymentMode !== paymentMode) return false;
      return true;
    });
  }, [payments, selectedParty, dateFrom, dateTo, selectedMonth, paymentMode]);

  // Totals
  const totalBilled = filteredJobCards.reduce((sum, c) => sum + c.billAmount, 0);
  const totalReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalReceived);

  const handleDownloadPdf = () => {
    PdfGeneratorService.generatePaymentCollectionsReport(
      filteredPayments,
      partiesMap,
      selectedParty !== 'all' ? partiesMap[selectedParty] || selectedParty : 'All Parties'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            All Payments &amp; Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete financial breakdown calculated strictly from real transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => navigate('record-payment')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards: TOTAL BILLED, TOTAL RECEIVED, TOTAL OUTSTANDING (Requirement #12) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL BILLED</div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">{filteredJobCards.length} transactions included</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">TOTAL RECEIVED</div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600/80">{filteredPayments.length} payments collected</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">TOTAL OUTSTANDING</div>
          <div className="text-2xl font-extrabold text-rose-600">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-600/80">Pending recovery</div>
        </div>
      </div>

      {/* Filter Suite */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Party</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="all">All Parties</option>
              {parties.map((p) => (
                <option key={p.partyId} value={p.partyId}>
                  {p.partyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Month</label>
            <input
              type="month"
              value={selectedMonth === 'all' ? '' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'all')}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>{filteredPayments.length} payments recorded</span>
          <span className="text-slate-400">Chronological ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Payment Date</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Party Name</th>
                <th className="p-3">Job Card No.</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Reference / Txn</th>
                <th className="p-3">Entered By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.paymentId} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{p.paymentDate}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{p.paymentId}</td>
                  <td className="p-3 font-semibold text-slate-900">{partiesMap[p.partyId] || p.partyId}</td>
                  <td className="p-3 font-mono text-slate-600">{p.jobCardNo || '-'}</td>
                  <td className="p-3 text-right font-extrabold text-emerald-700">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{p.referenceNumber || '-'}</td>
                  <td className="p-3 text-slate-500">{p.enteredBy}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    No payment records found. Use "+ Record Payment" to enter actual collections.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
