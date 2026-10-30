import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  CreditCard,
  UserPlus,
  Receipt,
  FileSpreadsheet,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export const MonthlyReportView: React.FC = () => {
  const { jobCards, payments, demands, getCardFinancials } = useData();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const monthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Actual records for this month
  const monthCards = useMemo(() => {
    return jobCards.filter((c) => {
      const d = c.cardCreatedDate || c.dateReceived;
      return d.startsWith(monthPrefix);
    });
  }, [jobCards, monthPrefix]);

  const monthNewCards = useMemo(() => {
    return monthCards.filter((c) => c.serviceType === 'New Job Card');
  }, [monthCards]);

  const monthMemberAdds = useMemo(() => {
    return monthCards.filter((c) => c.serviceType === 'Member Add');
  }, [monthCards]);

  const monthPayments = useMemo(() => {
    return payments.filter((p) => p.paymentDate.startsWith(monthPrefix));
  }, [payments, monthPrefix]);

  const monthWorkDemands = useMemo(() => {
    return demands.filter((d) => d.demandType === 'Work Demand' && d.demandDate.startsWith(monthPrefix));
  }, [demands, monthPrefix]);

  const monthPmaygDemands = useMemo(() => {
    return demands.filter((d) => d.demandType === 'PMAY-G Demand' && d.demandDate.startsWith(monthPrefix));
  }, [demands, monthPrefix]);

  // Totals
  const totalBusiness = monthCards.reduce((sum, c) => sum + c.billAmount, 0);
  const totalPayments = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const workDemandTotal = monthWorkDemands.reduce((sum, d) => sum + d.amount, 0);
  const pmaygDemandTotal = monthPmaygDemands.reduce((sum, d) => sum + d.amount, 0);
  const outstandingTotal = Math.max(0, totalBusiness - totalPayments);

  const hasData =
    monthCards.length > 0 ||
    monthPayments.length > 0 ||
    monthWorkDemands.length > 0 ||
    monthPmaygDemands.length > 0;

  const handleDownloadPdf = () => {
    PdfGeneratorService.generateMonthlyReport(
      selectedYear,
      selectedMonth,
      {
        totalCards: monthCards.length,
        newJobCardsCount: monthNewCards.length,
        memberAddCount: monthMemberAdds.length,
        totalBusiness,
        totalPayments,
        workDemandTotal,
        pmaygDemandTotal,
        outstandingTotal,
      },
      hasData
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-rose-600" />
            Monthly Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated business and operational statement for selected calendar month
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-rose-400" />
          <span>Download Monthly Report PDF</span>
        </button>
      </div>

      {/* Month & Year Selectors (Requirement #24) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-600">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State (Requirement #24: If there is no data, show "No records found for the selected month.") */}
      {!hasData ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <FileBarChart className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No records found for the selected month.</h3>
          <p className="text-xs text-slate-400">
            No Job Cards, Payments, or Demand records were entered for {monthNames[selectedMonth - 1]} {selectedYear}.
          </p>
        </div>
      ) : (
        /* The 7 Required Sections (Requirement #24) */
        <div className="space-y-6">
          {/* Section 1: JOB CARDS Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                JOB CARDS
              </h2>
              <span className="text-xs font-extrabold text-blue-600">{monthCards.length} Cards Total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-bold block">TOTAL BILLED WORK</span>
                <span className="text-xl font-extrabold text-slate-900">₹{totalBusiness.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] text-blue-700 font-bold block">NEW JOB CARDS</span>
                <span className="text-xl font-extrabold text-blue-800">{monthNewCards.length}</span>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] text-indigo-700 font-bold block">ADD MEMBER</span>
                <span className="text-xl font-extrabold text-indigo-800">{monthMemberAdds.length}</span>
              </div>
            </div>
          </div>

          {/* Section 2: PAYMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                PAYMENTS
              </h2>
              <span className="text-xs font-extrabold text-emerald-600">
                ₹{totalPayments.toLocaleString('en-IN')} Received
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {monthPayments.length} payment transactions processed in {monthNames[selectedMonth - 1]} {selectedYear}.
            </div>
          </div>

          {/* Section 3: WORK DEMAND */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                WORK DEMAND
              </h2>
              <span className="text-xs font-extrabold text-orange-600">
                ₹{workDemandTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {monthWorkDemands.length} work demand submissions recorded.
            </div>
          </div>

          {/* Section 4: PMAY-G DEMAND */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-600" />
                PMAY-G DEMAND
              </h2>
              <span className="text-xs font-extrabold text-cyan-600">
                ₹{pmaygDemandTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {monthPmaygDemands.length} PMAY-G demand entries recorded.
            </div>
          </div>

          {/* Section 5: OUTSTANDING */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                OUTSTANDING
              </h2>
              <span className="text-xs font-extrabold text-rose-600">
                ₹{outstandingTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Net balance for {monthNames[selectedMonth - 1]} {selectedYear}: Total Billed ₹{totalBusiness.toLocaleString('en-IN')} minus Total Payments ₹{totalPayments.toLocaleString('en-IN')}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
