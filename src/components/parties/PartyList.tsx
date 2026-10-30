import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  Archive,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { Party } from '../../types';
import { PartyModal } from './PartyModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const PartyList: React.FC = () => {
  const { parties, addParty, editParty, togglePartyStatus, getPartySummary } = useData();
  const { navigate, params } = useNavigation();

  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(params.filter === 'outstanding' ? 'outstanding' : 'All');
  const [isModalOpen, setIsModalOpen] = useState(params.openModal === 'true');
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Archive / status confirm state
  const [confirmTarget, setConfirmTarget] = useState<{ party: Party; action: 'Deactivate' | 'Activate' | 'Archive' } | null>(null);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.partyName.toLowerCase().includes(q) ||
        p.partyId.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.address.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'outstanding') {
        const summary = getPartySummary(p.partyId);
        return summary.outstanding > 0;
      }

      if (statusFilter !== 'All' && p.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [parties, searchQuery, statusFilter, getPartySummary]);

  const handleCreateOrEdit = async (data: any) => {
    if (editingParty) {
      await editParty(editingParty.partyId, data);
    } else {
      await addParty(data);
    }
    setEditingParty(null);
  };

  const handleStatusChangeConfirm = async () => {
    if (!confirmTarget) return;
    const { party, action } = confirmTarget;
    let newStatus: Party['status'] = 'Active';
    if (action === 'Deactivate') newStatus = 'Inactive';
    if (action === 'Archive') newStatus = 'Archived';

    await togglePartyStatus(party.partyId, newStatus);
    setConfirmTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Party Master Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Agencies, CSC centers, and work contractors registered in the system
          </p>
        </div>

        <button
          onClick={() => navigate('party-new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party by name, ID, mobile, or address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="All">All Statuses ({parties.length})</option>
            <option value="Active">Active Only</option>
            <option value="outstanding">Parties with Outstanding</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Party ID</th>
                <th className="py-3.5 px-4">Party / Agency Name</th>
                <th className="py-3.5 px-4">Mobile &amp; Location</th>
                <th className="py-3.5 px-4">Total Cards</th>
                <th className="py-3.5 px-4">Total Business</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Outstanding</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.map((p) => {
                const summary = getPartySummary(p.partyId);
                return (
                  <tr
                    key={p.partyId}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{p.partyId}</td>
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => navigate('party-detail', { partyId: p.partyId })}
                        className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm"
                      >
                        {p.partyName}
                      </div>
                      {p.remarks && (
                        <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{p.remarks}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {p.mobile || 'No Mobile'}
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{p.address || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {summary.totalCards}
                      <span className="text-[10px] text-slate-600 font-normal ml-1">
                        ({summary.newJobCardsCount} New / {summary.memberAddCount} Add)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{summary.totalBusiness.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      ₹{summary.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold ${
                          summary.outstanding > 0 ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        ₹{summary.outstanding.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'Inactive'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate('party-detail', { partyId: p.partyId })}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center gap-1"
                          title="View Profile, Card Details & Hisab"
                        >
                          View Profile
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingParty(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                          title="Edit Party Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {p.status === 'Active' ? (
                          <button
                            onClick={() => setConfirmTarget({ party: p, action: 'Archive' })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Archive / Deactivate (Safe storage)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmTarget({ party: p, action: 'Activate' })}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                            title="Re-activate Party"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredParties.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-600 text-sm">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No parties found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      <PartyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingParty(null);
        }}
        onSubmit={handleCreateOrEdit}
        initialParty={editingParty}
      />

      {/* Confirm Deactivate / Archive */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={`${confirmTarget?.action} Party: ${confirmTarget?.party.partyName}`}
        message={`Are you sure you want to ${confirmTarget?.action.toLowerCase()} this party? All existing Job Cards and payment financial records will be securely preserved.`}
        confirmLabel={`Yes, ${confirmTarget?.action}`}
        variant={confirmTarget?.action === 'Activate' ? 'info' : 'warning'}
        onConfirm={handleStatusChangeConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
