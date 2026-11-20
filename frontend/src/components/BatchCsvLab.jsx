import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertOctagon, 
  Zap, 
  Filter, 
  RefreshCw, 
  Table, 
  Info,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { uploadCsvAndPredict, getSampleCsvUrl } from '../api/client';

export default function BatchCsvLab() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, potable, non_potable, anomalies

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadCsvAndPredict(formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process CSV file. Ensure valid columns.');
    } finally {
      setLoading(false);
    }
  };

  const exportEnrichedCsv = () => {
    if (!result?.records) return;
    const headers = [
      'Row', 'Sample_ID', 'Location', 'pH', 'Turbidity_NTU', 'TDS_mg_L',
      'Temp_C', 'DO_mg_L', 'Conductivity_uS_cm', 'Potability_Prediction',
      'Potability_Label', 'Confidence_Prob', 'WQI', 'WQI_Status', 'Is_Anomaly',
      'Anomaly_Intensity_Pct', 'Top_Factor', 'Factor_Impact_Pct'
    ];
    
    const rows = result.records.map((r) => [
      r.row_index,
      `"${r.sample_id}"`,
      `"${r.location}"`,
      r.ph,
      r.turbidity,
      r.tds,
      r.temperature,
      r.dissolved_oxygen,
      r.conductivity,
      r.potability_pred,
      `"${r.potability_label}"`,
      (r.potability_prob * 100).toFixed(1) + '%',
      r.wqi,
      `"${r.wqi_status}"`,
      r.is_anomaly,
      r.anomaly_intensity + '%',
      `"${r.top_driving_factor}"`,
      r.top_factor_impact + '%'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analyzed_water_quality_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = result?.records?.filter((r) => {
    if (filterType === 'potable') return r.potability_pred === 1;
    if (filterType === 'non_potable') return r.potability_pred === 0;
    if (filterType === 'anomalies') return r.is_anomaly === true;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Batch CSV Dataset Upload & ML Analytics Lab</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload multi-sample CSV datasets to run bulk ML potability classification, WQI scoring, and anomaly detection
            </p>
          </div>
        </div>

        {/* Download Sample CSV */}
        <div className="flex items-center space-x-2">
          <a
            href={getSampleCsvUrl()}
            download="sample_water_quality_dataset.csv"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample CSV Template</span>
          </a>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="max-w-2xl mx-auto">
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center transition bg-slate-950/40">
            <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Select or Drag & Drop Water Quality Dataset (.csv)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Required parameters: <code className="text-cyan-400">ph, turbidity, tds, temperature, dissolved_oxygen, conductivity</code>
            </p>

            <div className="flex items-center justify-center space-x-3">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Inferences...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Batch Evaluation</span>
                  </>
                )}
              </button>
            </div>

            {file && (
              <p className="text-xs text-emerald-400 mt-3 font-mono">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Samples Evaluated</span>
              <div className="text-3xl font-black text-slate-100">{result.total_records}</div>
              <p className="text-xs text-slate-400 mt-1">From file: {result.filename}</p>
            </div>

            <div className="bg-slate-900/80 border border-emerald-900/60 rounded-2xl p-5">
              <span className="text-xs uppercase font-bold text-emerald-400 block mb-1">Potable / Safe Samples</span>
              <div className="text-3xl font-black text-emerald-400">
                {result.summary.potable_percentage}%
              </div>
              <p className="text-xs text-emerald-300/80 mt-1">
                {result.summary.potable_count} of {result.total_records} samples safe
              </p>
            </div>

            <div className="bg-slate-900/80 border border-amber-900/60 rounded-2xl p-5">
              <span className="text-xs uppercase font-bold text-amber-400 block mb-1">ML Anomalies Detected</span>
              <div className="text-3xl font-black text-amber-400">
                {result.summary.anomaly_percentage}%
              </div>
              <p className="text-xs text-amber-300/80 mt-1">
                {result.summary.anomaly_count} multi-parameter outlier vectors
              </p>
            </div>

            <div className="bg-slate-900/80 border border-cyan-900/60 rounded-2xl p-5">
              <span className="text-xs uppercase font-bold text-cyan-400 block mb-1">Average Water Quality Index</span>
              <div className="text-3xl font-black text-cyan-400">
                {result.summary.average_wqi} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-cyan-300/80 mt-1">Standardized Weighted Arithmetic WQI</p>
            </div>
          </div>

          {/* Results Table & Filtering */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Table className="w-5 h-5 text-cyan-400" />
                  <span>Enriched Sample Predictions & Inferences</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredRecords.length} of {result.total_records} processed samples
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter buttons */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({result.total_records})
                  </button>
                  <button
                    onClick={() => setFilterType('potable')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === 'potable' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Potable ({result.summary.potable_count})
                  </button>
                  <button
                    onClick={() => setFilterType('non_potable')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === 'non_potable' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Non-Potable ({result.summary.non_potable_count})
                  </button>
                  <button
                    onClick={() => setFilterType('anomalies')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === 'anomalies' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Anomalies ({result.summary.anomaly_count})
                  </button>
                </div>

                {/* Export Analyzed CSV */}
                <button
                  onClick={exportEnrichedCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Enriched CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-3">#</th>
                    <th className="px-3.5 py-3">Sample ID</th>
                    <th className="px-3.5 py-3">Location</th>
                    <th className="px-3.5 py-3">pH</th>
                    <th className="px-3.5 py-3">Turbidity</th>
                    <th className="px-3.5 py-3">DO</th>
                    <th className="px-3.5 py-3">TDS</th>
                    <th className="px-3.5 py-3">WQI Score</th>
                    <th className="px-3.5 py-3">ML Potability</th>
                    <th className="px-3.5 py-3">Anomaly</th>
                    <th className="px-3.5 py-3">Key Driving Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {filteredRecords.map((r) => (
                    <tr key={r.row_index} className="hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-2.5 text-slate-500">{r.row_index}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-200">{r.sample_id}</td>
                      <td className="px-3.5 py-2.5 font-sans text-slate-300">{r.location}</td>
                      <td className={`px-3.5 py-2.5 font-semibold ${r.ph < 6.5 || r.ph > 8.5 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {r.ph.toFixed(2)}
                      </td>
                      <td className={`px-3.5 py-2.5 font-semibold ${r.turbidity > 5.0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {r.turbidity.toFixed(1)} NTU
                      </td>
                      <td className={`px-3.5 py-2.5 font-semibold ${r.dissolved_oxygen < 5.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {r.dissolved_oxygen.toFixed(1)} mg/L
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300">{Math.round(r.tds)}</td>
                      <td className="px-3.5 py-2.5 font-bold text-cyan-400">
                        {r.wqi} <span className="text-[10px] text-slate-500">({r.wqi_status})</span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {r.potability_pred === 1 ? (
                          <span className="text-emerald-400 font-sans font-semibold">
                            ✓ Potable ({(r.potability_prob * 100).toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-sans font-semibold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                            ✕ Contaminated
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {r.is_anomaly ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-sans font-semibold text-[11px]">
                            ⚠️ Anomaly ({r.anomaly_intensity}%)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans">Normal</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-sans text-slate-400 text-[11px]">
                        {r.top_driving_factor} ({r.top_factor_impact > 0 ? `+${r.top_factor_impact}%` : `${r.top_factor_impact}%`})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
