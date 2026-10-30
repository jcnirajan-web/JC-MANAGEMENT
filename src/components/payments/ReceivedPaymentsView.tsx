import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Download,
  Plus,
  Calendar,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export const ReceivedPaymentsView: React.FC = () => {
  const { payments, parties } = useData();
  const { navigate } = useNavigation();

  // Filters (Requirement #13)
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('all');

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedParty !== 'all' && p.partyId !== selectedParty) return false;
      if (dateFilter && p.paymentDate !== dateFilter) return false;
      if (selectedMonth !== 'all' && !p.paymentDate.startsWith(selectedMonth)) return false;
      if (customStart && p.paymentDate < customStart) return false;
      if (customEnd && p.paymentDate > customEnd) return false;
      if (paymentMode !== 'all' && p.paymentMode !== paymentMode) return false;
      return true;
    });
  }, [payments, selectedParty, dateFilter, selectedMonth, customStart, customEnd, paymentMode]);

  const totalReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

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
            <FileCheck className="w-6 h-6 text-emerald-600" />
            Received Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log of all actual payments received from parties
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

      {/* Summary Box */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            TOTAL RECEIVED (FILTERED)
          </span>
          <span className="text-2xl font-extrabold text-emerald-700">
            ₹{totalReceived.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-xs font-semibold text-emerald-700">
          {filteredPayments.length} transactions
        </div>
      </div>

      {/* Filters */}
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
            <label className="block text-slate-500 font-bold mb-1">Single Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
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
            <label className="block text-slate-500 font-bold mb-1">Custom Range (From - To)</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-1/2 px-1 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
              />
              <span>-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-1/2 px-1 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
              />
            </div>
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

      {/* Table (Requirement #13) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Payment Date</th>
                <th className="p-3">Party</th>
                <th className="p-3">Job Card No.</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Reference Number</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.paymentId} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{p.paymentDate}</td>
                  <td className="p-3 font-semibold text-slate-900">{partiesMap[p.partyId] || p.partyId}</td>
                  <td className="p-3 font-mono text-slate-600">{p.jobCardNo || '-'}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{p.paymentId}</td>
                  <td className="p-3 text-right font-extrabold text-emerald-700">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{p.referenceNumber || '-'}</td>
                  <td className="p-3 text-slate-500">{p.remarks || '-'}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    No received payment records found.
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
