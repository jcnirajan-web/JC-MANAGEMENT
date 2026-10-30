import React, { useState } from 'react';
import { User, Save, RotateCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ChangeUsernameView: React.FC = () => {
  const { changeUsername } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentUsername = currentUser?.username || 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim() || newUsername.trim().length < 3) {
      showToast('New username must be at least 3 characters long.', 'warning');
      return;
    }

    if (!isConfirmed) {
      showToast('Please confirm that you want to update your login username.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await changeUsername(newUsername.trim());
      if (res.success) {
        setNewUsername('');
        setIsConfirmed(false);
      } else {
        showToast(res.error || 'Failed to update username', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating username', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-slate-700" />
            Change Username
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Modify the login identifier used to authenticate to the portal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Current Username
          </label>
          <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl font-mono text-sm font-bold text-slate-800 border border-slate-200">
            {currentUsername}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            New Username <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username (e.g. administrator)"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Important Notice</div>
            <p className="text-[11px] leading-relaxed">
              After updating your username, all future sign-ins will require this new identifier.
              Ensure you remember or note down your new username.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="confirm-username"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            required
          />
          <label htmlFor="confirm-username" className="text-xs text-slate-700 font-semibold cursor-pointer">
            I confirm that I want to change my login username
          </label>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || !isConfirmed}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <RotateCw className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>Update Username</span>
          </button>
        </div>
      </form>
    </div>
  );
};
