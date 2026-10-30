import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  FileText,
  ExternalLink,
  Search,
  CheckCircle2,
  Calendar,
  Cloud,
  FolderTree,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DocumentsView: React.FC = () => {
  const { documents, uploadDocument, jobCards, parties } = useData();
  const { isGoogleConnected } = useAuth();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedJobCardNo, setSelectedJobCardNo] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');

  const driveFolders = [
    { name: 'Documents', count: documents.filter((d) => !d.type.includes('Job Card') && !d.type.includes('Bulk') && !d.type.includes('Report')).length },
    { name: 'Job Cards', count: documents.filter((d) => d.type.includes('Job Card') || d.type.includes('Aadhaar')).length },
    { name: 'Bulk Uploads', count: documents.filter((d) => d.type.includes('Bulk')).length },
    { name: 'Reports', count: documents.filter((d) => d.type.includes('Report')).length },
    { name: 'Templates', count: 1 },
    { name: 'Archive', count: 0 },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q) ||
      (doc.relatedJobCardNo || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (selectedFolder !== 'All') {
      if (selectedFolder === 'Job Cards' && !(doc.type.includes('Job Card') || doc.type.includes('Aadhaar')))
        return false;
      if (selectedFolder === 'Bulk Uploads' && !doc.type.includes('Bulk')) return false;
      if (selectedFolder === 'Reports' && !doc.type.includes('Report')) return false;
    }

    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file, selectedJobCardNo || undefined, selectedPartyId || undefined);
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Google Drive Document Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cloud storage for Job Card copies, Aadhaar KYC documents, bulk sheets &amp; audit reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Uploading to Drive...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Google Drive Status Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Drive Folder Root
            </div>
            <div className="text-sm font-bold text-white">JOB CARD MANAGEMENT SYSTEM</div>
            <div className="text-[11px] text-slate-400">
              Synchronized with Workspace Drive storage (Restricted access)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Public Exposure
          </span>
        </div>
      </div>

      {/* Google Drive Recommended Folder Tree (Requirement #28) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {driveFolders.map((f) => (
          <button
            key={f.name}
            onClick={() => setSelectedFolder(selectedFolder === f.name ? 'All' : f.name)}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              selectedFolder === f.name
                ? 'bg-blue-50 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <FolderTree className={`w-4 h-4 ${selectedFolder === f.name ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {f.count}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 leading-tight">/{f.name}</span>
          </button>
        ))}
      </div>

      {/* Link Document Settings Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, type, or related Job Card No..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedJobCardNo}
              onChange={(e) => setSelectedJobCardNo(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="">Link Upload to Card (Optional)</option>
              {jobCards.map((c) => (
                <option key={c.transactionId} value={c.jobCardNo}>
                  {c.jobCardNo} - {c.applicantName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document Library Table (Requirement #29) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Linked Job Card / Party</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4 text-right">Drive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {doc.relatedJobCardNo ? (
                      <span className="text-blue-700 font-bold">{doc.relatedJobCardNo}</span>
                    ) : doc.relatedPartyId ? (
                      <span className="text-indigo-700 font-semibold">{doc.relatedPartyId}</span>
                    ) : (
                      <span className="text-slate-400">General</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{doc.fileSize || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{doc.uploadDate}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{doc.uploadedBy}</td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={doc.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                    >
                      <span>Drive Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No documents found matching the search criteria.
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
