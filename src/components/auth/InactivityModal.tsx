import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InactivityModal: React.FC = () => {
  const { showInactivityWarning, inactivityCountdown, dismissInactivityWarning, logout } = useAuth();

  if (!showInactivityWarning) return null;

  const minutes = Math.floor(inactivityCountdown / 60);
  const seconds = inactivityCountdown % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Session Inactivity Warning</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          You have been inactive for nearly 30 minutes. For security compliance, your session will
          automatically expire and logout in:
        </p>

        <div className="my-5 py-3 px-4 rounded-xl bg-amber-50/80 border border-amber-200/80 inline-block">
          <span className="font-mono text-3xl font-extrabold text-amber-700 tracking-wider">
            {timeFormatted}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={dismissInactivityWarning}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition"
          >
            I'm Still Working (Stay Logged In)
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};
