import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Building,
  Edit2,
  FileText,
  CheckCircle,
  Clock,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { JobCard, ServiceType, AadhaarStatus, JobCardStatus, PaymentStatus } from '../../types';
import { PdfGeneratorService } from '../../services/pdfGenerator';
import { JobCardModal } from './JobCardModal';

type SortField = 'date' | 'cardNo' | 'applicant' | 'amount' | 'outstanding';
type SortOrder = 'asc' | 'desc';

export const JobCardList: React.FC = () => {
  const { jobCards, parties, getCardFinancials } = useData();
  const { params, navigate } = useNavigation();

  // Filters State (Requirements #14 & #15)
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [selectedParty, setSelectedParty] = useState(params.partyId || 'All');
  const [selectedService, setSelectedService] = useState<string>(params.serviceType || 'All');
  const [selectedStatus, setSelectedStatus] = useState<string>(params.status || 'All');
  const [selectedAadhaarStatus, setSelectedAadhaarStatus] = useState<string>('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting and Pagination State (Requirement #5)
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<JobCard | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const partiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => {
      map[p.partyId] = p.partyName;
    });
    return map;
  }, [parties]);

  // Combined Multi-Filter Engine (Requirement #14)
  const filteredCards = useMemo(() => {
    return jobCards.filter((card) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.jobCardNo.toLowerCase().includes(q) ||
        card.applicantName.toLowerCase().includes(q) ||
        card.aadhaarNo.includes(q) ||
        (partiesMap[card.partyId] || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Party filter
      if (selectedParty !== 'All' && card.partyId !== selectedParty) return false;

      // Service Type filter
      if (selectedService !== 'All' && card.serviceType !== selectedService) return false;

      // Card Status filter
      if (selectedStatus !== 'All' && card.status !== selectedStatus) return false;

      // Aadhaar Status filter
      if (selectedAadhaarStatus !== 'All' && card.aadhaarStatus !== selectedAadhaarStatus) return false;

      // Date Range & Month filter
      const cardDate = card.cardCreatedDate || card.dateReceived;
      if (selectedMonth !== 'All' && !cardDate.startsWith(selectedMonth)) return false;
      if (dateFrom && cardDate < dateFrom) return false;
      if (dateTo && cardDate > dateTo) return false;

      // Payment Status filter (Paid, Partially Paid, Outstanding)
      if (selectedPaymentStatus !== 'All') {
        const fin = getCardFinancials(card);
        let statusTag: PaymentStatus = 'Outstanding';
        if (fin.outstanding === 0 && fin.paid > 0) statusTag = 'Paid';
        else if (fin.paid > 0 && fin.outstanding > 0) statusTag = 'Partially Paid';
        else statusTag = 'Outstanding';

        if (statusTag !== selectedPaymentStatus) return false;
      }

      return true;
    });
  }, [
    jobCards,
    searchQuery,
    selectedParty,
    selectedService,
    selectedStatus,
    selectedAadhaarStatus,
    selectedPaymentStatus,
    dateFrom,
    dateTo,
    partiesMap,
    getCardFinancials,
  ]);

  // Sorting and Pagination (Requirement #5)
  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
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
  }, [filteredCards, sortField, sortOrder, getCardFinancials]);

  const totalPages = Math.max(1, Math.ceil(sortedCards.length / pageSize));
  const paginatedCards = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return sortedCards.slice(start, start + pageSize);
  }, [sortedCards, currentPageNum, pageSize]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedParty('All');
    setSelectedService('All');
    setSelectedStatus('All');
    setSelectedAadhaarStatus('All');
    setSelectedPaymentStatus('All');
    setDateFrom('');
    setDateTo('');
    setCurrentPageNum(1);
  };

  // Requirement #31: Filtered Card PDF
  const handleDownloadFilteredPdf = () => {
    const reportRows = filteredCards.map((c) => {
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

    const activeFilterLabels = [];
    if (selectedParty !== 'All') activeFilterLabels.push(`Party: ${partiesMap[selectedParty] || selectedParty}`);
    if (selectedService !== 'All') activeFilterLabels.push(`Service: ${selectedService}`);
    if (selectedStatus !== 'All') activeFilterLabels.push(`Status: ${selectedStatus}`);
    if (dateFrom || dateTo) activeFilterLabels.push(`Dates: ${dateFrom || 'Start'} to ${dateTo || 'End'}`);

    PdfGeneratorService.generateCardsReport(
      reportRows,
      'Filtered Job Cards Statement',
      activeFilterLabels.length > 0 ? activeFilterLabels.join(' | ') : 'All Matching Records'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Job Card Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full registry of New Job Cards and Member Add transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadFilteredPdf}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            title="Download PDF of currently filtered records"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span>Download Filtered PDF</span>
          </button>

          <button
            onClick={() => navigate('new-jobcard', { serviceType: 'New Job Card' })}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Job Card</span>
          </button>

          <button
            onClick={() => navigate('new-jobcard', { serviceType: 'Member Add' })}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Member Add</span>
          </button>
        </div>
      </div>

      {/* Combinable Filter Suite (Section 14 & 15) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Row 1: Fast Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Job Card No., Applicant Name, Aadhaar Number, or Party..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Row 2: Dropdown Multi-Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-medium">
          {/* Party Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Party</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Parties</option>
              {parties.map((p) => (
                <option key={p.partyId} value={p.partyId}>
                  {p.partyName}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Service Type</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Services</option>
              <option value="New Job Card">New Job Card (₹1000)</option>
              <option value="Member Add">Member Add (₹500)</option>
            </select>
          </div>

          {/* Card Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Card Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Process">In Process</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Dispatched">Dispatched</option>
            </select>
          </div>

          {/* Aadhaar Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Aadhaar Status</label>
            <select
              value={selectedAadhaarStatus}
              onChange={(e) => setSelectedAadhaarStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Aadhaar Status</option>
              <option value="Fetched">Fetched</option>
              <option value="Registered Elsewhere">Registered Elsewhere</option>
              <option value="Not Available">Not Available</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          {/* Payment Status (Paid, Partially Paid, Outstanding) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Payment States</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Outstanding">Outstanding</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Month</label>
            <input
              type="month"
              value={selectedMonth === 'All' ? '' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'All')}
              className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
              title="Month Filter"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Date Range</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-1/2 px-1 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
                title="Date From"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-1/2 px-1 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
                title="Date To"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Sort Controls (Requirement #5) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Sort By:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700"
            >
              <option value="date">Date (Received / Created)</option>
              <option value="cardNo">Job Card Number</option>
              <option value="applicant">Applicant Name</option>
              <option value="amount">Bill Amount</option>
              <option value="outstanding">Outstanding Balance</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700"
            >
              <option value="desc">Descending (Newest / Highest)</option>
              <option value="asc">Ascending (Oldest / Lowest)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Per Page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPageNum(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table (Requirement #5 & #13) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Displaying {Math.min(sortedCards.length, (currentPageNum - 1) * pageSize + 1)}-
            {Math.min(sortedCards.length, currentPageNum * pageSize)} of {sortedCards.length} matching records
          </span>
          <span className="text-slate-400">Amounts fixed at transaction time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Job Card No.</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Masked Aadhaar</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Aadhaar Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCards.map((card) => {
                const fin = getCardFinancials(card);
                return (
                  <tr key={card.transactionId} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{card.jobCardNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{card.applicantName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {PdfGeneratorService.maskAadhaar(card.aadhaarNo)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          card.serviceType === 'New Job Card'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {card.serviceType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        onClick={() => navigate('party-detail', { partyId: card.partyId })}
                        className="font-medium text-blue-700 hover:underline cursor-pointer"
                      >
                        {partiesMap[card.partyId] || card.partyId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{card.aadhaarStatus}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {card.cardCreatedDate || card.dateReceived}
                    </td>
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
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          card.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : card.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                          title="Edit Card Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {fin.outstanding > 0 && (
                          <button
                            onClick={() =>
                              navigate('record-payment', {
                                partyId: card.partyId,
                                initialTxnId: card.transactionId,
                              })
                            }
                            className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                            title="Record Payment for this card"
                          >
                            Pay Due
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedCards.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No Job Cards match the applied filters and search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (Requirement #5) */}
        {sortedCards.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="text-slate-500 font-medium">
              Page {currentPageNum} of {totalPages}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPageNum - 1 && page <= currentPageNum + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPageNum(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPageNum - 2 || page === currentPageNum + 2) {
                  return (
                    <span key={page} className="text-slate-400 px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageNum === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Job Card Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto p-4">
            <JobCardModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingCard(null);
              }}
              editCard={editingCard}
            />
          </div>
        </div>
      )}
    </div>
  );
};
