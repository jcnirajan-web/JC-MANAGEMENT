import React, { useState, useMemo } from 'react';
import {
  Building,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FilePlus,
  PlusCircle,
  Download,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { PdfGeneratorService } from '../../services/pdfGenerator';
import { StatCard } from '../common/StatCard';

export const PartyProfile: React.FC = () => {
  const { parties, jobCards, payments, demands, getPartySummary, getCardFinancials } = useData();
  const { params, navigate, goBack } = useNavigation();

  const partyId = params.partyId || '';
  const party = parties.find((p) => p.partyId === partyId);

  // Active view: 'cards' | 'hisab' | 'demands' (Requirement #19: CARD DETAILS, ACCOUNT / HISAB, DEMAND HISTORY)
  const [activeTab, setActiveTab] = useState<'cards' | 'hisab' | 'demands'>(
    (params.tab as 'cards' | 'hisab' | 'demands') || 'cards'
  );

  // Filters within Card Details tab (Requirement #5)
  const [cardSearch, setCardSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<'date' | 'cardNo' | 'applicant' | 'amount' | 'outstanding'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Party summary
  const summary = useMemo(() => {
    return getPartySummary(partyId);
  }, [partyId, getPartySummary]);

  // Party job cards
  const partyCards = useMemo(() => {
    return jobCards.filter((c) => c.partyId === partyId);
  }, [jobCards, partyId]);

  // Filtered party job cards
  const filteredPartyCards = useMemo(() => {
    return partyCards.filter((c) => {
      const q = cardSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.jobCardNo.toLowerCase().includes(q) ||
        c.applicantName.toLowerCase().includes(q) ||
        c.aadhaarNo.includes(q);

      if (!matchSearch) return false;
      if (serviceFilter !== 'All' && c.serviceType !== serviceFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;

      const cardDate = c.cardCreatedDate || c.dateReceived;
      if (dateFrom && cardDate < dateFrom) return false;
      if (dateTo && cardDate > dateTo) return false;

      if (paymentStatusFilter !== 'All') {
        const fin = getCardFinancials(c);
        let tag = 'Outstanding';
        if (fin.outstanding === 0 && fin.paid > 0) tag = 'Paid';
        else if (fin.paid > 0 && fin.outstanding > 0) tag = 'Partially Paid';
        if (tag !== paymentStatusFilter) return false;
      }

      return true;
    });
  }, [partyCards, cardSearch, serviceFilter, statusFilter, dateFrom, dateTo, paymentStatusFilter, getCardFinancials]);

  // Sorted and Paginated cards
  const sortedPartyCards = useMemo(() => {
    return [...filteredPartyCards].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        const da = a.cardCreatedDate || a.dateReceived;
        const db = b.cardCreatedDate || b.dateReceived;
        cmp = da.localeCompare(db);
      } else if (sortField === 'cardNo') {
        cmp = a.jobCardNo.localeCompare(b.jobCardNo);
      } else if (sortField === 'applicant') {
        cmp = a.applicantName.localeCompare(b.applicantName);
      } else if (sortField === 'amount') {
        cmp = a.billAmount - b.billAmount;
      } else if (sortField === 'outstanding') {
        const finA = getCardFinancials(a);
        const finB = getCardFinancials(b);
        cmp = finA.outstanding - finB.outstanding;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredPartyCards, sortField, sortOrder, getCardFinancials]);

  const totalCardPages = Math.max(1, Math.ceil(sortedPartyCards.length / pageSize));
  const paginatedPartyCards = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return sortedPartyCards.slice(start, start + pageSize);
  }, [sortedPartyCards, pageNum, pageSize]);

  // Party payments history
  const partyPayments = useMemo(() => {
    return payments.filter((p) => p.partyId === partyId);
  }, [payments, partyId]);

  if (!party) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Party Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested Party ID "{partyId}" does not exist or was removed.
        </p>
        <button
          onClick={() => navigate('parties')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Party List
        </button>
      </div>
    );
  }

  // Handle Download Outstanding Statement PDF (Requirement #32)
  const handleDownloadStatement = () => {
    const statementItems = partyCards.map((c) => {
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

    PdfGeneratorService.generatePartyStatement(party, statementItems, 'October 2026 / Current');
  };

  return (
    <div className="space-y-6">
      {/* Back button and Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
            title="Go back (Browser Back supported)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {party.partyId}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  party.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {party.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {party.partyName}
            </h1>
          </div>
        </div>

        {/* Quick action buttons on profile */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('new-jobcard', { initialPartyId: party.partyId })}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Card for Party</span>
          </button>

          <button
            onClick={() => navigate('record-payment', { partyId: party.partyId })}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Party Contact & Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Mobile Number</span>
              <span className="text-sm font-bold text-slate-900">{party.mobile || 'Not specified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Address / Location</span>
              <span className="text-slate-800 font-medium">{party.address || 'Not specified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Registration Details</span>
              <span className="text-slate-800">
                Created: {party.createdDate} by {party.createdBy}
              </span>
            </div>
          </div>
        </div>

        {party.remarks && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <strong className="text-slate-700">Remarks: </strong> {party.remarks}
          </div>
        )}
      </div>

      {/* Section 12 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Cards"
          value={summary.totalCards}
          subtitle="All transactions"
          icon={<FileText className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50"
        />

        <StatCard
          title="New Job Cards"
          value={summary.newJobCardsCount}
          subtitle="New registrations"
          icon={<CreditCard className="w-4 h-4 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Member Add"
          value={summary.memberAddCount}
          subtitle="Member additions"
          icon={<PlusCircle className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-50"
        />

        <StatCard
          title="Total Business"
          value={`₹${summary.totalBusiness.toLocaleString('en-IN')}`}
          subtitle="Billed work"
          icon={<Building className="w-4 h-4 text-sky-600" />}
          iconBg="bg-sky-50"
          variant="info"
        />

        <StatCard
          title="Total Paid"
          value={`₹${summary.totalPaid.toLocaleString('en-IN')}`}
          subtitle="Received to date"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          variant="success"
        />

        <StatCard
          title="Outstanding"
          value={`₹${summary.outstanding.toLocaleString('en-IN')}`}
          subtitle="Due balance"
          icon={<AlertCircle className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50"
          variant={summary.outstanding > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* THREE MAJOR SECTIONS (Requirement #19: CARD DETAILS, ACCOUNT / HISAB, DEMAND HISTORY) */}
      <div className="bg-slate-900 p-2 rounded-2xl shadow-md border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>[ CARD DETAILS ]</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-950/40 text-blue-200">
              {partyCards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hisab')}
            className={`py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'hisab'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>[ ACCOUNT / HISAB ]</span>
            {summary.outstanding > 0 && (
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-red-900/80 text-red-200 border border-red-700/60 font-mono">
                ₹{summary.outstanding.toLocaleString('en-IN')} Due
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('demands')}
            className={`py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'demands'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>[ DEMAND HISTORY ]</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: [ CARD DETAILS ] (Section 13) */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          {/* Card Filters Bar (Requirement #5) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cardSearch}
                  onChange={(e) => {
                    setCardSearch(e.target.value);
                    setPageNum(1);
                  }}
                  placeholder="Search card number, applicant, or aadhaar..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={serviceFilter}
                  onChange={(e) => {
                    setServiceFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Services</option>
                  <option value="New Job Card">New Job Card</option>
                  <option value="Member Add">Member Add</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                  <option value="Completed">Completed</option>
                  <option value="Dispatched">Dispatched</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Payment States</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Outstanding">Outstanding</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Date Range:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                >
                  <option value="date">Date</option>
                  <option value="cardNo">Card No.</option>
                  <option value="applicant">Applicant</option>
                  <option value="amount">Amount</option>
                  <option value="outstanding">Due</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Job Card No.</th>
                    <th className="py-3 px-4">Applicant Name</th>
                    <th className="py-3 px-4">Masked Aadhaar</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Aadhaar Status</th>
                    <th className="py-3 px-4">Received / Created</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPartyCards.map((c) => {
                    const fin = getCardFinancials(c);
                    return (
                      <tr
                        key={c.transactionId}
                        onClick={() => navigate('jobcards', { search: c.jobCardNo })}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.jobCardNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{c.applicantName}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {PdfGeneratorService.maskAadhaar(c.aadhaarNo)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.serviceType === 'New Job Card'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {c.serviceType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-slate-600">
                            {c.aadhaarStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>{c.dateReceived}</div>
                          <div className="text-[10px] text-slate-400">Created: {c.cardCreatedDate}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{fin.billAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">
                          ₹{fin.paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={fin.outstanding > 0 ? 'text-red-600' : 'text-slate-500'}>
                            ₹{fin.outstanding.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedPartyCards.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        No Job Card transactions found for this party matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls in Party Profile */}
            {sortedPartyCards.length > 0 && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Showing {Math.min(sortedPartyCards.length, (pageNum - 1) * pageSize + 1)}-
                  {Math.min(sortedPartyCards.length, pageNum * pageSize)} of {sortedPartyCards.length} records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                    disabled={pageNum === 1}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-slate-600 font-semibold px-1">
                    Page {pageNum} of {totalCardPages}
                  </span>
                  <button
                    onClick={() => setPageNum((p) => Math.min(totalCardPages, p + 1))}
                    disabled={pageNum === totalCardPages}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: [ ACCOUNT / HISAB ] (Section 21) */}
      {activeTab === 'hisab' && (
        <div className="space-y-6">
          {/* Top Money Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Total Business
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                ₹{summary.totalBusiness.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total work executed &amp; billed</p>
            </div>

            <div className="bg-emerald-950/80 text-emerald-100 rounded-xl p-5 border border-emerald-800/80 shadow-md">
              <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                Total Paid
              </span>
              <div className="text-3xl font-extrabold text-emerald-300 mt-1">
                ₹{summary.totalPaid.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-300 mt-1">Total payments credited</p>
            </div>

            <div className="bg-red-950/80 text-red-100 rounded-xl p-5 border border-red-800/80 shadow-md">
              <span className="text-xs uppercase font-bold text-red-300 tracking-wider">
                Total Outstanding
              </span>
              <div className="text-3xl font-extrabold text-red-300 mt-1">
                ₹{summary.outstanding.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-red-300 mt-1">Remaining receivable balance</p>
            </div>
          </div>

          {/* Action Row: Print Statement + Record Payment */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Account Statement &amp; Collections
              </h3>
              <p className="text-xs text-slate-500">
                Download formal printable invoice ledger to provide directly to the party
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadStatement}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>Outstanding Statement PDF</span>
              </button>

              <button
                onClick={() => navigate('record-payment', { partyId: party.partyId })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record New Payment</span>
              </button>
            </div>
          </div>

          {/* Financial Ledger Table (Section 21) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Financial Transaction Ledger (Card Billings)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Job Card No.</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Bill Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyCards.map((c) => {
                    const fin = getCardFinancials(c);
                    return (
                      <tr key={c.transactionId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.cardCreatedDate || c.dateReceived}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.jobCardNo}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{c.applicantName}</td>
                        <td className="py-3 px-4">{c.serviceType}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{fin.billAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">
                          ₹{fin.paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-extrabold">
                          <span className={fin.outstanding > 0 ? 'text-red-600' : 'text-slate-400'}>
                            ₹{fin.outstanding.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts History Table (Section 24) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Party Payment Receipts History
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {partyPayments.length} Payments Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Reference No.</th>
                    <th className="py-3 px-4">Related Card</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyPayments.map((p) => {
                    const card = jobCards.find((c) => c.transactionId === p.transactionId);
                    return (
                      <tr key={p.paymentId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.paymentId}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          {card ? card.jobCardNo : 'General Balance'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.remarks || '-'}</td>
                      </tr>
                    );
                  })}

                  {partyPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No payments recorded yet for this party.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: [ DEMAND HISTORY ] (Requirement #19) */}
      {activeTab === 'demands' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                Work Demand
              </span>
              <span className="text-xl font-extrabold text-orange-700">
                ₹{demands
                  .filter((d) => d.partyId === partyId && d.demandType === 'Work Demand')
                  .reduce((sum, d) => sum + d.amount, 0)
                  .toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
              <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider block">
                PMAY-G Demand
              </span>
              <span className="text-xl font-extrabold text-cyan-700">
                ₹{demands
                  .filter((d) => d.partyId === partyId && d.demandType === 'PMAY-G Demand')
                  .reduce((sum, d) => sum + d.amount, 0)
                  .toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Demand Transaction History for {party.partyName}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Demand Date</th>
                    <th className="py-3 px-4">Demand Type</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4">Entered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demands
                    .filter((d) => d.partyId === partyId)
                    .map((d) => (
                      <tr key={d.demandId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-700">{d.demandDate}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.demandType === 'Work Demand'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}
                          >
                            {d.demandType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{d.remarks || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">{d.createdBy}</td>
                      </tr>
                    ))}

                  {demands.filter((d) => d.partyId === partyId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No demand records found for this party.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
