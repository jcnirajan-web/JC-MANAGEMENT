import React, { useState } from 'react';
import {
  UserPlus,
  RotateCw,
  Building,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';

export const AddNewPartyView: React.FC = () => {
  const { parties, addParty, setIsEditingForm } = useData();
  const { navigate } = useNavigation();
  const { showToast } = useToast();

  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleFormChange = () => {
    setIsEditingForm(true);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent, forceAllow = false) => {
    e.preventDefault();

    if (!partyName.trim()) {
      showToast('Party Name is required.', 'warning');
      return;
    }
    if (!mobile.trim()) {
      showToast('Phone Number is required.', 'warning');
      return;
    }

    // Duplicate check on exact Party Name + Phone Number (Requirement #17)
    if (!forceAllow) {
      const isDuplicate = parties.some(
        (p) =>
          p.partyName.trim().toLowerCase() === partyName.trim().toLowerCase() &&
          p.mobile.trim() === mobile.trim()
      );
      if (isDuplicate) {
        setDuplicateWarning(
          `A party named "${partyName.trim()}" with phone number "${mobile.trim()}" already exists. Are you sure you want to create a duplicate record?`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newParty = await addParty(
        {
          partyName: partyName.trim(),
          address: address.trim(),
          mobile: mobile.trim(),
          remarks: remarks.trim(),
          status: 'Active',
        },
        forceAllow
      );

      setIsEditingForm(false);
      navigate('party-detail', { partyId: newParty.partyId });
    } catch (err: any) {
      showToast(err.message || 'Failed to create party', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-600" />
            Add New Party
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register a new client, gramin seva kendra, or CSC partner
          </p>
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="font-semibold">{duplicateWarning}</div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
            >
              Confirm &amp; Create Anyway
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Compact Form (Requirement #17) */}
      <form onSubmit={(e) => handleSubmit(e, false)} onChange={handleFormChange} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Party Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. Sharma Gramin Seva Kendra"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile or contact number"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Village, Tehsil, District or Center address"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Remarks (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Payment terms, notes or references"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsEditingForm(false);
              navigate('parties');
            }}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <RotateCw className="w-4 h-4 animate-spin" />}
            <span>Save Party</span>
          </button>
        </div>
      </form>
    </div>
  );
};
