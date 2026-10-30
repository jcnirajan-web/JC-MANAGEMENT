import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export const OutstandingPaymentsView: React.FC = () => {
  const { jobCards, parties, getCardFinancials } = useData();

  // Filters (Requirement #14)
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  // Outstanding records calculation: only transactions having outstanding balance > 0
  const outstandingRecords = useMemo(() => {
    const items: {
      transactionId: string;
      partyId: string;
      partyName: string;
      jobCardNo: string;
      applicant: string;
      serviceType: string;
      date: string;
      billAmount: number;
      paid: number;
      outstanding: number;
    }[] = [];

    jobCards.forEach((card) => {
      if (selectedParty !== 'all' && card.partyId !== selectedParty) return;

      const cDate = card.cardCreatedDate || card.dateReceived;
      if (dateFilter && cDate !== dateFilter) return;
      if (selectedMonth !== 'all' && !cDate.startsWith(selectedMonth)) return;
      if (customStart && cDate < customStart) return;
      if (customEnd && cDate > customEnd) return;

      const fin = getCardFinancials(card);
      if (fin.outstanding > 0) {
        items.push({
          transactionId: card.transactionId,
          partyId: card.partyId,
          partyName: partiesMap[card.partyId] || card.partyName || card.partyId,
          jobCardNo: card.jobCardNo,
          applicant: card.applicantName,
          serviceType: card.serviceType,
          date: cDate,
          billAmount: fin.billAmount,
          paid: fin.paid,
          outstanding: fin.outstanding,
        });
      }
    });

    return items;
  }, [jobCards, selectedParty, dateFilter, selectedMonth, customStart, customEnd, getCardFinancials, partiesMap]);

  // Overall calculations across all matching cards (including fully paid for Total Business / Total Received context)
  const { totalBusiness, totalReceived, totalOutstanding } = useMemo(() => {
    let bus = 0;
    let rec = 0;

    jobCards.forEach((c) => {
      if (selectedParty !== 'all' && c.partyId !== selectedParty) return;
      const cDate = c.cardCreatedDate || c.dateReceived;
      if (dateFilter && cDate !== dateFilter) return;
      if (selectedMonth !== 'all' && !cDate.startsWith(selectedMonth)) return;
      if (customStart && cDate < customStart) return;
      if (customEnd && cDate > customEnd) return;

      const fin = getCardFinancials(c);
      bus += fin.billAmount;
      rec += fin.paid;
    });

    const due = Math.max(0, bus - rec);
    return {
      totalBusiness: bus,
      totalReceived: rec,
      totalOutstanding: due,
    };
  }, [jobCards, selectedParty, dateFilter, selectedMonth, customStart, customEnd, getCardFinancials]);

  const handleDownloadPdf = () => {
    PdfGeneratorService.generateOutstandingReport(
      outstandingRecords,
      totalBusiness,
      totalReceived,
      totalOutstanding,
      selectedParty !== 'all' ? partiesMap[selectedParty] || selectedParty : 'All Parties'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Outstanding Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Parties and transactions with pending payment amounts
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-rose-400" />
          <span>Download Outstanding PDF</span>
        </button>
      </div>

      {/* Summary Box (Requirement #14: Total Business, Total Received, Total Outstanding) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Business</div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalBusiness.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Received</div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Outstanding</div>
          <div className="text-2xl font-extrabold text-rose-600">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filters (Requirement #14) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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
        </div>
      </div>

      {/* Table (Requirement #14) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Party</th>
                <th className="p-3">Job Card No.</th>
                <th className="p-3">Applicant</th>
                <th className="p-3">Service Type</th>
                <th className="p-3 text-right">Bill Amount (₹)</th>
                <th className="p-3 text-right">Paid (₹)</th>
                <th className="p-3 text-right">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outstandingRecords.map((item) => (
                <tr key={item.transactionId} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{item.partyName}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{item.jobCardNo}</td>
                  <td className="p-3 text-slate-700">{item.applicant}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.serviceType === 'New Job Card' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {item.serviceType}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-slate-600">
                    ₹{item.billAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-medium text-emerald-600">
                    ₹{item.paid.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-extrabold text-rose-600">
                    ₹{item.outstanding.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {outstandingRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                    No outstanding balance records found. All accounts settled.
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
