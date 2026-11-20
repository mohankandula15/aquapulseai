import React, { useState, useEffect } from 'react';
import { 
  History, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import { getReportHistory, deleteReport, getReportPdfUrl, getReportDetail } from '../api/client';

export default function AnalysisHistoryView({ onSelectReport, onNavigateAnalyze }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getReportHistory(50);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete report #${id}?`)) return;
    setDeletingId(id);
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const fullRecord = await getReportDetail(id);
      onSelectReport(fullRecord);
    } catch (err) {
      alert('Failed to load report detail: ' + err.message);
    }
  };

  const handleDownloadPdf = (id, e) => {
    e.stopPropagation();
    window.open(getReportPdfUrl(id), '_blank');
  };

  const filteredReports = reports.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      (r.filename || '').toLowerCase().includes(q) ||
      (r.overall_quality || '').toLowerCase().includes(q) ||
      (r.intended_use || '').toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-2xl">
            <History className="w-6 h-6 text-sky-600" />
            <h1>Water Analysis History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Records of previously parsed lab reports, standards benchmarking, and safety audits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onNavigateAnalyze}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Analyze New Report</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by filename, location, quality or intended use..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
        />
      </div>

      {/* History Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
          Loading previous report analyses...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800">No Analysis History Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not analyzed any water quality reports yet, or no reports matched your search.
            </p>
          </div>
          <button
            onClick={onNavigateAnalyze}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-sm hover:bg-sky-700 transition"
          >
            <span>Upload Your First Water Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Report / Document</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Intended Use</th>
                  <th className="py-3 px-4">WQI</th>
                  <th className="py-3 px-4">Overall Quality</th>
                  <th className="py-3 px-4">Safety Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const q = report.overall_quality || 'Moderate';
                  const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr 
                      key={report.id}
                      onClick={() => handleView(report.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                            #{report.id}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 truncate max-w-xs">
                              {report.filename}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {report.parameter_count} parameters evaluated
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {report.intended_use || 'drinking'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {report.wqi_score ?? '--'}
                        <span className="text-[10px] font-normal text-slate-400">/100</span>
                      </td>

                      <td className="py-3 px-4">
                        {q === 'Good' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Good</span>
                          </span>
                        )}
                        {q === 'Moderate' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Moderate</span>
                          </span>
                        )}
                        {q === 'Poor' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Poor</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium text-[11px]">
                        {report.safety_category}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleView(report.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="View Full Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadPdf(report.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Download PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === report.id}
                            onClick={(e) => handleDelete(report.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
