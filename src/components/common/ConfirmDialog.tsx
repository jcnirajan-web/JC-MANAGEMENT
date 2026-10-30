import React from 'react';
import { AlertTriangle, AlertCircle, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  let btnColor = 'bg-blue-600 hover:bg-blue-700 text-white';
  let icon = <AlertCircle className="w-6 h-6 text-blue-600" />;
  let iconBg = 'bg-blue-50';

  if (variant === 'danger') {
    btnColor = 'bg-red-600 hover:bg-red-700 text-white';
    icon = <AlertTriangle className="w-6 h-6 text-red-600" />;
    iconBg = 'bg-red-50';
  } else if (variant === 'warning') {
    btnColor = 'bg-amber-600 hover:bg-amber-700 text-white';
    icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
    iconBg = 'bg-amber-50';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{message}</p>

              {details && <div className="mt-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">{details}</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-2 ${btnColor}`}
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
