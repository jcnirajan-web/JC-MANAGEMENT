import React from 'react';
import { ShieldCheck, Database, Lock } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Footer: React.FC = () => {
  const { settings } = useData();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-3.5 px-4 md:px-6 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{settings.applicationName}</span>
          <span>•</span>
          <span>© {currentYear} All Rights Reserved</span>
          <span>•</span>
          <span className="text-slate-400">v2.4.0 Commercial</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized Access Only
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <Lock className="w-3 h-3 text-slate-400" />
            256-Bit Encrypted Session
          </span>
          <span className="hidden md:flex items-center gap-1 text-slate-600">
            <Database className="w-3 h-3 text-slate-400" />
            Google Sheets Synchronized
          </span>
        </div>
      </div>
    </footer>
  );
};
