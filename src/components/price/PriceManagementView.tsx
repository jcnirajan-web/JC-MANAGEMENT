import React, { useState, useEffect } from 'react';
import {
  Tag,
  ShieldCheck,
  Save,
  RotateCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface PriceManagementViewProps {
  category: 'New Job Card' | 'Add Member' | 'Work Demand' | 'PMAY-G';
}

export const PriceManagementView: React.FC<PriceManagementViewProps> = ({ category }) => {
  const { settings, updatePrice } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const getCurrentPrice = () => {
    if (category === 'New Job Card') return settings.newJobCardPrice;
    if (category === 'Add Member') return settings.memberAddPrice;
    if (category === 'Work Demand') return settings.workDemandPrice || 500;
    if (category === 'PMAY-G') return settings.pmaygPrice || 500;
    return 1000;
  };

  const [currentPrice, setCurrentPrice] = useState(getCurrentPrice());
  const [newPrice, setNewPrice] = useState(getCurrentPrice());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const p = getCurrentPrice();
    setCurrentPrice(p);
    setNewPrice(p);
  }, [category, settings]);

  const isAdmin = currentUser?.role === 'Admin';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Only administrators can update price settings.', 'warning');
      return;
    }

    if (newPrice < 0) {
      showToast('Price cannot be negative.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updatePrice(category, Number(newPrice));
      setCurrentPrice(Number(newPrice));
    } catch (err: any) {
      showToast(err.message || 'Failed to update price.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-violet-600" />
            Price Management: {category}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure standard billing amount for future {category} transactions
          </p>
        </div>
      </div>

      {/* 1. CURRENT PRICE (Requirement #20) */}
      <div className="p-6 bg-gradient-to-r from-violet-900 via-purple-900 to-slate-900 text-white rounded-2xl shadow-lg border border-violet-800">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
          CURRENT PRICE
        </div>
        <div className="text-4xl font-extrabold mt-2 flex items-baseline gap-1">
          <span>₹{currentPrice.toLocaleString('en-IN')}</span>
          <span className="text-xs font-normal text-violet-300">per transaction</span>
        </div>
        <div className="text-xs text-violet-200 mt-2">
          This rate is automatically applied to all new {category} entries.
        </div>
      </div>

      {/* 2. UPDATE PRICE FORM (Requirement #20) */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            UPDATE PRICE
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter a new billing amount for future transactions
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            New Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="50"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 text-lg font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
        </div>

        {/* 3. HISTORICAL PRICE IMMUTABILITY NOTICE (Requirement #21) */}
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 text-xs text-violet-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Historical Price Protection Guaranteed</div>
            <div className="text-[11px] leading-relaxed text-violet-800">
              Updating this price applies ONLY to new transactions created after saving.
              All existing records will permanently retain their original billed amount (₹{currentPrice.toLocaleString('en-IN')})
              without retroactive alteration.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <RotateCw className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>Save Price</span>
          </button>
        </div>
      </form>
    </div>
  );
};
