import React, { useState, useMemo } from 'react';
import {
  Building,
  Download,
  Plus,
  Calendar,
  Filter,
  RotateCw,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export const PmaygDemandView: React.FC = () => {
  const { demands, parties, settings, addDemand } = useData();

  // Filters (Requirement #16)
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Add Demand Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formPartyId, setFormPartyId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState(settings.pmaygPrice || 500);
  const [formRemarks, setFormRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  const activeParties = parties.filter((p) => p.status === 'Active');

  // Filter only PMAY-G Demand records (Requirement #16: Do not mix with Job Cards)
  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      if (d.demandType !== 'PMAY-G Demand') return false;
      if (selectedParty !== 'all' && d.partyId !== selectedParty) return false;
      if (dateFilter && d.demandDate !== dateFilter) return false;
      if (selectedMonth !== 'all' && !d.demandDate.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [demands, selectedParty, dateFilter, selectedMonth]);

  const totalPmaygDemand = filteredDemands.reduce((sum, d) => sum + d.amount, 0);

  const handleDownloadPdf = () => {
    PdfGeneratorService.generateDemandReport(
      'PMAY-G Demand',
      filteredDemands.map((d) => ({
        demandDate: d.demandDate,
        partyName: partiesMap[d.partyId] || d.partyName || d.partyId,
        amount: d.amount,
        remarks: d.remarks,
      })),
      totalPmaygDemand,
      selectedParty !== 'all' ? partiesMap[selectedParty] || selectedParty : 'All Parties'
    );
  };

  const handleSaveDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartyId) return;

    setIsSubmitting(true);
    try {
      const party = parties.find((p) => p.partyId === formPartyId);
      await addDemand({
        demandType: 'PMAY-G Demand',
        partyId: formPartyId,
        partyName: party?.partyName || '',
        demandDate: formDate,
        amount: Number(formAmount) || 0,
        remarks: formRemarks.trim(),
      });
      setIsModalOpen(false);
      setFormRemarks('');
    } catch {
      // toast shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-cyan-600" />
            PMAY-G Demand
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record and manage PMAY-G demand entries submitted by parties
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => {
              setFormAmount(settings.pmaygPrice || 500);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add PMAY-G Demand</span>
          </button>
        </div>
      </div>

      {/* Total PMAY-G Demand Banner (Requirement #16) */}
      <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider block">
            TOTAL PMAY-G DEMAND
          </span>
          <span className="text-2xl font-extrabold text-cyan-700">
            ₹{totalPmaygDemand.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-xs font-semibold text-cyan-700">
          {filteredDemands.length} demands recorded
        </div>
      </div>

      {/* Filters (Requirement #16: Party-wise, Date-wise, Month-wise) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            <label className="block text-slate-500 font-bold mb-1">Date</label>
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
        </div>
      </div>

      {/* Table (Requirement #16: Demand Date, Party, Amount, Remarks) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Demand Date</th>
                <th className="p-3">Party</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Entered By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDemands.map((d) => (
                <tr key={d.demandId} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{d.demandDate}</td>
                  <td className="p-3 font-semibold text-slate-900">{partiesMap[d.partyId] || d.partyName}</td>
                  <td className="p-3 text-right font-extrabold text-cyan-700">
                    ₹{d.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-slate-600">{d.remarks || '-'}</td>
                  <td className="p-3 text-slate-500">{d.createdBy}</td>
                </tr>
              ))}

              {filteredDemands.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                    No PMAY-G Demand records found. Use "+ Add PMAY-G Demand" to record an entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PMAY-G Demand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Add PMAY-G Demand</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDemand} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Party <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPartyId}
                  onChange={(e) => setFormPartyId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  required
                >
                  <option value="">-- Select Party --</option>
                  {activeParties.map((p) => (
                    <option key={p.partyId} value={p.partyId}>
                      {p.partyName} ({p.partyId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Demand Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-extrabold text-slate-900"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Default price from Price &rarr; PMAY-G (₹{settings.pmaygPrice || 500})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Optional details or PMAY-G registration ID"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RotateCw className="w-4 h-4 animate-spin" />}
                  <span>Save PMAY-G Demand</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
