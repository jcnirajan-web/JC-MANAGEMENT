import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Building,
  CreditCard,
  Receipt,
  AlertCircle,
  TrendingUp,
  FileText,
  Printer,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';
import { StatCard } from '../common/StatCard';

export type ReportType =
  | 'all-cards'
  | 'new-cards'
  | 'member-add'
  | 'party-wise'
  | 'date-wise'
  | 'payments'
  | 'outstanding'
  | 'collections'
  | 'monthly-summary';

export const ReportsView: React.FC = () => {
  const { jobCards, parties, payments, getCardFinancials, getPartySummary } = useData();
  const { params } = useNavigation();

  const [activeReport, setActiveReport] = useState<ReportType>(
    (params.tab as ReportType) || 'outstanding'
  );
  const [selectedParty, setSelectedParty] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  // Report Items computation
  const reportCards = useMemo(() => {
    return jobCards.filter((c) => {
      if (activeReport === 'new-cards' && c.serviceType !== 'New Job Card') return false;
      if (activeReport === 'member-add' && c.serviceType !== 'Member Add') return false;
      if (selectedParty !== 'All' && c.partyId !== selectedParty) return false;

      const cardDate = c.cardCreatedDate || c.dateReceived;
      if (dateFrom && cardDate < dateFrom) return false;
      if (dateTo && cardDate > dateTo) return false;

      if (activeReport === 'outstanding') {
        const fin = getCardFinancials(c);
        if (fin.outstanding === 0) return false;
      }

      return true;
    });
  }, [jobCards, activeReport, selectedParty, dateFrom, dateTo, getCardFinancials]);

  // Outstanding Party Summaries
  const partySummaries = useMemo(() => {
    return parties
      .map((p) => ({ party: p, summary: getPartySummary(p.partyId) }))
      .filter((item) => {
        if (selectedParty !== 'All' && item.party.partyId !== selectedParty) return false;
        if (activeReport === 'outstanding') return item.summary.outstanding > 0;
        return true;
      });
  }, [parties, selectedParty, activeReport, getPartySummary]);

  // Report Financial Totals
  const totals = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let due = 0;

    reportCards.forEach((c) => {
      const fin = getCardFinancials(c);
      billed += fin.billAmount;
      paid += fin.paid;
      due += fin.outstanding;
    });

    return { billed, paid, due, count: reportCards.length };
  }, [reportCards, getCardFinancials]);

  // PDF Download Handler (Requirement #30)
  const handleExportPdf = () => {
    if (activeReport === 'payments' || activeReport === 'collections') {
      PdfGeneratorService.generatePaymentReport(
        payments,
        partiesMap,
        'Collections & Payment History Report'
      );
      return;
    }

    if (activeReport === 'outstanding' && selectedParty !== 'All') {
      const p = parties.find((item) => item.partyId === selectedParty);
      if (p) {
        const statementItems = reportCards.map((c) => {
          const fin = getCardFinancials(c);
          return {
            date: c.cardCreatedDate || c.dateReceived,
            jobCardNo: c.jobCardNo,
            applicant: c.applicantName,
            serviceType: c.serviceType,
            billAmount: fin.billAmount,
            paid: fin.paid,
            outstanding: fin.outstanding,
          };
        });
        PdfGeneratorService.generatePartyStatement(p, statementItems);
        return;
      }
    }

    // Default Cards PDF
    const rows = reportCards.map((c) => {
      const fin = getCardFinancials(c);
      return {
        jobCardNo: c.jobCardNo,
        applicantName: c.applicantName,
        maskedAadhaar: PdfGeneratorService.maskAadhaar(c.aadhaarNo),
        serviceType: c.serviceType,
        cardDate: c.cardCreatedDate || c.dateReceived,
        amount: fin.billAmount,
        paid: fin.paid,
        outstanding: fin.outstanding,
        status: c.status,
      };
    });

    PdfGeneratorService.generateCardsReport(
      rows,
      `${activeReport.replace('-', ' ').toUpperCase()} REPORT`,
      selectedParty !== 'All' ? `Party: ${partiesMap[selectedParty]}` : undefined
    );
  };

  const reportTabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'outstanding', label: 'Outstanding Report', icon: <AlertCircle className="w-4 h-4 text-red-600" /> },
    { id: 'all-cards', label: 'All Cards Statement', icon: <CreditCard className="w-4 h-4 text-blue-600" /> },
    { id: 'new-cards', label: 'New Job Cards', icon: <FileText className="w-4 h-4 text-indigo-600" /> },
    { id: 'member-add', label: 'Member Add Report', icon: <FileText className="w-4 h-4 text-purple-600" /> },
    { id: 'party-wise', label: 'Party-wise Ledger', icon: <Building className="w-4 h-4 text-emerald-600" /> },
    { id: 'payments', label: 'Payment Collections', icon: <Receipt className="w-4 h-4 text-teal-600" /> },
    { id: 'monthly-summary', label: 'Monthly Summary', icon: <Calendar className="w-4 h-4 text-orange-600" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-blue-600" />
            Executive Reports &amp; Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-ready financial statements, collection summaries, and party ledgers
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-rose-400" />
          <span>[ Download Printable PDF ]</span>
        </button>
      </div>

      {/* Report Types Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
              activeReport === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Party</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedParty('All');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Aggregate Metrics in Report */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Records In Report"
          value={totals.count}
          subtitle="Filtered transactions"
          icon={<FileText className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="Billed Volume"
          value={`₹${totals.billed.toLocaleString('en-IN')}`}
          subtitle="Total work value"
          icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
          variant="info"
        />
        <StatCard
          title="Paid Collections"
          value={`₹${totals.paid.toLocaleString('en-IN')}`}
          subtitle="Settled amount"
          icon={<Receipt className="w-4 h-4 text-emerald-600" />}
          variant="success"
        />
        <StatCard
          title="Outstanding Due"
          value={`₹${totals.due.toLocaleString('en-IN')}`}
          subtitle="Receivable balance"
          icon={<AlertCircle className="w-4 h-4 text-red-600" />}
          variant={totals.due > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Party Wise Summary Table if Party-Wise tab */}
      {activeReport === 'party-wise' || activeReport === 'outstanding' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Party Financial Ledger Summary
            </h3>
            <span className="text-xs text-slate-500">{partySummaries.length} Parties Listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Party ID</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Cards Count</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Outstanding Due</th>
                  <th className="py-3 px-4 text-right">Statement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partySummaries.map(({ party, summary }) => (
                  <tr key={party.partyId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{party.partyId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{party.partyName}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {summary.totalCards} cards ({summary.newJobCardsCount} New / {summary.memberAddCount} Add)
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{summary.totalBusiness.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      ₹{summary.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-red-600">
                      ₹{summary.outstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          const pCards = jobCards.filter((c) => c.partyId === party.partyId);
                          const statementItems = pCards.map((c) => {
                            const fin = getCardFinancials(c);
                            return {
                              date: c.cardCreatedDate || c.dateReceived,
                              jobCardNo: c.jobCardNo,
                              applicant: c.applicantName,
                              serviceType: c.serviceType,
                              billAmount: fin.billAmount,
                              paid: fin.paid,
                              outstanding: fin.outstanding,
                            };
                          });
                          PdfGeneratorService.generatePartyStatement(party, statementItems);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded transition flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-400" />
                        Print PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Job Card Detailed Ledger in Report */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detailed Transaction Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{reportCards.length} Cards in View</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Job Card No.</th>
                <th className="py-2.5 px-4">Applicant Name</th>
                <th className="py-2.5 px-4">Party</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Bill Amount</th>
                <th className="py-2.5 px-4">Paid</th>
                <th className="py-2.5 px-4">Outstanding</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportCards.map((c) => {
                const fin = getCardFinancials(c);
                return (
                  <tr key={c.transactionId} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{c.cardCreatedDate || c.dateReceived}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.jobCardNo}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{c.applicantName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{partiesMap[c.partyId] || c.partyId}</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">{c.serviceType}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      ₹{fin.billAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-600">
                      ₹{fin.paid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 font-extrabold text-red-600">
                      ₹{fin.outstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{c.status}</td>
                  </tr>
                );
              })}

              {reportCards.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No records match the report parameters.
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
