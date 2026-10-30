import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (selectedModule !== 'All' && log.module !== selectedModule) return false;

      return true;
    });
  }, [auditLogs, searchQuery, selectedModule]);

  const handleExportCsv = () => {
    const headers = ['Log ID', 'User', 'Action', 'Module', 'Record ID', 'Date/Time', 'Description'];
    const rows = filteredLogs.map((l) => [
      l.logId,
      `"${l.user}"`,
      `"${l.action}"`,
      l.module,
      `"${l.recordId}"`,
      `"${l.dateTime}"`,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-slate-700" />
            Security &amp; Operational Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable log of all user actions, transactions, party modifications, and logins
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user name, action, record ID, or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
          >
            <option value="All">All Modules</option>
            <option value="Auth">Auth &amp; Sessions</option>
            <option value="Parties">Parties</option>
            <option value="JobCards">Job Cards</option>
            <option value="Payments">Payments</option>
            <option value="BulkUpload">Bulk Upload</option>
            <option value="Settings">Settings</option>
            <option value="Documents">Documents</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedModule('All');
            }}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table (Requirement #34) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.logId} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {log.dateTime}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.module === 'Auth'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : log.module === 'Payments'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.module === 'JobCards'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : log.module === 'Parties'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {log.recordId}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{log.description}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No audit records found matching query.
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
