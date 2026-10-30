import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Building,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PaymentMode } from '../../types';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export const PaymentList: React.FC = () => {
  const { payments, parties, jobCards } = useData();
  const { navigate } = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  const cardsMap = useMemo(() => {
    const map: Record<string, string> = {};
    jobCards.forEach((c) => {
      map[c.transactionId] = c.jobCardNo;
    });
    return map;
  }, [jobCards]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const partyName = partiesMap[p.partyId] || '';
      const cardNo = p.transactionId ? cardsMap[p.transactionId] || '' : '';

      const matchSearch =
        !q ||
        p.paymentId.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        partyName.toLowerCase().includes(q) ||
        cardNo.toLowerCase().includes(q) ||
        p.remarks.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (selectedParty !== 'All' && p.partyId !== selectedParty) return false;
      if (selectedMode !== 'All' && p.paymentMode !== selectedMode) return false;
      if (dateFrom && p.paymentDate < dateFrom) return false;
      if (dateTo && p.paymentDate > dateTo) return false;

      return true;
    });
  }, [payments, searchQuery, selectedParty, selectedMode, dateFrom, dateTo, partiesMap, cardsMap]);

  const totalCollectedInView = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const handleDownloadPdf = () => {
    PdfGeneratorService.generatePaymentReport(
      filteredPayments,
      partiesMap,
      selectedParty !== 'All' ? `Payments for ${partiesMap[selectedParty]}` : 'Payment Collections Ledger'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Payment Transactions &amp; Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit trail of all funds received, UPI transactions, bank transfers, and cash collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            title="Download PDF report of payment collections"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Payments PDF</span>
          </button>

          <button
            onClick={() => navigate('record-payment')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment ID, Party name, UTR/Reference No, or card..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedParty('All');
              setSelectedMode('All');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Party</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Parties</option>
              {parties.map((p) => (
                <option key={p.partyId} value={p.partyId}>
                  {p.partyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{filteredPayments.length} payment entries found</span>
          <span className="text-emerald-700 font-extrabold text-sm">
            Total In View: ₹{totalCollectedInView.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4">Linked Card</th>
                <th className="py-3 px-4">Entered By</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.paymentId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono text-slate-600">{p.paymentDate}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{p.paymentId}</td>
                  <td className="py-3.5 px-4">
                    <span
                      onClick={() => navigate('party-detail', { partyId: p.partyId, tab: 'hisab' })}
                      className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                    >
                      {partiesMap[p.partyId] || p.partyId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {p.referenceNumber || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    {p.transactionId && cardsMap[p.transactionId]
                      ? cardsMap[p.transactionId]
                      : 'General Balance'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">{p.enteredBy}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{p.remarks || '-'}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No payment transactions match the selected filters.
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
